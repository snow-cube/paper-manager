from app.models.user import User
from sqlmodel import SQLModel
from typing import Optional

UserOut = User


class UserProfileUpdate(SQLModel):
    """普通用户个人信息更新schema - 只允许更新安全字段"""

    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
