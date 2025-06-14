from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.core.database import get_session
from app.models.journal import (
    Journal,
    JournalCreate,
    JournalRead,
    JournalUpdate,
    PaginatedJournalResponse,
)
from app.models.user import User
from app.api.user import get_current_user

router = APIRouter()


def check_admin_permission(user: User):
    """检查用户是否为管理员"""
    if not user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Only administrators can perform this operation"
        )


@router.post("/", response_model=JournalRead)
def create_journal(
    journal: JournalCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """创建期刊（仅管理员）"""
    check_admin_permission(current_user)

    # 检查期刊名称是否已存在
    existing_journal = session.exec(
        select(Journal).where(Journal.name == journal.name)
    ).first()
    if existing_journal:
        raise HTTPException(
            status_code=400, detail="A journal with this name already exists"
        )

    db_journal = Journal(
        name=journal.name, grade=journal.grade, description=journal.description
    )
    session.add(db_journal)
    session.commit()
    session.refresh(db_journal)

    if db_journal.id is None:
        raise HTTPException(status_code=500, detail="Journal ID is missing")

    return JournalRead(
        id=db_journal.id,
        name=db_journal.name,
        grade=db_journal.grade,
        description=db_journal.description,
        created_at=db_journal.created_at,
        updated_at=db_journal.updated_at,
    )


@router.get("/", response_model=PaginatedJournalResponse)
def read_journals(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    grade: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """获取期刊列表（所有用户可访问）"""
    query = select(Journal)

    # 应用过滤条件
    if name:
        query = query.where(Journal.name.contains(name))  # type: ignore
    if grade:
        query = query.where(Journal.grade == grade)

    # 计算总数量
    total_count = len(session.exec(query).all())

    # 执行分页查询
    journals = session.exec(query.offset(skip).limit(limit)).all()

    results = [
        JournalRead(
            id=journal.id if journal.id is not None else 0,
            name=journal.name,
            grade=journal.grade,
            description=journal.description,
            created_at=journal.created_at,
            updated_at=journal.updated_at,
        )
        for journal in journals
    ]

    # 计算分页信息
    current_page = (skip // limit) + 1
    total_pages = (total_count + limit - 1) // limit

    return PaginatedJournalResponse(
        items=results,
        total=total_count,
        page=current_page,
        size=limit,
        pages=total_pages,
    )


@router.get("/search")
def search_journals(
    q: str,
    limit: int = 10,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """搜索期刊（用于前端搜索框）"""
    if len(q.strip()) < 2:
        return {"items": []}

    journals = session.exec(
        select(Journal).where(Journal.name.contains(q)).limit(limit)  # type: ignore
    ).all()

    return {
        "items": [
            {"id": journal.id, "name": journal.name, "grade": journal.grade}
            for journal in journals
        ]
    }


@router.get("/{journal_id}", response_model=JournalRead)
def read_journal(
    journal_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """获取单个期刊"""
    journal = session.get(Journal, journal_id)
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")

    if journal.id is None:
        raise HTTPException(status_code=500, detail="Journal ID is missing")
    return JournalRead(
        id=int(journal.id),
        name=journal.name,
        grade=journal.grade,
        description=journal.description,
        created_at=journal.created_at,
        updated_at=journal.updated_at,
    )


@router.patch("/{journal_id}", response_model=JournalRead)
def update_journal(
    journal_id: int,
    journal_update: JournalUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """更新期刊（仅管理员）"""
    check_admin_permission(current_user)

    journal = session.get(Journal, journal_id)
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")

    # 如果要更新名称，检查是否与其他期刊重复
    if journal_update.name and journal_update.name != journal.name:
        existing_journal = session.exec(
            select(Journal).where(Journal.name == journal_update.name)
        ).first()
        if existing_journal:
            raise HTTPException(
                status_code=400, detail="A journal with this name already exists"
            )

    # 更新字段
    update_data = journal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(journal, key, value)

    journal.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(journal)

    if journal.id is None:
        raise HTTPException(status_code=500, detail="Journal ID is missing")
    return JournalRead(
        id=int(journal.id),
        name=journal.name,
        grade=journal.grade,
        description=journal.description,
        created_at=journal.created_at,
        updated_at=journal.updated_at,
    )


@router.delete("/{journal_id}")
def delete_journal(
    journal_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """删除期刊（仅管理员）"""
    check_admin_permission(current_user)

    journal = session.get(Journal, journal_id)
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")

    # 检查是否有论文使用此期刊
    from app.models.paper import Paper

    papers_using_journal = session.exec(
        select(Paper).where(Paper.journal_id == journal_id)
    ).first()

    if papers_using_journal:
        raise HTTPException(
            status_code=400, detail="Cannot delete journal that is used by papers"
        )

    session.delete(journal)
    session.commit()

    return {"ok": True}


@router.get("/grades/list")
def get_journal_grades(current_user: User = Depends(get_current_user)):
    """获取期刊等级列表"""
    return {
        "grades": [
            {"value": "SCI_Q1", "label": "SCI Q1"},
            {"value": "SCI_Q2", "label": "SCI Q2"},
            {"value": "SCI_Q3", "label": "SCI Q3"},
            {"value": "SCI_Q4", "label": "SCI Q4"},
            {"value": "EI", "label": "EI"},
            {"value": "OTHER", "label": "其他"},
        ]
    }
