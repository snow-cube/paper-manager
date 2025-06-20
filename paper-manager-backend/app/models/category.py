from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .paper import Paper


class Category(SQLModel, table=True):
    """分类"""

    __tablename__ = "category"  # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    parent_id: Optional[int] = Field(default=None, foreign_key="category.id")

    children: List["Category"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    parent: Optional["Category"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Category.id", "overlaps": "children"},
    )
    # Direct relationship to papers
    papers: List["Paper"] = Relationship(back_populates="category")


class CategoryCreate(SQLModel):
    """创建分类"""

    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryRead(SQLModel):
    """读取分类"""

    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    paper_count: Optional[int] = None  # 添加论文计数字段


class CategoryUpdate(SQLModel):
    """更新分类"""

    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
