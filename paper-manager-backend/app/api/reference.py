from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
import os
import shutil

from app.core.database import get_session
from app.models.reference import (
    ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate,
    ReferenceKeyword
)
from app.models.keyword import Keyword
from app.models.user import User
from app.models.category import Category
from app.api.user import get_current_user
from app.api.team import check_team_member

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
    """创建参考文献"""
    # 检查用户是否为团队成员
    check_team_member(reference.team_id, current_user, session)
    
    # 检查分类是否存在（如果提供了分类ID）
    if reference.category_id:
        category = session.get(Category, reference.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    # 获取或创建关键字
    keywords = get_or_create_keywords(session, reference.keyword_names)

    # 创建参考文献
    db_reference = ReferencePaper(
        **reference.dict(exclude={"keyword_names"}),
        created_by=current_user.id
    )
    session.add(db_reference)
    session.flush()

    # 创建关键字链接
    for keyword in keywords:
        keyword_link = ReferenceKeyword(
            reference_id=db_reference.id,
            keyword_id=keyword.id
        )
        session.add(keyword_link)

    session.commit()
    session.refresh(db_reference)

    # 准备返回数据
    result = ReferenceRead.from_orm(db_reference)
    result.keywords = [keyword.name for keyword in keywords]
    return result


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
        reference_read = ReferenceRead.from_orm(reference)
        reference_read.keywords = [kw.name for kw in reference.keywords]
        results.append(reference_read)
    
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
    check_team_member(reference.team_id, current_user, session)
    
    # 准备返回数据
    result = ReferenceRead.from_orm(reference)
    result.keywords = [keyword.name for keyword in reference.keywords]
    return result


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
        session.exec(
            select(ReferenceKeyword).where(ReferenceKeyword.reference_id == reference_id)
        ).delete()
        
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
    
    # 准备返回数据
    result = ReferenceRead.from_orm(db_reference)
    result.keywords = [keyword.name for keyword in db_reference.keywords]
    return result


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
    check_team_member(db_reference.team_id, current_user, session)
    
    # 如果存在关联的文件，删除文件
    if db_reference.file_path and os.path.exists(db_reference.file_path):
        os.remove(db_reference.file_path)
    
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
    check_team_member(db_reference.team_id, current_user, session)
    
    # 检查文件类型
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )
    
    # 创建存储目录
    upload_dir = f"uploads/teams/{db_reference.team_id}/references"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 生成文件路径
    file_path = os.path.join(upload_dir, f"{reference_id}_{file.filename}")
    
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
    db_reference.file_path = file_path
    db_reference.updated_at = datetime.utcnow()
    session.add(db_reference)
    session.commit()
    
    return {"filename": file.filename, "file_path": file_path} 