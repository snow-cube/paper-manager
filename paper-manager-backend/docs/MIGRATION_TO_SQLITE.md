# 数据库迁移说明：从 MySQL 到 SQLite

## 修改内容

### 1. 数据库配置
- **修改前**: 使用 MySQL + PyMySQL (`mysql+pymysql://root:123456@localhost:3306/paper_manager`)
- **修改后**: 使用 SQLite (`sqlite:///./data/database/paper_manager.db`)

### 2. 目录结构调整
- **修改前**: `uploads/` 和 `data/` 平级目录
- **修改后**: 统一数据存储结构
  ```
  data/
  ├── database/          # 数据库文件
  │   └── paper_manager.db
  └── uploads/           # 文件上传
      ├── papers/        # 论文文件
      └── teams/         # 团队文件
  ```

### 3. 代码清理
- 移除了所有不必要的 SQLAlchemy 导入 (`sqlalchemy.orm`, `sqlalchemy.Column` 等)
- 统一使用 SQLModel 提供的所有功能
- 移除了不必要的 `__tablename__` 声明

### 3. 数据库引擎配置
- 移除了 MySQL 特定的 `pool_pre_ping=True` 配置
- 添加了 SQLite 特定的 `connect_args={"check_same_thread": False}` 配置

### 4. 文件修改列表
- `.env` - 更新数据库连接字符串
- `app/core/database.py` - 更新引擎配置和注释
- `app/models/paper.py` - 移除不必要的 SQLAlchemy 导入
- `app/models/user.py` - 移除不必要的 SQLAlchemy 导入
- `app/models/reference.py` - 移除不必要的 SQLAlchemy 导入
- `app/models/category.py` - 移除不必要的 SQLAlchemy 导入和 `__tablename__`

## 优势

### 简化部署
- 无需安装和配置 MySQL 服务器
- 数据库文件自包含，便于备份和迁移
- 开发环境配置更简单

### 代码整洁
- 移除了重复的 SQLAlchemy 导入
- 统一使用 SQLModel 的现代化API
- 减少了混用不同ORM库的复杂性

### 性能
- SQLite 在小到中等规模应用中性能优异
- 减少了网络延迟（本地文件数据库）
- 简化了数据库连接管理

## 验证步骤

1. **数据库初始化**: ✅ 成功
   ```bash
   python -c "from app.core.database import init_db; init_db()"
   ```

2. **应用启动**: ✅ 成功
   ```bash
   uvicorn app.main:app --reload
   ```

3. **API接口**: ✅ 可访问
   - 文档地址: http://127.0.0.1:8000/docs
   - 所有表成功创建

## 注意事项

- SQLite 数据库文件位于 `data/paper_manager.db`
- 原有的 `data/test.db` 文件保留，可根据需要删除
- 如需要恢复 MySQL 配置，修改 `.env` 文件中的 `DATABASE_URL` 即可

## 后续建议

1. 在生产环境中，考虑关闭数据库日志 (`echo=False`)
2. 定期备份 SQLite 数据库文件
3. 如果数据量增长很大，可以考虑迁移到 PostgreSQL 而不是 MySQL
