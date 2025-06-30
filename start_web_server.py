#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
可靠的HTTP服务器启动脚本
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

def start_server():
    # 设置工作目录
    work_dir = Path('/home/ljh')
    os.chdir(work_dir)
    
    # 检查HTML文件是否存在
    html_files = ['enhanced_gallery.html', 'labubu_gallery.html']
    for file in html_files:
        if not (work_dir / file).exists():
            print(f"❌ 文件不存在: {file}")
            return False
    
    PORT = 8080
    
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
            super().end_headers()
        
        def log_message(self, format, *args):
            print(f"[{self.address_string()}] {format % args}")
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print("=" * 60)
            print("🌐 Labubu壁纸画廊服务器已启动")
            print("=" * 60)
            print(f"📍 服务地址: http://localhost:{PORT}")
            print(f"🎨 增强画廊: http://localhost:{PORT}/enhanced_gallery.html")
            print(f"🖼️  基础画廊: http://localhost:{PORT}/labubu_gallery.html")
            print("=" * 60)
            print("⏹️  按 Ctrl+C 停止服务器")
            print("📁 工作目录:", work_dir.absolute())
            print("=" * 60)
            
            # 列出可用文件
            print("📄 可用文件:")
            for file in work_dir.glob("*.html"):
                print(f"   - {file.name}")
            print()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
        return True
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {PORT} 已被占用")
            print("请先停止其他服务器或使用其他端口")
        else:
            print(f"❌ 启动服务器时出错: {e}")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

if __name__ == "__main__":
    start_server()
