# 后端

数据库 mysql 创建 paper_manager
启动 uvicorn app.main:app --reload --log-level debug

## 1. 项目文件结构

```
app/
├── api/                # API路由和处理函数
│   ├── paper.py       # 论文相关API
│   └── user.py        # 用户相关API
├── core/              # 核心配置
│   ├── config.py      # 应用配置
│   └── database.py    # 数据库配置
├── models/            # 数据模型定义
│   ├── paper.py       # 论文模型
│   ├── user.py        # 用户模型
│   ├── author.py      # 作者模型
│   ├── category.py    # 分类模型
│   ├── keyword.py     # 关键词模型
│   ├── team.py        # 团队模型
│   └── reference.py   # 参考文献模型
├── schemas/           # 请求/响应模式
├── services/          # 业务逻辑服务
│   └── utils.py       # 工具函数
└── main.py           # 应用入口
```

## 2. 数据库设计

### Paper（论文表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| title | String | 论文标题 | 必填，索引 |
| abstract | String | 摘要 | 可空 |
| publication_date | DateTime | 发表日期 | 可空 |
| journal | String | 期刊名称 | 可空 |
| doi | String | DOI号 | 可空，唯一 |
| file_path | String | 文件路径 | 可空 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### Author（作者表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 作者姓名 | 必填，索引 |
| email | String | 邮箱 | 可空，唯一 |
| affiliation | String | 所属机构 | 可空 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

### PaperAuthor（论文-作者关联表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| paper_id | Integer | 论文ID | 主键，外键 |
| author_id | Integer | 作者ID | 主键，外键 |
| contribution_ratio | Float | 贡献比例 | 默认1.0 |
| is_corresponding | Boolean | 是否通讯作者 | 默认False |
| author_order | Integer | 作者顺序 | 必填 |

### Category（分类表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 分类名称 | 必填，索引 |
| description | String | 描述 | 可空 |
| parent_id | Integer | 父分类ID | 可空，外键 |

### Keyword（关键词表）
| 字段 | 类型 | 说明 | 限制条件 |
|------|------|------|----------|
| id | Integer | 主键 | 自增 |
| name | String | 关键词 | 必填，唯一，索引 |
| created_at | DateTime | 创建时间 | 默认当前时间 |
| updated_at | DateTime | 更新时间 | 默认当前时间 |

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
    "parent_id": 0          // 可选，父分类ID
}
```

**返回值（CategoryRead）：**
```json
{
    "id": 0,
    "name": "string",
    "description": "string",
    "parent_id": 0,
    "created_at": "datetime",
    "updated_at": "datetime"
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
        "created_at": "datetime",
        "updated_at": "datetime"
    }
]
```

#### 获取单个分类
```
GET /api/categories/{category_id}
```

**参数：**
- category_id: 分类ID（路径参数）

**返回值：**
同CategoryRead

**错误码：**
- 404: 分类不存在

#### 更新分类
```
PATCH /api/categories/{category_id}
```

**参数：**
- category_id: 分类ID（路径参数）

**请求体（CategoryUpdate）：**
```json
{
    "name": "string",        // 可选
    "description": "string", // 可选
    "parent_id": 0          // 可选
}
```

**返回值：**
同CategoryRead

**错误码：**
- 400: 分类不能作为自己的父分类
- 404: 分类不存在
- 404: 父分类不存在

#### 删除分类
```
DELETE /api/categories/{category_id}
```

**参数：**
- category_id: 分类ID（路径参数）

**返回值：**
```json
{
    "ok": true
}
```

**错误码：**
- 400: 不能删除有子分类的分类
- 404: 分类不存在


### 团队相关API

#### 获取用户所在团队列表
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
        "created_at": "datetime",
        "updated_at": "datetime"
    }
]
```

**错误码：**
- 401: 未认证

### 工作量计算相关

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

### 文件上传相关

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
- 403: 无权限（非作者）

### 安全性说明

1. 认证机制：
   - 使用 OAuth2 密码模式进行认证
   - 返回 JWT token，有效期可配置
   - 所有需要认证的接口都需要在请求头中携带 token

2. 权限控制：
   - 用户分为普通用户和管理员（superuser）
   - 只有管理员可以修改用户信息
   - 分类管理需要管理员权限

3. 数据验证：
   - 用户名和邮箱唯一性检查
   - DOI 唯一性检查
   - 分类的循环引用检查

### 错误处理

所有API都可能返回以下错误：

1. 认证相关：
   - 401 Unauthorized: 未认证或token无效
   - 403 Forbidden: 无权限访问

2. 请求相关：
   - 400 Bad Request: 请求参数错误
   - 404 Not Found: 资源不存在
   - 409 Conflict: 资源冲突（如重复的用户名）

3. 服务器相关：
   - 500 Internal Server Error: 服务器内部错误

每个错误响应都包含详细的错误信息：
```json
{
    "detail": "错误描述信息"
}
```

### 数据模型关系

1. 论文与作者：多对多关系（通过 PaperAuthor 表）
2. 论文与分类：多对多关系（通过 PaperCategory 表）
3. 论文与关键词：多对多关系（通过 PaperKeyword 表）
4. 分类与分类：自引用关系（parent_id）
5. 用户与团队：多对多关系（通过 TeamUser 表）
