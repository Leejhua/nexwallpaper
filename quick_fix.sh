#!/bin/bash

clear
echo "🚀 Labubu壁纸画廊快速修复工具"
echo "=============================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "🔍 正在诊断问题..."
echo ""

# 检查端口状态
echo "📊 端口状态检查:"
if ss -tlnp | grep -q :3000; then
    echo "  ✅ 端口3000: 正在监听"
    REACT_STATUS="running"
else
    echo "  ❌ 端口3000: 未监听"
    REACT_STATUS="stopped"
fi

if ss -tlnp | grep -q :8080; then
    echo "  ✅ 端口8080: 正在监听"
    TEST_STATUS="running"
else
    echo "  ❌ 端口8080: 未监听"
    TEST_STATUS="stopped"
fi
echo ""

# 连接测试
echo "🧪 连接测试:"
if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ localhost:3000 - 可访问"
    LOCALHOST_OK=true
else
    echo "  ❌ localhost:3000 - 连接被拒绝"
    LOCALHOST_OK=false
fi

if curl -s --connect-timeout 3 http://$LOCAL_IP:3000 > /dev/null 2>&1; then
    echo "  ✅ $LOCAL_IP:3000 - 可访问"
    IP_OK=true
else
    echo "  ❌ $LOCAL_IP:3000 - 连接失败"
    IP_OK=false
fi
echo ""

# 自动修复
echo "🔧 开始自动修复..."
echo ""

if [ "$REACT_STATUS" = "stopped" ] || [ "$LOCALHOST_OK" = false ]; then
    echo "🛠️  修复React服务器..."
    
    # 停止可能的僵尸进程
    echo "  🧹 清理僵尸进程..."
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    sleep 3
    
    # 检查并清理端口
    if ss -tlnp | grep -q :3000; then
        echo "  🔧 强制释放端口3000..."
        PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null
            sleep 2
        fi
    fi
    
    # 启动React服务器
    echo "  🚀 启动React服务器..."
    cd /home/ljh/labubu-gallery-react
    
    # 检查项目完整性
    if [ ! -f "package.json" ]; then
        echo "  ❌ package.json不存在，项目可能损坏"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "  📦 安装依赖..."
        npm install
    fi
    
    # 后台启动
    nohup npm run dev > ../react-server.log 2>&1 &
    REACT_PID=$!
    
    # 等待启动
    echo "  ⏳ 等待服务器启动..."
    for i in {1..15}; do
        sleep 1
        if ss -tlnp | grep -q :3000; then
            echo "  ✅ React服务器启动成功 (PID: $REACT_PID)"
            break
        fi
        if [ $i -eq 15 ]; then
            echo "  ❌ React服务器启动超时"
            echo "  📋 查看错误日志:"
            tail -10 ../react-server.log
            exit 1
        fi
    done
fi

if [ "$TEST_STATUS" = "stopped" ]; then
    echo "🛠️  修复测试服务器..."
    cd /home/ljh
    nohup python3 -m http.server 8080 > test-server.log 2>&1 &
    sleep 2
    if ss -tlnp | grep -q :8080; then
        echo "  ✅ 测试服务器启动成功"
    else
        echo "  ❌ 测试服务器启动失败"
    fi
fi

echo ""
echo "🧪 修复后连接测试:"

# 最终测试
sleep 3
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ localhost:3000 - 修复成功"
else
    echo "  ❌ localhost:3000 - 仍无法访问"
    echo ""
    echo "🔍 深度诊断:"
    echo "  检查React服务器日志:"
    tail -5 /home/ljh/react-server.log
    echo ""
    echo "  检查端口占用:"
    ss -tlnp | grep :3000
    echo ""
    echo "  建议手动操作:"
    echo "    cd /home/ljh/labubu-gallery-react"
    echo "    npm run dev"
    exit 1
fi

if curl -s --connect-timeout 5 http://$LOCAL_IP:3000 > /dev/null 2>&1; then
    echo "  ✅ $LOCAL_IP:3000 - 修复成功"
else
    echo "  ⚠️  $LOCAL_IP:3000 - 局域网访问可能有问题"
fi

if curl -s --connect-timeout 5 http://labubu.local:3000 > /dev/null 2>&1; then
    echo "  ✅ labubu.local:3000 - 域名访问正常"
else
    echo "  ⚠️  labubu.local:3000 - 域名访问需要配置hosts"
fi

echo ""
echo "🎉 修复完成！"
echo "============="
echo ""
echo "🌐 现在可以访问:"
echo "  • http://localhost:3000"
echo "  • http://$LOCAL_IP:3000"
echo "  • http://labubu.local:3000"
echo ""
echo "🛠️  管理工具:"
echo "  • ./server_manager.sh status    - 查看状态"
echo "  • ./server_watchdog.sh start    - 启动自动监控"
echo "  • ./connection_troubleshoot.sh  - 详细诊断"
echo ""

# 启动看门狗
echo "🐕 是否启动自动监控看门狗? (y/n)"
read -t 10 -n 1 answer
echo ""
if [[ $answer =~ ^[Yy]$ ]]; then
    echo "🚀 启动看门狗监控..."
    ./server_watchdog.sh start
else
    echo "💡 提示: 可以稍后运行 ./server_watchdog.sh start 启动自动监控"
fi

echo ""
echo "✨ 享受你的Labubu壁纸画廊之旅！"
