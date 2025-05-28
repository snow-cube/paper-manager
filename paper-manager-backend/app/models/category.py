from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

from app.models.paper import Paper

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    parent_id: Optional[int] = Field(default=None, foreign_key="category.id")

    children: List["Category"] = Relationship(back_populates="parent")
    parent: Optional["Category"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Category.id"})
    papers: List["Paper"] = Relationship(back_populates="category")