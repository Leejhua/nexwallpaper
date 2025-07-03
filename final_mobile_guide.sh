#!/bin/bash

clear
echo "📱 Labubu壁纸画廊 - 手机访问终极指南"
echo "====================================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "🎯 当前状态检查:"
echo "---------------"
echo "  电脑IP: $LOCAL_IP"

# 检查服务器状态
if ss -tlnp | grep -q :3000; then
    echo "  ✅ Labubu画廊服务器: 运行中 (端口3000)"
else
    echo "  ❌ Labubu画廊服务器: 未运行"
fi

if ss -tlnp | grep -q :8080; then
    echo "  ✅ 测试服务器: 运行中 (端口8080)"
else
    echo "  ❌ 测试服务器: 未运行"
fi

echo ""
echo "📱 手机访问步骤:"
echo "---------------"
echo "第一步: 网络连接测试"
echo "  在手机浏览器输入: http://$LOCAL_IP:8080/network_test.html"
echo ""
echo "第二步: 访问Labubu画廊"
echo "  在手机浏览器输入: http://$LOCAL_IP:3000"
echo ""

echo "📱 扫描二维码快速访问测试页面:"
echo "-----------------------------"
qrencode -t ANSI "http://$LOCAL_IP:8080/network_test.html"
echo ""

echo "🔧 如果无法访问，请检查:"
echo "----------------------"
echo "1. 手机和电脑是否连接同一WiFi网络"
echo "2. 路由器是否开启了设备隔离 (AP隔离)"
echo "3. 企业网络是否有访问限制"
echo ""

echo "🚀 快速修复命令:"
echo "---------------"
echo "  重启服务器: ./fix_network_access.sh"
echo "  查看诊断: ./network_diagnosis.sh"
echo "  停止服务: ./stop_mobile_gallery.sh"
echo ""

echo "💡 替代方案:"
echo "-----------"
echo "如果局域网访问有问题，可以使用内网穿透:"
echo "  1. 安装ngrok: sudo apt install ngrok"
echo "  2. 启动穿透: ngrok http 3000"
echo "  3. 使用ngrok提供的公网地址访问"
echo ""

echo "🎉 成功访问后你将享受到:"
echo "----------------------"
echo "  📱 完美的移动端适配"
echo "  🖼️ 流畅的瀑布流浏览"
echo "  🚀 原生app级分享功能"
echo "  🔍 智能搜索和筛选"
echo "  ❤️ 实时点赞统计"
echo "  🌍 多语言支持"
echo ""

echo "📞 需要帮助?"
echo "-----------"
echo "如果按照步骤仍无法访问，可能的原因:"
echo "  • 网络环境有特殊限制 (企业网络、虚拟机等)"
echo "  • 路由器默认开启设备隔离"
echo "  • 防火墙或安全软件阻拦"
echo ""
echo "建议尝试内网穿透或让电脑也连接WiFi"
