from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.schemas.paper import PaperCreate, PaperOut
from app.core.dependencies import get_session
from app.models.paper import Paper, PaperAuthorLink
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=PaperOut)
def create_paper(paper: PaperCreate, session: Session = Depends(get_session)):
    authors = session.exec(select(User).where(User.id.in_(paper.author_ids))).all()
    db_paper = Paper(
        title=paper.title,
        journal=paper.journal,
        year=paper.year,
        category_id=paper.category_id,
        authors=authors,
    )
    session.add(db_paper)
    session.commit()
    session.refresh(db_paper)
    return db_paper

@router.get("/", response_model=list[PaperOut])
def get_all_papers(session: Session = Depends(get_session)):
    return session.exec(select(Paper)).all()
