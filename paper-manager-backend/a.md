## 🧠 一、后端项目结构（FastAPI + SQLModel）

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── user.py            # 用户相关API
│   │   ├── paper.py           # 论文相关API
│   │   ├── category.py        # 分类相关API
│   │   ├── team.py            # 团队相关API
│   │   └── reference.py       # 参考文献相关API
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接管理
│   │   └── dependencies.py    # 依赖注入
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py            # 用户模型
│   │   ├── paper.py           # 论文模型
│   │   ├── category.py        # 分类模型
│   │   ├── team.py            # 团队模型
│   │   └── reference.py       # 参考文献模型
│   ├── schemas/
│   │   ├── paper.py            # 请求/响应模型（可选，细分更清晰）
│   ├── services/
│   │   ├── __init__.py
│   │   └── utils.py          # 工具函数
│   ├── main.py               # 应用入口
│   └── __init__.py
├── instance/
│   └── db.sqlite               # SQLite 数据库文件（不纳入 Git）
├── .env                        # 配置文件（DATABASE_URL 等）
├── .gitignore
└── requirements.txt
```

### 📌 模块说明

| 模块路径           | 功能说明                                       |
| ------------------ | ---------------------------------------------- |
| `api/`             | FastAPI 路由定义，按领域拆分模块，组织清晰     |
| `core/config.py`   | 用 Pydantic 读取 `.env` 文件配置，如数据库路径 |
| `core/database.py` | 创建 `engine`，初始化 SQLModel 表结构          |
| `models/`          | 定义 SQLModel 模型（数据库结构）               |
| `schemas/`         | 请求/响应模型（选配）                          |
| `services/`        | 包含工作量计算、合作作者关系等业务逻辑         |
| `main.py`          | 注册路由、启动服务                             |

------

## 🌐 二、前端项目结构（Vue 3 + Vite）

```
frontend/
├── public/
├── src/
│   ├── assets/                   # 样式、图片资源
│   ├── components/               # 通用组件
│   │   ├── PaperList.vue
│   │   ├── PaperForm.vue
│   │   ├── CategoryTree.vue
│   │   └── UserSelect.vue
│   ├── pages/                    # 页面级组件
│   │   ├── Home.vue
│   │   ├── Papers.vue
│   │   └── Categories.vue
│   ├── router/
│   │   └── index.js              # Vue Router 配置
│   ├── services/
│   │   └── api.js                # 封装 axios 请求
│   ├── App.vue                   # 应用根组件（导航栏、布局）
│   └── main.js                   # 应用入口，挂载 Vue 应用
├── index.html
├── vite.config.js
└── package.json
```

### 📌 模块说明

| 模块路径          | 功能说明                              |
| ----------------- | ------------------------------------- |
| `components/`     | 封装的组件，如表单、下拉列表、分类树  |
| `pages/`          | 逻辑页面，如"论文管理"、"分类管理"    |
| `router/`         | 单页应用路由控制                      |
| `services/api.js` | Axios HTTP 请求封装（与后端接口对接） |
| `App.vue`         | 页面框架：导航栏 + 路由展示区         |
| `main.js`         | 挂载应用，加载样式和插件              |
| `vite.config.js`  | 本地开发配置（如端口、插件）          |

------

## 🔄 后前端交互模块对照示意

| 前端页面         | 对应后端 API 模块            |
| ---------------- | ---------------------------- |
| `Papers.vue`     | `api/paper.py`               |
| `Categories.vue` | `api/category.py`            |
| `UserSelect.vue` | `api/user.py`                |
| 下载/上传功能    | FastAPI 路由 + `UploadFile`  |
| 工作量统计功能   | `services/utils.py`          |
| 合作作者关系图   | `api/user.py` 返回图数据结构 |

------

## ✅ 后续可扩展方向建议

1. **增加前端图形化关系网络展示**
   - 使用 [ECharts](https://echarts.apache.org/)、Cytoscape.js 或 D3.js 可视化合作作者关系。
2. **文件上传支持**
   - 后端保存路径到数据库，前端通过 `<input type="file">` 上传。
3. **工作量分值计算逻辑**
   - 后端封装在 `utils.py` 中统一处理。
4. **权限管理（可选）**
   - 使用 JWT 或 session 进行登录认证。
5. **表格导出**
   - 使用 `xlsx` 前端导出，或后端生成 CSV 返回。

