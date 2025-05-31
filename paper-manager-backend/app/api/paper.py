from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
import os
from datetime import datetime
from fastapi.responses import FileResponse

from app.core.database import get_session
from app.models.paper import (
    Paper, PaperCreate, PaperRead, PaperUpdate,
    PaperAuthor, PaperCategory, PaperKeyword
)
from app.models.keyword import Keyword
from app.models.user import User
from app.models.category import Category
from app.models.author import Author
from app.api.user import get_current_user
from app.services.utils import calculate_workload

router = APIRouter()

UPLOAD_DIR = "uploads/papers"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
async def create_paper(
    paper: PaperCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if DOI already exists
    if paper.doi:
        existing_paper = session.exec(
            select(Paper).where(Paper.doi == paper.doi)
        ).first()
        if existing_paper:
            raise HTTPException(
                status_code=400,
                detail=f"Paper with DOI {paper.doi} already exists"
            )
    
    # Verify categories exist (if any)
    categories = []
    if paper.category_ids:
        for category_id in paper.category_ids:
            category = session.get(Category, category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category with id {category_id} not found"
                )
            categories.append(category)
    
    # Get or create authors
    authors = get_or_create_authors(session, paper.author_names)
    
    # Get or create keywords
    keywords = get_or_create_keywords(session, paper.keyword_names)
    
    # Create paper
    db_paper = Paper(
        title=paper.title,
        abstract=paper.abstract,
        publication_date=paper.publication_date,
        journal=paper.journal,
        doi=paper.doi,
        file_path=paper.file_path,
    )
    session.add(db_paper)
    session.flush()  # Get paper ID
    
    # Create category links (if any)
    for category in categories:
        category_link = PaperCategory(
            paper_id=db_paper.id,
            category_id=category.id
        )
        session.add(category_link)
    
    # Create keyword links
    for keyword in keywords:
        keyword_link = PaperKeyword(
            paper_id=db_paper.id,
            keyword_id=keyword.id
        )
        session.add(keyword_link)
    
    # Create author links with contribution ratios
    contribution_ratios = paper.author_contribution_ratios or [1.0/len(authors)] * len(authors)
    if len(contribution_ratios) != len(authors):
        raise HTTPException(
            status_code=400,
            detail="Number of contribution ratios must match number of authors"
        )
    
    for i, (author, ratio) in enumerate(zip(authors, contribution_ratios)):
        author_link = PaperAuthor(
            paper_id=db_paper.id,
            author_id=author.id,
            contribution_ratio=ratio,
            is_corresponding=author.name == paper.corresponding_author_name,
            author_order=i + 1
        )
        session.add(author_link)
    
    session.commit()
    session.refresh(db_paper)
    
    # 准备返回数据
    paper_dict = {
        "id": db_paper.id,
        "title": db_paper.title,
        "abstract": db_paper.abstract,
        "publication_date": db_paper.publication_date,
        "journal": db_paper.journal,
        "doi": db_paper.doi,
        "file_path": db_paper.file_path,
        "created_at": db_paper.created_at,
        "updated_at": db_paper.updated_at,
        "keywords": [keyword.name for keyword in keywords],
        "authors": [author.name for author in authors]
    }
    result = PaperRead(**paper_dict)
    return result


@router.post("/{paper_id}/upload")
async def upload_paper_file(
    paper_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 检查论文是否存在
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
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


@router.get("/", response_model=List[PaperRead])
def read_papers(
    skip: int = 0,
    limit: int = 100,
    title: Optional[str] = None,
    category_id: Optional[int] = None,
    author_name: Optional[str] = None,
    keyword: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session)
):
    """获取论文列表，支持按论文名、分类、作者、关键字和日期范围筛选"""
    query = select(Paper)
    
    # 按论文名筛选（模糊查询）
    if title is not None:
        query = query.where(Paper.title.contains(title))
    
    # 按分类筛选
    if category_id is not None:
        query = query.join(PaperCategory).where(PaperCategory.category_id == category_id)
    
    # 按作者名字筛选
    if author_name is not None:
        query = (
            query
            .join(PaperAuthor)
            .join(Author)
            .where(Author.name == author_name)
        )
    
    # 按关键字筛选
    if keyword is not None:
        query = (
            query
            .join(PaperKeyword)
            .join(Keyword)
            .where(Keyword.name == keyword)
        )
    
    # 按日期范围筛选
    if start_date is not None:
        query = query.where(Paper.publication_date >= start_date)
    if end_date is not None:
        query = query.where(Paper.publication_date <= end_date)
    
    papers = session.exec(query.offset(skip).limit(limit)).all()
    
    # 准备返回数据
    results = []
    for paper in papers:
        # 先创建包含基本信息的字典
        paper_dict = {
            "id": paper.id,
            "title": paper.title,
            "abstract": paper.abstract,
            "publication_date": paper.publication_date,
            "journal": paper.journal,
            "doi": paper.doi,
            "file_path": paper.file_path,
            "created_at": paper.created_at,
            "updated_at": paper.updated_at,
            "keywords": [kw.name for kw in paper.keywords],
            "authors": [author.name for author in paper.authors]
        }
        # 使用字典创建PaperRead对象
        paper_read = PaperRead(**paper_dict)
        results.append(paper_read)
    
    return results


@router.get("/{paper_id}", response_model=PaperRead)
def read_paper(
    paper_id: int,
    session: Session = Depends(get_session)
):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # 准备返回数据
    paper_dict = {
        "id": paper.id,
        "title": paper.title,
        "abstract": paper.abstract,
        "publication_date": paper.publication_date,
        "journal": paper.journal,
        "doi": paper.doi,
        "file_path": paper.file_path,
        "created_at": paper.created_at,
        "updated_at": paper.updated_at,
        "keywords": [keyword.name for keyword in paper.keywords],
        "authors": [author.name for author in paper.authors]
    }
    return PaperRead(**paper_dict)


@router.patch("/{paper_id}", response_model=PaperRead)
def update_paper(
    paper_id: int,
    paper_update: PaperUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_paper = session.get(Paper, paper_id)
    if not db_paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # 更新论文基本信息
    paper_data = paper_update.dict(exclude_unset=True)
    category_ids = paper_data.pop("category_ids", None)
    keyword_names = paper_data.pop("keyword_names", None)
    
    for key, value in paper_data.items():
        setattr(db_paper, key, value)
    
    # 更新分类（如果提供了）
    if category_ids is not None:
        # 删除现有的分类关联
        category_links = session.exec(
            select(PaperCategory).where(PaperCategory.paper_id == paper_id)
        ).all()
        for link in category_links:
            session.delete(link)
        
        # 添加新的分类关联
        for category_id in category_ids:
            category = session.get(Category, category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category with id {category_id} not found"
                )
            category_link = PaperCategory(
                paper_id=paper_id,
                category_id=category_id
            )
            session.add(category_link)
    
    # 更新关键词（如果提供了）
    if keyword_names is not None:
        # 删除现有的关键词关联
        keyword_links = session.exec(
            select(PaperKeyword).where(PaperKeyword.paper_id == paper_id)
        ).all()
        for link in keyword_links:
            session.delete(link)
        
        # 添加新的关键词关联
        keywords = get_or_create_keywords(session, keyword_names)
        for keyword in keywords:
            keyword_link = PaperKeyword(
                paper_id=paper_id,
                keyword_id=keyword.id
            )
            session.add(keyword_link)
    
    db_paper.updated_at = datetime.utcnow()
    session.add(db_paper)
    session.commit()
    session.refresh(db_paper)
    
    # 准备返回数据
    paper_dict = {
        "id": db_paper.id,
        "title": db_paper.title,
        "abstract": db_paper.abstract,
        "publication_date": db_paper.publication_date,
        "journal": db_paper.journal,
        "doi": db_paper.doi,
        "file_path": db_paper.file_path,
        "created_at": db_paper.created_at,
        "updated_at": db_paper.updated_at,
        "keywords": [keyword.name for keyword in db_paper.keywords],
        "authors": [author.name for author in db_paper.authors]
    }
    return PaperRead(**paper_dict)


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # 删除论文相关的所有关联记录
    # 1. 删除作者关联
    author_links = session.exec(
        select(PaperAuthor).where(PaperAuthor.paper_id == paper_id)
    ).all()
    for link in author_links:
        session.delete(link)
    
    # 2. 删除分类关联
    category_links = session.exec(
        select(PaperCategory).where(PaperCategory.paper_id == paper_id)
    ).all()
    for link in category_links:
        session.delete(link)
    
    # 3. 删除关键词关联
    keyword_links = session.exec(
        select(PaperKeyword).where(PaperKeyword.paper_id == paper_id)
    ).all()
    for link in keyword_links:
        session.delete(link)
    
    # 删除关联文件（如果存在）
    if paper.file_path and os.path.exists(paper.file_path):
        os.remove(paper.file_path)
    
    # 删除论文记录
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
    
    author_links = session.exec(
        select(PaperAuthor).where(PaperAuthor.paper_id == paper_id)
    ).all()
    
    workloads = []
    for author_link in author_links:
        workload = calculate_workload(
            contribution_ratio=author_link.contribution_ratio,
            paper_type="SCI_Q1"  # This should be determined based on journal ranking
        )
        workloads.append({
            "author_id": author_link.author_id,
            "contribution_ratio": author_link.contribution_ratio,
            "workload": workload
        })
    
    return {"paper_id": paper_id, "workloads": workloads}

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
            # 这里可以根据期刊等级来确定论文类型
            # 目前简单地将所有论文视为SCI_Q1
            paper_type = "SCI_Q1"  # 这里可以添加逻辑来确定论文类型
            
            workload = calculate_workload(
                contribution_ratio=paper_link.contribution_ratio,
                paper_type=paper_type
            )
            
            paper_workloads.append({
                "paper_id": paper.id,
                "paper_title": paper.title,
                "contribution_ratio": paper_link.contribution_ratio,
                "is_corresponding": paper_link.is_corresponding,
                "author_order": paper_link.author_order,
                "workload": workload,
                "publication_date": paper.publication_date,
                "journal": paper.journal
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
    session: Session = Depends(get_session)
):
    """通过ID下载论文PDF文件"""
    paper = session.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
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
    session: Session = Depends(get_session)
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
