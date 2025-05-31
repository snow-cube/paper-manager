# 后端

数据库 mysql 创建 paper_manager
启动 uvicorn app.main:app --reload --log-level debug

## 1. 项目文件结构

```
paper-manager-backend/
├── app/                        # 主应用目录
│   ├── api/                   # API 路由处理
│   │   ├── category.py       # 分类相关的 API 端点
│   │   ├── paper.py          # 论文相关的 API 端点
│   │   ├── reference.py      # 参考文献相关的 API 端点
│   │   ├── team.py          # 团队相关的 API 端点
│   │   └── user.py          # 用户相关的 API 端点
│   │
│   ├── core/                  # 核心配置和功能
│   │   ├── config.py        # 应用配置
│   │   ├── database.py      # 数据库配置
│   │   └── security.py      # 安全相关配置
│   │
│   ├── models/               # 数据模型
│   │   ├── author.py        # 作者模型
│   │   ├── category.py      # 分类模型
│   │   ├── keyword.py       # 关键词模型
│   │   ├── paper.py         # 论文模型
│   │   ├── reference.py     # 参考文献模型
│   │   ├── team.py         # 团队模型
│   │   └── user.py         # 用户模型
│   │
│   ├── services/             # 业务服务
│   │   └── utils.py        # 工具函数（工作量计算等）
│   │
│   ├── __init__.py          # 包初始化文件
│   └── main.py              # 应用入口点
│
├── uploads/                  # 文件上传目录
│   ├── papers/              # 论文文件存储
│   └── teams/               # 团队文件存储
│       └── references/      # 参考文献文件存储
│
├── .env                     # 环境变量配置
├── .gitignore              # Git 忽略文件
├── README.md               # 项目文档
├── requirements.txt        # 项目依赖
└── alembic/                # 数据库迁移
    ├── versions/          # 迁移版本
    └── env.py            # 迁移环境配置
```

## 2. 数据库设计

### User（用户表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| username | String | 用户名 | 必填，唯一，索引 |
| email | String | 邮箱 | 必填，唯一，索引 |
| full_name | String | 全名 | 必填 |
| hashed_password | String | 加密密码 | 必填 |
| is_active | Boolean | 是否激活 | 默认True |
| is_superuser | Boolean | 是否超级用户 | 默认False |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### Paper（论文表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| title | String | 论文标题 | 必填，索引 |
| abstract | Text | 摘要 | 可选 |
| publication_date | DateTime | 发表日期 | 可选 |
| journal | String | 期刊名称 | 可选 |
| doi | String | DOI | 可选，唯一 |
| file_path | String | 文件路径 | 可选 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### Author（作者表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 作者姓名 | 必填，索引 |
| email | String | 作者邮箱 | 可选，唯一 |
| affiliation | String | 所属机构 | 可选 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### Category（分类表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 分类名称 | 必填，索引 |
| description | Text | 分类描述 | 可选 |
| parent_id | Integer | 父分类ID | 可选，外键(category.id) |

### Team（团队表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 团队名称 | 必填，索引 |
| description | Text | 团队描述 | 可选 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |
| creator_id | Integer | 创建者ID | 必填，外键(user.id) |
| max_members | Integer | 最大成员数 | 可选 |
| is_active | Boolean | 是否激活 | 默认True |
| last_active_at | DateTime | 最后活动时间 | 可选 |

### TeamUser（团队-用户关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| team_id | Integer | 团队ID | 必填，主键，外键(team.id) |
| user_id | Integer | 用户ID | 必填，主键，外键(user.id) |
| role | Enum | 用户角色 | 必填，枚举(MEMBER/ADMIN) |
| joined_at | DateTime | 加入时间 | 默认当前时间 |

### Keyword（关键词表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 关键词 | 必填，唯一，索引 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### PaperAuthor（论文-作者关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| paper_id | Integer | 论文ID | 必填，主键，外键(paper.id) |
| author_id | Integer | 作者ID | 必填，主键，外键(author.id) |
| contribution_ratio | Float | 贡献比例 | 默认1.0 |
| is_corresponding | Boolean | 是否通讯作者 | 默认False |
| author_order | Integer | 作者顺序 | 必填 |

### PaperCategory（论文-分类关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| paper_id | Integer | 论文ID | 必填，主键，外键(paper.id) |
| category_id | Integer | 分类ID | 必填，主键，外键(category.id) |

### PaperKeyword（论文-关键词关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| paper_id | Integer | 论文ID | 必填，主键，外键(paper.id) |
| keyword_id | Integer | 关键词ID | 必填主键，外键(keyword.id) |

### ReferencePaper（参考文献表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| title | String | 标题 | 必填，索引 |
| authors | String | 作者字符串 | 必填 |
| doi | String | DOI | 可选，唯一 |
| file_path | String | 文件路径 | 可选 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |
| team_id | Integer | 所属团队ID | 必填，外键(team.id) |
| created_by_id | Integer | 创建者ID | 必填，外键(user.id) |
| category_id | Integer | 分类ID | 可选，外键(category.id) |

### ReferenceKeyword（参考文献-关键词关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| reference_id | Integer | 参考文献ID | 必填，主键，外键(referencepaper.id) |
| keyword_id | Integer | 关键词ID | 必填，主键，外键(keyword.id) |

## 3. API文档

### 论文相关API

#### 创建论文
```
POST /api/papers/
```

**请求体（PaperCreate）：**
```json
{
    "title": "string",              // 必填，论文标题
    "abstract": "string",           // 可选，摘要
    "publication_date": "datetime", // 可选，发表日期
    "journal": "string",            // 可选，期刊名称
    "doi": "string",               // 可选，DOI号（唯一）
    "author_names": ["string"],     // 必填，作者名字列表
    "category_ids": [0],           // 可选，分类ID列表
    "keyword_names": ["string"],    // 必填，关键词列表
    "author_contribution_ratios": [0.0], // 可选，作者贡献比例
    "corresponding_author_name": "string" // 可选，通讯作者名字
}
```

**返回值（PaperRead）：**
```json
{
    "id": 0,
    "title": "string",
    "abstract": "string",
    "publication_date": "datetime",
    "journal": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "keywords": ["string"],
    "authors": ["string"]
}
```

**错误码：**
- 400: DOI已存在
- 404: 分类不存在

#### 上传论文文件
```
POST /api/papers/{paper_id}/upload
```

**参数：**
- paper_id: 论文ID（路径参数）
- file: 文件（multipart/form-data）

**返回值：**
```json
{
    "paper_id": 0,
    "filename": "string",
    "file_path": "string"
}
```

**错误码：**
- 404: 论文不存在

#### 获取论文列表
```
GET /api/papers/
```

**查询参数：**
- skip: 跳过记录数（默认0）
- limit: 返回记录数（默认100）
- title: 论文标题（模糊查询）
- category_id: 分类ID
- author_name: 作者名字
- keyword: 关键词
- start_date: 开始日期
- end_date: 结束日期

**返回值：**
```json
[
    {
        "id": 0,
        "title": "string",
        "abstract": "string",
        "publication_date": "datetime",
        "journal": "string",
        "doi": "string",
        "file_path": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "keywords": ["string"],
        "authors": ["string"]
    }
]
```

#### 获取单个论文
```
GET /api/papers/{paper_id}
```

**参数：**
- paper_id: 论文ID（路径参数）

**返回值：**
同PaperRead

**错误码：**
- 404: 论文不存在

#### 更新论文
```
PATCH /api/papers/{paper_id}
```

**参数：**
- paper_id: 论文ID（路径参数）

**请求体（PaperUpdate）：**
```json
{
    "title": "string",              // 可选
    "abstract": "string",           // 可选
    "publication_date": "datetime", // 可选
    "journal": "string",            // 可选
    "doi": "string",               // 可选
    "category_ids": [0],           // 可选
    "keyword_names": ["string"],    // 可选
    "file_path": "string"          // 可选
}
```

**返回值：**
同PaperRead

**错误码：**
- 403: 无权限（非作者）
- 404: 论文不存在或分类不存在

#### 删除论文
```
DELETE /api/papers/{paper_id}
```

**参数：**
- paper_id: 论文ID（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非作者）
- 404: 论文不存在

#### 计算论文工作量
```
GET /api/papers/{paper_id}/workload
```

**参数：**
- paper_id: 论文ID（路径参数）

**返回值：**
```json
{
    "paper_id": 0,
    "workloads": [
        {
            "author_id": 0,
            "contribution_ratio": 0.0,
            "workload": 0.0
        }
    ]
}
```

**错误码：**
- 404: 论文不存在

#### 计算作者工作量（通过ID）
```
GET /api/papers/authors/{author_id}/workload
```

**参数：**
- author_id: 作者ID（路径参数）

**返回值：**
```json
{
    "author_id": 0,
    "author_name": "string",
    "total_workload": 0.0,
    "paper_workloads": [
        {
            "paper_id": 0,
            "paper_title": "string",
            "contribution_ratio": 0.0,
            "is_corresponding": false,
            "author_order": 0,
            "workload": 0.0,
            "publication_date": "datetime",
            "journal": "string"
        }
    ]
}
```

**错误码：**
- 404: 作者不存在

#### 计算作者工作量（通过名字）
```
GET /api/papers/authors/workload/by-name
```

**查询参数：**
- author_name: 作者名字

**返回值：**
与通过ID计算工作量的返回值相同

**错误码：**
- 404: 作者不存在

#### 下载论文（通过ID）
```
GET /api/papers/{paper_id}/download
```

**参数：**
- paper_id: 论文ID（路径参数）

**返回值：**
- 文件流（application/pdf）

**错误码：**
- 404: 论文不存在
- 404: PDF文件不存在

#### 下载论文（通过标题）
```
GET /api/papers/download/by-title
```

**查询参数：**
- title: 论文标题

**返回值：**
- 文件流（application/pdf）

**错误码：**
- 404: 论文不存在
- 404: PDF文件不存在

#### 获取作者合作网络
```
GET /api/papers/authors/collaboration-network
```

**查询参数：**
- author_name: 作者名字

**返回值：**
```json
{
    "author": {
        "id": 0,
        "name": "string"
    },
    "total_collaborators": 0,
    "collaborators": [
        {
            "author_id": 0,
            "name": "string",
            "collaboration_count": 0,
            "papers": [
                {
                    "paper_id": 0,
                    "author_order": 0,
                    "is_corresponding": false
                }
            ]
        }
    ]
}
```

**错误码：**
- 404: 作者不存在


### 用户相关API

#### 用户登录
```
POST /api/users/token
```

**请求体（form-data）：**
```
username: string    // 必填，用户名
password: string    // 必填，密码
```

**返回值：**
```json
{
    "access_token": "string",
    "token_type": "bearer"
}
```

**错误码：**
- 401: 用户名或密码错误
- 403: 账号未激活

#### 创建用户
```
POST /api/users/
```

**请求体（UserCreate）：**
```json
{
    "username": "string",    // 必填，用户名（唯一）
    "email": "string",       // 必填，电子邮件（唯一）
    "password": "string",    // 必填，密码
    "full_name": "string"    // 必填，全名
}
```

**返回值（UserRead）：**
```json
{
    "id": 0,
    "username": "string",
    "email": "string",
    "full_name": "string",
    "is_active": true,
    "is_superuser": false,
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

**错误码：**
- 409: 用户名已注册
- 409: 电子邮件已注册

#### 获取当前用户信息
```
GET /api/users/me
```

**请求头：**
- Authorization: Bearer {token}

**返回值：**
同UserRead

**错误码：**
- 401: 未认证或token无效
- 403: 账号未激活

#### 获取用户列表
```
GET /api/users/
```

**查询参数：**
- skip: 跳过记录数（默认0）
- limit: 返回记录数（默认100）

**返回值：**
```json
[
    {
        "id": 0,
        "username": "string",
        "email": "string",
        "full_name": "string",
        "is_active": true,
        "is_superuser": false,
        "created_at": "datetime",
        "updated_at": "datetime"
    }
]
```

#### 获取单个用户信息
```
GET /api/users/{user_id}
```

**参数：**
- user_id: 用户ID（路径参数）

**返回值：**
同UserRead

**错误码：**
- 404: 用户不存在

#### 更新用户信息
```
PATCH /api/users/{user_id}
```

**参数：**
- user_id: 用户ID（路径参数）

**请求体（UserUpdate）：**
```json
{
    "email": "string",       // 可选
    "password": "string",    // 可选
    "full_name": "string",   // 可选
    "is_active": true,      // 可选
    "is_superuser": false   // 可选
}
```

**返回值：**
同UserRead

**错误码：**
- 403: 无权限（非管理员）
- 404: 用户不存在


### 分类相关API

#### 创建分类
```
POST /api/categories/
```

**请求体（CategoryCreate）：**
```json
{
    "name": "string",        // 必填，分类名称
    "description": "string", // 可选，分类描述
    "parent_id": 0          // 必填，父分类，如果没有，填null
}
```

**返回值（CategoryRead）：**
```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "parent_id": 0,
}
```

**错误码：**
- 404: 父分类不存在

#### 获取分类列表
```
GET /api/categories/
```

**查询参数：**
- skip: 跳过记录数（默认0）
- limit: 返回记录数（默认100）

**返回值：**
```json
[
    {
        "id": 0,
        "name": "string",
        "description": "string",
        "parent_id": 0,
    }
]
```

#### 获取单个分类
```
GET /api/categories/{category_id}
```

### 团队相关API

#### 创建团队
```
POST /api/teams/
```

**请求体（TeamCreate）：**
```json
{
    "name": "string",        // 必填，团队名称
    "description": "string"  // 可选，团队描述
}
```

**返回值（TeamRead）：**
```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "creator_id": 0,
    "created_at": "datetime",
    "updated_at": "datetime",
    "member_count": 0,
    "max_members": 0,
    "is_active": true,
    "last_active_at": "datetime"
}
```

#### 添加团队成员
```
POST /api/teams/{team_id}/members/{username}
```

**参数：**
- team_id: 团队ID（路径参数）
- username: 用户名（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非管理员）
- 404: 用户不存在
- 400: 用户已是团队成员

#### 获取团队成员列表
```
GET /api/teams/{team_id}/members
```

**参数：**
- team_id: 团队ID（路径参数）

**返回值（List[TeamMemberRead]）：**
```json
[
    {
        "id": 0,
        "username": "string",
        "email": "string",
        "full_name": "string",
        "is_active": true,
        "is_superuser": false,
        "created_at": "datetime",
        "updated_at": "datetime",
        "role": "string",
        "joined_at": "datetime",
        "is_admin": true
    }
]
```

**错误码：**
- 403: 无权限（非团队成员）

#### 移除团队成员
```
DELETE /api/teams/{team_id}/members/{user_id}
```

**参数：**
- team_id: 团队ID（路径参数）
- user_id: 用户ID（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非管理员）
- 404: 用户不是团队成员
- 400: 不能移除自己或团队拥有者

#### 获取团队信息
```
GET /api/teams/{team_id}
```

**参数：**
- team_id: 团队ID（路径参数）

**返回值：**
同TeamRead

**错误码：**
- 403: 无权限（非团队成员）
- 404: 团队不存在

#### 更新团队信息
```
PATCH /api/teams/{team_id}
```

**参数：**
- team_id: 团队ID（路径参数）

**请求体（TeamUpdate）：**
```json
{
    "name": "string",        // 可选
    "description": "string", // 可选
    "max_members": 0,        // 可选
    "is_active": true       // 可选
}
```

**返回值：**
同TeamRead

**错误码：**
- 403: 无权限（非管理员）
- 404: 团队不存在

#### 删除团队
```
DELETE /api/teams/{team_id}
```

**参数：**
- team_id: 团队ID（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非团队拥有者）
- 404: 团队不存在

#### 获取团队列表
```
GET /api/teams/
```

**返回值：**
```json
[
    {
        "id": 0,
        "name": "string",
        "description": "string",
        "creator_id": 0,
        "created_at": "datetime",
        "updated_at": "datetime",
        "member_count": 0,
        "max_members": 0,
        "is_active": true,
        "last_active_at": "datetime"
    }
]
```

#### 更新成员角色
```
PATCH /api/teams/{team_id}/members/{user_id}/role
```

**参数：**
- team_id: 团队ID（路径参数）
- user_id: 用户ID（路径参数）
- role: 新角色（查询参数，MEMBER/ADMIN）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非管理员）
- 404: 用户不是团队成员
- 400: 不能更改团队拥有者的角色

### 参考文献相关API

#### 创建参考文献
```
POST /api/references/
```

**请求体（ReferenceCreate）：**
```json
{
    "title": "string",           // 必填，标题
    "authors": "string",         // 必填，作者字符串
    "doi": "string",            // 可选，DOI
    "team_id": 0,               // 必填，团队ID
    "category_id": 0,           // 可选，分类ID
    "keyword_names": ["string"]  // 可选，关键词列表
}
```

**返回值（ReferenceRead）：**
```json
{
    "id": 0,
    "title": "string",
    "authors": "string",
    "doi": "string",
    "file_path": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "team_id": 0,
    "created_by_id": 0,
    "category_id": 0,
    "keywords": ["string"]
}
```

**错误码：**
- 403: 无权限（非团队成员）
- 404: 团队或分类不存在
- 400: DOI已存在

#### 获取参考文献列表
```
GET /api/references/
```

**查询参数：**
- team_id: 团队ID（必填）
- category_id: 分类ID（可选）
- keyword: 关键词（可选）
- skip: 跳过记录数（默认0）
- limit: 返回记录数（默认100）

**返回值：**
```json
[
    {
        "id": 0,
        "title": "string",
        "authors": "string",
        "doi": "string",
        "file_path": "string",
        "created_at": "datetime",
        "updated_at": "datetime",
        "team_id": 0,
        "created_by_id": 0,
        "category_id": 0,
        "keywords": ["string"]
    }
]
```

**错误码：**
- 403: 无权限（非团队成员）

#### 获取单个参考文献
```
GET /api/references/{reference_id}
```

**参数：**
- reference_id: 参考文献ID（路径参数）

**返回值：**
同ReferenceRead

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献不存在

#### 更新参考文献
```
PATCH /api/references/{reference_id}
```

**参数：**
- reference_id: 参考文献ID（路径参数）

**请求体（ReferenceUpdate）：**
```json
{
    "title": "string",           // 可选
    "authors": "string",         // 可选
    "doi": "string",            // 可选
    "category_id": 0,           // 可选
    "keyword_names": ["string"]  // 可选
}
```

**返回值：**
同ReferenceRead

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献或分类不存在

#### 删除参考文献
```
DELETE /api/references/{reference_id}
```

**参数：**
- reference_id: 参考文献ID（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献不存在

#### 上传参考文献文件
```
POST /api/references/{reference_id}/upload
```

**参数：**
- reference_id: 参考文献ID（路径参数）
- file: 文件（multipart/form-data）

**返回值：**
```json
{
    "filename": "string",
    "file_path": "string"
}
```

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献不存在
- 400: 不支持的文件类型

#### 下载参考文献（通过ID）
```
GET /api/references/{reference_id}/download
```

**参数：**
- reference_id: 参考文献ID（路径参数）

**返回值：**
- 文件流（application/pdf）

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献或文件不存在

#### 下载参考文献（通过标题）
```
GET /api/references/download/by-title
```

**查询参数：**
- title: 参考文献标题
- team_id: 团队ID

**返回值：**
- 文件流（application/pdf）

**错误码：**
- 403: 无权限（非团队成员）
- 404: 参考文献或文件不存在