#!/bin/bash

# 后端Docker部署脚本
# 使用方法: ./deploy-backend.sh [build|start|stop|restart|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVICE_NAME="labubu-backend"
DOCKER_COMPOSE_FILE="docker-compose.backend.yml"
DOCKERFILE="Dockerfile.backend"
DOCKERIGNORE=".dockerignore.backend"

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 复制专用的dockerignore文件
setup_dockerignore() {
    if [ -f "$DOCKERIGNORE" ]; then
        cp "$DOCKERIGNORE" ".dockerignore"
        log_info "已使用后端专用的 .dockerignore 文件"
    fi
}

# 恢复原始dockerignore文件
restore_dockerignore() {
    if [ -f ".dockerignore.original" ]; then
        mv ".dockerignore.original" ".dockerignore"
        log_info "已恢复原始 .dockerignore 文件"
    fi
}

# 构建镜像
build_image() {
    log_info "开始构建后端Docker镜像..."
    
    # 备份原始dockerignore
    if [ -f ".dockerignore" ] && [ ! -f ".dockerignore.original" ]; then
        cp ".dockerignore" ".dockerignore.original"
    fi
    
    setup_dockerignore
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    if [ $? -eq 0 ]; then
        log_success "Docker镜像构建完成"
    else
        log_error "Docker镜像构建失败"
        restore_dockerignore
        exit 1
    fi
    
    restore_dockerignore
}

# 启动服务
start_service() {
    log_info "启动后端服务..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        log_success "后端服务启动成功"
        log_info "API服务地址: http://localhost:9091"
        log_info "健康检查: http://localhost:9091/api/health"
    else
        log_error "后端服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止后端服务..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    if [ $? -eq 0 ]; then
        log_success "后端服务已停止"
    else
        log_error "停止后端服务失败"
        exit 1
    fi
}

# 重启服务
restart_service() {
    log_info "重启后端服务..."
    stop_service
    start_service
}

# 查看日志
show_logs() {
    log_info "显示后端服务日志..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
}

# 查看状态
show_status() {
    log_info "后端服务状态:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    log_info "容器资源使用情况:"
    docker stats --no-stream $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q) 2>/dev/null || log_warning "没有运行中的容器"
}

# 显示帮助
show_help() {
    echo "后端Docker部署脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  build    - 构建Docker镜像"
    echo "  start    - 启动后端服务"
    echo "  stop     - 停止后端服务"
    echo "  restart  - 重启后端服务"
    echo "  logs     - 查看服务日志"
    echo "  status   - 查看服务状态"
    echo "  help     - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 build    # 构建镜像"
    echo "  $0 start    # 启动服务"
    echo "  $0 logs     # 查看日志"
}

# 主逻辑
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            build_image
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"