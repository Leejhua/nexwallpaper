#!/bin/bash

# 服务器管理脚本
# 用于检查、启动、停止和重启Labubu壁纸画廊服务器

LOCAL_IP=$(hostname -I | awk '{print $1}')

show_status() {
    echo "🔍 Labubu壁纸画廊服务器状态检查"
    echo "================================"
    echo ""
    
    # 检查React服务器
    if ss -tlnp | grep -q :3000; then
        echo "✅ React服务器 (端口3000): 运行中"
        REACT_PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
        echo "   进程ID: $REACT_PID"
    else
        echo "❌ React服务器 (端口3000): 未运行"
    fi
    
    # 检查测试服务器
    if ss -tlnp | grep -q :8080; then
        echo "✅ 测试服务器 (端口8080): 运行中"
        TEST_PID=$(ss -tlnp | grep :8080 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
        echo "   进程ID: $TEST_PID"
    else
        echo "❌ 测试服务器 (端口8080): 未运行"
    fi
    
    echo ""
    echo "🌐 访问地址:"
    echo "   本地访问: http://localhost:3000"
    echo "   局域网访问: http://$LOCAL_IP:3000"
    echo "   域名访问: http://labubu.local:3000"
    echo ""
}

start_react() {
    echo "🚀 启动React服务器..."
    
    if ss -tlnp | grep -q :3000; then
        echo "⚠️  React服务器已在运行"
        return 0
    fi
    
    cd /home/ljh/labubu-gallery-react
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装依赖..."
        npm install
    fi
    
    # 后台启动
    nohup npm run dev > ../react-server.log 2>&1 &
    REACT_PID=$!
    echo $REACT_PID > /home/ljh/.react_server_pid
    
    # 等待启动
    echo "⏳ 等待服务器启动..."
    for i in {1..10}; do
        sleep 1
        if ss -tlnp | grep -q :3000; then
            echo "✅ React服务器启动成功 (PID: $REACT_PID)"
            return 0
        fi
    done
    
    echo "❌ React服务器启动失败"
    echo "📋 查看日志: tail -f /home/ljh/react-server.log"
    return 1
}

stop_react() {
    echo "🛑 停止React服务器..."
    
    # 停止npm和vite进程
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    
    # 等待进程停止
    sleep 2
    
    # 强制停止如果还在运行
    if ss -tlnp | grep -q :3000; then
        PID=$(ss -tlnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d'=' -f2)
        if [ ! -z "$PID" ]; then
            kill -9 $PID 2>/dev/null
        fi
    fi
    
    # 清理PID文件
    rm -f /home/ljh/.react_server_pid
    
    if ss -tlnp | grep -q :3000; then
        echo "⚠️  警告: 仍有进程在端口3000运行"
    else
        echo "✅ React服务器已停止"
    fi
}

start_test_server() {
    echo "🧪 启动测试服务器..."
    
    if ss -tlnp | grep -q :8080; then
        echo "⚠️  测试服务器已在运行"
        return 0
    fi
    
    cd /home/ljh
    nohup python3 -m http.server 8080 > test-server.log 2>&1 &
    TEST_PID=$!
    echo $TEST_PID > /home/ljh/.test_server_pid
    
    sleep 2
    if ss -tlnp | grep -q :8080; then
        echo "✅ 测试服务器启动成功 (PID: $TEST_PID)"
    else
        echo "❌ 测试服务器启动失败"
    fi
}

stop_test_server() {
    echo "🛑 停止测试服务器..."
    
    pkill -f "python3 -m http.server 8080" 2>/dev/null
    rm -f /home/ljh/.test_server_pid
    
    if ss -tlnp | grep -q :8080; then
        echo "⚠️  警告: 仍有进程在端口8080运行"
    else
        echo "✅ 测试服务器已停止"
    fi
}

restart_all() {
    echo "🔄 重启所有服务器..."
    stop_react
    stop_test_server
    sleep 2
    start_react
    start_test_server
    echo ""
    show_status
}

test_connection() {
    echo "🧪 测试服务器连接..."
    echo ""
    
    # 测试React服务器
    if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
        echo "✅ React服务器连接正常"
    else
        echo "❌ React服务器连接失败"
    fi
    
    # 测试局域网访问
    if curl -s --connect-timeout 5 http://$LOCAL_IP:3000 > /dev/null; then
        echo "✅ 局域网访问正常"
    else
        echo "❌ 局域网访问失败"
    fi
    
    # 测试域名访问
    if curl -s --connect-timeout 5 http://labubu.local:3000 > /dev/null; then
        echo "✅ 域名访问正常"
    else
        echo "❌ 域名访问失败"
    fi
    
    echo ""
}

show_help() {
    echo "🎮 Labubu壁纸画廊服务器管理工具"
    echo "================================"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  status    - 显示服务器状态"
    echo "  start     - 启动React服务器"
    echo "  stop      - 停止React服务器"
    echo "  restart   - 重启所有服务器"
    echo "  test      - 测试服务器连接"
    echo "  logs      - 查看服务器日志"
    echo "  help      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 status     # 查看状态"
    echo "  $0 restart   # 重启服务器"
    echo "  $0 test      # 测试连接"
    echo ""
}

show_logs() {
    echo "📋 服务器日志"
    echo "============"
    echo ""
    
    if [ -f "/home/ljh/react-server.log" ]; then
        echo "React服务器日志 (最后20行):"
        echo "-------------------------"
        tail -20 /home/ljh/react-server.log
        echo ""
    fi
    
    if [ -f "/home/ljh/test-server.log" ]; then
        echo "测试服务器日志 (最后10行):"
        echo "-------------------------"
        tail -10 /home/ljh/test-server.log
        echo ""
    fi
}

# 主程序
case "${1:-status}" in
    "status")
        show_status
        ;;
    "start")
        start_react
        start_test_server
        echo ""
        show_status
        ;;
    "stop")
        stop_react
        stop_test_server
        ;;
    "restart")
        restart_all
        ;;
    "test")
        test_connection
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
