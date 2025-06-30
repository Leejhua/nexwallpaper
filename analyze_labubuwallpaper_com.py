#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析 labubuwallpaper.com 网站结构和资源
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random
import re
import json

class LabubuwallpaperComAnalyzer:
    def __init__(self):
        self.base_url = "https://labubuwallpaper.com/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        })
        
        self.discovered_pages = set()
        self.media_urls = {'images': set(), 'videos': set()}
        
    def get_page_with_delay(self, url):
        """获取页面内容，带延迟"""
        try:
            print(f"正在访问: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # 随机延迟 2-4 秒
            delay = random.uniform(2, 4)
            print(f"页面获取成功，等待 {delay:.1f} 秒...")
            time.sleep(delay)
            
            return response.text
        except Exception as e:
            print(f"获取页面失败: {url} - {e}")
            return None

    def discover_subpages(self, start_url, max_pages=20):
        """发现子页面"""
        to_visit = [start_url]
        visited = set()
        
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue
                
            visited.add(current_url)
            html_content = self.get_page_with_delay(current_url)
            
            if not html_content:
                continue
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 提取当前页面的媒体资源
            self.extract_media_from_page(html_content, current_url)
            
            # 查找子页面链接
            links = soup.find_all('a', href=True)
            base_domain = urlparse(self.base_url).netloc
            
            for link in links:
                href = link['href']
                full_url = urljoin(current_url, href)
                parsed_url = urlparse(full_url)
                
                # 只处理同域名的链接
                if parsed_url.netloc == base_domain:
                    clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                    if clean_url not in visited and clean_url not in to_visit:
                        to_visit.append(clean_url)
                        print(f"发现子页面: {clean_url}")
        
        self.discovered_pages = visited
        return visited

    def extract_media_from_page(self, html_content, page_url):
        """从页面提取媒体URL"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 提取图片
        img_tags = soup.find_all('img')
        for img in img_tags:
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src and self.is_valid_image_url(src):
                full_url = urljoin(page_url, src)
                self.media_urls['images'].add(full_url)
                print(f"发现图片: {full_url}")
        
        # 提取视频
        video_tags = soup.find_all('video')
        for video in video_tags:
            src = video.get('src')
            if src and self.is_valid_video_url(src):
                full_url = urljoin(page_url, src)
                self.media_urls['videos'].add(full_url)
                print(f"发现视频: {full_url}")
            
            # 检查poster图片
            poster = video.get('poster')
            if poster and self.is_valid_image_url(poster):
                full_url = urljoin(page_url, poster)
                self.media_urls['images'].add(full_url)
                print(f"发现视频封面: {full_url}")
        
        # 使用正则表达式从页面源码中提取媒体URL
        self.extract_urls_from_text(html_content, page_url)

    def extract_urls_from_text(self, text, base_url):
        """从文本中提取媒体URL"""
        # 图片URL模式
        img_patterns = [
            r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp|svg)(?:\?[^\s"\'<>]*)?',
            r'https?://[^/]*labubuwallpaper\.com[^\s"\'<>]*\.(?:jpg|jpeg|png|gif|bmp|webp)',
        ]
        
        # 视频URL模式
        video_patterns = [
            r'https?://[^\s"\'<>]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv)(?:\?[^\s"\'<>]*)?',
            r'https?://[^/]*labubuwallpaper\.com[^\s"\'<>]*\.(?:mp4|mov|avi)',
        ]
        
        for pattern in img_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if self.is_valid_image_url(match):
                    self.media_urls['images'].add(match)
                    print(f"从源码发现图片: {match}")
        
        for pattern in video_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if self.is_valid_video_url(match):
                    self.media_urls['videos'].add(match)
                    print(f"从源码发现视频: {match}")

    def is_valid_image_url(self, url):
        """检查是否为有效图片URL"""
        if not url or len(url) < 10:
            return False
        url_lower = url.lower()
        return any(ext in url_lower for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'])

    def is_valid_video_url(self, url):
        """检查是否为有效视频URL"""
        if not url or len(url) < 10:
            return False
        url_lower = url.lower()
        return any(ext in url_lower for ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'])

    def analyze_and_save(self):
        """分析网站并保存结果"""
        print("开始分析 labubuwallpaper.com...")
        
        # 发现子页面并提取资源
        discovered_pages = self.discover_subpages(self.base_url, max_pages=15)
        
        # 整理结果
        results = {
            'base_url': self.base_url,
            'discovered_pages': list(discovered_pages),
            'total_pages': len(discovered_pages),
            'images': list(self.media_urls['images']),
            'videos': list(self.media_urls['videos']),
            'total_images': len(self.media_urls['images']),
            'total_videos': len(self.media_urls['videos'])
        }
        
        # 保存到文件
        with open('labubuwallpaper_com_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print("\n" + "="*60)
        print("分析完成!")
        print(f"发现页面: {len(discovered_pages)} 个")
        print(f"发现图片: {len(self.media_urls['images'])} 个")
        print(f"发现视频: {len(self.media_urls['videos'])} 个")
        print("结果已保存到: labubuwallpaper_com_analysis.json")
        print("="*60)
        
        return results

def main():
    analyzer = LabubuwallpaperComAnalyzer()
    try:
        results = analyzer.analyze_and_save()
        return results
    except KeyboardInterrupt:
        print("\n用户中断了分析过程")
    except Exception as e:
        print(f"分析过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
