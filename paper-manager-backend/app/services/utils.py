from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings, TokenData

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


def calculate_workload(contribution_ratio: float, paper_type: str) -> float:
    """
    Calculate workload based on contribution ratio and paper type
    """
    base_points = {
        "SCI_Q1": 100,
        "SCI_Q2": 80,
        "SCI_Q3": 60,
        "SCI_Q4": 40,
        "EI": 30,
        "CONFERENCE": 20,
        "OTHER": 10
    }
    
    points = base_points.get(paper_type, 10)
    return points * contribution_ratio 