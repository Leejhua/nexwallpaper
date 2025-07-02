#!/bin/bash

echo "🔍 检查Hualang React画廊服务状态"
echo "================================================"

# 检查React前端服务 (端口3000)
if ss -tlnp | grep -q :3000; then
    echo "✅ React前端服务: 运行中 (http://localhost:3000)"
else
    echo "❌ React前端服务: 未运行"
fi

# 检查统计API服务 (端口3002)
if ss -tlnp | grep -q :3002; then
    echo "✅ 统计API服务: 运行中 (http://localhost:3002)"
else
    echo "❌ 统计API服务: 未运行"
fi

echo ""
echo "🌐 访问地址:"
echo "  • React画廊: http://localhost:3000"
echo "  • API健康检查: http://localhost:3002/api/health"
echo ""

# 检查进程
echo "📊 运行中的进程:"
ps aux | grep -E "(vite|node.*server\.js)" | grep -v grep | while read line; do
    echo "  • $line"
done

echo ""
echo "🎯 功能特色:"
echo "  • 400+高清壁纸资源"
echo "  • 智能搜索和筛选"
echo "  • 流畅动画效果"
echo "  • 点击统计功能"
echo "  • 响应式设计"
echo "  • 键盘快捷键支持"
