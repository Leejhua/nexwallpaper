#!/bin/bash

# 启动优化版React Labubu画廊 - 懒加载首屏40条
echo "🚀 启动优化版React Labubu画廊..."
echo "✨ 特性: 懒加载首屏40条，避免闪屏白屏"

# 检查是否在正确目录
if [ ! -d "labubu-gallery-react" ]; then
    echo "❌ 错误: 未找到 labubu-gallery-react 目录"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 进入React项目目录
cd labubu-gallery-react

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3000已被占用，尝试停止现有服务..."
    pkill -f "vite.*3000" 2>/dev/null || true
    sleep 2
fi

# 启动开发服务器
echo "🎨 启动React开发服务器..."
echo "📱 访问地址: http://localhost:3000"
echo "🎯 优化特性:"
echo "   • 首屏加载40张高清壁纸"
echo "   • 后续每次加载20张"
echo "   • 骨架屏避免白屏"
echo "   • 平滑过渡动画"
echo "   • 智能懒加载"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================="

# 启动并保存PID
npm run dev &
DEV_PID=$!
echo $DEV_PID > ../.optimized_react_pid

# 等待服务启动
sleep 3

# 检查服务是否成功启动
if ps -p $DEV_PID > /dev/null; then
    echo "✅ React画廊启动成功!"
    echo "🌐 访问: http://localhost:3000"
    echo "📊 PID: $DEV_PID"
    
    # 尝试自动打开浏览器
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3000 2>/dev/null &
    elif command -v open > /dev/null; then
        open http://localhost:3000 2>/dev/null &
    fi
    
    # 等待用户中断
    wait $DEV_PID
else
    echo "❌ React画廊启动失败"
    exit 1
fi
