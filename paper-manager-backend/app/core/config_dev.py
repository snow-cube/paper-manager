"""
极简开发环境配置
专为快速迭代设计，去除所有不必要的复杂性
"""

from pathlib import Path
from dataclasses import dataclass
from typing import Optional
import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


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

        # 服务器配置 - 支持文件预览
        self.server_host = os.getenv("SERVER_HOST", "http://localhost:8000")
        self.media_url = "/media"

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


def build_file_url(relative_path: str) -> str:
    """构建文件的HTTP访问URL"""
    if not relative_path:
        return ""

    # 确保相对路径使用正斜杠
    normalized_path = relative_path.replace("\\", "/")

    # 如果路径不以 papers/ 或 teams/ 开头，需要添加适当的前缀
    if not (
        normalized_path.startswith("papers/") or normalized_path.startswith("teams/")
    ):
        # 默认假设是论文文件
        normalized_path = f"papers/{normalized_path}"

    return f"{config.server_host}{config.media_url}/{normalized_path}"


def convert_to_relative_path(file_path: str) -> str:
    """将绝对路径转换为相对路径"""
    if not file_path:
        return ""

    # 如果已经是相对路径，直接返回
    if not os.path.isabs(file_path):
        return file_path.replace("\\", "/")

    # 尝试计算相对于 uploads 目录的路径
    try:
        uploads_path = str(config.uploads)
        if file_path.startswith(uploads_path):
            relative = os.path.relpath(file_path, uploads_path)
            return relative.replace("\\", "/")
    except ValueError:
        pass

    # 如果无法计算相对路径，返回文件名
    return os.path.basename(file_path)
