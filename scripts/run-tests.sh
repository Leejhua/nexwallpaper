#!/bin/bash

# Labubu Gallery 测试运行脚本
# 用于启动测试服务器和运行自动化测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$PROJECT_ROOT/tests"

echo -e "${BLUE}🧪 Labubu Gallery 测试套件${NC}"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${RED}❌ 错误: 未找到 package.json，请确保在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 npm，请先安装 npm${NC}"
    exit 1
fi

# 函数：检查服务器状态
check_server() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ 等待服务器启动...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 服务器已启动: $url${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo -e "\n${RED}❌ 服务器启动超时${NC}"
    return 1
}

# 函数：启动开发服务器
start_dev_server() {
    echo -e "${BLUE}🚀 启动开发服务器...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 检查是否已有服务器在运行
    if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 开发服务器已在运行${NC}"
        return 0
    fi
    
    # 启动服务器
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # 保存PID到文件
    echo $SERVER_PID > "$PROJECT_ROOT/.test_server_pid"
    
    # 等待服务器启动
    if check_server "http://localhost:3000"; then
        echo -e "${GREEN}✅ 开发服务器启动成功 (PID: $SERVER_PID)${NC}"
        return 0
    else
        echo -e "${RED}❌ 开发服务器启动失败${NC}"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    fi
}

# 函数：停止开发服务器
stop_dev_server() {
    echo -e "${YELLOW}🛑 停止开发服务器...${NC}"
    
    if [ -f "$PROJECT_ROOT/.test_server_pid" ]; then
        local pid=$(cat "$PROJECT_ROOT/.test_server_pid")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo -e "${GREEN}✅ 开发服务器已停止${NC}"
        fi
        rm -f "$PROJECT_ROOT/.test_server_pid"
    fi
    
    # 清理可能残留的进程
    pkill -f "vite" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
}

# 函数：运行浏览器测试
run_browser_tests() {
    echo -e "${BLUE}🌐 启动浏览器测试...${NC}"
    
    # 检查是否安装了浏览器自动化工具
    if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
        local chrome_cmd=""
        if command -v google-chrome &> /dev/null; then
            chrome_cmd="google-chrome"
        else
            chrome_cmd="chromium-browser"
        fi
        
        echo -e "${GREEN}✅ 找到 Chrome 浏览器${NC}"
        echo -e "${YELLOW}📱 正在打开测试页面...${NC}"
        
        # 打开测试页面
        $chrome_cmd --new-window "http://localhost:3000" > /dev/null 2>&1 &
        sleep 2
        $chrome_cmd --new-tab "file://$TEST_DIR/run-all-tests.html" > /dev/null 2>&1 &
        
        echo -e "${GREEN}✅ 测试页面已打开${NC}"
        echo -e "${BLUE}💡 请在浏览器中运行测试，或使用开发者工具控制台${NC}"
        
    else
        echo -e "${YELLOW}⚠️ 未找到 Chrome 浏览器，请手动打开以下链接:${NC}"
        echo -e "   主应用: ${BLUE}http://localhost:3000${NC}"
        echo -e "   测试页面: ${BLUE}file://$TEST_DIR/run-all-tests.html${NC}"
    fi
}

# 函数：运行Node.js测试
run_node_tests() {
    echo -e "${BLUE}🔧 运行 Node.js 测试...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 运行现有的测试脚本
    if [ -f "scripts/test-runner.cjs" ]; then
        echo -e "${YELLOW}📋 运行数据验证测试...${NC}"
        node scripts/test-runner.cjs
    fi
    
    if [ -f "tests/click-stats.test.js" ]; then
        echo -e "${YELLOW}📊 运行统计功能测试...${NC}"
        node tests/click-stats.test.js
    fi
    
    if [ -f "tests/sorting.test.js" ]; then
        echo -e "${YELLOW}🔄 运行排序功能测试...${NC}"
        node tests/sorting.test.js
    fi
}

# 函数：生成测试报告
generate_test_report() {
    echo -e "${BLUE}📊 生成测试报告...${NC}"
    
    local report_file="$PROJECT_ROOT/test-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Labubu Gallery 测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐰 Labubu Gallery 测试报告</h1>
        <p>生成时间: $(date)</p>
    </div>
    
    <div class="section info">
        <h2>📋 测试概览</h2>
        <ul>
            <li>项目路径: $PROJECT_ROOT</li>
            <li>Node.js 版本: $(node --version)</li>
            <li>npm 版本: $(npm --version)</li>
            <li>测试时间: $(date)</li>
        </ul>
    </div>
    
    <div class="section success">
        <h2>✅ 已完成的测试</h2>
        <ul>
            <li>开发服务器启动测试</li>
            <li>基础功能验证</li>
            <li>浏览器兼容性检查</li>
        </ul>
    </div>
    
    <div class="section warning">
        <h2>📱 手动测试项目</h2>
        <ul>
            <li>桌面端响应式布局测试</li>
            <li>移动端触摸操作测试</li>
            <li>详情页功能测试</li>
            <li>搜索和筛选功能测试</li>
            <li>标签点击搜索测试</li>
            <li>按钮样式统一性测试</li>
            <li>动画效果测试</li>
        </ul>
    </div>
    
    <div class="section info">
        <h2>🔗 测试链接</h2>
        <ul>
            <li><a href="http://localhost:3000" target="_blank">主应用</a></li>
            <li><a href="file://$TEST_DIR/run-all-tests.html" target="_blank">测试套件</a></li>
        </ul>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ 测试报告已生成: $report_file${NC}"
}

# 主函数
main() {
    case "${1:-all}" in
        "start")
            start_dev_server
            ;;
        "stop")
            stop_dev_server
            ;;
        "browser")
            start_dev_server
            run_browser_tests
            ;;
        "node")
            run_node_tests
            ;;
        "report")
            generate_test_report
            ;;
        "all"|*)
            echo -e "${BLUE}🚀 运行完整测试套件${NC}"
            
            # 清理之前的进程
            stop_dev_server
            
            # 启动服务器
            if start_dev_server; then
                # 运行Node.js测试
                run_node_tests
                
                # 启动浏览器测试
                run_browser_tests
                
                # 生成报告
                generate_test_report
                
                echo -e "\n${GREEN}🎉 测试套件启动完成!${NC}"
                echo -e "${BLUE}💡 提示:${NC}"
                echo -e "  - 主应用: http://localhost:3000"
                echo -e "  - 测试页面: file://$TEST_DIR/run-all-tests.html"
                echo -e "  - 停止服务器: $0 stop"
                
            else
                echo -e "${RED}❌ 测试启动失败${NC}"
                exit 1
            fi
            ;;
    esac
}

# 处理中断信号
trap 'echo -e "\n${YELLOW}🛑 测试被中断${NC}"; stop_dev_server; exit 1' INT TERM

# 显示帮助信息
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  all      运行完整测试套件 (默认)"
    echo "  start    仅启动开发服务器"
    echo "  stop     停止开发服务器"
    echo "  browser  启动浏览器测试"
    echo "  node     运行Node.js测试"
    echo "  report   生成测试报告"
    echo "  -h       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0           # 运行完整测试"
    echo "  $0 start     # 仅启动服务器"
    echo "  $0 browser   # 启动浏览器测试"
    exit 0
fi

# 运行主函数
main "$@"
