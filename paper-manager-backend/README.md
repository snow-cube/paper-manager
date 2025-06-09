# Paper Manager Backend

uvicorn app.main:app --reload --log-level debug

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

### TeamUser 团队成员表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| team_id | Integer | 团队ID | Primary Key, Foreign Key -> Team.id |
| user_id | Integer | 用户ID | Primary Key, Foreign Key -> User.id |
| role | Enum | 角色 | Enum(OWNER, ADMIN, MEMBER) |
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

### Category 论文分类表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 分类ID | Primary Key |
| name | String | 分类名称 | Not Null |
| description | String | 分类描述 | Nullable |
| parent_id | Integer | 父分类ID | Foreign Key -> Category.id, Nullable |

### ReferencePaper 参考文献表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 参考文献ID | Primary Key |
| title | String | 标题 | Not Null |
| authors | String | 作者 | Not Null |
| doi | String | DOI | Unique, Nullable |
| file_path | String | 文件路径 | Nullable |
| created_at | DateTime | 创建时间 | Default Now |
| updated_at | DateTime | 更新时间 | Default Now |
| team_id | Integer | 团队ID | Foreign Key -> Team.id, Nullable |
| category_id | Integer | 分类ID | Foreign Key -> ReferenceCategory.id, Nullable |
| created_by_id | Integer | 创建者ID | Foreign Key -> User.id |

### ReferenceCategory 参考文献分类表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 分类ID | Primary Key |
| name | String | 分类名称 | Not Null |
| description | String | 分类描述 | Nullable |
| team_id | Integer | 团队ID | Foreign Key -> Team.id |
| parent_id | Integer | 父分类ID | Foreign Key -> ReferenceCategory.id, Nullable |

### Keyword 关键词表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | Integer | 关键词ID | Primary Key |
| name | String | 关键词名称 | Not Null, Unique |

### ReferenceKeyword 参考文献-关键词关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| reference_id | Integer | 参考文献ID | Primary Key, Foreign Key -> ReferencePaper.id |
| keyword_id | Integer | 关键词ID | Primary Key, Foreign Key -> Keyword.id |

### PaperKeyword 论文-关键词关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| keyword_id | Integer | 关键词ID | Primary Key, Foreign Key -> Keyword.id |

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

### PaperCategory 论文-分类关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| category_id | Integer | 分类ID | Primary Key, Foreign Key -> Category.id |

### PaperTeam 论文-团队关联表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| paper_id | Integer | 论文ID | Primary Key, Foreign Key -> Paper.id |
| team_id | Integer | 团队ID | Primary Key, Foreign Key -> Team.id |

## 3. API 文档

### 用户相关 API

#### 认证

##### POST `/api/users/token`

用户登录接口

请求体（application/x-www-form-urlencoded）：

```
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

## 4. 错误响应

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

## 5. 认证说明

### Token 认证

本 API 使用 OAuth2 Bearer Token 认证。

1. 通过 `POST /api/users/token` 获取访问令牌
2. 在后续请求的 Header 中包含 `Authorization: Bearer {access_token}`

### 权限说明

- **普通用户**: 可以管理自己的论文和参考文献
- **团队管理员/拥有者**: 可以管理团队成员和团队资源
- **超级用户**: 可以管理所有用户和全局分类

## 6. 团队角色说明

- **OWNER**: 团队拥有者，拥有所有权限
- **ADMIN**: 团队管理员，可以管理成员和资源
- **MEMBER**: 团队成员，可以查看和操作团队资源
