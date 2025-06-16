from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_session
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.schemas.user import UserProfileUpdate
from app.services.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
)
from app.core.config_dev import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
) -> User:
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = session.exec(
        select(User).where(User.username == token_data.username)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    # 检查已存在的用户名
    existing_user_username = session.exec(
        select(User).where(User.username == user.username)
    ).first()
    if existing_user_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用户名已注册",  # Username already registered
        )

    # 检查已存在的电子邮件
    existing_user_email = session.exec(
        select(User).where(User.email == user.email)
    ).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="电子邮件已注册",  # Email already registered
        )

    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """普通用户更新自己的个人信息"""

    # 获取更新数据，排除未设置的字段
    update_data = profile_update.dict(exclude_unset=True)

    # 如果更新邮箱，检查是否已被其他用户使用
    if "email" in update_data:
        existing_user = session.exec(
            select(User).where(
                User.email == update_data["email"], User.id != current_user.id
            )
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="该邮箱已被其他用户使用"
            )

    # 如果更新密码，进行哈希处理
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    # 更新updated_at时间戳
    update_data["updated_at"] = datetime.utcnow()

    # 应用更新
    for key, value in update_data.items():
        setattr(current_user, key, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


@router.get("/", response_model=List[UserRead])
def read_users(
    skip: int = 0, limit: int = 100, session: Session = Depends(get_session)
):
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    return users


@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Check if current user is a superuser
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify user information",
        )

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_update.dict(exclude_unset=True)
    if "password" in user_data:
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))

    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
