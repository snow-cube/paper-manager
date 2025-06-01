from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import os
import shutil

from app.core.database import get_session
from app.core.config_dev import get_team_upload_dir
from app.models.reference import (
    ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate,
    ReferenceKeyword
)
from app.models.keyword import Keyword
from app.models.user import User
from app.models.category import Category
from app.api.user import get_current_user
from app.api.team import check_team_member
from app.models.team import Team

router = APIRouter()


def get_or_create_keywords(session: Session, keyword_names: List[str]) -> List[Keyword]:
    """获取或创建关键字"""
    keywords = []
    for name in keyword_names:
        # 查找现有关键字
        keyword = session.exec(
            select(Keyword).where(Keyword.name == name)
        ).first()

        # 如果不存在则创建
        if not keyword:
            keyword = Keyword(name=name)
            session.add(keyword)
            session.flush()

        keywords.append(keyword)
    return keywords


@router.post("/", response_model=ReferenceRead)
def create_reference(
    reference: ReferenceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建参考文献"""    # 检查团队是否存在
    if reference.team_id is None:
        raise HTTPException(status_code=400, detail="Team ID is required")

    team = session.get(Team, reference.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 检查是否为团队成员
    check_team_member(reference.team_id, current_user, session)

    # 如果提供了分类ID，检查分类是否存在
    if reference.category_id is not None:
        category = session.get(Category, reference.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # 如果提供了DOI，检查是否已存在
    if reference.doi:
        existing_reference = session.exec(
            select(ReferencePaper).where(ReferencePaper.doi == reference.doi)
        ).first()
        if existing_reference:
            raise HTTPException(
                status_code=400,
                detail="A reference with this DOI already exists"
            )    # 检查 current_user.id 是否为 None
    if current_user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    # 创建参考文献
    db_reference = ReferencePaper(
        title=reference.title,
        authors=reference.authors,
        doi=reference.doi,
        team_id=reference.team_id,
        category_id=reference.category_id,
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(db_reference)
    session.flush()  # 获取 ID

    # 处理关键词
    keyword_list = []  # 用于存储关键词名称
    if reference.keyword_names:
        keywords = get_or_create_keywords(session, reference.keyword_names)
        for keyword in keywords:
            # 创建关联
            ref_keyword = ReferenceKeyword(
                reference_id=db_reference.id,
                keyword_id=keyword.id
            )
            session.add(ref_keyword)
            keyword_list.append(keyword.name)

    session.commit()
    session.refresh(db_reference)

    # 构建返回数据
    reference_dict = {
        "id": db_reference.id,
        "title": db_reference.title,
        "authors": db_reference.authors,
        "doi": db_reference.doi,
        "file_path": db_reference.file_path,
        "created_at": db_reference.created_at,
        "updated_at": db_reference.updated_at,
        "team_id": db_reference.team_id,
        "created_by_id": db_reference.created_by_id,
        "category_id": db_reference.category_id,
        "keywords": keyword_list
    }

    return ReferenceRead(**reference_dict)


@router.get("/", response_model=List[ReferenceRead])
def read_references(
    team_id: int,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队的参考文献列表"""
    # 检查用户是否为团队成员
    check_team_member(team_id, current_user, session)

    # 构建查询
    query = select(ReferencePaper).where(ReferencePaper.team_id == team_id)

    # 如果指定了分类，添加分类过滤
    if category_id is not None:
        query = query.where(ReferencePaper.category_id == category_id)

    # 如果指定了关键字，添加关键字过滤
    if keyword is not None:
        query = (
            query
            .join(ReferenceKeyword)
            .join(Keyword)
            .where(Keyword.name == keyword)
        )

    # 执行查询
    references = session.exec(
        query.offset(skip).limit(limit)
    ).all()

    # 准备返回数据
    results = []
    for reference in references:
        # 构建返回数据字典
        reference_dict = {
            "id": reference.id,
            "title": reference.title,
            "authors": reference.authors,
            "doi": reference.doi,
            "file_path": reference.file_path,
            "created_at": reference.created_at,
            "updated_at": reference.updated_at,
            "team_id": reference.team_id,
            "created_by_id": reference.created_by_id,
            "category_id": reference.category_id,
            "keywords": [kw.name for kw in reference.keywords]  # 直接提取关键词名称
        }
        results.append(ReferenceRead(**reference_dict))

    return results


@router.get("/{reference_id}", response_model=ReferenceRead)
def read_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取特定参考文献的详细信息"""
    reference = session.get(ReferencePaper, reference_id)
    if not reference:
        raise HTTPException(status_code=404, detail="Reference paper not found")

    # 检查用户是否为团队成员
    if reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")
    check_team_member(reference.team_id, current_user, session)

    # 构建返回数据字典
    reference_dict = {
        "id": reference.id,
        "title": reference.title,
        "authors": reference.authors,
        "doi": reference.doi,
        "file_path": reference.file_path,
        "created_at": reference.created_at,
        "updated_at": reference.updated_at,
        "team_id": reference.team_id,
        "created_by_id": reference.created_by_id,
        "category_id": reference.category_id,
        "keywords": [keyword.name for keyword in reference.keywords]
    }

    return ReferenceRead(**reference_dict)


@router.patch("/{reference_id}", response_model=ReferenceRead)
def update_reference(
    reference_id: int,
    reference_update: ReferenceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新参考文献信息"""
    db_reference = session.get(ReferencePaper, reference_id)
    if not db_reference:
        raise HTTPException(status_code=404, detail="Reference paper not found")

    # 检查用户是否为团队成员
    if db_reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")
    check_team_member(db_reference.team_id, current_user, session)

    # 检查分类是否存在（如果要更新分类）
    if reference_update.category_id is not None:
        category = session.get(Category, reference_update.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # 更新参考文献信息
    reference_data = reference_update.dict(exclude_unset=True)
    keyword_names = reference_data.pop("keyword_names", None)

    for key, value in reference_data.items():
        setattr(db_reference, key, value)

    # 如果提供了关键字，更新关键字
    if keyword_names is not None:
        # 删除现有关键字链接
        existing_links = session.exec(
            select(ReferenceKeyword).where(ReferenceKeyword.reference_id == reference_id)
        ).all()
        for link in existing_links:
            session.delete(link)

        # 创建新的关键字链接
        keywords = get_or_create_keywords(session, keyword_names)
        for keyword in keywords:
            keyword_link = ReferenceKeyword(
                reference_id=reference_id,
                keyword_id=keyword.id
            )
            session.add(keyword_link)

    # 更新修改时间
    db_reference.updated_at = datetime.utcnow()

    session.add(db_reference)
    session.commit()
    session.refresh(db_reference)

    # 构建返回数据字典
    reference_dict = {
        "id": db_reference.id,
        "title": db_reference.title,
        "authors": db_reference.authors,
        "doi": db_reference.doi,
        "file_path": db_reference.file_path,
        "created_at": db_reference.created_at,
        "updated_at": db_reference.updated_at,
        "team_id": db_reference.team_id,
        "created_by_id": db_reference.created_by_id,
        "category_id": db_reference.category_id,
        "keywords": [keyword.name for keyword in db_reference.keywords]
    }

    return ReferenceRead(**reference_dict)


@router.delete("/{reference_id}")
def delete_reference(
    reference_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除参考文献"""
    db_reference = session.get(ReferencePaper, reference_id)
    if not db_reference:
        raise HTTPException(status_code=404, detail="Reference paper not found")

    # 检查用户是否为团队成员
    if db_reference.team_id is None:
        raise HTTPException(status_code=400, detail="Reference has no associated team")
    check_team_member(db_reference.team_id, current_user, session)

    # 删除关键词关联
    existing_links = session.exec(
        select(ReferenceKeyword).where(ReferenceKeyword.reference_id == reference_id)
    ).all()
    for link in existing_links:
        session.delete(link)

    # 如果存在关联的文件，删除文件
    if db_reference.file_path and os.path.exists(db_reference.file_path):
        try:
            os.remove(db_reference.file_path)
        except OSError as e:
            # 记录错误但不中断删除操作
            print(f"Error deleting file {db_reference.file_path}: {e}")

    # 删除参考文献
    session.delete(db_reference)
    session.commit()

    return {"ok": True}


@router.post("/{reference_id}/upload")
async def upload_file(
    reference_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
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
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )      # 创建存储目录
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
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
    current_user: User = Depends(get_current_user)
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
            status_code=404,
            detail="PDF file not found for this reference"
        )

    # 构建文件名
    filename = f"{db_reference.title}.pdf"

    return FileResponse(
        db_reference.file_path,
        filename=filename,
        media_type="application/pdf"
    )


@router.get("/download/by-title")
async def download_reference_by_title(
    title: str,
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
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
            status_code=404,
            detail="Reference paper not found with the specified title"
        )

    # 检查文件是否存在
    if not db_reference.file_path or not os.path.exists(db_reference.file_path):
        raise HTTPException(
            status_code=404,
            detail="PDF file not found for this reference"
        )

    # 构建文件名
    filename = f"{db_reference.title}.pdf"

    return FileResponse(
        db_reference.file_path,
        filename=filename,
        media_type="application/pdf"
    )