#!/bin/bash

# 停止优化版React Labubu画廊
echo "🛑 停止优化版React Labubu画廊..."

# 检查PID文件
if [ -f ".optimized_react_pid" ]; then
    PID=$(cat .optimized_react_pid)
    if ps -p $PID > /dev/null; then
        echo "📱 停止React开发服务器 (PID: $PID)..."
        kill $PID
        sleep 2
        
        # 强制停止如果还在运行
        if ps -p $PID > /dev/null; then
            echo "🔨 强制停止服务..."
            kill -9 $PID
        fi
        
        echo "✅ React画廊已停止"
    else
        echo "⚠️  进程已不存在"
    fi
    
    # 清理PID文件
    rm -f .optimized_react_pid
else
    echo "⚠️  未找到PID文件，尝试通过端口停止..."
fi

# 通过端口停止所有相关进程
echo "🔍 清理端口3000上的进程..."
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# 等待进程完全停止
sleep 1

# 检查端口是否已释放
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ 端口3000已释放"
    echo "🎉 优化版React画廊已完全停止"
else
    echo "⚠️  端口3000可能仍被占用"
    echo "💡 如需强制释放，请运行: sudo lsof -ti:3000 | xargs kill -9"
fi
