#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试版爬虫脚本 - 详细分析页面内容
"""

import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin

def debug_scraper():
    url = "https://www.labubuwallpaper.xyz/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"正在访问: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"响应状态码: {response.status_code}")
        print(f"内容长度: {len(response.text)}")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 详细分析img标签
        print("\n=== IMG 标签分析 ===")
        img_tags = soup.find_all('img')
        print(f"找到 {len(img_tags)} 个img标签")
        
        for i, img in enumerate(img_tags):
            print(f"\nIMG {i+1}:")
            print(f"  完整标签: {img}")
            print(f"  src: {img.get('src')}")
            print(f"  data-src: {img.get('data-src')}")
            print(f"  data-original: {img.get('data-original')}")
            print(f"  class: {img.get('class')}")
            
            # 构建完整URL
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src:
                full_url = urljoin(url, src)
                print(f"  完整URL: {full_url}")
        
        # 详细分析video标签
        print("\n=== VIDEO 标签分析 ===")
        video_tags = soup.find_all('video')
        print(f"找到 {len(video_tags)} 个video标签")
        
        for i, video in enumerate(video_tags):
            print(f"\nVIDEO {i+1}:")
            print(f"  完整标签: {video}")
            print(f"  src: {video.get('src')}")
            print(f"  poster: {video.get('poster')}")
            
            # 检查source标签
            sources = video.find_all('source')
            for j, source in enumerate(sources):
                print(f"  SOURCE {j+1}: {source.get('src')}")
            
            src = video.get('src')
            if src:
                full_url = urljoin(url, src)
                print(f"  完整URL: {full_url}")
        
        # 在页面源码中搜索媒体URL
        print("\n=== 源码中的媒体URL ===")
        
        # 搜索图片URL
        img_patterns = [
            r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp|svg)',
            r'https?://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp)',
        ]
        
        for pattern in img_patterns:
            matches = re.findall(pattern, response.text, re.IGNORECASE)
            print(f"\n图片URL模式 '{pattern}' 找到 {len(matches)} 个匹配:")
            for match in matches[:10]:  # 只显示前10个
                print(f"  {match}")
        
        # 搜索视频URL
        video_patterns = [
            r'https?://[^\s"\'<>]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv)',
            r'https?://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:mp4|mov|avi)',
        ]
        
        for pattern in video_patterns:
            matches = re.findall(pattern, response.text, re.IGNORECASE)
            print(f"\n视频URL模式 '{pattern}' 找到 {len(matches)} 个匹配:")
            for match in matches[:10]:  # 只显示前10个
                print(f"  {match}")
        
        # 保存页面源码用于分析
        with open('page_source.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"\n页面源码已保存到 page_source.html")
        
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    debug_scraper()
