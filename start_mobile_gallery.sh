#!/bin/bash

echo "🚀 启动Labubu壁纸画廊 - 移动端访问模式"
echo "======================================="
echo ""

# 进入项目目录
cd /home/ljh/labubu-gallery-react

# 检查是否已经在运行
if ss -tlnp | grep -q :3000; then
    echo "⚠️  服务器已在运行中"
    echo ""
    /home/ljh/show_network_access.sh
    exit 0
fi

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🔧 启动React开发服务器..."
echo "   配置: host=true, port=3000"
echo "   支持: 局域网访问"
echo ""

# 后台启动服务器
nohup npm run dev > ../mobile-gallery.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器是否成功启动
if ss -tlnp | grep -q :3000; then
    echo "✅ 服务器启动成功！"
    echo ""
    
    # 显示访问信息
    /home/ljh/show_network_access.sh
    
    # 保存PID
    echo $SERVER_PID > /home/ljh/.mobile_gallery_pid
    
else
    echo "❌ 服务器启动失败"
    echo "📋 查看日志: tail -f /home/ljh/mobile-gallery.log"
    exit 1
fi
