from sqlmodel import SQLModel

print("DEBUG: Starting app.models.__init__.py execution")

# 基础模型
from .category import Category, CategoryCreate, CategoryRead, CategoryUpdate
print(f"DEBUG: Imported .category. Registered tables: {list(SQLModel.metadata.tables.keys())}")

from .keyword import Keyword, KeywordCreate, KeywordRead, KeywordUpdate
print(f"DEBUG: Imported .keyword. Registered tables: {list(SQLModel.metadata.tables.keys())}")

# 关联模型
from .paper import (
    Paper, PaperCreate, PaperRead, PaperUpdate,
    PaperAuthor, PaperCategory, PaperKeyword
)
print(f"DEBUG: Imported .paper. Registered tables: {list(SQLModel.metadata.tables.keys())}")

from .team import Team, TeamCreate, TeamRead, TeamUpdate, TeamUser
print(f"DEBUG: Imported .team. Registered tables: {list(SQLModel.metadata.tables.keys())}")

from .reference import (
    ReferencePaper, ReferenceCreate, ReferenceRead, ReferenceUpdate,
    ReferenceKeyword, ReferenceCategory, ReferenceCategoryRead
)
print(f"DEBUG: Imported .reference. Registered tables: {list(SQLModel.metadata.tables.keys())}")

from .user import User, UserCreate, UserRead, UserUpdate
print(f"DEBUG: Imported .user. Registered tables: {list(SQLModel.metadata.tables.keys())}")

__all__ = [
    "User", "UserCreate", "UserRead", "UserUpdate",
    "Category", "CategoryCreate", "CategoryRead", "CategoryUpdate",
    "Team", "TeamCreate", "TeamRead", "TeamUpdate", "TeamUser",
    "Paper", "PaperCreate", "PaperRead", "PaperUpdate", "PaperAuthor", "PaperKeyword",
    "ReferencePaper", "ReferenceCreate", "ReferenceRead", "ReferenceUpdate", "ReferenceKeyword",
    "ReferenceCategory", "ReferenceCategoryRead",
    "Keyword", "KeywordCreate", "KeywordRead", "KeywordUpdate"
]

print("DEBUG: Finished app.models.__init__.py execution") 