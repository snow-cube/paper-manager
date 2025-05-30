from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .user import User
    from .reference import ReferencePaper


class TeamUser(SQLModel, table=True):
    """团队-用户关联表"""
    team_id: Optional[int] = Field(
        default=None, foreign_key="team.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="user.id", primary_key=True
    )
    is_admin: bool = Field(default=False)  # 是否为团队管理员
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    team: "Team" = Relationship(back_populates="member_links")
    user: "User" = Relationship(back_populates="team_links")


class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    creator_id: int = Field(foreign_key="user.id")  # 创建者ID

    # Relationships
    members: List["User"] = Relationship(
        back_populates="teams",
        link_model=TeamUser
    )
    member_links: List[TeamUser] = Relationship(back_populates="team")
    references: List["ReferencePaper"] = Relationship(back_populates="team")


class TeamCreate(SQLModel):
    name: str
    description: Optional[str] = None


class TeamRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    creator_id: int


class TeamUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None 