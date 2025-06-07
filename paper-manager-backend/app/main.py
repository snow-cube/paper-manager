from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
import os
from app.core.database import init_db
from app.api import api_router  # 只导入主路由器

app = FastAPI(
    title="Paper Manager API",
    description="API for managing academic papers and their authors",
    version="1.0.0",
    docs_url=None  # 禁用默认的文档URL
)

# 配置静态文件目录
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含所有API路由
app.include_router(api_router, prefix="/api")

# 自定义文档页面
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - API Documentation",
        swagger_favicon_url="/static/favicon.ico",
    )

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to Paper Manager API"}