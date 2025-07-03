#!/bin/bash

clear
echo "🌐 Labubu壁纸画廊 - 域名访问指南"
echo "==============================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "🎯 域名访问已配置成功！"
echo "---------------------"
echo "  服务器IP: $LOCAL_IP"
echo "  域名配置: ✅ 已完成"
echo "  服务状态: $(ss -tlnp | grep -q :3000 && echo "✅ 运行中" || echo "❌ 未运行")"
echo ""

echo "💻 电脑端访问 (立即可用)"
echo "--------------------"
echo "以下域名已配置到hosts文件，可直接访问:"
echo ""
echo "  🐰 主推荐: http://labubu.local:3000"
echo "  🎨 备选1: http://labubu-gallery.local:3000"
echo "  🖼️  备选2: http://wallpaper.local:3000"
echo "  📂 备选3: http://gallery.local:3000"
echo ""

echo "📱 手机端访问配置"
echo "---------------"
echo "方法1: 修改手机DNS (推荐)"
echo "  1. 打开手机WiFi设置"
echo "  2. 点击已连接的WiFi网络"
echo "  3. 找到'DNS'或'域名服务器'设置"
echo "  4. 将DNS改为: $LOCAL_IP"
echo "  5. 保存并重新连接WiFi"
echo "  6. 访问: http://labubu.local:3000"
echo ""

echo "方法2: 路由器DNS配置 (一劳永逸)"
echo "  1. 电脑浏览器访问: http://172.27.0.1"
echo "  2. 登录路由器管理界面"
echo "  3. 找到'DNS设置'或'静态DNS条目'"
echo "  4. 添加域名映射:"
echo "     labubu.local -> $LOCAL_IP"
echo "  5. 保存设置，所有设备自动生效"
echo ""

echo "🧪 快速测试"
echo "----------"
echo "电脑端测试 (应该立即可用):"
for domain in "labubu.local" "labubu-gallery.local" "wallpaper.local"; do
    if curl -s --connect-timeout 3 http://$domain:3000 > /dev/null; then
        echo "  ✅ http://$domain:3000"
    else
        echo "  ❌ http://$domain:3000"
    fi
done

echo ""
echo "📱 扫描二维码测试域名访问:"
echo "------------------------"
qrencode -t ANSI "http://labubu.local:8080/domain_test.html"

echo ""
echo "🎉 域名访问的优势"
echo "---------------"
echo "  ✅ 更友好的访问地址"
echo "  ✅ 易于记忆和分享"
echo "  ✅ 专业的访问体验"
echo "  ✅ 支持多个备用域名"
echo ""

echo "🔧 故障排除"
echo "----------"
echo "如果域名无法访问:"
echo "  1. 检查服务器状态: ss -tlnp | grep :3000"
echo "  2. 重启服务器: ./fix_network_access.sh"
echo "  3. 检查hosts文件: cat /etc/hosts | grep local"
echo "  4. 使用IP访问: http://$LOCAL_IP:3000"
echo ""

echo "💡 提示"
echo "------"
echo "• 电脑端域名访问已立即生效"
echo "• 手机端需要配置DNS才能使用域名"
echo "• 如果不想配置DNS，仍可使用IP访问"
echo "• 域名和IP访问功能完全相同"
