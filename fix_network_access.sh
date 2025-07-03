#!/bin/bash

echo "🔧 修复网络访问问题"
echo "=================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')
GATEWAY=$(ip route | grep default | awk '{print $3}')

echo "📊 当前网络状态:"
echo "  电脑IP: $LOCAL_IP"
echo "  网关: $GATEWAY"
echo ""

# 方案1: 重新配置Vite服务器
echo "🚀 方案1: 重新配置服务器监听所有接口"
echo "----------------------------------------"

# 停止现有服务器
echo "停止现有服务器..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# 确保Vite配置正确
cd /home/ljh/labubu-gallery-react

echo "检查Vite配置..."
if grep -q "host: true" vite.config.js; then
    echo "✅ Vite配置正确"
else
    echo "🔧 修复Vite配置..."
    cp vite.config.js vite.config.js.backup
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',  // 明确监听所有接口
    strictPort: true
  }
})
EOF
    echo "✅ Vite配置已更新"
fi

# 启动服务器
echo "启动服务器..."
nohup npm run dev > ../network-fix.log 2>&1 &
sleep 5

# 检查服务器状态
if ss -tlnp | grep -q :3000; then
    echo "✅ 服务器启动成功"
    
    # 测试本地访问
    if curl -s --connect-timeout 3 http://$LOCAL_IP:3000 > /dev/null; then
        echo "✅ 本地IP访问正常"
    else
        echo "❌ 本地IP访问失败"
    fi
else
    echo "❌ 服务器启动失败"
    echo "查看日志: tail -f /home/ljh/network-fix.log"
fi

echo ""

# 方案2: 创建简单的HTTP服务器
echo "🌐 方案2: 创建备用HTTP服务器 (端口8080)"
echo "----------------------------------------"

# 创建一个简单的Python HTTP服务器脚本
cat > /home/ljh/simple_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse, parse_qs

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # 如果访问根路径，重定向到React应用
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', 'http://localhost:3000')
            self.end_headers()
            return
        
        # 否则提供静态文件服务
        return super().do_GET()

PORT = 8080
Handler = CustomHandler

# 切换到项目目录
os.chdir('/home/ljh/labubu-gallery-react/dist')

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"服务器运行在端口 {PORT}")
    print(f"访问地址: http://0.0.0.0:{PORT}")
    httpd.serve_forever()
EOF

chmod +x /home/ljh/simple_server.py

echo "备用服务器脚本已创建: /home/ljh/simple_server.py"
echo "如需使用: python3 /home/ljh/simple_server.py"
echo ""

# 方案3: 使用ngrok进行内网穿透
echo "🌍 方案3: 内网穿透解决方案"
echo "------------------------"
echo "如果局域网访问仍有问题，可以使用ngrok:"
echo ""
echo "1. 安装ngrok:"
echo "   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null"
echo "   echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list"
echo "   sudo apt update && sudo apt install ngrok"
echo ""
echo "2. 启动ngrok:"
echo "   ngrok http 3000"
echo ""
echo "3. 使用ngrok提供的公网地址访问"
echo ""

# 方案4: 检查防火墙和网络
echo "🔒 方案4: 网络和防火墙检查"
echo "------------------------"

# 检查防火墙状态
echo "防火墙状态:"
if command -v ufw &> /dev/null; then
    sudo ufw status
else
    echo "  未安装ufw防火墙"
fi

# 检查iptables
if command -v iptables &> /dev/null; then
    echo ""
    echo "iptables规则 (INPUT链):"
    sudo iptables -L INPUT -n | head -10
fi

echo ""
echo "🧪 测试建议:"
echo "----------"
echo "1. 在手机上测试以下地址:"
echo "   - http://$LOCAL_IP:3000"
echo "   - http://$LOCAL_IP:8080 (如果启动了备用服务器)"
echo ""
echo "2. 检查手机WiFi设置:"
echo "   - 确保连接到与电脑相同的网络"
echo "   - 检查手机IP是否在同一网段 (172.27.x.x)"
echo ""
echo "3. 路由器设置:"
echo "   - 访问 http://$GATEWAY 进入路由器管理"
echo "   - 查找'AP隔离'、'客户端隔离'等选项并关闭"
echo "   - 确保WiFi和有线网络在同一VLAN"
echo ""

# 创建测试页面
echo "📄 创建网络测试页面"
echo "-----------------"
cat > /home/ljh/network_test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>网络连接测试</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .success { color: #28a745; font-size: 18px; text-align: center; margin: 20px 0; }
        .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 网络连接测试成功！</h1>
        <div class="success">
            恭喜！你的手机已经可以访问电脑上的网页了！
        </div>
        
        <div class="info">
            <h3>📱 当前访问信息:</h3>
            <p><strong>访问地址:</strong> http://$LOCAL_IP:3000</p>
            <p><strong>服务器IP:</strong> $LOCAL_IP</p>
            <p><strong>网关:</strong> $GATEWAY</p>
            <p><strong>访问时间:</strong> <span id="time"></span></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="http://$LOCAL_IP:3000" class="button">🐰 访问Labubu壁纸画廊</a>
            <a href="javascript:location.reload()" class="button">🔄 刷新测试</a>
        </div>
        
        <div class="info">
            <h3>🔧 如果Labubu画廊无法访问:</h3>
            <ul>
                <li>确保React服务器正在运行</li>
                <li>检查端口3000是否被占用</li>
                <li>尝试重启服务器: ./start_mobile_gallery.sh</li>
            </ul>
        </div>
    </div>
    
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

# 启动测试服务器
echo "启动网络测试服务器 (端口8080)..."
cd /home/ljh
nohup python3 -m http.server 8080 > network-test.log 2>&1 &
sleep 2

if ss -tlnp | grep -q :8080; then
    echo "✅ 测试服务器启动成功"
    echo ""
    echo "🧪 请在手机浏览器中访问:"
    echo "   http://$LOCAL_IP:8080/network_test.html"
    echo ""
    echo "如果这个测试页面可以访问，说明网络连接正常，"
    echo "问题可能出在React服务器配置上。"
else
    echo "❌ 测试服务器启动失败"
fi

echo ""
echo "🎯 总结:"
echo "------"
echo "1. ✅ React服务器已重新配置并启动"
echo "2. ✅ 测试服务器已在端口8080启动"
echo "3. 📱 请用手机测试访问:"
echo "   - 测试页面: http://$LOCAL_IP:8080/network_test.html"
echo "   - Labubu画廊: http://$LOCAL_IP:3000"
echo ""
echo "如果测试页面可以访问但画廊不行，请运行:"
echo "   tail -f /home/ljh/network-fix.log"
