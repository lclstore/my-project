# MySQL 安装和配置指南

## 1. 安装MySQL

### macOS (推荐使用Homebrew)
```bash
# 安装Homebrew (如果未安装)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装MySQL
brew install mysql

# 启动MySQL服务
brew services start mysql
```

### Windows
1. 下载MySQL安装包：https://dev.mysql.com/downloads/mysql/
2. 运行安装程序，按照向导完成安装
3. 启动MySQL服务

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 2. 配置MySQL

### 设置root密码（如果需要）
```bash
# macOS/Linux
sudo mysql_secure_installation

# 或者直接连接MySQL设置密码
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
EXIT;
```

### 创建数据库用户（可选）
```sql
-- 连接到MySQL
mysql -u root -p

-- 创建新用户
CREATE USER 'fullstack_user'@'localhost' IDENTIFIED BY 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON fullstack_app.* TO 'fullstack_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

## 3. 配置项目

### 修改 backend/.env 文件
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fullstack_app
```

## 4. 验证连接

### 测试MySQL连接
```bash
# 使用命令行连接
mysql -u root -p

# 显示数据库
SHOW DATABASES;
```

### 启动项目
```bash
# 启动后端服务
cd backend
npm start

# 如果看到以下信息说明连接成功：
# ✅ 数据库连接成功
# ✅ 数据库表初始化成功
# ✅ 默认用户创建成功
```

## 5. 常见问题

### 问题1: 连接被拒绝 (ECONNREFUSED)
**解决方案:**
- 确保MySQL服务正在运行
- 检查端口3306是否被占用
- 验证数据库配置信息

### 问题2: 访问被拒绝 (Access denied)
**解决方案:**
- 检查用户名和密码是否正确
- 确保用户有足够的权限
- 尝试重置root密码

### 问题3: 数据库不存在
**解决方案:**
- 项目会自动创建数据库，无需手动创建
- 确保用户有创建数据库的权限

## 6. MySQL服务管理

### macOS (Homebrew)
```bash
# 启动服务
brew services start mysql

# 停止服务
brew services stop mysql

# 重启服务
brew services restart mysql

# 查看服务状态
brew services list | grep mysql
```

### Linux (systemd)
```bash
# 启动服务
sudo systemctl start mysql

# 停止服务
sudo systemctl stop mysql

# 重启服务
sudo systemctl restart mysql

# 查看服务状态
sudo systemctl status mysql
```

### Windows
```cmd
# 启动服务
net start mysql

# 停止服务
net stop mysql
```

## 7. 默认账户信息

项目启动后会自动创建默认管理员账户：
- **用户名**: admin
- **密码**: 123456

## 8. 数据库表结构

项目会自动创建以下表：

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

## 9. 备用方案

如果暂时无法安装MySQL，可以：
1. 使用在线MySQL服务（如PlanetScale、Railway等）
2. 使用Docker运行MySQL
3. 修改项目使用SQLite数据库

### Docker MySQL (快速方案)
```bash
# 运行MySQL容器
docker run --name mysql-fullstack \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=fullstack_app \
  -p 3306:3306 \
  -d mysql:8.0

# 修改.env文件中的密码为123456
```
