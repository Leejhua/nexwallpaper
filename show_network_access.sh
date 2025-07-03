#!/bin/bash

echo "🌐 Labubu壁纸画廊 - 局域网访问指南"
echo "=================================="
echo ""

# 获取本机IP地址
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📍 服务器IP地址: $LOCAL_IP"
echo ""

# 检查服务状态
if ss -tlnp | grep -q :3000; then
    echo "✅ React开发服务器状态: 运行中"
    echo "🚀 服务端口: 3000"
    echo ""
    
    echo "📱 手机访问地址:"
    echo "   http://$LOCAL_IP:3000"
    echo ""
    
    echo "💻 电脑访问地址:"
    echo "   本地: http://localhost:3000"
    echo "   局域网: http://$LOCAL_IP:3000"
    echo ""
    
    echo "📋 手机访问步骤:"
    echo "   1. 确保手机和电脑在同一WiFi网络"
    echo "   2. 在手机浏览器中输入: http://$LOCAL_IP:3000"
    echo "   3. 享受Labubu壁纸画廊！"
    echo ""
    
    echo "🔧 如果无法访问，请检查:"
    echo "   • 手机和电脑是否在同一局域网"
    echo "   • 路由器是否开启了设备间通信"
    echo "   • 电脑防火墙设置"
    echo ""
    
    # 生成二维码（如果有qrencode）
    if command -v qrencode &> /dev/null; then
        echo "📱 扫描二维码快速访问:"
        qrencode -t ANSI "http://$LOCAL_IP:3000"
        echo ""
    fi
    
else
    echo "❌ React开发服务器状态: 未运行"
    echo ""
    echo "🔧 启动服务器:"
    echo "   cd /home/ljh/labubu-gallery-react"
    echo "   npm run dev"
    echo ""
fi

# 显示网络接口信息
echo "🌐 网络接口信息:"
ip addr show | grep -E "inet.*scope global" | awk '{print "   " $2}' | head -3

echo ""
echo "🎉 祝你使用愉快！"
