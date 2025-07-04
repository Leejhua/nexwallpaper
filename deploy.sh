#!/bin/bash

# 🚀 Hualang React画廊一键部署脚本
# 作者: LEEJHSE
# 项目: https://gitcode.com/LEEJHSE/hualang.git

echo "🎉 欢迎使用Hualang React画廊部署脚本！"
echo "================================================"

# 检查Node.js版本
echo "🔍 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 16+版本"
    echo "📥 下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ 错误: Node.js版本过低 (当前: $(node -v))，需要16+版本"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查npm版本
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm包管理器"
    exit 1
fi

echo "✅ npm版本: $(npm -v)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
echo "================================================"

if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接或尝试使用yarn"
    echo "💡 提示: 可以尝试运行 'npm install --registry https://registry.npmmirror.com'"
    exit 1
fi

echo "✅ 依赖安装完成！"

# 构建项目
echo ""
echo "🔨 构建生产版本..."
echo "================================================"

npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查代码错误"
    exit 1
fi

echo "✅ 构建完成！"

# 启动开发服务器
echo ""
echo "🚀 启动开发服务器..."
echo "================================================"
echo "📱 访问地址: http://localhost:3000"
echo "🔧 开发模式: 支持热重载"
echo "⌨️  快捷键: Ctrl+C 停止服务"
echo ""
echo "🎨 功能特色:"
echo "  • 400+高清壁纸资源"
echo "  • 智能搜索和筛选"
echo "  • 流畅动画效果"
echo "  • 响应式设计"
echo "  • 键盘快捷键支持"
echo ""
echo "================================================"

# 启动服务
npm run dev
