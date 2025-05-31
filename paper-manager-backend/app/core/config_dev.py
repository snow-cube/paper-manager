"""
极简开发环境配置
专为快速迭代设计，去除所有不必要的复杂性
"""
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
import os


@dataclass
class TokenData:
    """JWT Token 数据"""
    username: Optional[str] = None


class DevConfig:
    """开发环境配置 - 极简设计"""

    def __init__(self):
        # 项目根目录
        self.root = Path(__file__).parent.parent.parent

        # 数据目录 - 所有数据都在这里
        self.data = self.root / "data"

        # 数据库配置 - 可自定义数据库文件名
        db_name = os.getenv("DB_NAME", "app.db")
        self.database_url = f"sqlite:///./{self.data}/{db_name}"

        # 文件上传目录
        self.uploads = self.data / "uploads"
        self.papers = self.uploads / "papers"
        self.teams = self.uploads / "teams"

        # 安全配置 - 支持自定义
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-12345")
        self.algorithm = "HS256"  # 标准值，无需配置
        self.token_expire_minutes = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))

        # 服务器配置 - 支持自定义端口
        self.host = os.getenv("HOST", "127.0.0.1")
        self.port = int(os.getenv("PORT", "8000"))
        self.debug = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

        # 确保目录存在
        self._setup()

    def _setup(self):
        """一次性设置所有必需的目录"""
        for path in [self.data, self.uploads, self.papers, self.teams]:
            path.mkdir(exist_ok=True, parents=True)

    def team_dir(self, team_id: int) -> Path:
        """获取团队目录，自动创建"""
        path = self.teams / str(team_id)
        path.mkdir(exist_ok=True, parents=True)
        return path


# 全局配置实例
config = DevConfig()

# 直接导出常用配置，无需包装
DATABASE_URL = config.database_url
SECRET_KEY = config.secret_key
ALGORITHM = config.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = config.token_expire_minutes

# 路径直接导出
PAPERS_DIR = config.papers
TEAMS_DIR = config.teams

# 兼容性对象
class Settings:
    SECRET_KEY = config.secret_key
    ALGORITHM = config.algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES = config.token_expire_minutes

settings = Settings()


def get_team_upload_dir(team_id: int, subdir: str = "references") -> Path:
    """获取团队上传目录"""
    path = config.team_dir(team_id) / subdir
    path.mkdir(exist_ok=True, parents=True)
    return path
