#!/bin/bash

# 🔍 React项目状态检查脚本

echo "🔍 检查React项目状态..."
echo ""

# 检查Node.js版本
echo "📦 Node.js版本:"
if command -v node &> /dev/null; then
    node --version
else
    echo "❌ Node.js未安装"
fi

# 检查npm版本
echo ""
echo "📦 npm版本:"
if command -v npm &> /dev/null; then
    npm --version
else
    echo "❌ npm未安装"
fi

# 检查React项目目录
echo ""
echo "📁 React项目目录:"
if [ -d "labubu-gallery-react" ]; then
    echo "✅ labubu-gallery-react 目录存在"
    cd labubu-gallery-react
    
    # 检查package.json
    if [ -f "package.json" ]; then
        echo "✅ package.json 存在"
        echo "   项目名称: $(grep '"name"' package.json | cut -d'"' -f4)"
        echo "   项目版本: $(grep '"version"' package.json | cut -d'"' -f4)"
    else
        echo "❌ package.json 不存在"
    fi
    
    # 检查依赖
    if [ -d "node_modules" ]; then
        echo "✅ node_modules 存在"
        echo "   依赖数量: $(ls node_modules | wc -l)"
    else
        echo "⚠️  node_modules 不存在，需要运行 npm install"
    fi
    
    # 检查源码目录
    if [ -d "src" ]; then
        echo "✅ src 目录存在"
        echo "   组件数量: $(ls src/components/*.jsx 2>/dev/null | wc -l)"
        echo "   Hook数量: $(ls src/hooks/*.js 2>/dev/null | wc -l)"
    else
        echo "❌ src 目录不存在"
    fi
    
    # 检查数据文件
    if [ -f "src/data/galleryData.js" ]; then
        echo "✅ 画廊数据文件存在"
        DATA_SIZE=$(wc -l < src/data/galleryData.js)
        echo "   数据文件行数: $DATA_SIZE"
    else
        echo "❌ 画廊数据文件不存在"
    fi
    
    cd ..
else
    echo "❌ labubu-gallery-react 目录不存在"
fi

# 检查启动脚本
echo ""
echo "🚀 启动脚本:"
if [ -f "start_main_gallery.sh" ]; then
    echo "✅ start_main_gallery.sh 存在"
    if [ -x "start_main_gallery.sh" ]; then
        echo "✅ 启动脚本可执行"
    else
        echo "⚠️  启动脚本不可执行，正在修复..."
        chmod +x start_main_gallery.sh
        echo "✅ 已修复执行权限"
    fi
else
    echo "❌ start_main_gallery.sh 不存在"
fi

if [ -f "stop_main_gallery.sh" ]; then
    echo "✅ stop_main_gallery.sh 存在"
    if [ -x "stop_main_gallery.sh" ]; then
        echo "✅ 停止脚本可执行"
    else
        echo "⚠️  停止脚本不可执行，正在修复..."
        chmod +x stop_main_gallery.sh
        echo "✅ 已修复执行权限"
    fi
else
    echo "❌ stop_main_gallery.sh 不存在"
fi

# 检查端口占用
echo ""
echo "🌐 端口状态:"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口3000被占用"
    echo "   占用进程: $(lsof -ti:3000 | head -1)"
else
    echo "✅ 端口3000可用"
fi

echo ""
echo "📊 项目状态总结:"
echo "   🎯 主要版本: React + Vite"
echo "   📱 访问地址: http://localhost:3000"
echo "   🚀 启动命令: ./start_main_gallery.sh"
echo "   🛑 停止命令: ./stop_main_gallery.sh"
echo ""

# 给出建议
if [ ! -d "labubu-gallery-react/node_modules" ]; then
    echo "💡 建议: 首次运行前请安装依赖"
    echo "   cd labubu-gallery-react && npm install"
fi

echo "✅ 检查完成"
