from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.core.database import get_session
from app.models.category import Category, CategoryCreate, CategoryRead, CategoryUpdate
from app.models.user import User
from app.api.user import get_current_user
from app.models.paper import PaperCategory
from app.models.reference import ReferencePaper

router = APIRouter()


def check_superuser(user: User):
    """检查用户是否为管理员"""
    if not user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can perform this operation"
        )


@router.post("/", response_model=CategoryRead)
def create_category(
    category: CategoryCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建分类（仅管理员）"""
    # 检查管理员权限
    check_superuser(current_user)

    # 如果指定了父分类，检查是否存在
    if category.parent_id:
        parent = session.get(Category, category.parent_id)
        if not parent:
            raise HTTPException(
                status_code=404,
                detail=f"Parent category {category.parent_id} not found"
            )

    db_category = Category.from_orm(category)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


@router.get("/", response_model=List[CategoryRead])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    categories = session.exec(select(Category).offset(skip).limit(limit)).all()
    return categories


@router.get("/{category_id}", response_model=CategoryRead)
def read_category(
    category_id: int,
    session: Session = Depends(get_session)
):
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新分类（仅管理员）"""
    # 检查管理员权限
    check_superuser(current_user)

    db_category = session.get(Category, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 如果要更新父分类，检查是否存在
    if category.parent_id is not None:
        if category.parent_id != 0:  # 0 表示没有父分类
            parent = session.get(Category, category.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=404,
                    detail=f"Parent category {category.parent_id} not found"
                )

        # 检查是否会创建循环依赖
        if category.parent_id == category_id:
            raise HTTPException(
                status_code=400,
                detail="Category cannot be its own parent"
            )

    category_data = category.dict(exclude_unset=True)
    for key, value in category_data.items():
        setattr(db_category, key, value)

    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除分类（仅管理员）"""
    # 检查管理员权限
    check_superuser(current_user)

    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 检查是否有子分类
    children = session.exec(
        select(Category).where(Category.parent_id == category_id)
    ).all()
    if children:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with subcategories"
        )

    # 检查是否有关联的论文
    papers = session.exec(
        select(PaperCategory).where(PaperCategory.category_id == category_id)
    ).all()
    if papers:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with associated papers"
        )

    session.delete(category)
    session.commit()
    return {"ok": True}