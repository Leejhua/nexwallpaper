#!/bin/bash

echo "🛑 Stopping Labubu Gallery Full System..."

# 停止API服务器
echo "🔧 Stopping API Server..."
pkill -f "labubu-stats-api" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ API Server stopped"
else
    echo "ℹ️  API Server was not running"
fi

# 停止前端
echo "🎨 Stopping Frontend..."
pkill -f "vite.*labubu-gallery-react" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend was not running"
fi

echo "🎉 Full system stopped!"
