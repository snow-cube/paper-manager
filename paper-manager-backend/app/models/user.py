from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from app.models.paper import Paper, PaperAuthorLink

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    papers: List["Paper"] = Relationship(back_populates="authors", link_model=PaperAuthorLink)