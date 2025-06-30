#!/bin/bash

# Labubu壁纸画廊启动脚本
echo "🐰 启动Labubu壁纸画廊服务器..."

# 检查端口是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口8080已被占用，尝试使用端口8081..."
    PORT=8081
else
    PORT=8080
fi

# 启动服务器
cd /home/ljh
echo "🚀 在端口 $PORT 启动服务器..."
python3 -m http.server $PORT &
SERVER_PID=$!

echo "✅ 服务器已启动！"
echo "📱 访问地址："
echo "   - 🎬 视频缩略图版: http://localhost:$PORT/video_thumbnail_gallery.html (最新推荐)"
echo "   - 🚀 分页版画廊: http://localhost:$PORT/paginated_gallery.html"
echo "   - 完整画廊: http://localhost:$PORT/ultimate_labubu_gallery.html"
echo "   - 自适应画廊: http://localhost:$PORT/adaptive_cards_gallery.html"
echo ""
echo "🛑 要停止服务器，请运行: kill $SERVER_PID"
echo "   或者按 Ctrl+C"

# 保存PID到文件
echo $SERVER_PID > /tmp/labubu_gallery_pid

echo ""
echo "🎨 画廊特色："
echo "   • 🖼️  视频缩略图: 动态壁纸自动生成预览图"
echo "   • 📄 智能分页: 避免服务器压力，提升加载速度"
echo "   • 📸 完整收藏: 来自两个专业网站的所有资源"
echo "   • 🎬 动态壁纸: 支持视频预览和下载"
echo "   • 📱 响应式设计: 适配所有设备"
echo "   • 🔍 智能筛选: 按类别、分辨率、来源筛选"
echo "   • 💫 瀑布流布局: 美观的卡片式展示"
echo "   • ⬇️  一键下载: 支持批量下载"
echo "   • ⌨️  键盘导航: 左右箭头键翻页"
echo ""
echo "享受浏览吧！ 🌟"
