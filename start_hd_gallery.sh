#!/bin/bash

# 🐰 Labubu高清壁纸画廊启动脚本
# 400+高清壁纸收藏

echo "🚀 启动Labubu高清壁纸画廊..."

# 检查端口是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口8080已被占用，正在终止现有进程..."
    pkill -f "python.*http.server.*8080" 2>/dev/null || true
    sleep 2
fi

# 启动HTTP服务器
echo "🌐 启动HTTP服务器 (端口: 8080)..."
python3 -m http.server 8080 > /dev/null 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 检查服务器是否成功启动
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ 服务器启动成功!"
    echo ""
    echo "🎨 画廊访问地址:"
    echo "   🌟 高清画廊 (推荐): http://localhost:8080/hd_sidebar_gallery.html"
    echo "   📱 经典版本: http://localhost:8080/hd_video_thumbnail_gallery.html"
    echo "   🎬 视频缩略图: http://localhost:8080/video_thumbnail_gallery.html"
    echo "   📄 分页画廊: http://localhost:8080/paginated_gallery.html"
    echo ""
    echo "📊 高清画廊特色:"
    echo "   • 400+高清壁纸和视频"
    echo "   • 真正的4K画质"
    echo "   • 侧边栏导航设计"
    echo "   • 智能分页加载"
    echo "   • 视频缩略图预览"
    echo "   • 响应式设计"
    echo ""
    echo "🛑 停止服务器: ./stop_gallery.sh"
    echo "📝 进程ID: $SERVER_PID"
    echo "$SERVER_PID" > .gallery_pid
else
    echo "❌ 服务器启动失败!"
    exit 1
fi
