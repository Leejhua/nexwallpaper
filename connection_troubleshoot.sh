#!/bin/bash

clear
echo "🔧 Localhost连接问题故障排除指南"
echo "================================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "📊 当前网络状态:"
echo "  本机IP: $LOCAL_IP"
echo "  时间: $(date)"
echo ""

# 检查端口状态
echo "🔍 端口监听状态检查:"
echo "-------------------"
if ss -tlnp | grep -q :3000; then
    echo "✅ 端口3000: 正在监听"
    PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
    echo "   进程ID: $PID"
    PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "未知")
    echo "   进程名: $PROCESS"
else
    echo "❌ 端口3000: 未监听"
    echo "   🔧 解决方案: 运行 ./server_manager.sh start"
fi

if ss -tlnp | grep -q :8080; then
    echo "✅ 端口8080: 正在监听"
else
    echo "❌ 端口8080: 未监听"
fi
echo ""

# 检查进程状态
echo "🔍 相关进程检查:"
echo "---------------"
REACT_PROCESSES=$(ps aux | grep -E "npm|vite|node.*vite" | grep -v grep | wc -l)
if [ $REACT_PROCESSES -gt 0 ]; then
    echo "✅ 发现 $REACT_PROCESSES 个React相关进程"
    ps aux | grep -E "npm|vite|node.*vite" | grep -v grep | head -3
else
    echo "❌ 未发现React相关进程"
    echo "   🔧 解决方案: 运行 ./server_manager.sh start"
fi
echo ""

# 连接测试
echo "🧪 连接测试:"
echo "-----------"

# 测试localhost
if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ localhost:3000 - 可访问"
else
    echo "❌ localhost:3000 - 连接被拒绝"
    echo "   🔧 可能原因:"
    echo "      • 服务器未启动"
    echo "      • 端口被占用"
    echo "      • 防火墙阻拦"
fi

# 测试IP访问
if curl -s --connect-timeout 3 http://$LOCAL_IP:3000 > /dev/null 2>&1; then
    echo "✅ $LOCAL_IP:3000 - 可访问"
else
    echo "❌ $LOCAL_IP:3000 - 连接失败"
fi

# 测试域名访问
if curl -s --connect-timeout 3 http://labubu.local:3000 > /dev/null 2>&1; then
    echo "✅ labubu.local:3000 - 可访问"
else
    echo "❌ labubu.local:3000 - 连接失败"
    echo "   💡 提示: 域名访问需要配置hosts文件"
fi
echo ""

# 常见问题诊断
echo "🔧 常见问题诊断:"
echo "---------------"

# 检查端口占用
PORT_USED=$(ss -tlnp | grep :3000 | wc -l)
if [ $PORT_USED -eq 0 ]; then
    echo "❌ 问题: 端口3000未被监听"
    echo "   🔧 解决方案:"
    echo "      1. 运行: ./server_manager.sh start"
    echo "      2. 或手动启动: cd /home/ljh/labubu-gallery-react && npm run dev"
    echo ""
elif [ $PORT_USED -gt 1 ]; then
    echo "⚠️  警告: 端口3000被多个进程占用"
    echo "   🔧 解决方案:"
    echo "      1. 运行: ./server_manager.sh stop"
    echo "      2. 然后: ./server_manager.sh start"
    echo ""
fi

# 检查防火墙
echo "🔒 防火墙状态:"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1)
    echo "   $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo "   ⚠️  防火墙已启用，可能阻止连接"
        echo "   🔧 解决方案: sudo ufw allow 3000"
    fi
else
    echo "   未安装ufw防火墙"
fi
echo ""

# 检查系统资源
echo "💻 系统资源检查:"
echo "---------------"
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "   内存使用率: ${MEMORY_USAGE}%"

DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}')
echo "   磁盘使用率: $DISK_USAGE"

LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "   系统负载:$LOAD_AVG"
echo ""

# 快速修复建议
echo "🚀 快速修复建议:"
echo "---------------"
echo "1. 🔄 重启服务器:"
echo "   ./server_manager.sh restart"
echo ""
echo "2. 🧹 清理并重启:"
echo "   ./server_manager.sh stop"
echo "   sleep 5"
echo "   ./server_manager.sh start"
echo ""
echo "3. 🔍 查看详细日志:"
echo "   ./server_manager.sh logs"
echo ""
echo "4. 🆘 完全重置:"
echo "   pkill -f npm"
echo "   pkill -f vite"
echo "   cd /home/ljh/labubu-gallery-react"
echo "   rm -rf node_modules/.vite"
echo "   npm run dev"
echo ""

# 检查依赖
echo "📦 依赖检查:"
echo "-----------"
if [ -d "/home/ljh/labubu-gallery-react/node_modules" ]; then
    echo "✅ node_modules 存在"
    NODE_MODULES_SIZE=$(du -sh /home/ljh/labubu-gallery-react/node_modules 2>/dev/null | cut -f1)
    echo "   大小: $NODE_MODULES_SIZE"
else
    echo "❌ node_modules 不存在"
    echo "   🔧 解决方案: cd /home/ljh/labubu-gallery-react && npm install"
fi

if [ -f "/home/ljh/labubu-gallery-react/package.json" ]; then
    echo "✅ package.json 存在"
else
    echo "❌ package.json 不存在"
    echo "   🔧 这是严重问题，需要检查项目完整性"
fi
echo ""

echo "🎯 推荐操作顺序:"
echo "---------------"
echo "1. 运行: ./server_manager.sh status"
echo "2. 如果服务器未运行: ./server_manager.sh start"
echo "3. 如果仍有问题: ./server_manager.sh restart"
echo "4. 测试连接: ./server_manager.sh test"
echo "5. 查看日志: ./server_manager.sh logs"
echo ""

echo "📞 如果问题仍然存在:"
echo "-------------------"
echo "• 检查是否有其他程序占用端口3000"
echo "• 尝试使用不同的端口"
echo "• 检查Node.js和npm版本"
echo "• 重新安装项目依赖"
echo ""

echo "🎉 故障排除完成！"
echo "如果按照建议操作后仍有问题，请查看详细日志。"
