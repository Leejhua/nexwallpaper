#!/bin/bash

echo "🔧 快速测试修复效果..."

cd /home/ljh/labubu-gallery-react

# 停止现有服务
pkill -f "vite.*3000" 2>/dev/null || true
sleep 1

# 检查语法错误
echo "📝 检查语法..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 构建成功，语法无误"
else
    echo "❌ 构建失败，仍有语法错误"
    npm run build 2>&1 | tail -10
    exit 1
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
timeout 10s npm run dev &
sleep 3

# 测试页面
echo "🧪 测试页面..."
if curl -s http://localhost:3000 | grep -q "root"; then
    echo "✅ 页面正常响应"
    echo "🎉 修复成功！"
    echo "🌐 访问: http://localhost:3000"
else
    echo "❌ 页面仍有问题"
fi

# 清理
pkill -f "vite.*3000" 2>/dev/null || true
