#!/bin/bash

# Labubu壁纸画廊停止脚本
echo "🛑 正在停止Labubu壁纸画廊服务器..."

# 从PID文件读取进程ID
if [ -f /tmp/labubu_gallery_pid ]; then
    PID=$(cat /tmp/labubu_gallery_pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ 服务器已停止 (PID: $PID)"
        rm /tmp/labubu_gallery_pid
    else
        echo "⚠️  PID文件中的进程不存在"
    fi
else
    echo "⚠️  未找到PID文件，尝试查找并停止所有http.server进程..."
    pkill -f "python3 -m http.server"
    echo "✅ 已尝试停止所有相关进程"
fi

echo "🐰 Labubu画廊服务器已关闭"
