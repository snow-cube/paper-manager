from typing import Optional, List, TYPE_CHECKING, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .category import Category
    from .author import Author
    from .keyword import Keyword
    from .team import Team
    from .user import User

class PaperAuthor(SQLModel, table=True):
    """论文-作者关联表"""
    paper_id: Optional[int] = Field(
        default=None, foreign_key="paper.id", primary_key=True
    )
    author_id: Optional[int] = Field(
        default=None, foreign_key="author.id", primary_key=True
    )
    contribution_ratio: float = Field(default=1.0)
    is_corresponding: bool = Field(default=False)
    author_order: int

    paper: "Paper" = Relationship(back_populates="author_links")
    author: "Author" = Relationship(back_populates="paper_links")


class PaperKeyword(SQLModel, table=True):
    """论文-关键字关联表"""
    paper_id: Optional[int] = Field(
        default=None, foreign_key="paper.id", primary_key=True
    )
    keyword_id: Optional[int] = Field(
        default=None, foreign_key="keyword.id", primary_key=True
    )

    paper: "Paper" = Relationship(back_populates="keyword_links")
    keyword: "Keyword" = Relationship(back_populates="paper_links")


class PaperBase(SQLModel):
    title: str = Field(index=True)
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal_id: Optional[int] = Field(default=None, foreign_key="journal.id")
    doi: Optional[str] = Field(default=None, unique=True)
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")  # Direct foreign key


class Paper(PaperBase, table=True):
    __tablename__ = "paper"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: int = Field(foreign_key="user.id")
    team_id: int = Field(foreign_key="team.id")

    # Direct relationship to single category
    category: Optional["Category"] = Relationship(back_populates="papers")

    authors: List["Author"] = Relationship(
        back_populates="papers",
        link_model=PaperAuthor
    )
    author_links: List[PaperAuthor] = Relationship(
        back_populates="paper"
    )

    keywords: List["Keyword"] = Relationship(
        back_populates="papers",
        link_model=PaperKeyword
    )
    keyword_links: List[PaperKeyword] = Relationship(
        back_populates="paper"
    )

    team: "Team" = Relationship(back_populates="papers")
    created_by: "User" = Relationship(back_populates="papers")
    journal: Optional["Journal"] = Relationship()


class PaperCreate(SQLModel):
    """创建论文的请求模型"""
    title: str
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal_id: Optional[int] = None
    doi: Optional[str] = None
    author_names: List[str]
    category_id: Optional[int] = None  # Changed from category_ids to category_id
    keyword_names: List[str]
    author_contribution_ratios: Optional[List[float]] = None
    corresponding_author_name: Optional[str] = None
    team_id: int


class PaperRead(SQLModel):
    """论文返回模型"""
    id: int
    title: str
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal_id: Optional[int] = None
    journal_name: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    keywords: List[str] = []
    authors: List[str] = []
    category_id: Optional[int] = None  # Changed from categories to category_id
    category_name: Optional[str] = None  # Single category name
    team_id: int
    team_name: Optional[str] = None
    created_by_id: int


class PaperUpdate(SQLModel):
    """更新论文的请求模型"""
    title: Optional[str] = None
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal_id: Optional[int] = None
    doi: Optional[str] = None
    category_id: Optional[int] = None  # Changed from category_ids to category_id
    keyword_names: Optional[List[str]] = None
    author_names: Optional[List[str]] = None
    author_contribution_ratios: Optional[List[float]] = None
    file_path: Optional[str] = None
    team_id: Optional[int] = None


class PaginatedPaperResponse(SQLModel):
    """分页论文响应模型"""
    items: List[PaperRead]
    total: int
    page: int
    size: int
    pages: int