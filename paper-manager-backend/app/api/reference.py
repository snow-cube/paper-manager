from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, col, select, delete
from typing import List, Optional
from datetime import datetime
import os
import shutil
import tempfile
import pandas as pd

from app.core.database import get_session
from app.core.config_dev import get_team_upload_dir
from app.models.reference import (
    ReferencePaper,
    ReferenceCreate,
    ReferenceRead,
    ReferenceUpdate,
    ReferenceCategory,
    ReferenceKeyword,
    ReferenceCategoryRead,
    PaginatedReferenceResponse,
)
from app.models.keyword import Keyword
from app.models.user import User
from app.models.team import TeamUser, TeamRole
from app.models.journal import Journal
from app.api.user import get_current_user
from app.api.team import check_team_member
from app.models.team import Team

router = APIRouter()


def get_or_create_keywords(session: Session, keyword_names: List[str]) -> List[Keyword]:
    """获取或创建关键字"""
    keywords = []
    for name in keyword_names:
        # 查找现有关键字
        keyword = session.exec(select(Keyword).where(Keyword.name == name)).first()

        # 如果不存在则创建
        if not keyword:
            keyword = Keyword(name=name)
            session.add(keyword)
            session.flush()

        keywords.append(keyword)
    return keywords


# def check_team_member(team_id: int, user: User, session: Session):
#     """检查用户是否为团队成员"""
#     if team_id == 0:  # 0 表示公开，不需要检查
#         return True

#     team_user = session.exec(
#         select(TeamUser).where(TeamUser.team_id == team_id, TeamUser.user_id == user.id)
#     ).first()

#     if not team_user:
#         raise HTTPException(status_code=403, detail="Not a member of this team")
#     return True


def get_reference_category_and_subcategories(
    session: Session, category_id: int
) -> List[int]:
    """递归获取参考文献分类及其所有子分类的ID列表"""
    from app.models.reference import ReferenceCategory

    result = [category_id]
    children = session.exec(
        select(ReferenceCategory).where(ReferenceCategory.parent_id == category_id)
    ).all()

    for child in children:
        assert child.id is not None, "Child category ID should not be None"
        result.extend(get_reference_category_and_subcategories(session, child.id))

    return result


@router.post("/", response_model=ReferenceRead)
def create_reference(
    reference: ReferenceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """创建参考文献"""
    assert reference.team_id is not None, "Team ID should not be None"
    # 检查用户是否为团队成员
    check_team_member(
        reference.team_id, current_user, session
    )  # 如果指定了分类，检查分类是否存在且属于同一团队
    if reference.category_id:
        category = session.get(ReferenceCategory, reference.category_id)
        if not category:
            raise HTTPException(
                status_code=404, detail=f"Category {reference.category_id} not found"
            )
        if category.team_id != reference.team_id:
            raise HTTPException(
                status_code=400, detail="Category must belong to the same team"
            )

    # 如果指定了期刊，检查期刊是否存在
    if reference.journal_id:
        journal = session.get(Journal, reference.journal_id)
        if not journal:
            raise HTTPException(
                status_code=404, detail=f"Journal {reference.journal_id} not found"
            )

    # 检查DOI是否已存在
    if reference.doi:
        existing_reference = session.exec(
            select(ReferencePaper).where(ReferencePaper.doi == reference.doi)
        ).first()
        if existing_reference:
            raise HTTPException(
                status_code=400, detail="Reference with this DOI already exists"
            )

    # 创建参考文献
    db_reference = ReferencePaper.from_orm(reference)
    assert current_user.id is not None, "Current user ID should not be None"
    db_reference.created_by_id = current_user.id
    session.add(db_reference)

    # 处理关键词
    for name in reference.keyword_names:
        # 查找或创建关键词
        keyword = session.exec(select(Keyword).where(Keyword.name == name)).first()
        if not keyword:
            keyword = Keyword(name=name)
            session.add(keyword)
            session.flush()  # 获取新创建的关键词ID

        # 创建参考文献-关键词关联
        reference_keyword = ReferenceKeyword(
            reference_id=db_reference.id, keyword_id=keyword.id
        )
        session.add(reference_keyword)

    session.commit()
    session.refresh(db_reference)

    # 构建返回数据
    return get_reference_read(db_reference, session)


@router.get("/", response_model=PaginatedReferenceResponse)
def read_references(
    skip: int = 0,
    limit: int = 100,
    team_id: Optional[int] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    journal_id: Optional[int] = None,
    publication_year: Optional[int] = None,
    title: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """获取参考文献列表"""
    # 基础查询
    query = select(ReferencePaper)

    # 如果指定了团队，检查用户是否为团队成员
    if team_id is not None:
        check_team_member(team_id, current_user, session)
        query = query.where(ReferencePaper.team_id == team_id)
    else:
        # 获取用户所在的所有团队ID
        user_teams = session.exec(
            select(TeamUser).where(TeamUser.user_id == current_user.id)
        ).all()
        team_ids = [0] + [tu.team_id for tu in user_teams]  # 包括公开的参考文献
        query = query.where(ReferencePaper.team_id.in_(team_ids))  # type: ignore

    # 应用其他过滤条件
    if title:
        query = query.where(ReferencePaper.title.contains(title))  # type: ignore
    if category_id:
        # 获取指定分类及其所有子分类的ID列表
        category_ids = get_reference_category_and_subcategories(session, category_id)
        query = query.where(ReferencePaper.category_id.in_(category_ids))  # type: ignore
    if keyword:
        query = (
            query.join(ReferenceKeyword).join(Keyword).where(Keyword.name == keyword)
        )
    if journal_id:
        query = query.where(ReferencePaper.journal_id == journal_id)
    if publication_year:
        query = query.where(ReferencePaper.publication_year == publication_year)

    # 计算总数量（在应用 offset/limit 之前）
    total_count = len(session.exec(query).all())

    # 执行分页查询
    references = session.exec(query.offset(skip).limit(limit)).all()

    # 构建返回数据
    results = [get_reference_read(ref, session) for ref in references]

    # 计算分页信息
    current_page = (skip // limit) + 1
    total_pages = (total_count + limit - 1) // limit  # 向上取整

    # 返回分页响应
    return PaginatedReferenceResponse(
        items=results,
        total=total_count,
        page=current_page,
        size=limit,
        pages=total_pages,
    )


@router.get("/{reference_id}", response_model=ReferenceRead)
def read_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """获取单个参考文献"""
    reference = session.get(ReferencePaper, reference_id)
    if not reference:
        raise HTTPException(status_code=404, detail="Reference not found")

    # 检查参考文献是否属于团队
    if reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")

    # 检查用户是否有权限访问
    check_team_member(reference.team_id, current_user, session)

    return get_reference_read(reference, session)


@router.patch("/{reference_id}", response_model=ReferenceRead)
def update_reference(
    reference_id: int,
    reference_update: ReferenceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """更新参考文献"""
    db_reference = session.get(ReferencePaper, reference_id)
    if not db_reference:
        raise HTTPException(status_code=404, detail="Reference not found")
    # 检查参考文献是否属于团队
    if db_reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")

    # 检查用户是否有权限修改
    check_team_member(db_reference.team_id, current_user, session)
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == db_reference.team_id,
            TeamUser.user_id == current_user.id,
        )
    ).first()

    # 只有创建者和团队管理员可以修改
    if db_reference.created_by_id != current_user.id and not (
        team_user and team_user.role in [TeamRole.OWNER, TeamRole.ADMIN]
    ):
        raise HTTPException(
            status_code=403,
            detail="Only the creator or team administrators can modify this reference",
        )  # 如果要更新分类，检查分类是否存在且属于同一团队
    if reference_update.category_id is not None:
        if reference_update.category_id != 0:  # 0 表示无分类
            category = session.get(ReferenceCategory, reference_update.category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category {reference_update.category_id} not found",
                )
            if category.team_id != db_reference.team_id:
                raise HTTPException(
                    status_code=400, detail="Category must belong to the same team"
                )

    # 如果要更新期刊，检查期刊是否存在
    if reference_update.journal_id is not None:
        if reference_update.journal_id != 0:  # 0 表示无期刊
            journal = session.get(Journal, reference_update.journal_id)
            if not journal:
                raise HTTPException(
                    status_code=404,
                    detail=f"Journal {reference_update.journal_id} not found",
                )

    # 更新基本信息
    reference_data = reference_update.dict(exclude_unset=True)
    for key, value in reference_data.items():
        if key != "keyword_names":
            setattr(db_reference, key, value)

    # 如果提供了关键词，更新关键词
    if reference_update.keyword_names is not None:
        # 删除现有关键词关联
        session.execute(
            delete(ReferenceKeyword).where(
                col(ReferenceKeyword.reference_id) == reference_id
            )
        )

        # 添加新的关键词
        for name in reference_update.keyword_names:
            keyword = session.exec(select(Keyword).where(Keyword.name == name)).first()
            if not keyword:
                keyword = Keyword(name=name)
                session.add(keyword)
                session.flush()

            reference_keyword = ReferenceKeyword(
                reference_id=reference_id, keyword_id=keyword.id
            )
            session.add(reference_keyword)

    db_reference.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(db_reference)

    return get_reference_read(db_reference, session)


@router.delete("/{reference_id}")
def delete_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """删除参考文献"""
    reference = session.get(ReferencePaper, reference_id)
    if not reference:
        raise HTTPException(status_code=404, detail="Reference not found")

    # 检查参考文献是否属于团队
    if reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")

    # 检查用户是否有权限删除
    check_team_member(reference.team_id, current_user, session)
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == reference.team_id, TeamUser.user_id == current_user.id
        )
    ).first()

    # 只有创建者和团队管理员可以删除
    if reference.created_by_id != current_user.id and not (
        team_user and team_user.role in [TeamRole.OWNER, TeamRole.ADMIN]
    ):
        raise HTTPException(
            status_code=403,
            detail="Only the creator or team administrators can delete this reference",
        )

    # 删除关联的关键词
    session.execute(
        delete(ReferenceKeyword).where(
            col(ReferenceKeyword.reference_id) == reference_id
        )
    )

    session.delete(reference)
    session.commit()
    return {"ok": True}


def get_reference_read(reference: ReferencePaper, session: Session) -> ReferenceRead:
    """构建参考文献返回数据"""
    if reference.id is None:
        raise HTTPException(status_code=500, detail="Reference ID is missing")

    # 获取关键词
    keywords = [
        kw.name
        for kw in session.exec(
            select(Keyword)
            .join(ReferenceKeyword)
            .where(ReferenceKeyword.reference_id == reference.id)
        ).all()
    ]

    # 获取分类信息
    category_info = None
    if reference.category_id:
        category = session.get(ReferenceCategory, reference.category_id)
        if category:
            category_info = ReferenceCategoryRead.from_orm(category)

    # 获取期刊信息
    journal_name = None
    if reference.journal_id:
        journal = session.get(Journal, reference.journal_id)
        if journal:
            journal_name = journal.name

    return ReferenceRead(
        id=reference.id,
        title=reference.title,
        authors=reference.authors,
        doi=reference.doi,
        file_path=reference.file_path,
        journal_id=reference.journal_id,
        journal_name=journal_name,
        publication_year=reference.publication_year,
        created_at=reference.created_at,
        updated_at=reference.updated_at,
        team_id=reference.team_id,
        created_by_id=reference.created_by_id,
        category_id=reference.category_id,
        keywords=keywords,
        category=category_info,
    )


@router.post("/{reference_id}/upload")
async def upload_file(
    reference_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """上传参考文献的PDF文件"""
    db_reference = session.get(ReferencePaper, reference_id)
    if not db_reference:
        raise HTTPException(status_code=404, detail="Reference paper not found")
    # 检查用户是否为团队成员
    if db_reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")
    check_team_member(db_reference.team_id, current_user, session)

    # 检查文件类型
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are allowed"
        )  # 创建存储目录
    upload_dir = get_team_upload_dir(db_reference.team_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # 生成文件路径
    file_path = upload_dir / f"{reference_id}_{file.filename}"

    # 如果已存在文件，先删除
    if db_reference.file_path and os.path.exists(db_reference.file_path):
        os.remove(db_reference.file_path)
    # 保存新文件
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    # 更新数据库中的文件路径
    db_reference.file_path = str(file_path)
    db_reference.updated_at = datetime.utcnow()
    session.add(db_reference)
    session.commit()

    return {"filename": file.filename, "file_path": str(file_path)}


@router.get("/{reference_id}/download")
async def download_reference_by_id(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """通过ID下载参考文献PDF文件"""
    db_reference = session.get(ReferencePaper, reference_id)
    if not db_reference:
        raise HTTPException(status_code=404, detail="Reference paper not found")
    # 检查用户是否为团队成员
    if db_reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")
    check_team_member(db_reference.team_id, current_user, session)

    # 检查文件是否存在
    if not db_reference.file_path or not os.path.exists(db_reference.file_path):
        raise HTTPException(
            status_code=404, detail="PDF file not found for this reference"
        )

    # 构建文件名
    filename = f"{db_reference.title}.pdf"

    return FileResponse(
        db_reference.file_path, filename=filename, media_type="application/pdf"
    )


@router.get("/download/by-title")
async def download_reference_by_title(
    title: str,
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """通过标题下载参考文献PDF文件"""
    # 检查用户是否为团队成员
    check_team_member(team_id, current_user, session)

    # 查找参考文献
    db_reference = session.exec(
        select(ReferencePaper)
        .where(ReferencePaper.team_id == team_id)
        .where(ReferencePaper.title == title)
    ).first()

    if not db_reference:
        raise HTTPException(
            status_code=404, detail="Reference paper not found with the specified title"
        )

    # 检查文件是否存在
    if not db_reference.file_path or not os.path.exists(db_reference.file_path):
        raise HTTPException(
            status_code=404, detail="PDF file not found for this reference"
        )

    # 构建文件名
    filename = f"{db_reference.title}.pdf"

    return FileResponse(
        db_reference.file_path, filename=filename, media_type="application/pdf"
    )


@router.get("/export/excel")
def export_references_excel(
    team_id: Optional[int] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    journal_id: Optional[int] = None,
    publication_year: Optional[int] = None,
    title: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """导出参考文献列表为Excel格式"""
    # 使用与read_references相同的查询逻辑
    query = select(ReferencePaper)

    # 如果指定了团队，检查用户是否为团队成员
    if team_id is not None:
        check_team_member(team_id, current_user, session)
        query = query.where(ReferencePaper.team_id == team_id)
    else:
        # 获取用户所在的所有团队ID
        user_teams = session.exec(
            select(TeamUser).where(TeamUser.user_id == current_user.id)
        ).all()
        team_ids = [0] + [tu.team_id for tu in user_teams]  # 包括公开的参考文献
        query = query.where(ReferencePaper.team_id.in_(team_ids))  # type: ignore

    # 应用其他过滤条件
    if title:
        query = query.where(ReferencePaper.title.contains(title))  # type: ignore
    if category_id:
        category_ids = get_reference_category_and_subcategories(session, category_id)
        query = query.where(ReferencePaper.category_id.in_(category_ids))  # type: ignore
    if keyword:
        query = (
            query.join(ReferenceKeyword).join(Keyword).where(Keyword.name == keyword)
        )
    if journal_id:
        query = query.where(ReferencePaper.journal_id == journal_id)
    if publication_year:
        query = query.where(ReferencePaper.publication_year == publication_year)

    references = session.exec(query).all()

    # 准备Excel数据
    excel_data = []
    for ref in references:
        # 获取相关信息
        keywords = [
            kw.name
            for kw in session.exec(
                select(Keyword)
                .join(ReferenceKeyword)
                .where(ReferenceKeyword.reference_id == ref.id)
            ).all()
        ]

        category_name = None
        if ref.category_id:
            category = session.get(ReferenceCategory, ref.category_id)
            if category:
                category_name = category.name

        journal_name = None
        if ref.journal_id:
            journal = session.get(Journal, ref.journal_id)
            if journal:
                journal_name = journal.name

        team_name = None
        if ref.team_id:
            team = session.get(Team, ref.team_id)
            if team:
                team_name = team.name

        excel_data.append(
            {
                "ID": ref.id,
                "Title": ref.title,
                "Authors": ref.authors or "",
                "Keywords": "; ".join(keywords),
                "Category": category_name or "",
                "Journal": journal_name or "",
                "Publication Year": ref.publication_year,
                "DOI": ref.doi or "",
                "Team": team_name or "",
                "Created At": ref.created_at,
                "Has File": (
                    "Yes" if ref.file_path and os.path.exists(ref.file_path) else "No"
                ),
            }
        )

    # 创建Excel文件
    df = pd.DataFrame(excel_data)

    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"references_export_{timestamp}.xlsx"

    # 创建临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
        df.to_excel(temp_file.name, index=False, engine="openpyxl")
        temp_path = temp_file.name

    return FileResponse(
        temp_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
