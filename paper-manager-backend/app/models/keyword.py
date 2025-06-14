from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from .paper import PaperKeyword
from .reference import ReferenceKeyword

if TYPE_CHECKING:
    from .paper import Paper
    from .reference import ReferencePaper


class Keyword(SQLModel, table=True):
    """关键字表"""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)  # 关键字名称
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # 关系
    papers: List["Paper"] = Relationship(
        back_populates="keywords", link_model=PaperKeyword
    )
    paper_links: List[PaperKeyword] = Relationship(back_populates="keyword")

    references: List["ReferencePaper"] = Relationship(
        back_populates="keywords", link_model=ReferenceKeyword
    )
    reference_links: List[ReferenceKeyword] = Relationship(back_populates="keyword")


class KeywordCreate(SQLModel):
    name: str


class KeywordRead(SQLModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class KeywordUpdate(SQLModel):
    name: Optional[str] = None
