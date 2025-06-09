from typing import Optional, List, TYPE_CHECKING, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .keyword import Keyword
    from .team import Team
    from .user import User


class ReferenceCategory(SQLModel, table=True):
    """参考文献分类"""
    __tablename__ = "reference_category"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    parent_id: Optional[int] = Field(default=None, foreign_key="reference_category.id")
    team_id: int = Field(foreign_key="team.id")  # 所属团队ID

    # 关系
    references: List["ReferencePaper"] = Relationship(back_populates="category")
    team: "Team" = Relationship(back_populates="reference_categories")
    children: List["ReferenceCategory"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    parent: Optional["ReferenceCategory"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={
            "remote_side": "ReferenceCategory.id",
            "overlaps": "children"
        }
    )


class ReferenceCategoryCreate(SQLModel):
    """创建参考文献分类"""
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    team_id: int


class ReferenceCategoryRead(SQLModel):
    """读取参考文献分类"""
    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    team_id: int


class ReferenceCategoryUpdate(SQLModel):
    """更新参考文献分类"""
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


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
    category_id: Optional[int] = Field(default=None, foreign_key="reference_category.id")


class ReferencePaper(ReferencePaperBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationships
    team: Optional["Team"] = Relationship(back_populates="references")
    creator: "User" = Relationship(back_populates="created_references")
    category: Optional[ReferenceCategory] = Relationship(back_populates="references")
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
    category: Optional[ReferenceCategoryRead] = None  # 使用 ReferenceCategoryRead 模型


class ReferenceUpdate(SQLModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    doi: Optional[str] = None
    file_path: Optional[str] = None
    category_id: Optional[int] = None
    keyword_names: Optional[List[str]] = None


class PaginatedReferenceResponse(SQLModel):
    """分页参考文献响应模型"""
    items: List[ReferenceRead]
    total: int
    page: int
    size: int
    pages: int