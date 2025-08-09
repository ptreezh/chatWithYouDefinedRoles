#!/bin/bash

echo "🎭 虚拟角色聊天室启动脚本"
echo "================================"

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "❌ 未找到.env文件"
    echo "📝 请先运行设置向导: node setup.js"
    exit 1
fi

# 检查API密钥
source .env
if [ -z "$ZAI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  未设置API密钥"
    echo "📝 请运行设置向导: node setup.js"
    echo "或者手动编辑.env文件添加API密钥"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查数据库
if [ ! -f "db/custom.db" ]; then
    echo "🗄️  初始化数据库..."
    mkdir -p db
    npm run db:push
fi

echo "✅ 环境检查完成"
echo "🚀 启动项目..."
echo "📍 访问地址: http://localhost:3000"
echo "⏹️  停止服务: Ctrl+C"
echo ""

# 启动开发服务器
npm run dev