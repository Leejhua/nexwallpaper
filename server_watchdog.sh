#!/bin/bash

# 服务器看门狗脚本
# 自动监控和重启Labubu壁纸画廊服务器

LOG_FILE="/home/ljh/watchdog.log"
PID_FILE="/home/ljh/.watchdog_pid"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_and_restart_react() {
    if ! ss -tlnp | grep -q :3000; then
        log_message "⚠️  React服务器未运行，正在重启..."
        
        # 清理可能的僵尸进程
        pkill -f "npm run dev" 2>/dev/null
        pkill -f "vite" 2>/dev/null
        sleep 2
        
        # 启动React服务器
        cd /home/ljh/labubu-gallery-react
        nohup npm run dev > ../react-server.log 2>&1 &
        
        # 等待启动
        for i in {1..10}; do
            sleep 1
            if ss -tlnp | grep -q :3000; then
                log_message "✅ React服务器重启成功"
                return 0
            fi
        done
        
        log_message "❌ React服务器重启失败"
        return 1
    else
        log_message "✅ React服务器运行正常"
        return 0
    fi
}

check_and_restart_test() {
    if ! ss -tlnp | grep -q :8080; then
        log_message "⚠️  测试服务器未运行，正在重启..."
        
        cd /home/ljh
        nohup python3 -m http.server 8080 > test-server.log 2>&1 &
        
        sleep 2
        if ss -tlnp | grep -q :8080; then
            log_message "✅ 测试服务器重启成功"
        else
            log_message "❌ 测试服务器重启失败"
        fi
    else
        log_message "✅ 测试服务器运行正常"
    fi
}

test_connectivity() {
    # 测试React服务器连接
    if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
        log_message "✅ React服务器连接测试通过"
        return 0
    else
        log_message "❌ React服务器连接测试失败"
        return 1
    fi
}

start_watchdog() {
    log_message "🐕 启动服务器看门狗监控"
    
    # 保存看门狗PID
    echo $$ > "$PID_FILE"
    
    while true; do
        log_message "🔍 开始服务器健康检查..."
        
        # 检查React服务器
        if check_and_restart_react; then
            # 测试连接
            if ! test_connectivity; then
                log_message "⚠️  连接测试失败，尝试重启React服务器"
                pkill -f "npm run dev" 2>/dev/null
                sleep 3
                check_and_restart_react
            fi
        fi
        
        # 检查测试服务器
        check_and_restart_test
        
        log_message "😴 等待下次检查 (60秒后)..."
        sleep 60
    done
}

stop_watchdog() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            log_message "🛑 看门狗已停止 (PID: $PID)"
        fi
        rm -f "$PID_FILE"
    else
        log_message "⚠️  看门狗PID文件不存在"
    fi
}

status_watchdog() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "✅ 看门狗正在运行 (PID: $PID)"
            echo "📋 最近日志:"
            tail -10 "$LOG_FILE" 2>/dev/null || echo "无日志文件"
        else
            echo "❌ 看门狗未运行 (PID文件存在但进程不存在)"
            rm -f "$PID_FILE"
        fi
    else
        echo "❌ 看门狗未运行"
    fi
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📋 看门狗日志 (最后50行):"
        echo "========================="
        tail -50 "$LOG_FILE"
    else
        echo "📋 暂无日志文件"
    fi
}

show_help() {
    echo "🐕 Labubu壁纸画廊服务器看门狗"
    echo "============================="
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     - 启动看门狗监控"
    echo "  stop      - 停止看门狗监控"
    echo "  status    - 查看看门狗状态"
    echo "  logs      - 查看监控日志"
    echo "  once      - 执行一次检查"
    echo "  help      - 显示此帮助"
    echo ""
    echo "功能:"
    echo "• 每60秒检查一次服务器状态"
    echo "• 自动重启停止的服务器"
    echo "• 连接测试和健康检查"
    echo "• 详细的日志记录"
    echo ""
}

run_once() {
    log_message "🔍 执行一次性健康检查"
    check_and_restart_react
    check_and_restart_test
    test_connectivity
    log_message "✅ 一次性检查完成"
}

# 主程序
case "${1:-help}" in
    "start")
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "⚠️  看门狗已在运行"
            status_watchdog
        else
            echo "🚀 启动看门狗监控..."
            start_watchdog &
            sleep 2
            status_watchdog
        fi
        ;;
    "stop")
        stop_watchdog
        ;;
    "status")
        status_watchdog
        ;;
    "logs")
        show_logs
        ;;
    "once")
        run_once
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
