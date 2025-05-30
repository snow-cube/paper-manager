from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from .paper import PaperAuthor

class Author(SQLModel, table=True):
    """作者表"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: Optional[str] = Field(default=None, unique=True)
    affiliation: Optional[str] = None  # 所属机构
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # 关系
    papers: List["Paper"] = Relationship(
        back_populates="authors",
        link_model=PaperAuthor
    )
    paper_links: List[PaperAuthor] = Relationship(
        back_populates="author"
    ) 