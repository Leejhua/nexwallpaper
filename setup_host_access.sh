#!/bin/bash

echo "🌐 配置Host域名访问"
echo "=================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📍 当前电脑IP: $LOCAL_IP"
echo ""

# 定义友好的域名
DOMAINS=(
    "labubu.local"
    "labubu-gallery.local" 
    "wallpaper.local"
    "gallery.local"
)

echo "🔧 配置电脑端hosts文件"
echo "--------------------"

# 备份现有hosts文件
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 已备份原hosts文件"

# 添加域名映射
echo "添加域名映射到hosts文件..."
for domain in "${DOMAINS[@]}"; do
    # 检查是否已存在
    if grep -q "$domain" /etc/hosts; then
        echo "  ⚠️  $domain 已存在，跳过"
    else
        echo "$LOCAL_IP $domain" | sudo tee -a /etc/hosts > /dev/null
        echo "  ✅ 添加 $domain -> $LOCAL_IP"
    fi
done

echo ""
echo "📱 手机端hosts配置指南"
echo "--------------------"
echo "由于手机无法直接修改hosts文件，我们提供以下方案："
echo ""

echo "方案1: 使用路由器DNS设置 (推荐)"
echo "  1. 登录路由器管理界面: http://172.27.0.1"
echo "  2. 找到DNS设置或静态DNS条目"
echo "  3. 添加以下域名映射:"
for domain in "${DOMAINS[@]}"; do
    echo "     $domain -> $LOCAL_IP"
done

echo ""
echo "方案2: 手机端DNS应用 (需要root)"
echo "  • Android: 使用AdAway、Hosts Editor等应用"
echo "  • iOS: 需要越狱后使用相关工具"
echo ""

echo "方案3: 本地DNS服务器"
echo "  我们可以在电脑上搭建一个简单的DNS服务器"
echo ""

# 创建本地DNS服务器
echo "🚀 创建本地DNS服务器"
echo "------------------"

# 安装dnsmasq
if ! command -v dnsmasq &> /dev/null; then
    echo "安装dnsmasq DNS服务器..."
    sudo apt update
    sudo apt install -y dnsmasq
fi

# 配置dnsmasq
echo "配置DNS服务器..."
sudo tee /etc/dnsmasq.d/labubu-gallery.conf > /dev/null << EOF
# Labubu Gallery DNS配置
interface=eth0
bind-interfaces
listen-address=127.0.0.1
listen-address=$LOCAL_IP

# 域名映射
$(for domain in "${DOMAINS[@]}"; do echo "address=/$domain/$LOCAL_IP"; done)

# 上游DNS服务器
server=8.8.8.8
server=8.8.4.4
EOF

# 重启dnsmasq服务
echo "启动DNS服务器..."
sudo systemctl restart dnsmasq
sudo systemctl enable dnsmasq

if systemctl is-active --quiet dnsmasq; then
    echo "✅ DNS服务器启动成功"
    echo "   监听地址: $LOCAL_IP:53"
else
    echo "❌ DNS服务器启动失败"
fi

echo ""
echo "📋 测试域名访问"
echo "-------------"
echo "电脑端测试:"
for domain in "${DOMAINS[@]}"; do
    if curl -s --connect-timeout 3 http://$domain:3000 > /dev/null; then
        echo "  ✅ http://$domain:3000 - 可访问"
    else
        echo "  ❌ http://$domain:3000 - 无法访问"
    fi
done

echo ""
echo "🎯 访问地址汇总"
echo "-------------"
echo "现在你可以使用以下任意地址访问:"
echo ""
echo "📱 手机端 (需要配置DNS):"
for domain in "${DOMAINS[@]}"; do
    echo "  • http://$domain:3000"
done

echo ""
echo "💻 电脑端 (已配置hosts):"
for domain in "${DOMAINS[@]}"; do
    echo "  • http://$domain:3000"
done

echo ""
echo "🔧 手机DNS配置步骤"
echo "----------------"
echo "1. 手机WiFi设置 -> 高级设置"
echo "2. 将DNS服务器设置为: $LOCAL_IP"
echo "3. 保存并重新连接WiFi"
echo "4. 在手机浏览器访问: http://labubu.local:3000"
echo ""

# 创建测试页面
echo "📄 创建域名测试页面"
echo "-----------------"
cat > /home/ljh/domain_test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Labubu Gallery - 域名访问测试</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
            text-align: center; 
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .success { 
            background: rgba(40, 167, 69, 0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 1px solid rgba(40, 167, 69, 0.3);
        }
        .info { 
            background: rgba(23, 162, 184, 0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 1px solid rgba(23, 162, 184, 0.3);
        }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: rgba(255,255,255,0.2); 
            color: white; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 10px; 
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .button:hover { 
            background: rgba(255,255,255,0.3); 
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .domain-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .domain-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .emoji { font-size: 1.5em; margin-right: 10px; }
        @media (max-width: 600px) {
            .container { padding: 20px; }
            h1 { font-size: 2em; }
            .domain-list { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐰 Labubu Gallery 域名访问成功！</h1>
        
        <div class="success">
            <h3><span class="emoji">🎉</span>恭喜！域名访问配置成功！</h3>
            <p>你现在可以使用友好的域名访问Labubu壁纸画廊了！</p>
        </div>
        
        <div class="info">
            <h3><span class="emoji">📊</span>当前访问信息</h3>
            <p><strong>访问域名:</strong> <span id="currentDomain"></span></p>
            <p><strong>服务器IP:</strong> $LOCAL_IP</p>
            <p><strong>访问时间:</strong> <span id="currentTime"></span></p>
            <p><strong>用户代理:</strong> <span id="userAgent"></span></p>
        </div>
        
        <div class="info">
            <h3><span class="emoji">🌐</span>可用域名列表</h3>
            <div class="domain-list">
$(for domain in "${DOMAINS[@]}"; do
    echo "                <div class=\"domain-item\">"
    echo "                    <strong>$domain</strong><br>"
    echo "                    <a href=\"http://$domain:3000\" class=\"button\">访问画廊</a>"
    echo "                    <a href=\"http://$domain:8080/network_test.html\" class=\"button\">网络测试</a>"
    echo "                </div>"
done)
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="http://labubu.local:3000" class="button" style="font-size: 1.2em; padding: 15px 30px;">
                <span class="emoji">🚀</span>进入Labubu壁纸画廊
            </a>
        </div>
        
        <div class="info">
            <h3><span class="emoji">📱</span>手机访问配置</h3>
            <p>要在手机上使用域名访问，请按以下步骤配置：</p>
            <ol>
                <li>打开手机WiFi设置</li>
                <li>点击已连接的WiFi网络</li>
                <li>找到"DNS"或"域名服务器"设置</li>
                <li>将DNS设置为：<strong>$LOCAL_IP</strong></li>
                <li>保存并重新连接WiFi</li>
                <li>在浏览器访问：<strong>http://labubu.local:3000</strong></li>
            </ol>
        </div>
    </div>
    
    <script>
        document.getElementById('currentDomain').textContent = window.location.hostname + ':' + window.location.port;
        document.getElementById('currentTime').textContent = new Date().toLocaleString();
        document.getElementById('userAgent').textContent = navigator.userAgent.substring(0, 100) + '...';
    </script>
</body>
</html>
EOF

echo "✅ 域名测试页面已创建"
echo ""

# 生成二维码
echo "📱 域名访问二维码"
echo "---------------"
echo "扫描以下二维码访问域名测试页面:"
qrencode -t ANSI "http://labubu.local:8080/domain_test.html"

echo ""
echo "🎯 配置完成总结"
echo "-------------"
echo "✅ 电脑hosts文件已配置"
echo "✅ 本地DNS服务器已启动"
echo "✅ 域名测试页面已创建"
echo ""
echo "📋 下一步操作:"
echo "1. 电脑端测试: http://labubu.local:3000"
echo "2. 手机端配置DNS为: $LOCAL_IP"
echo "3. 手机端访问: http://labubu.local:3000"
echo ""
echo "🔧 如需恢复原配置:"
echo "   sudo cp /etc/hosts.backup.* /etc/hosts"
echo "   sudo systemctl stop dnsmasq"
EOF
