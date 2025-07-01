#!/bin/bash

echo "🔧 测试白屏修复效果..."

cd /home/ljh/labubu-gallery-react

# 停止现有服务
pkill -f "vite.*3000" 2>/dev/null || true
sleep 1

# 启动开发服务器
echo "🚀 启动React开发服务器..."
npm run dev &
DEV_PID=$!

# 等待服务启动
sleep 3

# 测试页面是否正常
echo "🧪 测试页面响应..."
if curl -s http://localhost:3000 | grep -q "root"; then
    echo "✅ 页面正常响应"
    echo "🌐 访问: http://localhost:3000"
    echo "📊 PID: $DEV_PID"
    echo "按 Ctrl+C 停止服务"
    wait $DEV_PID
else
    echo "❌ 页面响应异常"
    kill $DEV_PID 2>/dev/null
    exit 1
fi
