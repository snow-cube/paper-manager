from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models.keyword import Keyword
from app.models.paper import Paper, PaperCreate, PaperRead, PaperUpdate, PaperAuthor, PaperKeyword
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.models.category import Category, CategoryCreate, CategoryRead, CategoryUpdate
from app.models.reference import ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate, ReferenceKeyword
from app.models.team import Team, TeamUser
from app.core.database import get_session
from app.api.user import get_current_user

router = APIRouter()

def check_team_member(team_id: int, user: User, session: Session) -> None:
    """检查用户是否为团队成员"""
    # 查询用户是否为团队成员
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

@router.get("/", response_model=list[Team])
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
    return teams

__all__ = [
    "Keyword",
    "Paper", "PaperCreate", "PaperRead", "PaperUpdate", "PaperAuthor", "PaperKeyword",
    "User", "UserCreate", "UserRead", "UserUpdate",
    "Category", "CategoryCreate", "CategoryRead", "CategoryUpdate",
    "ReferencePaper", "ReferenceCreate", "ReferenceRead", "ReferenceUpdate", "ReferenceKeyword",
    "check_team_member"
]