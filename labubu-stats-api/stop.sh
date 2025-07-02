#!/bin/bash

echo "🛑 Stopping Labubu Stats API Server..."

# 查找并终止运行在3001端口的进程
PID=$(lsof -ti:3001)

if [ -z "$PID" ]; then
    echo "ℹ️  No server running on port 3001"
else
    echo "🔍 Found server process: $PID"
    kill -TERM $PID
    sleep 2
    
    # 检查进程是否还在运行
    if kill -0 $PID 2>/dev/null; then
        echo "⚠️  Process still running, force killing..."
        kill -KILL $PID
    fi
    
    echo "✅ Server stopped successfully"
fi
