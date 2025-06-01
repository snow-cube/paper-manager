from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .category import Category
    from .author import Author
    from .keyword import Keyword

class PaperCategory(SQLModel, table=True):
    """论文-分类关联表"""
    paper_id: Optional[int] = Field(
        default=None, foreign_key="paper.id", primary_key=True
    )
    category_id: Optional[int] = Field(
        default=None, foreign_key="category.id", primary_key=True
    )

    paper: "Paper" = Relationship(back_populates="category_links")
    category: "Category" = Relationship(back_populates="paper_links")


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
    journal: Optional[str] = None
    doi: Optional[str] = Field(default=None, unique=True)
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Paper(PaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationships
    categories: List["Category"] = Relationship(
        back_populates="papers",
        link_model=PaperCategory
    )
    category_links: List[PaperCategory] = Relationship(
        back_populates="paper"
    )

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


class PaperCreate(PaperBase):
    author_names: List[str]  # 修改为作者名字列表
    category_ids: Optional[List[int]] = []
    keyword_names: List[str]
    author_contribution_ratios: Optional[List[float]] = None
    corresponding_author_name: Optional[str] = None  # 修改为通讯作者名字


class PaperRead(PaperBase):
    id: int
    keywords: List[str] = []  # 返回关键字名称列表
    authors: List[str] = []  # 返回作者名称列表


class PaperUpdate(SQLModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    publication_date: Optional[datetime] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    category_ids: Optional[List[int]] = None  # 修改为支持多个分类
    keyword_names: Optional[List[str]] = None  # 更新关键字列表
    file_path: Optional[str] = None