from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.models.category import Category
from app.schemas.category import CategoryOut
from app.core.dependencies import get_session

router = APIRouter()

@router.get("/", response_model=list[CategoryOut])
def get_categories(session: Session = Depends(get_session)):
    return session.exec(select(Category)).all()