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


@router.post("/", response_model=CategoryRead)
def create_category(
    category: CategoryCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if category.parent_id:
        parent = session.get(Category, category.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
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
    category_update: CategoryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_category = session.get(Category, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category_update.parent_id:
        parent = session.get(Category, category_update.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")
        # Prevent circular reference
        if category_id == category_update.parent_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
    
    category_data = category_update.dict(exclude_unset=True)
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
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has children
    children = session.exec(
        select(Category).where(Category.parent_id == category_id)
    ).all()
    if children:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with child categories"
        )
    
    # Remove category links from papers
    paper_links = session.exec(
        select(PaperCategory).where(PaperCategory.category_id == category_id)
    ).all()
    for link in paper_links:
        session.delete(link)
    
    # Update reference papers to remove this category
    reference_papers = session.exec(
        select(ReferencePaper).where(ReferencePaper.category_id == category_id)
    ).all()
    for ref_paper in reference_papers:
        ref_paper.category_id = None
        session.add(ref_paper)
    
    session.delete(category)
    session.commit()
    return {"ok": True}