# 全栈应用后端API

一个基于 Node.js + Express + MySQL 的企业级后台管理系统API，提供完整的用户认证、文件管理、数据操作等功能。

## 🚀 项目特性

- **🔐 JWT认证系统** - 完整的用户登录/登出，支持Token黑名单
- **📁 文件管理** - 支持文件上传、下载、预览等操作
- **🗄️ 通用CRUD** - 提供通用的数据库操作接口
- **📊 API文档** - 集成Swagger UI自动生成API文档
- **🛡️ 安全防护** - CORS配置、参数验证、错误处理
- **📦 模块化设计** - 清晰的项目结构，易于维护和扩展

## 📋 技术栈

- **后端框架**: Express.js 4.21.2
- **数据库**: MySQL 8.0+
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer
- **API文档**: Swagger UI
- **密码加密**: bcryptjs
- **环境配置**: dotenv

## 🏗️ 项目结构

```
backend/
├── config/              # 配置文件
│   ├── database.js      # 数据库配置和操作封装
│   └── swagger.js       # Swagger API文档配置
├── middleware/          # 中间件
│   └── auth.js          # JWT认证中间件
├── routes/              # 路由定义
│   ├── user.js          # 用户相关接口
│   ├── files.js         # 文件管理接口
│   ├── data.js          # 通用数据操作接口
│   └── enums.js         # 枚举数据接口
├── utils/               # 工具类
│   ├── response.js      # 统一响应格式
│   └── tokenBlacklist.js # Token黑名单管理
├── uploads/             # 文件上传目录
├── server.js            # 应用入口文件
├── package.json         # 项目依赖
└── README.md           # 项目文档
```

## ⚙️ 环境配置

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```env
# 服务器配置
PORT=8080
NODE_ENV=development
API_PREFIX=/api
FRONTEND_URL=http://localhost:3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### 2. 数据库准备

确保MySQL服务已启动，项目会自动创建数据库（如果不存在）。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
# 开发模式（需要安装nodemon）
npm run dev

# 或者生产模式
npm start
```

### 3. 访问应用

- **API服务**: http://localhost:8080
- **API文档**: http://localhost:8080/api/swagger-ui

## 📚 API接口文档

### 认证接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/user/login` | 用户登录 | ❌ |
| POST | `/api/user/logout` | 用户登出 | ✅ |

### 文件管理接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/files/upload` | 文件上传 | ✅ |
| GET | `/api/files/:id` | 获取文件信息 | ❌ |
| GET | `/api/files/download/:id` | 下载文件 | ❌ |

### 通用数据接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/data/:table` | 查询数据列表 | ❌ |
| GET | `/api/data/:table/:id` | 查询单条数据 | ❌ |
| POST | `/api/data/:table` | 创建数据 | ❌ |
| PUT | `/api/data/:table/:id` | 更新数据 | ❌ |
| DELETE | `/api/data/:table/:id` | 删除数据 | ❌ |

### 枚举数据接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/enums` | 获取所有枚举 | ❌ |
| GET | `/api/enums/:enumName` | 获取指定枚举 | ❌ |

## 🔧 开发指南

### 统一响应格式

所有API接口都遵循统一的响应格式：

```json
{
  "success": true,
  "errCode": null,
  "errMessage": null,
  "data": {},
  "message": "操作成功"
}
```

### 错误处理

项目提供了完整的错误码定义和处理机制：

```javascript
const { ERROR_CODES, sendError } = require('./utils/response');

// 使用示例
sendError(res, ERROR_CODES.USER_NOT_FOUND, '用户不存在', 404);
```

### JWT认证

使用Bearer Token进行认证：

```javascript
// 请求头
Authorization: Bearer <your_jwt_token>
```

## 🛠️ 项目优化建议

### 1. 架构优化

当前项目建议进行以下结构优化：

```
backend/
├── controllers/         # 控制器层 (新增)
├── services/           # 业务逻辑层 (新增)
├── models/             # 数据模型层 (新增)
├── validators/         # 输入验证层 (新增)
├── middleware/         # 中间件
├── routes/             # 路由定义
├── config/             # 配置文件
├── utils/              # 工具类
└── tests/              # 测试文件 (新增)
```

### 2. 功能增强

- **API版本控制**: 添加 `/api/v1/` 路径前缀
- **权限控制**: 实现基于角色的权限管理(RBAC)
- **输入验证**: 使用 joi 或 express-validator
- **日志系统**: 集成 winston 日志框架
- **缓存机制**: 添加 Redis 缓存支持
- **单元测试**: 使用 Jest 进行测试覆盖

### 3. 安全增强

- **参数验证**: 严格的输入参数验证
- **SQL注入防护**: 使用参数化查询
- **XSS防护**: 输入输出过滤
- **限流机制**: API访问频率限制

## 🧪 测试

```bash
# 运行测试（需要配置测试环境）
npm test
```

## 📦 部署

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "backend-api"
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
