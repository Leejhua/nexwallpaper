#!/bin/bash

echo "🚀 Starting Labubu Gallery Full System..."

# 检查API服务器是否运行
if curl -s http://localhost:3002/api/health > /dev/null; then
    echo "✅ API Server is already running"
else
    echo "🔧 Starting API Server..."
    cd /home/ljh/labubu-stats-api
    nohup npm start > api.log 2>&1 &
    sleep 3
    
    if curl -s http://localhost:3002/api/health > /dev/null; then
        echo "✅ API Server started successfully"
    else
        echo "❌ Failed to start API Server"
        exit 1
    fi
fi

# 检查前端是否运行
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is already running"
else
    echo "🎨 Starting Frontend..."
    cd /home/ljh/labubu-gallery-react
    npm start &
    echo "🎯 Frontend starting... Please wait for it to be ready"
fi

echo ""
echo "🌟 System Status:"
echo "📊 API Server: http://localhost:3002/api/health"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "🎉 Full system is ready!"
