from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User, UserRead
    from .reference import ReferencePaper, ReferenceCategory
    from .paper import Paper


class TeamRole(str, Enum):
    """团队角色枚举"""

    OWNER = "OWNER"  # 创建者/拥有者
    ADMIN = "ADMIN"  # 管理员
    MEMBER = "MEMBER"  # 普通成员

    @property
    def is_admin(self) -> bool:
        """是否具有管理员权限"""
        return self in [TeamRole.OWNER, TeamRole.ADMIN]


class TeamUser(SQLModel, table=True):
    """团队-用户关联表"""

    team_id: Optional[int] = Field(
        default=None, foreign_key="team.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )
    role: TeamRole = Field(default=TeamRole.MEMBER)  # 团队中的角色
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    team: "Team" = Relationship(back_populates="member_links")
    user: "User" = Relationship(back_populates="team_links")

    @property
    def is_admin(self) -> bool:
        """是否具有管理员权限（包括拥有者）"""
        return self.role.is_admin


class TeamBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    creator_id: int = Field(foreign_key="user.id")


class Team(TeamBase, table=True):
    """团队表"""

    __tablename__ = "team"  # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # 添加更新时间
    max_members: Optional[int] = None
    is_active: bool = Field(default=True)
    last_active_at: Optional[datetime] = None

    # Relationships
    members: List["TeamUser"] = Relationship(back_populates="team")
    member_links: List[TeamUser] = Relationship(back_populates="team")
    references: List["ReferencePaper"] = Relationship(back_populates="team")
    creator: "User" = Relationship(back_populates="created_teams")
    papers: List["Paper"] = Relationship(back_populates="team")
    reference_categories: List["ReferenceCategory"] = Relationship(
        back_populates="team"
    )


class TeamCreate(TeamBase):
    """创建团队的请求模型"""

    pass


class TeamRead(TeamBase):
    """团队信息返回模型"""

    id: int
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None  # 成员数量


class TeamUpdate(SQLModel):
    """更新团队的请求模型"""

    name: Optional[str] = None
    description: Optional[str] = None
