#!/bin/bash

# Labubu壁纸画廊 - 自动更新管理脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "🐰 Labubu壁纸画廊 - 自动更新管理系统"
    echo "================================================"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  check     - 立即检查URL状态"
    echo "  update    - 检查并更新数据文件"
    echo "  backup    - 创建数据文件备份"
    echo "  restore   - 恢复最新备份"
    echo "  status    - 显示系统状态"
    echo "  config    - 显示配置信息"
    echo "  setup     - 设置定时任务"
    echo "  clean     - 清理临时文件"
    echo "  help      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 check    # 检查URL状态"
    echo "  $0 update   # 更新数据文件"
    echo "  $0 setup    # 设置自动更新"
}

check_dependencies() {
    echo "🔍 检查依赖..."
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 未安装"
        exit 1
    fi
    
    if ! python3 -c "import requests" 2>/dev/null; then
        echo "⚠️  requests 模块未安装，正在安装..."
        pip3 install requests
    fi
    
    echo "✅ 依赖检查完成"
}

check_urls() {
    echo "🔍 开始URL状态检查..."
    python3 comprehensive_url_checker.py
    echo "✅ URL检查完成"
}

update_data() {
    echo "🔄 开始数据更新..."
    python3 auto_update_system.py
    echo "✅ 数据更新完成"
}

create_backup() {
    echo "💾 创建备份..."
    
    if [ ! -d "backups" ]; then
        mkdir -p backups
    fi
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backups/complete_gallery_data_${timestamp}.js"
    
    if [ -f "complete_gallery_data.js" ]; then
        cp "complete_gallery_data.js" "$backup_file"
        echo "✅ 备份已创建: $backup_file"
    else
        echo "❌ 原数据文件不存在"
        exit 1
    fi
}

restore_backup() {
    echo "🔄 恢复备份..."
    
    if [ ! -d "backups" ]; then
        echo "❌ 备份目录不存在"
        exit 1
    fi
    
    # 找到最新的备份文件
    latest_backup=$(ls -t backups/complete_gallery_data_*.js 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        echo "❌ 没有找到备份文件"
        exit 1
    fi
    
    cp "$latest_backup" "complete_gallery_data.js"
    echo "✅ 已恢复备份: $latest_backup"
}

show_status() {
    echo "📊 系统状态"
    echo "============"
    
    if [ -f "complete_gallery_data.js" ]; then
        file_size=$(du -h "complete_gallery_data.js" | cut -f1)
        file_date=$(date -r "complete_gallery_data.js" "+%Y-%m-%d %H:%M:%S")
        echo "📁 数据文件: $file_size (更新于 $file_date)"
    else
        echo "❌ 数据文件不存在"
    fi
    
    if [ -d "backups" ]; then
        backup_count=$(ls backups/complete_gallery_data_*.js 2>/dev/null | wc -l)
        echo "💾 备份文件: $backup_count 个"
        
        if [ $backup_count -gt 0 ]; then
            latest_backup=$(ls -t backups/complete_gallery_data_*.js 2>/dev/null | head -1)
            backup_date=$(date -r "$latest_backup" "+%Y-%m-%d %H:%M:%S")
            echo "📅 最新备份: $backup_date"
        fi
    else
        echo "💾 备份文件: 0 个"
    fi
    
    if [ -f "url_check_report.json" ]; then
        report_date=$(date -r "url_check_report.json" "+%Y-%m-%d %H:%M:%S")
        echo "📋 检测报告: 存在 (生成于 $report_date)"
    else
        echo "📋 检测报告: 不存在"
    fi
    
    if [ -f "update_log.txt" ]; then
        log_lines=$(wc -l < "update_log.txt")
        echo "📝 更新日志: $log_lines 行记录"
    else
        echo "📝 更新日志: 不存在"
    fi
}

show_config() {
    echo "⚙️  配置信息"
    echo "============"
    python3 auto_update_system.py config
}

setup_cron() {
    echo "📅 设置定时任务"
    echo "=============="
    python3 auto_update_system.py setup
}

clean_temp() {
    echo "🧹 清理临时文件..."
    
    # 清理临时文件
    rm -f complete_gallery_data_updated.js
    rm -f url_check_report.json.tmp
    
    # 清理过期日志（保留最近100行）
    if [ -f "update_log.txt" ] && [ $(wc -l < "update_log.txt") -gt 100 ]; then
        tail -100 "update_log.txt" > "update_log.txt.tmp"
        mv "update_log.txt.tmp" "update_log.txt"
        echo "✅ 已清理更新日志"
    fi
    
    echo "✅ 临时文件清理完成"
}

# 主逻辑
case "${1:-help}" in
    "check")
        check_dependencies
        check_urls
        ;;
    "update")
        check_dependencies
        update_data
        ;;
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup
        ;;
    "status")
        show_status
        ;;
    "config")
        show_config
        ;;
    "setup")
        setup_cron
        ;;
    "clean")
        clean_temp
        ;;
    "help"|*)
        show_help
        ;;
esac
