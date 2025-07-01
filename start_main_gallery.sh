#!/bin/bash

# 🐰 Labubu高清壁纸画廊 - 主要版本启动脚本
# React + Aceternity UI + Framer Motion 现代化版本

echo "🚀 启动Labubu高清壁纸画廊 - React主要版本..."
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 16+版本"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 进入React项目目录
cd labubu-gallery-react

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3000已被占用，正在终止现有进程..."
    pkill -f "vite" 2>/dev/null || true
    sleep 2
fi

echo "🌐 启动React开发服务器..."
echo ""

# 启动开发服务器
nohup npm run dev > ../vite.log 2>&1 &
SERVER_PID=$!
cd ..

# 等待服务器启动
sleep 5

# 检查服务器是否成功启动
if ps -p $SERVER_PID > /dev/null; then
    echo ""
    echo "✅ React画廊启动成功!"
    echo ""
    echo "🎨 主要访问地址:"
    echo "   🌟 React现代化画廊: http://localhost:3000"
    echo ""
    echo "📊 React版本特色:"
    echo "   • 🎭 流畅的Framer Motion动画"
    echo "   • 🎨 Aceternity UI现代化组件"
    echo "   • 📱 完美的响应式设计"
    echo "   • 🔍 智能搜索和筛选"
    echo "   • ⌨️  键盘快捷键支持"
    echo "   • 🖼️  全屏预览和下载"
    echo "   • 400+ 高清壁纸和视频"
    echo ""
    echo "⌨️  快捷键:"
    echo "   • Ctrl/Cmd + K: 聚焦搜索"
    echo "   • ←/→: 上一页/下一页"
    echo "   • Esc: 关闭模态框"
    echo ""
    echo "🔧 其他版本:"
    echo "   • 原生版本: ./start_hd_gallery.sh"
    echo "   • 经典版本: ./start_gallery.sh"
    echo ""
    echo "🛑 停止服务器: Ctrl+C 或 ./stop_main_gallery.sh"
    echo "📝 进程ID: $SERVER_PID"
    echo "$SERVER_PID" > .react_gallery_pid
    
    # 等待用户输入或进程结束
    wait $SERVER_PID
else
    echo "❌ React服务器启动失败!"
    exit 1
fi
