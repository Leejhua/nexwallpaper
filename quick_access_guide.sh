#!/bin/bash

clear
echo "🚀 Labubu壁纸画廊 - 快速访问指南"
echo "================================"
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "📱 手机访问Labubu壁纸画廊的所有方式"
echo "================================="
echo ""

echo "🎯 方式1: 域名访问 (推荐，更友好)"
echo "-----------------------------"
echo "📋 配置步骤:"
echo "  1. 手机WiFi设置 → 点击当前WiFi"
echo "  2. 高级设置 → IP设置改为'静态'"
echo "  3. DNS 1 设置为: $LOCAL_IP"
echo "  4. 保存并重新连接WiFi"
echo ""
echo "🌐 访问地址:"
echo "  • http://labubu.local:3000 (主推荐)"
echo "  • http://labubu-gallery.local:3000"
echo "  • http://wallpaper.local:3000"
echo ""

echo "🎯 方式2: IP直接访问 (简单，立即可用)"
echo "--------------------------------"
echo "🌐 访问地址: http://$LOCAL_IP:3000"
echo "📋 优势: 无需任何配置，直接访问"
echo "📋 劣势: IP地址不够友好，难记忆"
echo ""

echo "🎯 方式3: 路由器DNS配置 (一劳永逸)"
echo "-------------------------------"
echo "📋 配置步骤:"
echo "  1. 电脑浏览器访问: http://172.27.0.1"
echo "  2. 登录路由器管理界面"
echo "  3. 找到DNS设置或静态DNS条目"
echo "  4. 添加: labubu.local → $LOCAL_IP"
echo "  5. 保存设置"
echo ""
echo "🌐 访问地址: http://labubu.local:3000"
echo "📋 优势: 所有设备自动生效，无需单独配置"
echo ""

echo "📱 扫描二维码快速访问"
echo "==================="
echo ""
echo "IP访问二维码:"
qrencode -t ANSI "http://$LOCAL_IP:3000"
echo ""

echo "🔧 当前服务器状态"
echo "================"
if ss -tlnp | grep -q :3000; then
    echo "✅ Labubu画廊服务器: 运行中"
    echo "✅ 端口3000: 正常监听"
else
    echo "❌ 服务器未运行，请先启动:"
    echo "   ./start_mobile_gallery.sh"
fi

if ss -tlnp | grep -q :8080; then
    echo "✅ 测试服务器: 运行中"
else
    echo "⚠️  测试服务器未运行"
fi
echo ""

echo "🧪 快速测试"
echo "=========="
echo "电脑端测试 (应该立即可用):"
if curl -s --connect-timeout 3 http://$LOCAL_IP:3000 > /dev/null; then
    echo "  ✅ http://$LOCAL_IP:3000 - 可访问"
else
    echo "  ❌ http://$LOCAL_IP:3000 - 无法访问"
fi

if curl -s --connect-timeout 3 http://labubu.local:3000 > /dev/null; then
    echo "  ✅ http://labubu.local:3000 - 可访问"
else
    echo "  ❌ http://labubu.local:3000 - 无法访问"
fi
echo ""

echo "📋 手机DNS配置详细指南"
echo "===================="
echo ""
echo "🤖 Android手机:"
echo "  设置 → WiFi → 长按WiFi名称 → 修改网络"
echo "  → 高级选项 → IP设置: 静态 → DNS 1: $LOCAL_IP"
echo ""
echo "🍎 iPhone手机:"
echo "  设置 → WiFi → 点击WiFi旁的ℹ️ → 配置DNS"
echo "  → 手动 → 添加服务器 → 输入: $LOCAL_IP"
echo ""

echo "💡 推荐方案选择"
echo "=============="
echo ""
echo "🥇 最简单: 直接使用IP访问"
echo "   地址: http://$LOCAL_IP:3000"
echo "   优势: 无需配置，立即可用"
echo ""
echo "🥈 最友好: 配置手机DNS"
echo "   地址: http://labubu.local:3000"
echo "   优势: 域名友好，易于记忆"
echo ""
echo "🥉 最省心: 配置路由器DNS"
echo "   地址: http://labubu.local:3000"
echo "   优势: 一次配置，全网生效"
echo ""

echo "🎉 功能特色预览"
echo "=============="
echo "访问成功后，你将享受到:"
echo "  📱 完美的移动端适配"
echo "  🖼️ 流畅的瀑布流浏览"
echo "  🚀 原生app级分享功能"
echo "  🔍 智能搜索和筛选"
echo "  ❤️ 实时点赞统计"
echo "  🌍 多语言支持 (中英西)"
echo ""

echo "📞 需要帮助?"
echo "==========="
echo "查看详细配置指南:"
echo "  ./mobile_dns_setup_guide.sh - 终端版详细指南"
echo "  http://$LOCAL_IP:8080/mobile_dns_visual_guide.html - 图文版指南"
echo ""
echo "其他工具:"
echo "  ./network_diagnosis.sh - 网络问题诊断"
echo "  ./fix_network_access.sh - 自动修复网络问题"
echo ""

echo "🎯 立即开始"
echo "=========="
echo "选择最适合你的方式:"
echo "  1️⃣ 简单直接: 手机浏览器输入 http://$LOCAL_IP:3000"
echo "  2️⃣ 友好域名: 配置DNS后访问 http://labubu.local:3000"
echo "  3️⃣ 扫码访问: 扫描上面的二维码"
echo ""
echo "🎪 祝你使用愉快！"
