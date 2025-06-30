#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的HTTP服务器，用于测试Labubu画廊网页
"""

import http.server
import socketserver
import webbrowser
import os
import threading
import time

def start_server():
    PORT = 8080
    
    # 切换到包含HTML文件的目录
    os.chdir('/home/ljh')
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🌐 HTTP服务器已启动")
            print(f"📍 服务地址: http://localhost:{PORT}")
            print(f"🎨 画廊页面: http://localhost:{PORT}/labubu_gallery.html")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 50)
            
            # 延迟2秒后自动打开浏览器
            def open_browser():
                time.sleep(2)
                try:
                    webbrowser.open(f'http://localhost:{PORT}/labubu_gallery.html')
                    print("🚀 已自动打开浏览器")
                except:
                    print("❌ 无法自动打开浏览器，请手动访问上述地址")
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {PORT} 已被占用，请尝试其他端口")
        else:
            print(f"❌ 启动服务器时出错: {e}")

if __name__ == "__main__":
    start_server()
