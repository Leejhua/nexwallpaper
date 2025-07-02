#!/bin/bash

echo "🛑 停止Hualang React画廊服务"
echo "================================================"

# 停止React前端服务
if [ -f "/home/ljh/.react_gallery_pid" ]; then
    PID=$(cat /home/ljh/.react_gallery_pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ React前端服务已停止 (PID: $PID)"
        rm -f /home/ljh/.react_gallery_pid
    else
        echo "ℹ️  React前端服务未运行"
        rm -f /home/ljh/.react_gallery_pid
    fi
else
    echo "ℹ️  未找到React前端服务PID文件"
fi

# 停止统计API服务
API_PID=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$API_PID" ]; then
    kill $API_PID
    echo "✅ 统计API服务已停止 (PID: $API_PID)"
else
    echo "ℹ️  统计API服务未运行"
fi

# 停止所有相关的vite进程
VITE_PIDS=$(ps aux | grep vite | grep -v grep | awk '{print $2}')
if [ ! -z "$VITE_PIDS" ]; then
    echo $VITE_PIDS | xargs kill
    echo "✅ Vite进程已停止"
fi

echo ""
echo "🔍 检查剩余进程:"
REMAINING=$(ps aux | grep -E "(vite|node.*server\.js)" | grep -v grep)
if [ -z "$REMAINING" ]; then
    echo "✅ 所有服务已成功停止"
else
    echo "⚠️  仍有进程运行:"
    echo "$REMAINING"
fi
