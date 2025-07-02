#!/bin/bash

# 🚀 Hualang React画廊快速启动脚本

echo "🎨 启动Hualang React画廊..."

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "📱 访问地址: http://localhost:3000"
echo "⌨️  按 Ctrl+C 停止服务"

npm run dev
