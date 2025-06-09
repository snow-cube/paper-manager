# Paper Manager Backend

一个用于管理学术论文和参考文献的后端API系统，支持团队协作、论文管理、参考文献管理、分类管理等功能。

## 快速开始

### 环境要求

- Python 3.8+
- SQLite 3
- uv (Python 包管理器)

### 安装依赖

```bash
# 使用 uv 安装依赖
uv sync

# 或使用 pip
pip install -r requirements.txt
```

### 环境配置

复制环境变量示例文件并修改配置：

```bash
cp .env.example .env
```

修改 `.env` 文件中的配置：

```env
DATABASE_URL=sqlite:///./data/app.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 运行应用

```bash
# 开发模式
uvicorn app.main:app --reload --log-level debug

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

访问地址：

- API 文档: <http://localhost:8000/docs>
- ReDoc 文档: <http://localhost:8000/redoc>

## 1. 项目结构

```text
paper-manager-backend/
├── app/                  # 应用主目录
│   ├── api/             # API 路由处理
│   │   ├── __init__.py
│   │   ├── user.py        # 用户相关接口
│   │   ├── team.py        # 团队相关接口
│   │   ├── paper.py       # 论文相关接口
│   │   ├── reference.py   # 参考文献相关接口
│   │   ├── category.py    # 论文分类相关接口
│   │   └── reference_category.py  # 参考文献分类相关接口
│   ├── core/            # 核心配置
│   │   ├── config_dev.py  # 开发环境配置
│   │   ├── database.py    # 数据库配置
│   │   └── dependencies.py # 依赖注入
│   ├── models/          # 数据模型
│   ├── schemas/         # Pydantic 模型
│   ├── services/        # 业务逻辑服务
│   ├── static/          # 静态文件
│   └── main.py          # 应用入口
├── data/                # 数据文件
├── .env.example         # 环境变量示例
├── .gitignore          # Git 忽略文件
├── .python-version     # Python 版本配置
├── MIGRATION_TO_SQLITE.md  # SQLite 迁移说明
├── pyproject.toml      # 项目配置
└── uv.lock             # 依赖锁定文件
```

## 2. 数据库表结构

### User 用户表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 用户ID | Primary Key |
| username | String | 用户名 | Unique, Index |
| email | String | 邮箱 | Unique, Index |
| full_name | String | 全名 | Not Null |
| hashed_password | String | 加密密码 | Not Null |
| is_active | Boolean | 是否激活 | Default True |
| is_superuser | Boolean | 是否超级用户 | Default False |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |

### Team 团队表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 团队ID | Primary Key |
| name | String | 团队名称 | Index |
| description | String | 团队描述 | Nullable |
| creator_id | Integer | 创建者ID | Foreign Key -> User.id |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |
| max_members | Integer | 最大成员数 | Nullable |
| is_active | Boolean | 是否激活 | Default True |
| last_active_at | DateTime | 最后活跃时间 | Nullable |

### TeamUser 团队成员关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| team_id | Integer | 团队ID | Primary Key, Foreign Key -> Team.id |
| user_id | Integer | 用户ID | Primary Key, Foreign Key -> User.id |
| role | Enum | 角色 | Enum(OWNER, ADMIN, MEMBER), Default MEMBER |
| joined_at | DateTime | 加入时间 | Default Now |

### Paper 论文表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 论文ID | Primary Key |
| title | String | 标题 | Not Null, Index |
| abstract | String | 摘要 | Nullable |
| publication_date | DateTime | 发表日期 | Nullable |
| journal | String | 期刊名称 | Nullable |
| doi | String | DOI | Unique, Nullable |
| file_path | String | 文件路径 | Nullable |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |
| created_by_id | Integer | 创建者ID | Foreign Key -> User.id |
| team_id | Integer | 团队ID | Foreign Key -> Team.id |

### Author 作者表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 作者ID | Primary Key |
| name | String | 作者姓名 | Index |
| email | String | 邮箱 | Unique, Nullable |
| affiliation | String | 所属机构 | Nullable |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |

### PaperAuthor 论文-作者关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| author_id | Integer | 作者ID | Primary Key, Foreign Key -> Author.id |
| contribution_ratio | Float | 贡献率 | Default 1.0 |
| is_corresponding | Boolean | 是否通讯作者 | Default False |
| author_order | Integer | 作者顺序 | Not Null |

### Category 论文分类表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 分类ID | Primary Key |
| name | String | 分类名称 | Not Null, Index |
| description | String | 分类描述 | Nullable |
| parent_id | Integer | 父分类ID | Foreign Key -> Category.id, Nullable |

### PaperCategory 论文-分类关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| category_id | Integer | 分类ID | Primary Key, Foreign Key -> Category.id |

### ReferencePaper 参考文献表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 参考文献ID | Primary Key |
| title | String | 标题 | Not Null, Index |
| authors | String | 作者信息 | Not Null |
| doi | String | DOI | Unique, Nullable |
| file_path | String | 文件路径 | Nullable |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |
| team_id | Integer | 团队ID | Foreign Key -> Team.id, Nullable |
| category_id | Integer | 分类ID | Foreign Key -> ReferenceCategory.id, Nullable |
| created_by_id | Integer | 创建者ID | Foreign Key -> User.id, Not Null |

### ReferenceCategory 参考文献分类表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 分类ID | Primary Key |
| name | String | 分类名称 | Not Null, Index |
| description | String | 分类描述 | Nullable |
| parent_id | Integer | 父分类ID | Foreign Key -> ReferenceCategory.id, Nullable |
| team_id | Integer | 团队ID | Foreign Key -> Team.id, Not Null |

### Keyword 关键词表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 关键词ID | Primary Key |
| name | String | 关键词名称 | Not Null, Unique, Index |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |

### PaperKeyword 论文-关键词关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| keyword_id | Integer | 关键词ID | Primary Key, Foreign Key -> Keyword.id |

### ReferenceKeyword 参考文献-关键词关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| reference_id | Integer | 参考文献ID | Primary Key, Foreign Key -> ReferencePaper.id |
| keyword_id | Integer | 关键词ID | Primary Key, Foreign Key -> Keyword.id |

### 数据库关系说明

#### 用户与团队关系

- 用户可以属于多个团队（多对多）
- 每个团队中的用户有不同角色（OWNER, ADMIN, MEMBER）
- 团队有创建者（一对多）

#### 论文与作者关系

- 论文可以有多个作者（多对多）
- 每个作者在论文中有贡献率和顺序
- 支持通讯作者标识

#### 分类层次关系

- 论文分类支持层次结构（父子关系）
- 参考文献分类按团队隔离，支持层次结构

#### 关键词关系

- 论文和参考文献都可以有多个关键词（多对多）
- 关键词全局唯一，可被多个资源共享

## 3. API 文档

### 用户相关 API

#### 认证

##### POST `/api/users/token`

用户登录接口

请求体（application/x-www-form-urlencoded）：

```text
username: string (必填)
password: string (必填)
grant_type: string (可选，默认 "password")
scope: string (可选，默认 "")
client_id: string (可选)
client_secret: string (可选)
```

响应体：

```json
{
    "access_token": "string",
    "token_type": "bearer"
}
```

#### 用户管理

##### POST `/api/users/`

创建新用户

请求体：

```json
{
    "username": "string",
    "email": "string",
    "password": "string",
    "full_name": "string"
}
```

响应体：

```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "is_active": "boolean",
    "is_superuser": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### GET `/api/users/`

获取用户列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)

响应体：

```json
[
    {
        "id": "integer",
        "username": "string",
        "email": "string",
        "full_name": "string",
        "is_active": "boolean",
        "is_superuser": "boolean",
        "created_at": "datetime",
        "updated_at": "datetime"
    }
]
```

##### GET `/api/users/me`

获取当前用户信息

响应体：

```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "is_active": "boolean",
    "is_superuser": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### GET `/api/users/{user_id}`

获取指定用户信息

路径参数：

- user_id: integer

响应体：

```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "is_active": "boolean",
    "is_superuser": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### PATCH `/api/users/{user_id}`

更新用户信息（仅超级用户）

路径参数：

- user_id: integer

请求体：

```json
{
    "username": "string",
    "email": "string",
    "full_name": "string",
    "password": "string",
    "is_active": "boolean",
    "is_superuser": "boolean"
}
```

响应体：

```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "is_active": "boolean",
    "is_superuser": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

### 团队相关 API

#### 团队管理

##### POST `/api/teams/`

创建新团队

请求体：

```json
{
    "name": "string",
    "description": "string",
    "creator_id": "integer"
}
```

**必填字段：**

- `name`: string - 团队名称
- `creator_id`: integer - 创建者ID (自动设置)

**可选字段：**

- `description`: string - 团队描述

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "creator_id": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "member_count": "integer"
}
```

##### GET `/api/teams/`

获取用户所在的团队列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)

响应体：

```json
[
    {
        "id": "integer",
        "name": "string",
        "description": "string",
        "creator_id": "integer",
        "created_at": "datetime",
        "updated_at": "datetime",
        "member_count": "integer"
    }
]
```

##### GET `/api/teams/{team_id}`

获取团队详情

路径参数：

- team_id: integer

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "creator_id": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "member_count": "integer"
}
```

##### PATCH `/api/teams/{team_id}`

更新团队信息

路径参数：

- team_id: integer

请求体：

```json
{
    "name": "string",
    "description": "string"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "creator_id": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "member_count": "integer"
}
```

##### DELETE `/api/teams/{team_id}`

删除团队

路径参数：

- team_id: integer

响应体：

```json
{
    "message": "string"
}
```

#### 团队成员管理

##### POST `/api/teams/{team_id}/members/{user_id}`

添加团队成员

路径参数：

- team_id: integer
- user_id: integer

查询参数：

- role: string (默认: "MEMBER", 可选值: "OWNER", "ADMIN", "MEMBER")

响应体：

```json
{
    "message": "string"
}
```

##### GET `/api/teams/{team_id}/members`

获取团队成员列表

路径参数：

- team_id: integer

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)

响应体：

```json
[
    {
        "id": "integer",
        "username": "string",
        "email": "string",
        "full_name": "string",
        "is_active": "boolean",
        "is_superuser": "boolean",
        "created_at": "datetime",
        "updated_at": "datetime",
        "role": "string",
        "joined_at": "datetime"
    }
]
```

##### PATCH `/api/teams/{team_id}/members/{user_id}`

更新成员角色

路径参数：

- team_id: integer
- user_id: integer

查询参数：

- role: string (必填, 可选值: "OWNER", "ADMIN", "MEMBER")

响应体：

```json
{
    "message": "string"
}
```

##### DELETE `/api/teams/{team_id}/members/{user_id}`

移除团队成员

路径参数：

- team_id: integer
- user_id: integer

响应体：

```json
{
    "message": "string"
}
```

### 论文相关 API

#### 论文管理

##### POST `/api/papers/`

创建论文

请求体：

```json
{
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "author_names": ["string"],
    "category_ids": ["integer"],
    "keyword_names": ["string"],
    "author_contribution_ratios": ["number"],
    "corresponding_author_name": "string",
    "team_id": "integer"
}
```

**必填字段：**

- `title`: string - 论文标题
- `author_names`: array[string] - 作者姓名列表
- `keyword_names`: array[string] - 关键词列表
- `team_id`: integer - 团队ID

**可选字段：**

- `abstract`: string - 论文摘要
- `publication_date`: datetime - 发表日期
- `journal`: string - 期刊名称
- `doi`: string - DOI标识符
- `category_ids`: array[integer] - 分类ID列表
- `author_contribution_ratios`: array[number] - 作者贡献率列表
- `corresponding_author_name`: string - 通讯作者姓名

响应体：

```json
{
    "id": "integer",
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "categories": [{}],
    "team_id": "integer",
    "created_by_id": "integer"
}
```

##### GET `/api/papers/`

获取论文列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)
- title: string (可选)
- category_id: integer (可选)
- author_name: string (可选)
- keyword: string (可选)
- start_date: datetime (可选)
- end_date: datetime (可选)
- team_id: integer (可选)

响应体：

```json
[
    {
        "id": "integer",
        "title": "string",
        "abstract": "string",
        "publication_date": "datetime",
        "journal": "string",
        "doi": "string",
        "file_path": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "keywords": ["string"],
        "authors": ["string"],
        "categories": [{}],
        "team_id": "integer",
        "created_by_id": "integer"
    }
]
```

##### GET `/api/papers/{paper_id}`

获取单个论文

路径参数：

- paper_id: integer

响应体：

```json
{
    "id": "integer",
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "categories": [{}],
    "team_id": "integer",
    "created_by_id": "integer"
}
```

##### PATCH `/api/papers/{paper_id}`

更新论文

路径参数：

- paper_id: integer

请求体：

```json
{
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "category_ids": ["integer"],
    "keyword_names": ["string"],
    "file_path": "string",
    "team_id": "integer"
}
```

响应体：

```json
{
    "id": "integer",
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "categories": [{}],
    "team_id": "integer",
    "created_by_id": "integer"
}
```

##### DELETE `/api/papers/{paper_id}`

删除论文

路径参数：

- paper_id: integer

响应体：

```json
{
    "message": "string"
}
```

##### POST `/api/papers/{paper_id}/upload`

上传论文文件

路径参数：

- paper_id: integer

请求体（multipart/form-data）：

- file: File (PDF文件)

响应体：

```json
{
    "message": "string",
    "filename": "string"
}
```

##### GET `/api/papers/{paper_id}/download`

下载论文文件

路径参数：

- paper_id: integer

响应：PDF文件下载

##### GET `/api/papers/download/by-title`

通过标题下载论文文件

查询参数：

- title: string (必填)

响应：PDF文件下载

##### GET `/api/papers/{paper_id}/workload`

计算论文工作量

路径参数：

- paper_id: integer

响应体：

```json
{
    "paper_id": "integer",
    "total_workload": "number",
    "authors": [
        {
            "name": "string",
            "workload": "number",
            "contribution_ratio": "number"
        }
    ]
}
```

##### GET `/api/papers/authors/workload/by-name`

通过作者名字计算其所有论文工作量

查询参数：

- author_name: string (必填)

响应体：

```json
{
    "author_name": "string",
    "total_workload": "number",
    "papers": [
        {
            "paper_id": "integer",
            "title": "string",
            "workload": "number",
            "contribution_ratio": "number"
        }
    ]
}
```

##### GET `/api/papers/authors/collaboration-network`

获取作者的合作关系网络

查询参数：

- author_name: string (必填)

响应体：

```json
{
    "author": "string",
    "collaborators": [
        {
            "name": "string",
            "collaboration_count": "integer",
            "papers": ["string"]
        }
    ]
}
```

### 分类相关 API

#### 论文分类管理

##### POST `/api/categories/`

创建分类（仅管理员）

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

##### GET `/api/categories/`

获取分类列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)

响应体：

```json
[
    {
        "id": "integer",
        "name": "string",
        "description": "string",
        "parent_id": "integer"
    }
]
```

##### GET `/api/categories/{category_id}`

获取分类详情

路径参数：

- category_id: integer

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

##### PATCH `/api/categories/{category_id}`

更新分类（仅管理员）

路径参数：

- category_id: integer

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

##### DELETE `/api/categories/{category_id}`

删除分类（仅管理员）

路径参数：

- category_id: integer

响应体：

```json
{
    "message": "string"
}
```

### 参考文献相关 API

#### 参考文献管理

##### POST `/api/references/`

创建参考文献

请求体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "keyword_names": ["string"]
}
```

**必填字段：**

- `title`: string - 参考文献标题
- `authors`: string - 作者信息
- `created_by_id`: integer - 创建者ID (自动设置)
- `keyword_names`: array[string] - 关键词列表

**可选字段：**

- `doi`: string - DOI标识符
- `file_path`: string - 文件路径
- `created_at`: datetime - 创建时间 (自动设置)
- `updated_at`: datetime - 更新时间 (自动设置)
- `team_id`: integer - 团队ID
- `category_id`: integer - 分类ID

响应体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {}
}
```

##### GET `/api/references/`

获取参考文献列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)
- team_id: integer (可选)
- category_id: integer (可选)
- keyword: string (可选)

响应体：

```json
[
    {
        "title": "string",
        "authors": "string",
        "doi": "string",
        "file_path": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "team_id": "integer",
        "created_by_id": "integer",
        "category_id": "integer",
        "id": "integer",
        "keywords": ["string"],
        "category": {}
    }
]
```

##### GET `/api/references/{reference_id}`

获取单个参考文献

路径参数：

- reference_id: integer

响应体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {}
}
```

##### PATCH `/api/references/{reference_id}`

更新参考文献

路径参数：

- reference_id: integer

请求体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "category_id": "integer",
    "keyword_names": ["string"]
}
```

响应体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {}
}
```

##### DELETE `/api/references/{reference_id}`

删除参考文献

路径参数：

- reference_id: integer

响应体：

```json
{
    "message": "string"
}
```

##### POST `/api/references/{reference_id}/upload`

上传参考文献的PDF文件

路径参数：

- reference_id: integer

请求体（multipart/form-data）：

- file: File (PDF文件)

响应体：

```json
{
    "message": "string",
    "filename": "string"
}
```

##### GET `/api/references/{reference_id}/download`

通过ID下载参考文献PDF文件

路径参数：

- reference_id: integer

响应：PDF文件下载

##### GET `/api/references/download/by-title`

通过标题下载参考文献PDF文件

查询参数：

- title: string (必填)
- team_id: integer (必填)

响应：PDF文件下载

#### 参考文献分类管理

##### POST `/api/reference-categories/`

创建参考文献分类（仅团队管理员）

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer",
    "team_id": "integer"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer",
    "team_id": "integer"
}
```

##### GET `/api/reference-categories/`

获取团队的参考文献分类列表

查询参数：

- team_id: integer (必填)
- skip: integer (默认: 0)
- limit: integer (默认: 100)

响应体：

```json
[
    {
        "id": "integer",
        "name": "string",
        "description": "string",
        "parent_id": "integer",
        "team_id": "integer"
    }
]
```

##### GET `/api/reference-categories/{category_id}`

获取参考文献分类详情

路径参数：

- category_id: integer

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer",
    "team_id": "integer"
}
```

##### PATCH `/api/reference-categories/{category_id}`

更新参考文献分类（仅团队管理员）

路径参数：

- category_id: integer

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "description": "string",
    "parent_id": "integer",
    "team_id": "integer"
}
```

##### DELETE `/api/reference-categories/{category_id}`

删除参考文献分类（仅团队管理员）

路径参数：

- category_id: integer

响应体：

```json
{
    "message": "string"
}
```

## 4. HTTP 状态码说明

### 成功响应

- `200 OK`: 请求成功，返回数据
- `201 Created`: 资源创建成功
- `204 No Content`: 请求成功，无返回内容

### 客户端错误

- `400 Bad Request`: 请求参数错误或格式不正确
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 权限不足，无法访问资源
- `404 Not Found`: 请求的资源不存在
- `409 Conflict`: 资源冲突（如用户名/邮箱已存在）
- `422 Unprocessable Entity`: 请求格式正确但语义错误

### 服务器错误

- `500 Internal Server Error`: 服务器内部错误

## 5. 错误响应

### 常见错误状态码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如用户名/邮箱已存在）
- `422 Unprocessable Entity`: 请求格式正确但语义错误
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式

```json
{
    "detail": "错误详细信息"
}
```

或

```json
{
    "detail": [
        {
            "loc": ["字段位置"],
            "msg": "错误消息",
            "type": "错误类型"
        }
    ]
}
```

## 6. 认证说明

### Token 认证

本 API 使用 OAuth2 Bearer Token 认证。

1. 通过 `POST /api/users/token` 获取访问令牌
2. 在后续请求的 Header 中包含 `Authorization: Bearer {access_token}`

### 权限说明

- **普通用户**: 可以管理自己的论文和参考文献
- **团队管理员/拥有者**: 可以管理团队成员和团队资源
- **超级用户**: 可以管理所有用户和全局分类

## 7. 团队角色说明

- **OWNER**: 团队拥有者，拥有所有权限
- **ADMIN**: 团队管理员，可以管理成员和资源
- **MEMBER**: 团队成员，可以查看和操作团队资源

## 8. 文件上传说明

### 支持的文件格式

- **论文文件**: PDF格式
- **参考文献文件**: PDF格式

### 文件大小限制

- 单个文件最大支持: 50MB
- 文件名要求: 支持中英文，避免特殊字符

### 上传流程

1. 先创建论文/参考文献记录
2. 使用返回的ID上传对应的PDF文件
3. 文件会自动保存到服务器指定目录

## 9. 分页说明

### 查询参数

大部分列表接口支持分页查询：

- `skip`: integer (默认: 0) - 跳过的记录数
- `limit`: integer (默认: 100) - 返回的最大记录数

### 示例

```bash
GET /api/papers/?skip=0&limit=10
```

### 最大限制

- 单次查询最大返回记录数: 1000
- 建议每页记录数: 10-100

## 10. API 使用示例

### 用户登录

```bash
curl -X POST "http://localhost:8000/api/users/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_username&password=your_password"
```

### 创建论文

```bash
curl -X POST "http://localhost:8000/api/papers/" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "论文标题",
    "author_names": ["作者1", "作者2"],
    "keyword_names": ["关键词1", "关键词2"],
    "team_id": 1
  }'
```

### 上传论文文件

```bash
curl -X POST "http://localhost:8000/api/papers/1/upload" \
  -H "Authorization: Bearer your_token" \
  -F "file=@paper.pdf"
```

## 11. 数据库设计

## 12. 开发说明

### 项目特点

- **现代技术栈**: 使用 FastAPI + SQLAlchemy + SQLite
- **类型安全**: 完整的 TypeScript 类型定义和 Pydantic 验证
- **团队协作**: 支持多团队管理和权限控制
- **文件管理**: 完整的 PDF 文件上传下载功能
- **数据分析**: 支持作者工作量计算和合作关系分析

### API 文档

- **Swagger UI**: `/docs` - 交互式 API 文档
- **ReDoc**: `/redoc` - 美观的 API 文档
- **OpenAPI JSON**: `/openapi.json` - 机器可读的 API 规范

### 相关文档

- [管理员工具指南](docs/ADMIN_TOOLS_GUIDE.md)
- [SQLite 迁移说明](docs/MIGRATION_TO_SQLITE.md)
- [极简配置成功指南](docs/EXTREME_SIMPLE_CONFIG_SUCCESS.md)

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 许可证

本项目采用 MIT 许可证。

---

**注意**: 本文档基于 OpenAPI 规范自动生成和更新，确保与实际 API 实现保持一致。如发现文档与实际行为不符，请以 `/docs` 中的 Swagger 文档为准。
