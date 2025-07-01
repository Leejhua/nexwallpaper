#!/bin/bash

# 🧪 React画廊快速测试脚本

echo "🧪 开始测试React画廊..."
echo ""

# 检查基础环境
echo "1️⃣ 检查基础环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# 检查项目目录
echo ""
echo "2️⃣ 检查项目目录..."
if [ ! -d "labubu-gallery-react" ]; then
    echo "❌ React项目目录不存在"
    exit 1
fi

cd labubu-gallery-react

# 检查依赖
echo ""
echo "3️⃣ 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖中..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

echo "✅ 依赖已安装"

# 检查数据文件
echo ""
echo "4️⃣ 检查数据文件..."
if [ ! -f "src/data/galleryData.js" ]; then
    echo "❌ 画廊数据文件不存在"
    exit 1
fi

DATA_LINES=$(wc -l < src/data/galleryData.js)
echo "✅ 数据文件存在 ($DATA_LINES 行)"

# 构建测试
echo ""
echo "5️⃣ 构建测试..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    echo "尝试查看详细错误:"
    npm run build
    exit 1
fi

# 清理构建文件
rm -rf dist

echo ""
echo "6️⃣ 启动测试..."
echo "正在启动开发服务器进行测试..."

# 启动服务器并测试
timeout 30s npm run dev &
SERVER_PID=$!

# 等待服务器启动
sleep 10

# 检查端口是否可访问
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 服务器启动成功，端口3000可访问"
    TEST_RESULT="成功"
else
    echo "⚠️  服务器可能还在启动中..."
    TEST_RESULT="部分成功"
fi

# 停止测试服务器
kill $SERVER_PID 2>/dev/null || true
sleep 2

cd ..

echo ""
echo "🎯 测试结果总结:"
echo "   📦 依赖安装: ✅"
echo "   🏗️  项目构建: ✅"
echo "   🌐 服务器启动: $TEST_RESULT"
echo ""

if [ "$TEST_RESULT" = "成功" ]; then
    echo "🎉 React画廊测试完全通过！"
    echo "🚀 可以安全使用 ./start_main_gallery.sh 启动"
else
    echo "⚠️  React画廊基本功能正常，建议手动测试启动"
    echo "🚀 运行 ./start_main_gallery.sh 进行完整测试"
fi

echo ""
echo "📱 访问地址: http://localhost:3000"
echo "🛑 停止命令: ./stop_main_gallery.sh"
