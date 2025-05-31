from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, delete
from typing import List
from app.models.keyword import Keyword
from app.models.paper import Paper, PaperCreate, PaperRead, PaperUpdate, PaperAuthor, PaperKeyword
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.models.category import Category, CategoryCreate, CategoryRead, CategoryUpdate
from app.models.reference import ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate, ReferenceKeyword
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


def check_team_admin(team_id: int, user: User, session: Session) -> None:
    """检查用户是否为团队管理员"""
    team_member = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user.id
        )
    ).first()
    
    if not team_member or not team_member.role.is_admin:
        raise HTTPException(
            status_code=403,
            detail="User is not an admin of this team"
        )


def check_team_member(team_id: int, user: User, session: Session) -> None:
    """检查用户是否为团队成员"""
    team_member = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user.id
        )
    ).first()
    
    if not team_member:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of this team"
        )


@router.post("/", response_model=TeamRead)
def create_team(
    team: TeamCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建团队"""
    db_team = Team(
        name=team.name,
        description=team.description,
        creator_id=current_user.id
    )
    session.add(db_team)
    session.flush()

    # 创建团队时，创建者自动成为拥有者
    team_user = TeamUser(
        team_id=db_team.id,
        user_id=current_user.id,
        role=TeamRole.OWNER
    )
    session.add(team_user)
    session.commit()
    session.refresh(db_team)

    # 构建返回数据
    result = TeamRead.from_orm(db_team)
    result.member_count = 1  # 创建时只有创建者一个成员
    return result


@router.post("/{team_id}/members/{username}")
def add_team_member(
    team_id: int,
    username: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """通过用户名将用户添加到团队"""
    # 检查是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 查找要添加的用户
    user = session.exec(
        select(User).where(User.username == username)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 检查用户是否已经是团队成员
    existing_member = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user.id
        )
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this team"
        )

    # 添加用户到团队
    team_user = TeamUser(
        team_id=team_id,
        user_id=user.id,
        role=TeamRole.MEMBER
    )
    session.add(team_user)
    session.commit()
    return {"ok": True}


@router.get("/{team_id}/members", response_model=List[TeamMemberRead])
def get_team_members(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队所有成员"""
    # 检查是否为团队成员
    check_team_member(team_id, current_user, session)

    # 获取团队成员及其角色信息
    team_members = session.exec(
        select(User, TeamUser)
        .join(TeamUser, User.id == TeamUser.user_id)
        .where(TeamUser.team_id == team_id)
    ).all()
    
    # 构建返回数据
    result = []
    for user, team_user in team_members:
        # 创建一个包含用户基本信息的字典
        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "role": team_user.role,
            "joined_at": team_user.joined_at
        }
        # 使用字典创建 TeamMemberRead 对象
        member_info = TeamMemberRead(**user_dict)
        result.append(member_info)
    
    return result


@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除团队成员"""
    # 检查是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 不能删除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove yourself from the team"
        )

    # 检查要删除的用户的角色
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user_id
        )
    ).first()
    if not team_user:
        raise HTTPException(
            status_code=404,
            detail="User is not a member of this team"
        )

    # 不能删除团队拥有者
    if team_user.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove the team owner"
        )

    session.delete(team_user)
    session.commit()
    return {"ok": True}


@router.get("/{team_id}", response_model=TeamRead)
def get_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队信息"""
    # 检查是否为团队成员
    check_team_member(team_id, current_user, session)

    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # 构建返回数据
    result = TeamRead.from_orm(team)
    result.member_count = len(team.members)
    return result


@router.patch("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新团队信息"""
    # 检查是否为团队管理员
    check_team_admin(team_id, current_user, session)

    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 更新团队信息
    team_data = team_update.dict(exclude_unset=True)
    for key, value in team_data.items():
        setattr(team, key, value)

    # 更新最后修改时间
    team.updated_at = datetime.utcnow()

    session.add(team)
    session.commit()
    session.refresh(team)
    
    # 构建返回数据
    result = TeamRead.from_orm(team)
    result.member_count = len(team.members)
    return result


@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除团队"""
    # 检查是否为团队拥有者
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == current_user.id
        )
    ).first()
    
    if not team_user or team_user.role != TeamRole.OWNER:
        raise HTTPException(
            status_code=403,
            detail="Only team owner can delete the team"
        )

    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    references = session.exec(
        select(ReferencePaper).where(ReferencePaper.team_id == team_id)
    ).all()
    
    for ref in references:
        # 删除参考文献的关键词关联
        session.exec(
            delete(ReferenceKeyword).where(ReferenceKeyword.reference_id == ref.id)
        )

    # 删除团队的所有参考文献
    session.exec(
        delete(ReferencePaper).where(ReferencePaper.team_id == team_id)
    )

    # 删除所有团队成员关联
    session.exec(
        delete(TeamUser).where(TeamUser.team_id == team_id)
    )

    # 删除团队
    session.delete(team)
    session.commit()
    return {"ok": True}


@router.get("/", response_model=List[TeamRead])
def list_teams(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取用户所在的所有团队"""
    teams = session.exec(
        select(Team)
        .join(TeamUser)
        .where(TeamUser.user_id == current_user.id)
    ).all()
    
    # 构建返回数据
    results = []
    for team in teams:
        result = TeamRead.from_orm(team)
        result.member_count = len(team.members)
        results.append(result)
    
    return results


@router.patch("/{team_id}/members/{user_id}/role")
def update_member_role(
    team_id: int,
    user_id: int,
    role: TeamRole,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """修改团队成员权限"""
    # 检查是否为团队管理员
    check_team_admin(team_id, current_user, session)

    # 不能修改自己的权限
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify your own role"
        )

    # 检查要修改权限的用户
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user_id
        )
    ).first()
    if not team_user:
        raise HTTPException(
            status_code=404,
            detail="User is not a member of this team"
        )

    # 不能修改团队拥有者的权限
    if team_user.role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify team owner's role"
        )

    # 不能将成员设置为拥有者
    if role == TeamRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot set member as team owner"
        )

    # 更新成员权限
    team_user.role = role
    session.add(team_user)
    session.commit()
    session.refresh(team_user)

    return {"ok": True}


__all__ = [
    "Keyword",
    "Paper", "PaperCreate", "PaperRead", "PaperUpdate", "PaperAuthor", "PaperKeyword",
    "User", "UserCreate", "UserRead", "UserUpdate",
    "Category", "CategoryCreate", "CategoryRead", "CategoryUpdate",
    "ReferencePaper", "ReferenceCreate", "ReferenceRead", "ReferenceUpdate", "ReferenceKeyword",
    "check_team_member"
]