from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserOut
from app.core.dependencies import get_session

router = APIRouter()

@router.get("/", response_model=list[UserOut])
def get_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()
