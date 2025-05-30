from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey
from datetime import datetime

if TYPE_CHECKING:
    from .keyword import Keyword
    from .team import Team
    from .user import User

class ReferenceKeyword(SQLModel, table=True):
    """参考文献-关键字关联表"""
    reference_id: Optional[int] = Field(
        default=None, foreign_key="referencepaper.id", primary_key=True
    )
    keyword_id: Optional[int] = Field(
        default=None, foreign_key="keyword.id", primary_key=True
    )
    
    reference: "ReferencePaper" = Relationship(back_populates="keyword_links")
    keyword: "Keyword" = Relationship(back_populates="reference_links")


class ReferencePaperBase(SQLModel):
    title: str = Field(index=True)
    authors: str
    doi: Optional[str] = Field(default=None, unique=True)
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    team_id: Optional[int] = Field(default=None, foreign_key="team.id")
    created_by_id: int = Field(foreign_key="user.id")
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")


class ReferencePaper(ReferencePaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    team: Optional["Team"] = Relationship(back_populates="references")
    creator: "User" = Relationship(back_populates="created_references")
    category: Optional["Category"] = Relationship(back_populates="reference_papers")
    keywords: List["Keyword"] = Relationship(
        back_populates="references",
        link_model=ReferenceKeyword
    )
    keyword_links: List[ReferenceKeyword] = Relationship(
        back_populates="reference"
    )


class ReferenceCreate(ReferencePaperBase):
    keyword_names: List[str]  # 使用关键字名称列表


class ReferenceRead(ReferencePaperBase):
    id: int
    keywords: List[str] = []  # 返回关键字名称列表


class ReferenceUpdate(SQLModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    keyword_names: Optional[List[str]] = None  # 更新关键字列表 