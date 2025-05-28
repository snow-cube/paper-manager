from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import paper, category, user
from app.core.database import create_db_and_tables

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建数据库表
create_db_and_tables()

# 注册路由
app.include_router(paper.router, prefix="/api/paper", tags=["paper"])
app.include_router(category.router, prefix="/api/category", tags=["category"])
app.include_router(user.router, prefix="/api/user", tags=["user"])