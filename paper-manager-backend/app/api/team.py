from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, delete, func
from typing import List, Optional
from app.models.keyword import Keyword
from app.models.paper import Paper, PaperCreate, PaperRead, PaperUpdate, PaperAuthor, PaperKeyword
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.models.category import Category, CategoryCreate, CategoryRead, CategoryUpdate
from app.models.reference import ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate, ReferenceKeyword, ReferenceCategory
from app.models.team import Team, TeamCreate, TeamRead, TeamUpdate, TeamUser, TeamRole
from app.core.database import get_session
from app.api.user import get_current_user
from datetime import datetime


class TeamMemberRead(UserRead):
    """团队成员信息返回模型"""
    role: TeamRole  # 成员角色
    joined_at: datetime  # 加入时间

    @property
    def is_admin(self) -> bool:
        """是否具有管理员权限"""
        return self.role.is_admin


router = APIRouter()


def check_team_member(team_id: int, user: User, session: Session) -> TeamUser:
    """检查用户是否为团队成员，并返回团队成员关系"""
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user.id
        )
    ).first()

    if not team_user:
        raise HTTPException(
            status_code=403,
            detail="Not a member of this team"
        )
    return team_user


def check_team_admin(team_id: int, user: User, session: Session) -> TeamUser:
    """检查用户是否为团队管理员，并返回团队成员关系"""
    team_user = check_team_member(team_id, user, session)
    if team_user.role not in [TeamRole.OWNER, TeamRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only team administrators can perform this action"
        )
    return team_user


@router.post("/", response_model=TeamRead)
def create_team(
    team: TeamCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建团队"""
    db_team = Team.from_orm(team)
    db_team.creator_id = current_user.id
    session.add(db_team)
    session.flush()  # 获取团队ID

    # 创建团队成员关系（创建者为所有者）
    team_user = TeamUser(
        team_id=db_team.id,
        user_id=current_user.id,
        role=TeamRole.OWNER
    )
    session.add(team_user)

    # 创建默认的参考文献分类
    # default_category = ReferenceCategory(
    #     name="默认分类",
    #     description="团队默认参考文献分类",
    #     team_id=db_team.id
    # )
    # session.add(default_category)

    session.commit()
    session.refresh(db_team)

    # 构建返回数据
    return TeamRead(
        id=db_team.id,
        name=db_team.name,
        description=db_team.description,
        created_at=db_team.created_at,
        updated_at=db_team.updated_at,
        creator_id=db_team.creator_id,
        member_count=1  # 创建时只有创建者一个成员
    )


@router.get("/", response_model=List[TeamRead])
def read_teams(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取用户所在的团队列表"""
    # 获取用户所在的所有团队
    teams = session.exec(
        select(Team)
        .join(TeamUser)
        .where(TeamUser.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    ).all()

    # 构建返回数据
    results = []
    for team in teams:
        # 获取团队成员数量
        member_count = session.exec(
            select(func.count(TeamUser.user_id))
            .where(TeamUser.team_id == team.id)
        ).first()

        results.append(TeamRead(
            id=team.id,
            name=team.name,
            description=team.description,
            created_at=team.created_at,
            updated_at=team.updated_at,
            creator_id=team.creator_id,
            member_count=member_count or 0
        ))

    return results


@router.get("/{team_id}", response_model=TeamRead)
def read_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队详细信息"""
    # 检查用户是否为团队成员
    check_team_member(team_id, current_user, session)

    # 获取团队信息
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 获取团队成员数量
    member_count = session.exec(
        select(func.count(TeamUser.user_id))
        .where(TeamUser.team_id == team_id)
    ).first()

    # 构建返回数据
    return TeamRead(
        id=team.id,
        name=team.name,
        description=team.description,
        created_at=team.created_at,
        updated_at=team.updated_at,
        creator_id=team.creator_id,
        member_count=member_count or 0
    )


@router.patch("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新团队信息"""
    # 检查用户是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 获取团队
    db_team = session.get(Team, team_id)
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 更新团队信息
    team_data = team_update.dict(exclude_unset=True)
    for key, value in team_data.items():
        setattr(db_team, key, value)

    db_team.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(db_team)

    # 获取团队成员数量
    member_count = session.exec(
        select(func.count(TeamUser.user_id))
        .where(TeamUser.team_id == team_id)
    ).first()

    # 构建返回数据
    return TeamRead(
        id=db_team.id,
        name=db_team.name,
        description=db_team.description,
        created_at=db_team.created_at,
        updated_at=db_team.updated_at,
        creator_id=db_team.creator_id,
        member_count=member_count or 0
    )


@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除团队"""
    # 检查用户是否为团队所有者
    team_user = check_team_member(team_id, current_user, session)
    if team_user.role != TeamRole.OWNER:
        raise HTTPException(
            status_code=403,
            detail="Only team owner can delete the team"
        )

    # 获取团队
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 删除团队成员关系
    session.exec(
        delete(TeamUser).where(TeamUser.team_id == team_id)
    )

    # 删除团队的参考文献分类
    session.exec(
        delete(ReferenceCategory).where(ReferenceCategory.team_id == team_id)
    )

    # 删除团队的参考文献
    session.exec(
        delete(ReferencePaper).where(ReferencePaper.team_id == team_id)
    )

    # 删除团队
    session.delete(team)
    session.commit()

    return {"ok": True}


@router.post("/{team_id}/members/{user_id}")
def add_team_member(
    team_id: int,
    user_id: int,
    role: TeamRole = TeamRole.MEMBER,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """添加团队成员"""
    # 检查用户是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 检查要添加的用户是否存在
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 检查用户是否已经是团队成员
    existing_member = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user_id
        )
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this team"
        )

    # 创建团队成员关系
    team_user = TeamUser(
        team_id=team_id,
        user_id=user_id,
        role=role
    )
    session.add(team_user)
    session.commit()

    return {"ok": True}


@router.patch("/{team_id}/members/{user_id}")
def update_member_role(
    team_id: int,
    user_id: int,
    role: TeamRole,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新团队成员角色"""
    # 检查当前用户是否为团队所有者
    current_user_team = check_team_member(team_id, current_user, session)
    if current_user_team.role != TeamRole.OWNER:
        raise HTTPException(
            status_code=403,
            detail="Only team owner can update member roles"
        )

    # 获取要更新的成员
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user_id
        )
    ).first()
    if not team_user:
        raise HTTPException(status_code=404, detail="Team member not found")

    # 不能更改所有者的角色
    if team_user.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot change owner's role"
        )

    # 更新角色
    team_user.role = role
    session.commit()

    return {"ok": True}


@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """移除团队成员"""
    # 检查当前用户是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 获取要移除的成员
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user_id
        )
    ).first()
    if not team_user:
        raise HTTPException(status_code=404, detail="Team member not found")

    # 不能移除团队所有者
    if team_user.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove team owner"
        )

    # 不能移除自己（除非是所有者）
    if user_id == current_user.id and team_user.role != TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove yourself from the team"
        )

    # 移除成员
    session.delete(team_user)
    session.commit()

    return {"ok": True}


@router.get("/{team_id}/members", response_model=List[TeamMemberRead])
def get_team_members(
    team_id: int,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队所有成员"""
    # 检查用户是否为团队成员
    check_team_member(team_id, current_user, session)

    # 获取团队成员
    team_members = session.exec(
        select(User, TeamUser)
        .join(TeamUser, User.id == TeamUser.user_id)
        .where(TeamUser.team_id == team_id)
        .offset(skip)
        .limit(limit)
    ).all()

    # 构建返回数据
    results = []
    for user, team_user in team_members:
        member = TeamMemberRead(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            updated_at=user.updated_at,
            role=team_user.role,
            joined_at=team_user.joined_at
        )
        results.append(member)

    return results


__all__ = [
    "Keyword",
    "Paper", "PaperCreate", "PaperRead", "PaperUpdate", "PaperAuthor", "PaperKeyword",
    "User", "UserCreate", "UserRead", "UserUpdate",
    "Category", "CategoryCreate", "CategoryRead", "CategoryUpdate",
    "ReferencePaper", "ReferenceCreate", "ReferenceRead", "ReferenceUpdate", "ReferenceKeyword",
    "ReferenceCategory",
    "check_team_member"
]