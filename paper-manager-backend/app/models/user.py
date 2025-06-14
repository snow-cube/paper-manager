from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

# 导入需要在运行时使用的类
from .team import TeamUser

if TYPE_CHECKING:
    from .team import Team
    from .reference import ReferencePaper
    from .paper import Paper


class UserBase(SQLModel):
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    teams: List["TeamUser"] = Relationship(back_populates="user")
    team_links: List[TeamUser] = Relationship(back_populates="user")

    # 创建的参考论文
    created_references: List["ReferencePaper"] = Relationship(back_populates="creator")

    # 创建的论文
    papers: List["Paper"] = Relationship(back_populates="created_by")

    # 创建的团队
    created_teams: List["Team"] = Relationship(back_populates="creator")


class UserCreate(SQLModel):
    username: str
    email: str
    password: str
    full_name: str


class UserRead(SQLModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
