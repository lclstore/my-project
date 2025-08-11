# 全栈项目 - React + Node.js + MySQL

这是一个完整的全栈Web应用项目，包含React前端、Node.js后端和MySQL数据库，实现了用户登录功能。

## 项目结构

```
my-project/
├── frontend/                    # React + Ant Design 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.js    # 登录组件
│   │   │   └── LoginForm.css   # 登录样式
│   │   ├── App.js              # 主应用组件
│   │   └── index.js            # 入口文件
│   └── package.json
├── backend/                     # Node.js + Express + MySQL 后端
│   ├── config/
│   │   └── database.js         # 数据库配置
│   ├── routes/
│   │   └── auth.js             # 认证路由
│   ├── .env                    # 环境变量配置
│   ├── server.js               # 服务器入口
│   └── package.json
├── start.sh                    # 启动脚本
└── README.md
```

## 功能特性

- 🎨 **前端**：React + Ant Design UI组件库
- 🚀 **后端**：Node.js + Express框架
- 🗄️ **数据库**：MySQL数据库
- 🔐 **用户认证**：JWT Token认证
- 📱 **响应式设计**：支持移动端和桌面端
- 🛡️ **安全性**：密码加密、CORS配置

## 技术栈

### 前端
- React 18
- Ant Design 5.x
- CSS3 (响应式设计)
- Fetch API

### 后端
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs (密码加密)
- CORS
- dotenv

## 快速开始

### 1. 环境要求
- Node.js (版本 >= 14)
- MySQL (版本 >= 5.7)
- npm 或 yarn

### 2. 一键启动（推荐）
```bash
./start.sh
```

### 3. 手动启动

#### 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

#### 配置数据库
1. 确保MySQL服务已启动
2. 修改 `backend/.env` 文件中的数据库配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fullstack_app
```

#### 启动服务

**启动后端服务：**
```bash
cd backend
npm start
```

**启动前端服务：**
```bash
cd frontend
npm start
```

## 访问地址

- 🌐 **前端应用**：http://localhost:3000
- 🔌 **后端API**：http://localhost:5000
- 📊 **API文档**：http://localhost:5000/

## 默认账户

系统会自动创建一个默认管理员账户：
- **用户名**：admin
- **密码**：123456

## API接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息（需要认证）

### 请求示例

**登录请求：**
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "123456"
}
```

**登录响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

## 开发说明

### 数据库表结构

**users 表：**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 环境变量配置

在 `backend/.env` 文件中配置以下变量：
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fullstack_app

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS配置
FRONTEND_URL=http://localhost:3000
```

## 部署说明

### 生产环境部署
1. 设置环境变量 `NODE_ENV=production`
2. 构建前端项目：`cd frontend && npm run build`
3. 配置生产环境数据库
4. 使用 PM2 或其他进程管理器启动后端服务

### Docker部署（可选）
项目支持Docker容器化部署，可以创建相应的Dockerfile和docker-compose.yml文件。

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息
   - 确保数据库用户有足够权限

2. **前端无法连接后端**
   - 检查后端服务是否正常启动
   - 验证CORS配置
   - 检查防火墙设置

3. **登录失败**
   - 检查用户名和密码是否正确
   - 查看后端日志获取详细错误信息

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请创建 Issue 或联系开发者。
