#!/bin/bash

echo "🔍 网络连接诊断工具"
echo "==================="
echo ""

# 获取网络信息
echo "📡 网络接口信息:"
echo "----------------"
ip addr show | grep -E "inet.*scope global" | while read line; do
    interface=$(echo "$line" | awk '{print $NF}')
    ip=$(echo "$line" | awk '{print $2}')
    echo "  接口: $interface"
    echo "  IP地址: $ip"
    echo ""
done

# 检查网关
echo "🌐 网关信息:"
echo "------------"
GATEWAY=$(ip route | grep default | awk '{print $3}')
echo "  默认网关: $GATEWAY"
echo ""

# 检查服务器状态
echo "🚀 服务器状态:"
echo "-------------"
if ss -tlnp | grep -q :3000; then
    echo "  ✅ 服务器运行中 (端口3000)"
    SERVER_PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
    echo "  进程ID: $SERVER_PID"
else
    echo "  ❌ 服务器未运行"
fi
echo ""

# 测试本地连接
echo "🔧 本地连接测试:"
echo "---------------"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "  本机IP: $LOCAL_IP"

if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null; then
    echo "  ✅ localhost:3000 可访问"
else
    echo "  ❌ localhost:3000 不可访问"
fi

if curl -s --connect-timeout 3 http://$LOCAL_IP:3000 > /dev/null; then
    echo "  ✅ $LOCAL_IP:3000 可访问"
else
    echo "  ❌ $LOCAL_IP:3000 不可访问"
fi
echo ""

# 网络类型检测
echo "🏠 网络环境分析:"
echo "---------------"
if [[ $LOCAL_IP == 192.168.* ]]; then
    echo "  网络类型: 家庭/办公室路由器网络"
    echo "  WiFi设备通常可以访问有线设备"
elif [[ $LOCAL_IP == 10.* ]]; then
    echo "  网络类型: 企业内网"
    echo "  可能存在VLAN隔离"
elif [[ $LOCAL_IP == 172.* ]]; then
    echo "  网络类型: 私有网络 (可能是虚拟机或企业网络)"
    echo "  需要检查网络隔离策略"
else
    echo "  网络类型: 公网IP或特殊网络"
fi
echo ""

# 提供解决方案
echo "💡 解决方案建议:"
echo "---------------"
echo "1. 🔧 启动支持所有接口的服务器:"
echo "   ./start_mobile_gallery.sh"
echo ""
echo "2. 📱 手机WiFi网络检查:"
echo "   - 确保手机连接的WiFi与电脑在同一网络"
echo "   - 检查WiFi网关是否为: $GATEWAY"
echo ""
echo "3. 🌐 尝试不同的访问地址:"
echo "   - http://$LOCAL_IP:3000"
echo "   - http://localhost:3000 (仅电脑本地)"
echo ""
echo "4. 🔒 路由器设置检查:"
echo "   - 登录路由器管理界面 (通常是 http://$GATEWAY)"
echo "   - 检查是否开启了'AP隔离'或'客户端隔离'"
echo "   - 确保WiFi和有线网络在同一子网"
echo ""
echo "5. 🛠️ 高级解决方案:"
echo "   - 临时关闭电脑防火墙"
echo "   - 使用热点模式让手机连接电脑"
echo "   - 配置端口转发"
echo ""

# 生成测试命令
echo "🧪 手机端测试命令:"
echo "-----------------"
echo "在手机浏览器中依次尝试:"
echo "  1. http://$LOCAL_IP:3000"
echo "  2. http://$GATEWAY:3000 (如果路由器支持)"
echo ""

# 检查是否是WSL环境
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "⚠️  检测到WSL环境:"
    echo "   WSL可能需要特殊的网络配置"
    echo "   建议使用Windows本机IP地址"
    echo ""
fi

echo "🎯 快速测试:"
echo "----------"
echo "让朋友用手机浏览器访问: http://$LOCAL_IP:3000"
echo "如果无法访问，问题可能是网络隔离"
