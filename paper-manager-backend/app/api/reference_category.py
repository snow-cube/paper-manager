from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.core.database import get_session
from app.models.reference import (
    ReferenceCategory, ReferenceCategoryCreate,
    ReferenceCategoryRead, ReferenceCategoryUpdate,
    ReferencePaper
)
from app.models.user import User
from app.api.user import get_current_user
from app.models.team import Team, TeamUser, TeamRole

router = APIRouter()


def check_team_admin(user: User, team_id: int, session: Session):
    """检查用户是否为团队管理员"""
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == user.id
        )
    ).first()

    if not team_user or team_user.role not in [TeamRole.OWNER, TeamRole.ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only team administrators can perform this operation"
        )


def get_reference_category_count_recursive(session: Session, category_id: int) -> int:
    """递归获取参考文献分类及其所有子分类下的参考文献数量"""
    # 获取当前分类的参考文献数量
    current_count = len(session.exec(
        select(ReferencePaper).where(ReferencePaper.category_id == category_id)
    ).all())

    # 获取子分类的参考文献数量
    children = session.exec(
        select(ReferenceCategory).where(ReferenceCategory.parent_id == category_id)
    ).all()

    for child in children:
        current_count += get_reference_category_count_recursive(session, child.id)

    return current_count


@router.post("/", response_model=ReferenceCategoryRead)
def create_reference_category(
    category: ReferenceCategoryCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """创建参考文献分类（仅团队管理员）"""
    # 检查团队管理员权限
    check_team_admin(current_user, category.team_id, session)

    # 如果指定了父分类，检查是否存在且属于同一团队
    if category.parent_id:
        parent = session.get(ReferenceCategory, category.parent_id)
        if not parent:
            raise HTTPException(
                status_code=404,
                detail=f"Parent category {category.parent_id} not found"
            )
        if parent.team_id != category.team_id:
            raise HTTPException(
                status_code=400,
                detail="Parent category must belong to the same team"
            )

    db_category = ReferenceCategory.from_orm(category)
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


@router.get("/", response_model=List[ReferenceCategoryRead])
def read_reference_categories(
    team_id: int,
    skip: int = 0,
    limit: int = 100,
    include_stats: bool = False,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取团队的参考文献分类列表，可选择包含统计信息"""
    # 检查用户是否为团队成员
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == team_id,
            TeamUser.user_id == current_user.id
        )
    ).first()

    if not team_user:
        raise HTTPException(
            status_code=403,
            detail="Not a member of this team"
        )

    categories = session.exec(
        select(ReferenceCategory)
        .where(ReferenceCategory.team_id == team_id)
        .offset(skip)
        .limit(limit)
    ).all()

    result = []
    for category in categories:
        category_data = ReferenceCategoryRead(
            id=category.id,
            name=category.name,
            description=category.description,
            parent_id=category.parent_id,
            team_id=category.team_id
        )

        # 如果需要统计信息，计算参考文献数量
        if include_stats:
            reference_count = get_reference_category_count_recursive(session, category.id)
            category_data.reference_count = reference_count

        result.append(category_data)

    return result


@router.get("/{category_id}", response_model=ReferenceCategoryRead)
def read_reference_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取参考文献分类详情"""
    category = session.get(ReferenceCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 检查用户是否为团队成员
    team_user = session.exec(
        select(TeamUser).where(
            TeamUser.team_id == category.team_id,
            TeamUser.user_id == current_user.id
        )
    ).first()

    if not team_user:
        raise HTTPException(
            status_code=403,
            detail="Not a member of this team"
        )

    return category


@router.patch("/{category_id}", response_model=ReferenceCategoryRead)
def update_reference_category(
    category_id: int,
    category: ReferenceCategoryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """更新参考文献分类（仅团队管理员）"""
    db_category = session.get(ReferenceCategory, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 检查团队管理员权限
    check_team_admin(current_user, db_category.team_id, session)

    # 如果要更新父分类，检查是否存在且属于同一团队
    if category.parent_id is not None:
        if category.parent_id != 0:  # 0 表示没有父分类
            parent = session.get(ReferenceCategory, category.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=404,
                    detail=f"Parent category {category.parent_id} not found"
                )
            if parent.team_id != db_category.team_id:
                raise HTTPException(
                    status_code=400,
                    detail="Parent category must belong to the same team"
                )

        # 检查是否会创建循环依赖
        if category.parent_id == category_id:
            raise HTTPException(
                status_code=400,
                detail="Category cannot be its own parent"
            )

    category_data = category.dict(exclude_unset=True)
    for key, value in category_data.items():
        setattr(db_category, key, value)

    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_reference_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """删除参考文献分类（仅团队管理员）"""
    category = session.get(ReferenceCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 检查团队管理员权限
    check_team_admin(current_user, category.team_id, session)

    # 检查是否有子分类
    children = session.exec(
        select(ReferenceCategory).where(ReferenceCategory.parent_id == category_id)
    ).all()
    if children:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with subcategories"
        )

    # 检查是否有关联的参考文献
    references = session.exec(
        select(ReferencePaper).where(ReferencePaper.category_id == category_id)
    ).all()
    if references:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with associated references"
        )

    session.delete(category)
    session.commit()
    return {"ok": True}