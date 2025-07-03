#!/bin/bash

echo "🛑 停止Labubu壁纸画廊服务器"
echo "=========================="
echo ""

# 查找并停止所有相关进程
echo "🔍 查找运行中的服务器进程..."

# 停止端口3000上的进程
if ss -tlnp | grep -q :3000; then
    echo "📍 发现端口3000上的服务器进程"
    
    # 获取进程ID
    PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
    
    if [ ! -z "$PID" ]; then
        echo "🔪 停止进程 PID: $PID"
        kill $PID
        sleep 2
        
        # 强制停止如果还在运行
        if kill -0 $PID 2>/dev/null; then
            echo "💀 强制停止进程 PID: $PID"
            kill -9 $PID
        fi
    fi
fi

# 停止npm和node相关进程
echo "🔍 停止npm和node相关进程..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

# 清理PID文件
if [ -f "/home/ljh/.mobile_gallery_pid" ]; then
    rm /home/ljh/.mobile_gallery_pid
fi

if [ -f "/home/ljh/.react_gallery_pid" ]; then
    rm /home/ljh/.react_gallery_pid
fi

# 检查是否成功停止
sleep 1
if ss -tlnp | grep -q :3000; then
    echo "⚠️  警告: 仍有进程在端口3000上运行"
    echo "📋 手动检查: ss -tlnp | grep :3000"
else
    echo "✅ 所有服务器进程已停止"
fi

echo ""
echo "🎉 停止完成！"
