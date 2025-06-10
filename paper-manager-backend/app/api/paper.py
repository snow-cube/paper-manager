from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select, delete
from typing import List, Optional
import os
from datetime import datetime
from fastapi.responses import FileResponse

from app.core.database import get_session
from app.models.paper import (
    Paper, PaperCreate, PaperRead, PaperUpdate,
    PaperAuthor, PaperCategory, PaperKeyword, PaginatedPaperResponse
)
from app.models.keyword import Keyword
from app.models.user import User
from app.models.category import Category
from app.models.author import Author
from app.models.team import Team, TeamUser
from app.api.user import get_current_user
from app.api.team import check_team_member
from app.services.utils import calculate_workload
from app.core.config_dev import PAPERS_DIR
from app.models.journal import Journal

router = APIRouter()

UPLOAD_DIR = str(PAPERS_DIR)


def check_paper_access(paper_id: int, user: User, session: Session) -> Paper:
    """检查论文是否存在（所有论文都是公开的）"""
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


def check_paper_modify_permission(paper_id: int, user: User, session: Session) -> Paper:
    """检查用户是否有权限修改论文"""
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # 如果是管理员，直接允许修改
    if user.is_superuser:
        return paper

    # 只允许创建者修改论文
    if paper.created_by_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the paper creator can modify this paper"
        )

    return paper


def get_category_and_subcategories(session: Session, category_id: int) -> List[int]:
    """递归获取分类及其所有子分类的ID列表"""
    result = [category_id]
    children = session.exec(
        select(Category).where(Category.parent_id == category_id)
    ).all()

    for child in children:
        result.extend(get_category_and_subcategories(session, child.id))

    return result


def get_category_and_parents(session: Session, category_id: int) -> List[int]:
    """递归获取分类及其所有父分类的ID列表"""
    result = [category_id]
    category = session.get(Category, category_id)

    if category and category.parent_id:
        result.extend(get_category_and_parents(session, category.parent_id))

    return result


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


def get_or_create_authors(session: Session, author_names: List[str]) -> List[Author]:
    """获取或创建作者"""
    authors = []
    for name in author_names:
        # 查找现有作者
        author = session.exec(
            select(Author).where(Author.name == name)
        ).first()

        # 如果不存在则创建
        if not author:
            author = Author(name=name)
            session.add(author)
            session.flush()

        authors.append(author)
    return authors


@router.post("/", response_model=PaperRead)
def create_paper(
    paper: PaperCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建论文"""
    # 验证团队是否存在
    if paper.team_id == 0:
        raise HTTPException(
            status_code=400,
            detail="Paper must be associated with a valid team (team_id cannot be 0)"
        )

    team = session.get(Team, paper.team_id)
    if not team:
        raise HTTPException(
            status_code=404,
            detail=f"Team {paper.team_id} not found"
        )

    # 检查用户是否为团队成员
    check_team_member(paper.team_id, current_user, session)

    # 检查DOI是否已存在
    if paper.doi:
        existing_paper = session.exec(
            select(Paper).where(Paper.doi == paper.doi)
        ).first()
        if existing_paper:
            raise HTTPException(
                status_code=400,
                detail="A paper with this DOI already exists"
            )

    # 验证期刊是否存在
    if paper.journal_id:
        journal = session.get(Journal, paper.journal_id)
        if not journal:
            raise HTTPException(
                status_code=404,
                detail=f"Journal {paper.journal_id} not found"
            )

    # 创建论文
    db_paper = Paper(
        title=paper.title,
        abstract=paper.abstract,
        publication_date=paper.publication_date,
        journal_id=paper.journal_id,
        doi=paper.doi,
        created_by_id=current_user.id,
        team_id=paper.team_id
    )
    session.add(db_paper)
    session.flush()  # 获取ID

    # 创建团队关联
    # paper_team = PaperTeam(paper_id=db_paper.id, team_id=paper.team_id)
    # session.add(paper_team)

    # 处理作者
    authors = []
    for i, name in enumerate(paper.author_names):
        # 查找或创建作者
        author = session.exec(
            select(Author).where(Author.name == name)
        ).first()
        if not author:
            author = Author(name=name)
            session.add(author)
            session.flush()

        # 创建论文-作者关联
        contribution_ratio = (
            paper.author_contribution_ratios[i]
            if paper.author_contribution_ratios
            and i < len(paper.author_contribution_ratios)
            else 1.0
        )
        is_corresponding = (
            name == paper.corresponding_author_name
            if paper.corresponding_author_name
            else False
        )
        paper_author = PaperAuthor(
            paper_id=db_paper.id,
            author_id=author.id,
            contribution_ratio=contribution_ratio,
            is_corresponding=is_corresponding,
            author_order=i + 1
        )
        session.add(paper_author)
        authors.append(name)

    # 处理分类
    if paper.category_ids:
        for category_id in paper.category_ids:
            # 检查分类是否存在
            category = session.get(Category, category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category {category_id} not found"
                )
            # 创建论文-分类关联
            paper_category = PaperCategory(
                paper_id=db_paper.id,
                category_id=category_id
            )
            session.add(paper_category)

    # 处理关键词
    keywords = []
    for name in paper.keyword_names:
        # 查找或创建关键词
        keyword = session.exec(
            select(Keyword).where(Keyword.name == name)
        ).first()
        if not keyword:
            keyword = Keyword(name=name)
            session.add(keyword)
            session.flush()        # 创建论文-关键词关联
        paper_keyword = PaperKeyword(
            paper_id=db_paper.id,
            keyword_id=keyword.id
        )
        session.add(paper_keyword)
        keywords.append(name)

    session.commit()
    session.refresh(db_paper)

    # 获取团队名称
    team_name = None
    if paper.team_id:
        team = session.get(Team, paper.team_id)
        if team:
            team_name = team.name

    # 获取期刊名称
    journal_name = None
    if paper.journal_id:
        journal = session.get(Journal, paper.journal_id)
        if journal:
            journal_name = journal.name

    return PaperRead(
        id=db_paper.id,
        title=db_paper.title,
        abstract=db_paper.abstract,
        publication_date=db_paper.publication_date,
        journal_id=paper.journal_id,
        journal_name=journal_name,
        doi=db_paper.doi,
        file_path=db_paper.file_path,
        created_at=db_paper.created_at,
        updated_at=db_paper.updated_at,
        keywords=keywords,
        authors=authors,
        team_id=paper.team_id,
        team_name=team_name,
        created_by_id=current_user.id
    )


@router.post("/{paper_id}/upload")
async def upload_paper_file(
    paper_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 检查论文是否存在
    paper = check_paper_modify_permission(paper_id, current_user, session)

    # 如果论文已有文件，删除旧文件
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)

    # 生成唯一文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{paper_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 保存文件
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # 更新论文的文件路径
    paper.file_path = file_path
    paper.updated_at = datetime.utcnow()
    session.add(paper)
    session.commit()

    return {
        "paper_id": paper_id,
        "filename": filename,
        "file_path": file_path
    }


@router.get("/", response_model=PaginatedPaperResponse)
def read_papers(
    skip: int = 0,
    limit: int = 100,
    title: Optional[str] = None,
    category_id: Optional[int] = None,
    author_name: Optional[str] = None,
    keyword: Optional[str] = None,
    journal_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    team_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取论文列表"""
    # 基础查询
    query = select(Paper)

    # 根据team_id进行过滤
    if team_id is not None and team_id != 0:
        # 验证团队是否存在
        team = session.get(Team, team_id)
        if not team:
            raise HTTPException(
                status_code=404,
                detail=f"Team {team_id} not found"
            )
        # 过滤指定团队的论文
        query = query.where(Paper.team_id == team_id)
    # 如果team_id为0或None，返回所有论文（不添加团队过滤条件）

    # 应用其他过滤条件
    if title:
        query = query.where(Paper.title.contains(title))
    if category_id:
        query = (
            query
            .join(PaperCategory)
            .where(PaperCategory.category_id == category_id)
        )
    if author_name:
        query = (
            query
            .join(PaperAuthor)
            .join(Author)
            .where(Author.name == author_name)
        )
    if keyword:
        query = (
            query
            .join(PaperKeyword)
            .join(Keyword)
            .where(Keyword.name == keyword)
        )
    if journal_id:
        query = query.where(Paper.journal_id == journal_id)
    if start_date:
        query = query.where(Paper.publication_date >= start_date)
    if end_date:
        query = query.where(Paper.publication_date <= end_date)

    # 计算总数量（在应用 offset/limit 之前）
    total_count = len(session.exec(query).all())

    # 执行分页查询
    papers = session.exec(query.offset(skip).limit(limit)).all()

    # 构建返回数据
    results = []
    for paper in papers:
        # 获取关键词
        keywords = [
            kw.name for kw in session.exec(
                select(Keyword)
                .join(PaperKeyword)
                .where(PaperKeyword.paper_id == paper.id)
            ).all()
        ]

        # 获取作者
        authors = [
            author.name for author in session.exec(
                select(Author)
                .join(PaperAuthor)
                .where(PaperAuthor.paper_id == paper.id)
                .order_by(PaperAuthor.author_order)
            ).all()
        ]        # 获取分类
        categories = [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description
            }
            for category in session.exec(
                select(Category)
                .join(PaperCategory)
                .where(PaperCategory.paper_id == paper.id)
            ).all()
        ]

        # 获取期刊名称
        journal_name = None
        if paper.journal_id:
            journal = session.get(Journal, paper.journal_id)
            if journal:
                journal_name = journal.name

        # 获取团队名称
        team_name = None
        if paper.team_id:
            team = session.get(Team, paper.team_id)
            if team:
                team_name = team.name

        # 获取团队ID - 直接从论文对象获取
        results.append(
            PaperRead(
                id=paper.id,
                title=paper.title,
                abstract=paper.abstract,
                publication_date=paper.publication_date,
                journal_id=paper.journal_id,
                journal_name=journal_name,
                doi=paper.doi,
                file_path=paper.file_path,
                created_at=paper.created_at,
                updated_at=paper.updated_at,
                keywords=keywords,
                authors=authors,
                categories=categories,
                team_id=paper.team_id,
                team_name=team_name,
                created_by_id=paper.created_by_id
            )
        )

    # 计算分页信息
    current_page = (skip // limit) + 1
    total_pages = (total_count + limit - 1) // limit  # 向上取整

    # 返回分页响应
    return PaginatedPaperResponse(
        items=results,
        total=total_count,
        page=current_page,
        size=limit,
        pages=total_pages
    )


@router.get("/{paper_id}", response_model=PaperRead)
def read_paper(
    paper_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取单个论文"""
    paper = check_paper_access(paper_id, current_user, session)

    # 获取关键词
    keywords = [
        kw.name for kw in session.exec(
            select(Keyword)
            .join(PaperKeyword)
            .where(PaperKeyword.paper_id == paper_id)
        ).all()
    ]

    # 获取作者
    authors = [
        author.name for author in session.exec(
            select(Author)
            .join(PaperAuthor)
            .where(PaperAuthor.paper_id == paper_id)
            .order_by(PaperAuthor.author_order)
        ).all()
    ]    # 获取分类
    categories = [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
        for category in session.exec(
            select(Category)
            .join(PaperCategory)
            .where(PaperCategory.paper_id == paper_id)
        ).all()
    ]

    # 获取期刊名称
    journal_name = None
    if paper.journal_id:
        journal = session.get(Journal, paper.journal_id)
        if journal:
            journal_name = journal.name

    # 获取团队名称
    team_name = None
    if paper.team_id:
        team = session.get(Team, paper.team_id)
        if team:
            team_name = team.name

    return PaperRead(
        id=paper.id,
        title=paper.title,
        abstract=paper.abstract,
        publication_date=paper.publication_date,
        journal_id=paper.journal_id,
        journal_name=journal_name,
        doi=paper.doi,
        file_path=paper.file_path,
        created_at=paper.created_at,
        updated_at=paper.updated_at,
        keywords=keywords,
        authors=authors,
        categories=categories,
        team_id=paper.team_id,
        team_name=team_name,
        created_by_id=paper.created_by_id
    )


@router.patch("/{paper_id}", response_model=PaperRead)
def update_paper(
    paper_id: int,
    paper_update: PaperUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新论文"""
    paper = check_paper_modify_permission(paper_id, current_user, session)

    # 如果要更改团队，检查权限
    if paper_update.team_id is not None:
        if paper_update.team_id == 0:
            raise HTTPException(
                status_code=400,
                detail="Paper must be associated with a valid team (team_id cannot be 0)"
            )

        # 验证新团队是否存在
        team = session.get(Team, paper_update.team_id)
        if not team:
            raise HTTPException(
                status_code=404,
                detail=f"Team {paper_update.team_id} not found"
            )

        # 检查用户是否为新团队成员
        check_team_member(paper_update.team_id, current_user, session)

    # 验证期刊是否存在
    if paper_update.journal_id is not None:
        if paper_update.journal_id != 0:  # 0 表示清空期刊
            journal = session.get(Journal, paper_update.journal_id)
            if not journal:
                raise HTTPException(
                    status_code=404,
                    detail=f"Journal {paper_update.journal_id} not found"
                )

    # 更新基本信息
    paper_data = paper_update.dict(exclude_unset=True)
    # 移除需要特殊处理的字段
    special_fields = {"category_ids", "keyword_names", "author_names", "author_contribution_ratios"}
    update_data = {k: v for k, v in paper_data.items() if k not in special_fields}

    # 更新基本字段（包括team_id）
    for key, value in update_data.items():
        setattr(paper, key, value)

    # 更新分类
    if paper_update.category_ids is not None:
        # 删除现有分类关联
        session.exec(
            delete(PaperCategory).where(PaperCategory.paper_id == paper_id)
        )
        # 添加新的分类关联
        for category_id in paper_update.category_ids:
            category = session.get(Category, category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category {category_id} not found"
                )
            paper_category = PaperCategory(
                paper_id=paper_id,
                category_id=category_id
            )
            session.add(paper_category)

    # 更新关键词
    if paper_update.keyword_names is not None:
        # 删除现有关键词关联
        session.exec(
            delete(PaperKeyword).where(PaperKeyword.paper_id == paper_id)
        )
        # 添加新的关键词关联
        for name in paper_update.keyword_names:
            keyword = session.exec(
                select(Keyword).where(Keyword.name == name)
            ).first()
            if not keyword:
                keyword = Keyword(name=name)
                session.add(keyword)
                session.flush()
            paper_keyword = PaperKeyword(
                paper_id=paper_id,
                keyword_id=keyword.id
            )
            session.add(paper_keyword)

    paper.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(paper)

    # 返回更新后的论文信息
    return read_paper(paper_id, session, current_user)


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除论文"""
    paper = check_paper_modify_permission(paper_id, current_user, session)

    # 删除文件（如果存在）
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)

    # 删除所有关联
    session.exec(
        delete(PaperAuthor).where(PaperAuthor.paper_id == paper_id)
    )
    session.exec(
        delete(PaperCategory).where(PaperCategory.paper_id == paper_id)
    )
    session.exec(
        delete(PaperKeyword).where(PaperKeyword.paper_id == paper_id)
    )

    # 删除论文
    session.delete(paper)
    session.commit()

    return {"ok": True}


@router.get("/{paper_id}/workload")
def calculate_paper_workload(
    paper_id: int,
    session: Session = Depends(get_session)
):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # 获取期刊等级
    journal_grade = "OTHER"
    if paper.journal_id:
        journal = session.get(Journal, paper.journal_id)
        if journal:
            journal_grade = journal.grade

    author_links = session.exec(
        select(PaperAuthor).where(PaperAuthor.paper_id == paper_id)
    ).all()

    workloads = []
    for author_link in author_links:
        workload = calculate_workload(
            contribution_ratio=author_link.contribution_ratio,
            journal_grade=journal_grade
        )
        workloads.append({
            "author_id": author_link.author_id,
            "contribution_ratio": author_link.contribution_ratio,
            "workload": workload
        })

    return {"paper_id": paper_id, "journal_grade": journal_grade, "workloads": workloads}

@router.get("/authors/workload/by-name")
def calculate_author_workload_by_name(
    author_name: str,
    session: Session = Depends(get_session)
):
    """通过作者名字计算其所有论文工作量"""
    # 查找作者
    author = session.exec(
        select(Author).where(Author.name == author_name)
    ).first()

    if not author:
        raise HTTPException(status_code=404, detail=f"Author '{author_name}' not found")

    # 获取作者的所有论文关联
    author_papers = session.exec(
        select(PaperAuthor).where(PaperAuthor.author_id == author.id)
    ).all()

    # 计算每篇论文的工作量
    paper_workloads = []
    for paper_link in author_papers:
        paper = session.get(Paper, paper_link.paper_id)
        if paper:
            # 获取期刊等级
            journal_grade = "OTHER"
            journal_name = None
            if paper.journal_id:
                journal = session.get(Journal, paper.journal_id)
                if journal:
                    journal_grade = journal.grade
                    journal_name = journal.name

            workload = calculate_workload(
                contribution_ratio=paper_link.contribution_ratio,
                journal_grade=journal_grade
            )

            paper_workloads.append({
                "paper_id": paper.id,
                "paper_title": paper.title,
                "contribution_ratio": paper_link.contribution_ratio,
                "is_corresponding": paper_link.is_corresponding,
                "author_order": paper_link.author_order,
                "workload": workload,
                "publication_date": paper.publication_date,
                "journal_id": paper.journal_id,
                "journal_name": journal_name,
                "journal_grade": journal_grade
            })

    # 按发表日期排序
    paper_workloads.sort(key=lambda x: x["publication_date"] if x["publication_date"] else datetime.min)

    total_workload = sum(pw["workload"] for pw in paper_workloads)

    return {
        "author_id": author.id,
        "author_name": author.name,
        "total_workload": total_workload,
        "paper_workloads": paper_workloads
    }

@router.get("/{paper_id}/download")
async def download_paper_by_id(
    paper_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """通过ID下载论文PDF文件"""
    # 检查论文是否存在（所有论文都是公开的）
    paper = check_paper_access(paper_id, current_user, session)

    # 检查文件是否存在
    if not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(
            status_code=404,
            detail="PDF file not found for this paper"
        )

    # 构建文件名
    filename = f"{paper.title}.pdf"

    return FileResponse(
        paper.file_path,
        filename=filename,
        media_type="application/pdf"
    )


@router.get("/download/by-title")
async def download_paper_by_title(
    title: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """通过标题下载论文PDF文件"""
    # 查找论文
    paper = session.exec(
        select(Paper).where(Paper.title == title)
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found with the specified title"
        )

    # 检查论文是否存在（所有论文都是公开的）
    paper = check_paper_access(paper.id, current_user, session)

    # 检查文件是否存在
    if not paper.file_path or not os.path.exists(paper.file_path):
        raise HTTPException(
            status_code=404,
            detail="PDF file not found for this paper"
        )

    # 构建文件名
    filename = f"{paper.title}.pdf"

    return FileResponse(
        paper.file_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/authors/collaboration-network")
def get_author_collaboration_network(
    author_name: str,
    session: Session = Depends(get_session)
):
    """获取作者的合作关系网络"""
    # 查找作者
    author = session.exec(
        select(Author).where(Author.name == author_name)
    ).first()

    if not author:
        raise HTTPException(status_code=404, detail=f"Author '{author_name}' not found")

    # 获取作者参与的所有论文
    author_papers = session.exec(
        select(PaperAuthor).where(PaperAuthor.author_id == author.id)
    ).all()

    # 用于存储合作关系的字典
    collaborations = {}

    # 遍历每篇论文，查找合作者
    for paper_link in author_papers:
        # 获取这篇论文的所有作者
        coauthors = session.exec(
            select(PaperAuthor, Author)
            .join(Author)
            .where(
                PaperAuthor.paper_id == paper_link.paper_id,
                PaperAuthor.author_id != author.id  # 排除作者本人
            )
        ).all()

        # 统计合作次数
        for coauthor_link, coauthor in coauthors:
            if coauthor.name not in collaborations:
                collaborations[coauthor.name] = {
                    "author_id": coauthor.id,
                    "name": coauthor.name,
                    "collaboration_count": 1,
                    "papers": [{
                        "paper_id": paper_link.paper_id,
                        "author_order": coauthor_link.author_order,
                        "is_corresponding": coauthor_link.is_corresponding
                    }]
                }
            else:
                collaborations[coauthor.name]["collaboration_count"] += 1
                collaborations[coauthor.name]["papers"].append({
                    "paper_id": paper_link.paper_id,
                    "author_order": coauthor_link.author_order,
                    "is_corresponding": coauthor_link.is_corresponding
                })

    # 将合作者列表按合作次数降序排序
    sorted_collaborators = sorted(
        collaborations.values(),
        key=lambda x: x["collaboration_count"],
        reverse=True
    )

    return {
        "author": {
            "id": author.id,
            "name": author.name
        },
        "total_collaborators": len(sorted_collaborators),
        "collaborators": sorted_collaborators
    }
