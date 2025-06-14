from typing import Optional, List
from sqlmodel import SQLModel


class PaperCreate(SQLModel):
    title: str
    journal: Optional[str] = None
    year: Optional[int] = None
    author_ids: List[int]
    category_id: Optional[int] = None


from app.models.paper import Paper

PaperOut = Paper
