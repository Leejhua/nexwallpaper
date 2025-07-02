#!/bin/bash

# 🚀 Labubu壁纸画廊项目快速同步脚本
# 适用于新电脑首次同步项目

echo "🎨 Labubu壁纸画廊项目快速同步"
echo "=================================="

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js (推荐版本18+)"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 克隆仓库
echo "📥 正在克隆仓库..."
if [ -d "mycode" ]; then
    echo "⚠️  目录mycode已存在，是否删除并重新克隆? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -rf mycode
    else
        echo "❌ 取消操作"
        exit 1
    fi
fi

# 尝试SSH克隆，失败则使用HTTPS
echo "🔐 尝试SSH克隆..."
if git clone git@gitcode.com:LEEJHSE/mycode.git; then
    echo "✅ SSH克隆成功"
else
    echo "⚠️  SSH克隆失败，尝试HTTPS克隆..."
    if git clone https://gitcode.com/LEEJHSE/mycode.git; then
        echo "✅ HTTPS克隆成功"
    else
        echo "❌ 克隆失败，请检查网络连接"
        exit 1
    fi
fi

cd mycode || exit 1

# 安装React前端依赖
echo ""
echo "📦 安装React前端依赖..."
cd labubu-gallery-react
if npm install; then
    echo "✅ React依赖安装成功"
else
    echo "❌ React依赖安装失败"
    exit 1
fi

# 安装统计API依赖
echo ""
echo "📦 安装统计API依赖..."
cd ../labubu-stats-api
if npm install; then
    echo "✅ API依赖安装成功"
else
    echo "❌ API依赖安装失败"
    exit 1
fi

cd ..

# 给脚本执行权限
echo ""
echo "🔧 设置脚本权限..."
chmod +x *.sh
echo "✅ 权限设置完成"

# 显示完成信息
echo ""
echo "🎉 项目同步完成！"
echo "=================="
echo ""
echo "🚀 启动服务:"
echo "  ./start_main_gallery.sh"
echo ""
echo "🔍 检查状态:"
echo "  ./check_services.sh"
echo ""
echo "🛑 停止服务:"
echo "  ./stop_react_services.sh"
echo ""
echo "🌐 访问地址:"
echo "  React画廊: http://localhost:3000"
echo "  统计API:   http://localhost:3002"
echo ""
echo "📚 详细说明请查看: SYNC_REPOSITORY_GUIDE.md"
echo ""

# 询问是否立即启动服务
echo "🤔 是否立即启动服务? (y/n)"
read -r start_response
if [[ "$start_response" =~ ^[Yy]$ ]]; then
    echo "🚀 正在启动服务..."
    ./start_main_gallery.sh
    sleep 3
    ./check_services.sh
else
    echo "💡 稍后可以运行 ./start_main_gallery.sh 启动服务"
fi

echo ""
echo "✨ 同步完成，享受你的Labubu壁纸画廊！"
