# 🛠️ 管理员工具使用指南

## 📖 概述

本文档专门介绍论文管理系统中的管理员工具的功能和使用方法，包括命令行工具和编程接口的详细使用说明。

## 🚀 快速开始

### 工具位置
```
app/utils/create_admin.py
```

### 基本命令结构
```powershell
python app/utils/create_admin.py <command> [options]
```

## 📋 可用命令

### 1. 创建/重置管理员 (`create`)

#### 基本用法
```powershell
# 使用默认配置创建管理员
python app/utils/create_admin.py create

# 完全自定义创建管理员
python app/utils/create_admin.py create `
    --username myadmin `
    --email admin@mycompany.com `
    --full-name "My Admin" `
    --password MySecurePassword123

# 强制重置现有管理员
python app/utils/create_admin.py create `
    --username admin `
    --force-reset
```

#### 命令选项详解

| 选项            | 说明             | 默认值                   | 示例                        |
| --------------- | ---------------- | ------------------------ | --------------------------- |
| `--username`    | 管理员用户名     | `admin`                  | `--username myadmin`        |
| `--email`       | 管理员邮箱       | `admin@paperManager.com` | `--email admin@company.com` |
| `--full-name`   | 管理员全名       | `System Administrator`   | `--full-name "John Doe"`    |
| `--password`    | 管理员密码       | 自动生成                 | `--password SecurePass123`  |
| `--force-reset` | 强制重置现有用户 | `false`                  | `--force-reset`             |

#### 使用环境变量
```powershell
# 设置环境变量
$env:ADMIN_USERNAME="myadmin"
$env:ADMIN_EMAIL="admin@mycompany.com"
$env:ADMIN_PASSWORD="SecurePassword123!"

# 使用环境变量创建
python app/utils/create_admin.py create
```

### 2. 列出管理员 (`list`)

#### 基本用法
```powershell
python app/utils/create_admin.py list
```

#### 输出示例
```
Initializing database for listing admins...

Admin User List:
================================================================================
ID    | Username             | Email                          | Full Name            | Status
--------------------------------------------------------------------------------
1     | admin               | admin@paperManager.com         | System Administrator | Active
2     | myadmin             | admin@mycompany.com            | My Admin             | Active
================================================================================
```

## 🔧 环境变量配置

### 支持的环境变量

```powershell
# 管理员账户配置
$env:ADMIN_USERNAME="admin"                    # 默认用户名
$env:ADMIN_EMAIL="admin@paperManager.com"      # 默认邮箱
$env:ADMIN_PASSWORD="your-secure-password"     # 自定义密码（推荐）
$env:ADMIN_FORCE_RESET="false"                 # 是否强制重置现有管理员

# 安全配置
$env:SECRET_KEY="your-secret-key"              # JWT密钥
$env:TOKEN_EXPIRE_MINUTES="60"                 # Token过期时间
```

### 生产环境配置示例
```powershell
# 生产环境推荐配置
$env:SECRET_KEY="your-very-secure-secret-key-here-min-32-chars"
$env:ADMIN_PASSWORD="StrongPasswordWith123!@#"
$env:TOKEN_EXPIRE_MINUTES="30"
$env:ADMIN_FORCE_RESET="false"
```

## 💻 编程接口

### 同步接口

```python
from app.utils.create_admin import create_admin_user_sync

# 创建管理员
result = create_admin_user_sync(
    username="admin",
    email="admin@example.com",
    full_name="System Administrator",
    password="secure_password",  # 可选，不提供会自动生成
    force_reset=False           # 是否强制重置
)

if result["success"]:
    print(f"管理员创建成功: {result['message']}")
    if result.get("generated_password"):
        print(f"生成的密码: {result['generated_password']}")
else:
    print(f"创建失败: {result['message']}")
```

### 异步接口

```python
from app.utils.create_admin import create_admin_user

# 交互式创建
await create_admin_user(interactive=True)

# 非交互式创建
await create_admin_user(interactive=False)
```

## 📝 使用场景示例

### 1. 初次部署创建管理员
```powershell
# 进入项目目录
cd paper-manager-backend

# 创建默认管理员
python app/utils/create_admin.py create
```

### 2. 重置忘记密码的管理员
```powershell
python app/utils/create_admin.py create `
    --username admin `
    --password "NewSecurePassword123!" `
    --force-reset
```

### 3. 创建自定义管理员
```powershell
python app/utils/create_admin.py create `
    --username superadmin `
    --email admin@mycompany.com `
    --full-name "Super Administrator" `
    --password "CustomPassword123!"
```

### 4. 批量管理脚本
```python
# 批量创建管理员脚本示例
import os
from app.utils.create_admin import create_admin_user_sync

admins = [
    {"username": "admin1", "email": "admin1@company.com"},
    {"username": "admin2", "email": "admin2@company.com"},
]

for admin in admins:
    result = create_admin_user_sync(
        username=admin["username"],
        email=admin["email"],
        password="TempPassword123!",
        force_reset=True
    )
    print(f"创建 {admin['username']}: {result['success']}")
```

## ⚡ 系统自动创建

应用启动时会自动检查并创建管理员：

```python
# 启动时自动执行
@app.on_event("startup")
async def startup_event():
    # 检查是否存在管理员
    existing_admin = session.exec(
        select(User).where(User.is_superuser == True)
    ).first()

    if not existing_admin or force_reset:
        # 创建或重置管理员账户
        result = create_admin_user_sync(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            force_reset=force_reset
        )
```

## 🔍 常见使用问题

### Q: 如何查看创建命令帮助？
```powershell
python app/utils/create_admin.py create --help
```

### Q: 如何处理用户名冲突？
```powershell
# 使用 --force-reset 强制重置
python app/utils/create_admin.py create --username admin --force-reset
```

### Q: 如何安全地设置密码？
```powershell
# 方法1：使用环境变量
$env:ADMIN_PASSWORD="SecurePassword123!"
python app/utils/create_admin.py create

# 方法2：让系统生成随机密码
python app/utils/create_admin.py create
```

### Q: 如何验证管理员创建成功？
```powershell
# 列出所有管理员
python app/utils/create_admin.py list
```

## 🛡️ 安全建议

1. **密码策略**
   - 最少8位字符
   - 包含大小写字母、数字和特殊字符
   - 定期更换密码

2. **环境变量安全**
   - 不要在代码中硬编码密码
   - 生产环境使用环境变量
   - 保护 `.env` 文件

3. **定期维护**
   ```powershell
   # 定期检查管理员状态
   python app/utils/create_admin.py list

   # 根据需要重置密码
   python app/utils/create_admin.py create --username admin --force-reset
   ```

## 🔧 故障排除

### 常见错误及解决方案

#### 1. 创建管理员失败
```
Failed to create admin user: UNIQUE constraint failed
```
**解决方案：** 使用 `--force-reset` 参数

#### 2. 数据库连接失败
```
OperationalError: no such table: user
```
**解决方案：** 确认数据库已初始化

#### 3. 权限不足
```
PermissionError: [Errno 13] Permission denied
```
**解决方案：** 检查数据库文件权限

---

**⚠️ 重要提醒：**
- 生产环境请务必设置强密码
- 定期检查和更新管理员账户
- 保护好环境变量配置文件
