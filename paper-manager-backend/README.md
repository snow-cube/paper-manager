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

| 字段名          | 类型     | 说明         | 约束          |
| --------------- | -------- | ------------ | ------------- |
| id              | Integer  | 用户ID       | Primary Key   |
| username        | String   | 用户名       | Unique, Index |
| email           | String   | 邮箱         | Unique, Index |
| full_name       | String   | 全名         | Not Null      |
| hashed_password | String   | 加密密码     | Not Null      |
| is_active       | Boolean  | 是否激活     | Default True  |
| is_superuser    | Boolean  | 是否超级用户 | Default False |
| created_at      | DateTime | 创建时间     | Default Now   |
| updated_at      | DateTime | 更新时间     | Default Now   |

### Team 团队表

| 字段名         | 类型     | 说明         | 约束                   |
| -------------- | -------- | ------------ | ---------------------- |
| id             | Integer  | 团队ID       | Primary Key            |
| name           | String   | 团队名称     | Index                  |
| description    | String   | 团队描述     | Nullable               |
| creator_id     | Integer  | 创建者ID     | Foreign Key -> User.id |
| created_at     | DateTime | 创建时间     | Default Now            |
| updated_at     | DateTime | 更新时间     | Default Now            |
| max_members    | Integer  | 最大成员数   | Nullable               |
| is_active      | Boolean  | 是否激活     | Default True           |
| last_active_at | DateTime | 最后活跃时间 | Nullable               |

### TeamUser 团队成员关联表

| 字段名    | 类型     | 说明     | 约束                                       |
| --------- | -------- | -------- | ------------------------------------------ |
| team_id   | Integer  | 团队ID   | Primary Key, Foreign Key -> Team.id        |
| user_id   | Integer  | 用户ID   | Primary Key, Foreign Key -> User.id        |
| role      | Enum     | 角色     | Enum(OWNER, ADMIN, MEMBER), Default MEMBER |
| joined_at | DateTime | 加入时间 | Default Now                                |

### Paper 论文表

| 字段名           | 类型     | 说明     | 约束                                 |
| ---------------- | -------- | -------- | ------------------------------------ |
| id               | Integer  | 论文ID   | Primary Key                          |
| title            | String   | 标题     | Not Null, Index                      |
| abstract         | String   | 摘要     | Nullable                             |
| publication_date | DateTime | 发表日期 | Nullable                             |
| journal_id       | Integer  | 期刊ID   | Foreign Key -> Journal.id, Nullable  |
| doi              | String   | DOI      | Unique, Nullable                     |
| file_path        | String   | 文件路径 | Nullable                             |
| category_id      | Integer  | 分类ID   | Foreign Key -> Category.id, Nullable |
| created_at       | DateTime | 创建时间 | Default Now                          |
| updated_at       | DateTime | 更新时间 | Default Now                          |
| created_by_id    | Integer  | 创建者ID | Foreign Key -> User.id               |
| team_id          | Integer  | 团队ID   | Foreign Key -> Team.id               |

### Author 作者表

| 字段名      | 类型     | 说明     | 约束             |
| ----------- | -------- | -------- | ---------------- |
| id          | Integer  | 作者ID   | Primary Key      |
| name        | String   | 作者姓名 | Index            |
| email       | String   | 邮箱     | Unique, Nullable |
| affiliation | String   | 所属机构 | Nullable         |
| created_at  | DateTime | 创建时间 | Default Now      |
| updated_at  | DateTime | 更新时间 | Default Now      |

### PaperAuthor 论文-作者关联表

| 字段名             | 类型    | 说明         | 约束                                  |
| ------------------ | ------- | ------------ | ------------------------------------- |
| paper_id           | Integer | 论文ID       | Primary Key, Foreign Key -> Paper.id  |
| author_id          | Integer | 作者ID       | Primary Key, Foreign Key -> Author.id |
| contribution_ratio | Float   | 贡献率       | Default 1.0                           |
| is_corresponding   | Boolean | 是否通讯作者 | Default False                         |
| author_order       | Integer | 作者顺序     | Not Null                              |

### Category 论文分类表

| 字段名      | 类型    | 说明     | 约束                                 |
| ----------- | ------- | -------- | ------------------------------------ |
| id          | Integer | 分类ID   | Primary Key                          |
| name        | String  | 分类名称 | Not Null, Index                      |
| description | String  | 分类描述 | Nullable                             |
| parent_id   | Integer | 父分类ID | Foreign Key -> Category.id, Nullable |

**特性说明：**

- 支持层次化分类结构，通过 `parent_id` 实现父子关系
- 全局分类，所有用户共享，仅管理员可管理
- 支持统计功能，可查询每个分类下的论文数量

### ReferencePaper 参考文献表

| 字段名           | 类型     | 说明       | 约束                                          |
| ---------------- | -------- | ---------- | --------------------------------------------- |
| id               | Integer  | 参考文献ID | Primary Key                                   |
| title            | String   | 标题       | Not Null, Index                               |
| authors          | String   | 作者信息   | Not Null                                      |
| doi              | String   | DOI        | Unique, Nullable                              |
| file_path        | String   | 文件路径   | Nullable                                      |
| journal_id       | Integer  | 期刊ID     | Foreign Key -> Journal.id, Nullable           |
| publication_year | Integer  | 发表年份   | Index, Nullable                               |
| category_id      | Integer  | 分类ID     | Foreign Key -> ReferenceCategory.id, Nullable |
| created_at       | DateTime | 创建时间   | Default Now                                   |
| updated_at       | DateTime | 更新时间   | Default Now                                   |
| team_id          | Integer  | 团队ID     | Foreign Key -> Team.id, Nullable              |
| created_by_id    | Integer  | 创建者ID   | Foreign Key -> User.id, Not Null              |

### ReferenceCategory 参考文献分类表

| 字段名      | 类型    | 说明     | 约束                                          |
| ----------- | ------- | -------- | --------------------------------------------- |
| id          | Integer | 分类ID   | Primary Key                                   |
| name        | String  | 分类名称 | Not Null, Index                               |
| description | String  | 分类描述 | Nullable                                      |
| parent_id   | Integer | 父分类ID | Foreign Key -> ReferenceCategory.id, Nullable |
| team_id     | Integer | 团队ID   | Foreign Key -> Team.id, Not Null              |

**特性说明：**

- 支持层次化分类结构，通过 `parent_id` 实现父子关系
- 按团队隔离，每个团队拥有独立的分类体系
- 仅团队管理员/拥有者可管理团队分类
- 支持统计功能，可查询每个分类下的参考文献数量

### Keyword 关键词表

| 字段名     | 类型     | 说明       | 约束                    |
| ---------- | -------- | ---------- | ----------------------- |
| id         | Integer  | 关键词ID   | Primary Key             |
| name       | String   | 关键词名称 | Not Null, Unique, Index |
| created_at | DateTime | 创建时间   | Default Now             |
| updated_at | DateTime | 更新时间   | Default Now             |

### PaperKeyword 论文-关键词关联表

| 字段名     | 类型    | 说明     | 约束                                   |
| ---------- | ------- | -------- | -------------------------------------- |
| paper_id   | Integer | 论文ID   | Primary Key, Foreign Key -> Paper.id   |
| keyword_id | Integer | 关键词ID | Primary Key, Foreign Key -> Keyword.id |

### ReferenceKeyword 参考文献-关键词关联表

| 字段名       | 类型    | 说明       | 约束                                          |
| ------------ | ------- | ---------- | --------------------------------------------- |
| reference_id | Integer | 参考文献ID | Primary Key, Foreign Key -> ReferencePaper.id |
| keyword_id   | Integer | 关键词ID   | Primary Key, Foreign Key -> Keyword.id        |

### Journal 期刊表

| 字段名      | 类型     | 说明     | 约束                    |
| ----------- | -------- | -------- | ----------------------- |
| id          | Integer  | 期刊ID   | Primary Key             |
| name        | String   | 期刊名称 | Not Null, Unique, Index |
| grade       | String   | 期刊等级 | Default "OTHER"         |
| description | String   | 期刊描述 | Nullable                |
| created_at  | DateTime | 创建时间 | Default Now             |
| updated_at  | DateTime | 更新时间 | Default Now             |

**期刊等级说明：**

- `SCI_Q1`: SCI一区期刊（工作量基础分：10.0）
- `SCI_Q2`: SCI二区期刊（工作量基础分：8.0）
- `SCI_Q3`: SCI三区期刊（工作量基础分：6.0）
- `SCI_Q4`: SCI四区期刊（工作量基础分：4.0）
- `EI`: EI期刊（工作量基础分：3.0）
- `OTHER`: 其他期刊（工作量基础分：1.0）

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

#### 期刊与论文关系

- 论文可以关联到期刊（多对一）
- 期刊具有等级属性，用于计算论文工作量
- 支持期刊的增删改查和搜索功能

#### 工作量计算机制

- 基于期刊等级和作者贡献率的工作量计算系统
- 支持单篇论文工作量计算和作者总工作量统计
- 自动考虑通讯作者标识和作者顺序

### API响应字段说明

#### 计算字段

除了数据库中直接存储的字段外，某些API响应还包含通过数据库关联查询计算得出的字段：

**论文API响应中的计算字段：**

- `team_name`: 通过 `team_id` 关联查询 `Team` 表获得的团队名称
- `journal_name`: 通过 `journal_id` 关联查询 `Journal` 表获得的期刊名称
- `keywords`: 通过 `PaperKeyword` 关联表获得的关键词名称列表
- `authors`: 通过 `PaperAuthor` 关联表获得的作者姓名列表
- `category_name`: 通过 `category_id` 关联查询 `Category` 表获得的分类名称

**团队API响应中的计算字段：**

- `member_count`: 通过 `TeamUser` 关联表统计的团队成员数量

**参考文献API响应中的计算字段：**

- `keywords`: 通过 `ReferenceKeyword` 关联表获得的关键词名称列表
- `category`: 通过 `category_id` 关联查询 `ReferenceCategory` 表获得的分类信息
- `journal_name`: 通过 `journal_id` 关联查询 `Journal` 表获得的期刊名称

**期刊与工作量计算：**

- 论文工作量根据期刊等级和作者贡献率计算：`工作量 = 期刊基础分 × 作者贡献率`
- 支持按作者名称统计总工作量，包含所有参与论文的详细信息

**设计优势：**

- 减少前端API调用次数，提升用户体验
- 在单次查询中提供完整的业务信息
- 保持数据库规范化设计的同时，优化API响应结构

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
    "journal_id": "integer",
    "doi": "string",
    "author_names": ["string"],
    "category_id": "integer",
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
- `journal_id`: integer - 期刊ID
- `doi`: string - DOI标识符
- `category_id`: integer - 分类ID
- `author_contribution_ratios`: array[number] - 作者贡献率列表
- `corresponding_author_name`: string - 通讯作者姓名

响应体：

```json
{
    "id": "integer",
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal_id": "integer",
    "journal_name": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "category_id": "integer",
    "category_name": "string",
    "team_id": "integer",
    "team_name": "string",
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
{
    "items": [
        {
            "id": "integer",
            "title": "string",
            "abstract": "string",
            "publication_date": "datetime",
            "journal_id": "integer",
            "journal_name": "string",
            "doi": "string",
            "file_path": "string",
            "created_at": "datetime",
            "updated_at": "datetime",
            "keywords": ["string"],
            "authors": ["string"],
            "category_id": "integer",
            "category_name": "string",
            "team_id": "integer",
            "team_name": "string",
            "created_by_id": "integer"
        }
    ],
    "total": "integer",
    "page": "integer",
    "size": "integer",
    "pages": "integer"
}
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
    "journal_id": "integer",
    "journal_name": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "category_id": "integer",
    "category_name": "string",
    "team_id": "integer",
    "team_name": "string",
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
    "journal_id": "integer",
    "doi": "string",
    "category_id": "integer",
    "keyword_names": ["string"],
    "author_names": ["string"],
    "author_contribution_ratios": ["number"],
    "file_path": "string",
    "team_id": "integer"
}
```

**所有字段都是可选的：**

- `title`: string - 论文标题
- `abstract`: string - 论文摘要
- `publication_date`: datetime - 发表日期
- `journal_id`: integer - 期刊ID（设为0可清空期刊关联）
- `doi`: string - DOI标识符
- `category_id`: integer - 分类ID（设为0可清空分类关联）
- `keyword_names`: array[string] - 关键词列表（完全替换现有关键词）
- `author_names`: array[string] - 作者姓名列表（完全替换现有作者，按顺序排列）
- `author_contribution_ratios`: array[number] - 作者贡献率列表（对应author_names的顺序，默认为1.0）
- `file_path`: string - 文件路径
- `team_id`: integer - 团队ID（不能设为0，必须是有效的团队ID）

响应体：

```json
{
    "id": "integer",
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal_id": "integer",
    "journal_name": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"],
    "category_id": "integer",
    "category_name": "string",
    "team_id": "integer",
    "team_name": "string",
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
    "journal_grade": "string",
    "workloads": [
        {
            "author_id": "integer",
            "contribution_ratio": "number",
            "workload": "number"
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
    "author_id": "integer",
    "author_name": "string",
    "total_workload": "number",
    "paper_workloads": [
        {
            "paper_id": "integer",
            "paper_title": "string",
            "contribution_ratio": "number",
            "is_corresponding": "boolean",
            "author_order": "integer",
            "workload": "number",
            "publication_date": "datetime",
            "journal_id": "integer",
            "journal_name": "string",
            "journal_grade": "string"
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
        }    ]
}
```

##### GET `/api/papers/export/excel`

导出论文列表为Excel格式

查询参数：

- title: string (可选) - 论文标题筛选
- category_id: integer (可选) - 分类ID筛选
- author_name: string (可选) - 作者名称筛选
- keyword: string (可选) - 关键词筛选
- journal_id: integer (可选) - 期刊ID筛选
- start_date: datetime (可选) - 发表日期起始范围
- end_date: datetime (可选) - 发表日期结束范围
- team_id: integer (可选) - 团队ID筛选

响应：Excel文件下载

**说明：**

- 支持与论文列表API相同的筛选条件
- 导出的Excel包含以下列：ID、Title、Abstract、Authors、Keywords、Category、Journal、Publication Date、DOI、Team、Created At、Has File
- 文件名格式：`papers_export_YYYYMMDD_HHMMSS.xlsx`
- 返回Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 期刊相关 API

#### 期刊管理

##### POST `/api/journals/`

创建期刊（仅管理员）

请求体：

```json
{
    "name": "string",
    "grade": "string",
    "description": "string"
}
```

**必填字段：**

- `name`: string - 期刊名称

**可选字段：**

- `grade`: string - 期刊等级（默认: "OTHER"，可选值: "SCI_Q1", "SCI_Q2", "SCI_Q3", "SCI_Q4", "EI", "OTHER"）
- `description`: string - 期刊描述

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "grade": "string",
    "description": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### GET `/api/journals/`

获取期刊列表

查询参数：

- skip: integer (默认: 0)
- limit: integer (默认: 100)
- name: string (可选)
- grade: string (可选)

响应体：

```json
{
    "items": [
        {
            "id": "integer",
            "name": "string",
            "grade": "string",
            "description": "string",
            "created_at": "datetime",
            "updated_at": "datetime"
        }
    ],
    "total": "integer",
    "page": "integer",
    "size": "integer",
    "pages": "integer"
}
```

##### GET `/api/journals/search`

搜索期刊

查询参数：

- q: string (必填) - 搜索关键词
- limit: integer (默认: 10)

响应体：

```json
[
    {
        "id": "integer",
        "name": "string",
        "grade": "string",
        "description": "string"
    }
]
```

##### GET `/api/journals/{journal_id}`

获取期刊详情

路径参数：

- journal_id: integer

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "grade": "string",
    "description": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### PATCH `/api/journals/{journal_id}`

更新期刊（仅管理员）

路径参数：

- journal_id: integer

请求体：

```json
{
    "name": "string",
    "grade": "string",
    "description": "string"
}
```

响应体：

```json
{
    "id": "integer",
    "name": "string",
    "grade": "string",
    "description": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

##### DELETE `/api/journals/{journal_id}`

删除期刊（仅管理员）

路径参数：

- journal_id: integer

响应体：

```json
{
    "message": "string"
}
```

##### GET `/api/journals/grades/list`

获取所有期刊等级

响应体：

```json
[
    {
        "value": "SCI_Q1",
        "label": "SCI一区",
        "base_workload": 10.0
    },
    {
        "value": "SCI_Q2",
        "label": "SCI二区",
        "base_workload": 8.0
    },
    {
        "value": "SCI_Q3",
        "label": "SCI三区",
        "base_workload": 6.0
    },
    {
        "value": "SCI_Q4",
        "label": "SCI四区",
        "base_workload": 4.0
    },
    {
        "value": "EI",
        "label": "EI期刊",
        "base_workload": 3.0
    },
    {
        "value": "OTHER",
        "label": "其他期刊",
        "base_workload": 1.0
    }
]
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

**必填字段：**

- `name`: string - 分类名称

**可选字段：**

- `description`: string - 分类描述
- `parent_id`: integer - 父分类ID

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

获取分类列表，可选择包含统计信息

查询参数：

- `skip`: integer (默认: 0) - 跳过的记录数
- `limit`: integer (默认: 100) - 限制返回的记录数
- `include_stats`: boolean (默认: false) - 是否包含统计信息

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

**注意：** 当 `include_stats=true` 时，响应会包含 `paper_count` 字段显示每个分类下的论文数量。

##### GET `/api/categories/{category_id}`

获取分类详情

路径参数：

- `category_id`: integer - 分类ID

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

- `category_id`: integer - 分类ID

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

**可选字段：**

- `name`: string - 分类名称
- `description`: string - 分类描述
- `parent_id`: integer - 父分类ID

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

- `category_id`: integer - 分类ID

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
    "journal_id": "integer",
    "publication_year": "integer",
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
- `keyword_names`: array[string] - 关键词列表

**可选字段：**

- `doi`: string - DOI标识符
- `file_path`: string - 文件路径
- `journal_id`: integer - 期刊ID
- `publication_year`: integer - 发表年份
- `team_id`: integer - 团队ID
- `category_id`: integer - 分类ID

响应体：

```json
{
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "journal_id": "integer",
    "journal_name": "string",
    "publication_year": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {
        "id": "integer",
        "name": "string",
        "description": "string",
        "parent_id": "integer",
        "team_id": "integer"
    }
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
{    "items": [
        {
            "title": "string",
            "authors": "string",
            "doi": "string",
            "file_path": "string",
            "journal_id": "integer",
            "journal_name": "string",
            "publication_year": "integer",
            "created_at": "datetime",
            "updated_at": "datetime",
            "team_id": "integer",
            "created_by_id": "integer",
            "category_id": "integer",
            "id": "integer",
            "keywords": ["string"],
            "category": {
                "id": "integer",
                "name": "string",
                "description": "string",
                "parent_id": "integer",
                "team_id": "integer"
            }
        }
    ],
    "total": "integer",
    "page": "integer",
    "size": "integer",
    "pages": "integer"
}
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
    "journal_id": "integer",
    "journal_name": "string",
    "publication_year": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {
        "id": "integer",
        "name": "string",
        "description": "string",
        "parent_id": "integer",
        "team_id": "integer"
    }
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
    "journal_id": "integer",
    "publication_year": "integer",
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
    "journal_id": "integer",
    "journal_name": "string",
    "publication_year": "integer",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": "integer",
    "created_by_id": "integer",
    "category_id": "integer",
    "id": "integer",
    "keywords": ["string"],
    "category": {
        "id": "integer",
        "name": "string",
        "description": "string",
        "parent_id": "integer",
        "team_id": "integer"
    }
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

##### GET `/api/references/export/excel`

导出参考文献列表为Excel格式

查询参数：

- team_id: integer (可选) - 团队ID筛选
- category_id: integer (可选) - 分类ID筛选
- keyword: string (可选) - 关键词筛选
- journal_id: integer (可选) - 期刊ID筛选
- publication_year: integer (可选) - 发表年份筛选
- title: string (可选) - 标题筛选

响应：Excel文件下载

**说明：**

- 支持与参考文献列表API相同的筛选条件
- 如果不指定team_id，导出用户有权访问的所有团队的参考文献
- 导出的Excel包含以下列：ID、Title、Authors、Keywords、Category、Journal、Publication Year、DOI、Team、Created At、Has File
- 文件名格式：`references_export_YYYYMMDD_HHMMSS.xlsx`
- 返回Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

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

**必填字段：**

- `name`: string - 分类名称
- `team_id`: integer - 团队ID

**可选字段：**

- `description`: string - 分类描述
- `parent_id`: integer - 父分类ID

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

获取团队的参考文献分类列表，可选择包含统计信息

查询参数：

- `team_id`: integer (必填) - 团队ID
- `skip`: integer (默认: 0) - 跳过的记录数
- `limit`: integer (默认: 100) - 限制返回的记录数
- `include_stats`: boolean (默认: false) - 是否包含统计信息

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

**注意：** 当 `include_stats=true` 时，响应会包含 `reference_count` 字段显示每个分类下的参考文献数量。

##### GET `/api/reference-categories/{category_id}`

获取参考文献分类详情

路径参数：

- `category_id`: integer - 分类ID

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

- `category_id`: integer - 分类ID

请求体：

```json
{
    "name": "string",
    "description": "string",
    "parent_id": "integer"
}
```

**可选字段：**

- `name`: string - 分类名称
- `description`: string - 分类描述
- `parent_id`: integer - 父分类ID

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

- `category_id`: integer - 分类ID

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
