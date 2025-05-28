from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

# from app.models.category import Category
# from app.models.user import User

class PaperAuthorLink(SQLModel, table=True):
    paper_id: Optional[int] = Field(default=None, foreign_key="paper.id", primary_key=True)
    author_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)

class Paper(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    journal: Optional[str] = None
    year: Optional[int] = None
    file_path: Optional[str] = None
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    authors: List["User"] = Relationship(back_populates="papers", link_model=PaperAuthorLink)
    category: Optional["Category"] = Relationship(back_populates="papers")