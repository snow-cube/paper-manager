from sqlmodel import SQLModel, create_engine, Session
from .config_dev import DATABASE_URL

# SQLite 数据库引擎配置
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False},  # SQLite 需要这个配置
)


def init_db():
    """初始化数据库，创建所有表"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """获取数据库会话"""
    with Session(engine) as session:
        yield session
