#!/bin/bash

# 🐰 Labubu高清壁纸画廊 - 主要版本停止脚本
# 停止React开发服务器

echo "🛑 停止Labubu高清壁纸画廊 - React主要版本..."

# 检查是否有保存的进程ID
if [ -f ".react_gallery_pid" ]; then
    PID=$(cat .react_gallery_pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "📝 找到进程ID: $PID"
        kill $PID
        echo "✅ React服务器已停止"
    else
        echo "⚠️  进程ID $PID 不存在"
    fi
    rm -f .react_gallery_pid
else
    echo "📝 未找到进程ID文件，尝试通用停止..."
fi

# 通用停止方法
pkill -f "vite" 2>/dev/null && echo "✅ 已停止所有Vite进程" || echo "ℹ️  未找到运行中的Vite进程"
pkill -f "node.*vite" 2>/dev/null && echo "✅ 已停止所有Node Vite进程" || echo "ℹ️  未找到运行中的Node Vite进程"

# 检查端口3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口3000仍被占用，强制终止..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ 无法释放端口3000，请手动检查"
    else
        echo "✅ 端口3000已释放"
    fi
else
    echo "✅ 端口3000已释放"
fi

echo ""
echo "🎯 React画廊已完全停止"
echo "🚀 重新启动: ./start_main_gallery.sh"
