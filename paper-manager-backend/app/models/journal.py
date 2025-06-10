from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class JournalBase(SQLModel):
    name: str = Field(index=True, unique=True)
    grade: str = Field(default="OTHER")  # SCI_Q1, SCI_Q2, SCI_Q3, SCI_Q4, EI, OTHER
    description: Optional[str] = None

class Journal(JournalBase, table=True):
    __tablename__ = "journal"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class JournalCreate(SQLModel):
    name: str
    grade: str = "OTHER"
    description: Optional[str] = None

class JournalRead(SQLModel):
    id: int
    name: str
    grade: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class JournalUpdate(SQLModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    description: Optional[str] = None

class PaginatedJournalResponse(SQLModel):
    items: List[JournalRead]
    total: int
    page: int
    size: int
    pages: int
