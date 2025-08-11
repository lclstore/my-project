#!/bin/bash

echo "🚀 启动全栈应用..."

# 检查是否安装了Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

# 检查MySQL服务状态
check_mysql() {
    if command -v mysql &> /dev/null; then
        # 尝试连接MySQL
        if mysql -u root -e "SELECT 1;" &> /dev/null; then
            echo "✅ MySQL服务运行正常"
            return 0
        else
            echo "⚠️  MySQL已安装但无法连接，请检查服务状态和密码配置"
            return 1
        fi
    else
        echo "⚠️  未检测到MySQL，请先安装MySQL"
        return 1
    fi
}

# 检查MySQL状态
mysql_status=0
check_mysql || mysql_status=1

echo "📦 安装依赖..."

# 安装前端依赖
echo "📱 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "前端依赖已存在，跳过安装"
fi
cd ..

# 安装后端依赖
echo "🚀 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "后端依赖已存在，跳过安装"
fi
cd ..

echo "✅ 依赖安装完成"

echo ""
echo "🔧 配置说明:"
echo "1. 修改 backend/.env 文件中的数据库配置"
echo "2. 默认用户: admin, 密码: 123456"

if [ $mysql_status -eq 1 ]; then
    echo ""
    echo "⚠️  MySQL配置提醒:"
    echo "- 请确保MySQL服务已启动"
    echo "- 检查数据库连接配置"
    echo "- 后端服务可以在无数据库模式下启动，但登录功能将不可用"
fi

echo ""
echo "🚀 启动服务:"
echo "后端: cd backend && npm start"
echo "前端: cd frontend && npm start"
echo ""
echo "📱 访问地址:"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:5000"
echo ""
echo "💡 提示: 建议先启动后端服务，再启动前端服务"
