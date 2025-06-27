#!/bin/bash

echo "🚀 启动壁纸分享站..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 进入后端目录
cd backend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 启动后端服务
echo "🔧 启动后端服务..."
npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🌐 启动前端服务..."
cd ../frontend

# 检查 Python 是否可用
if command -v python3 &> /dev/null; then
    echo "使用 Python 启动前端服务..."
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
elif command -v python &> /dev/null; then
    echo "使用 Python 启动前端服务..."
    python -m http.server 8000 &
    FRONTEND_PID=$!
else
    echo "❌ Python 未安装，请手动启动前端服务"
    echo "可以使用: npx serve . 或其他静态服务器"
fi

echo ""
echo "✅ 服务启动完成！"
echo "📱 前端地址: http://localhost:8000"
echo "🔧 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap 'echo "🛑 停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
