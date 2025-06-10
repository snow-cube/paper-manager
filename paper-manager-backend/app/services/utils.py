from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config_dev import settings, TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return TokenData(username=username)
    except JWTError:
        return None


def calculate_workload(contribution_ratio: float, journal_grade: str = "OTHER") -> float:
    """
    计算工作量

    Args:
        contribution_ratio: 贡献比例 (0.0 - 1.0)
        journal_grade: 期刊等级 (SCI_Q1, SCI_Q2, SCI_Q3, SCI_Q4, EI, OTHER)

    Returns:
        工作量值
    """
    # 根据期刊等级确定基础工作量
    base_workload_map = {
        "SCI_Q1": 10.0,
        "SCI_Q2": 8.0,
        "SCI_Q3": 6.0,
        "SCI_Q4": 4.0,
        "EI": 3.0,
        "OTHER": 1.0
    }

    base_workload = base_workload_map.get(journal_grade, 1.0)

    # 工作量 = 基础工作量 × 贡献比例
    return base_workload * contribution_ratio