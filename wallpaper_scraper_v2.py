#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
改进版壁纸网站爬虫脚本
专门针对 https://www.labubuwallpaper.xyz/ 网站优化
"""

import requests
from bs4 import BeautifulSoup
import os
import urllib.parse
from urllib.parse import urljoin, urlparse
import time
import random
from pathlib import Path
import logging
import json
import re

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper_v2.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class ImprovedWallpaperScraper:
    def __init__(self, base_url="https://www.labubuwallpaper.xyz/"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        # 创建下载目录
        self.download_dir = Path("wallpaper_downloads_v2")
        self.img_dir = self.download_dir / "images"
        self.video_dir = self.download_dir / "videos"
        
        for dir_path in [self.download_dir, self.img_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.downloaded_urls = set()
        self.failed_urls = set()
        self.all_media_urls = {'images': set(), 'videos': set()}

    def get_page_content(self, url, retries=3):
        """获取页面内容"""
        for attempt in range(retries):
            try:
                logging.info(f"正在获取页面: {url} (尝试 {attempt + 1}/{retries})")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                response.encoding = response.apparent_encoding
                return response.text
            except requests.RequestException as e:
                logging.warning(f"获取页面失败 (尝试 {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(2, 5))
                else:
                    logging.error(f"获取页面最终失败: {url}")
                    return None

    def extract_media_urls_from_page(self, html_content, page_url):
        """从单个页面提取媒体URL"""
        soup = BeautifulSoup(html_content, 'html.parser')
        page_media = {'images': [], 'videos': []}
        
        # 提取图片URL - 多种方式
        img_selectors = [
            'img[src]',
            'img[data-src]', 
            'img[data-original]',
            'img[data-lazy]',
            '[style*="background-image"]'
        ]
        
        for selector in img_selectors:
            elements = soup.select(selector)
            for element in elements:
                urls = []
                if element.name == 'img':
                    urls = [
                        element.get('src'),
                        element.get('data-src'),
                        element.get('data-original'),
                        element.get('data-lazy')
                    ]
                else:
                    # 处理背景图片
                    style = element.get('style', '')
                    bg_match = re.search(r'background-image:\s*url\(["\']?([^"\']+)["\']?\)', style)
                    if bg_match:
                        urls = [bg_match.group(1)]
                
                for url in urls:
                    if url and self.is_valid_media_url(url, 'image'):
                        full_url = urljoin(page_url, url)
                        page_media['images'].append(full_url)
                        logging.info(f"发现图片: {full_url}")
        
        # 提取视频URL
        video_selectors = [
            'video[src]',
            'video source[src]',
            '[data-video-src]'
        ]
        
        for selector in video_selectors:
            elements = soup.select(selector)
            for element in elements:
                url = element.get('src') or element.get('data-video-src')
                if url and self.is_valid_media_url(url, 'video'):
                    full_url = urljoin(page_url, url)
                    page_media['videos'].append(full_url)
                    logging.info(f"发现视频: {full_url}")
        
        # 在页面源码中搜索媒体URL模式
        self.extract_urls_from_text(html_content, page_url, page_media)
        
        return page_media

    def extract_urls_from_text(self, text, base_url, media_dict):
        """从文本中提取媒体URL"""
        # 图片URL模式
        img_patterns = [
            r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp|svg)(?:\?[^\s"\'<>]*)?',
            r'https?://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp)',
        ]
        
        # 视频URL模式  
        video_patterns = [
            r'https?://[^\s"\'<>]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv)(?:\?[^\s"\'<>]*)?',
            r'https?://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:mp4|mov|avi)',
        ]
        
        for pattern in img_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if self.is_valid_media_url(match, 'image'):
                    media_dict['images'].append(match)
                    logging.info(f"从文本中发现图片: {match}")
        
        for pattern in video_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if self.is_valid_media_url(match, 'video'):
                    media_dict['videos'].append(match)
                    logging.info(f"从文本中发现视频: {match}")

    def is_valid_media_url(self, url, media_type):
        """检查是否为有效的媒体URL"""
        if not url or len(url) < 10:
            return False
            
        url_lower = url.lower()
        
        if media_type == 'image':
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
            return any(ext in url_lower for ext in image_extensions)
        elif media_type == 'video':
            video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
            return any(ext in url_lower for ext in video_extensions)
        
        return False

    def download_file(self, url, file_path, retries=3):
        """下载文件"""
        if url in self.downloaded_urls:
            logging.info(f"文件已下载，跳过: {url}")
            return True
            
        for attempt in range(retries):
            try:
                logging.info(f"正在下载: {url}")
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                # 检查内容类型
                content_type = response.headers.get('content-type', '').lower()
                if not any(t in content_type for t in ['image', 'video', 'octet-stream']):
                    logging.warning(f"跳过非媒体文件: {url} (类型: {content_type})")
                    return False
                
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                file_size = os.path.getsize(file_path)
                if file_size < 1024:  # 小于1KB的文件可能是错误页面
                    logging.warning(f"文件太小，可能下载失败: {file_path} ({file_size} bytes)")
                    os.remove(file_path)
                    return False
                
                self.downloaded_urls.add(url)
                logging.info(f"下载成功: {file_path} ({file_size} bytes)")
                return True
                
            except Exception as e:
                logging.warning(f"下载失败 (尝试 {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(1, 3))
                else:
                    self.failed_urls.add(url)
                    logging.error(f"下载最终失败: {url}")
                    return False

    def get_filename_from_url(self, url):
        """从URL获取文件名"""
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        if not filename or '.' not in filename:
            # 生成文件名
            url_hash = abs(hash(url)) % 100000
            if self.is_valid_media_url(url, 'image'):
                filename = f"image_{url_hash}.jpg"
            elif self.is_valid_media_url(url, 'video'):
                filename = f"video_{url_hash}.mp4"
            else:
                filename = f"file_{url_hash}"
        
        # 清理文件名
        filename = re.sub(r'[^\w\-_\.]', '_', filename)
        return filename

    def scrape_single_page(self, url):
        """爬取单个页面"""
        html_content = self.get_page_content(url)
        if not html_content:
            return
        
        media_urls = self.extract_media_urls_from_page(html_content, url)
        
        # 添加到总集合中
        for img_url in media_urls['images']:
            self.all_media_urls['images'].add(img_url)
        
        for video_url in media_urls['videos']:
            self.all_media_urls['videos'].add(video_url)
        
        logging.info(f"页面 {url} 发现: {len(media_urls['images'])} 图片, {len(media_urls['videos'])} 视频")

    def scrape_all(self):
        """爬取所有资源"""
        logging.info("开始爬取壁纸网站...")
        
        # 先爬取主页
        self.scrape_single_page(self.base_url)
        
        # 等待一下
        time.sleep(2)
        
        # 转换为列表并去重
        all_images = list(self.all_media_urls['images'])
        all_videos = list(self.all_media_urls['videos'])
        
        logging.info(f"总共发现 {len(all_images)} 个图片, {len(all_videos)} 个视频")
        
        # 保存URL列表
        with open(self.download_dir / "found_urls.json", 'w', encoding='utf-8') as f:
            json.dump({
                'images': all_images,
                'videos': all_videos
            }, f, indent=2, ensure_ascii=False)
        
        # 下载图片
        logging.info("开始下载图片...")
        for i, img_url in enumerate(all_images, 1):
            filename = self.get_filename_from_url(img_url)
            file_path = self.img_dir / f"{i:04d}_{filename}"
            self.download_file(img_url, file_path)
            time.sleep(random.uniform(0.5, 2))
        
        # 下载视频
        logging.info("开始下载视频...")
        for i, video_url in enumerate(all_videos, 1):
            filename = self.get_filename_from_url(video_url)
            file_path = self.video_dir / f"{i:04d}_{filename}"
            self.download_file(video_url, file_path)
            time.sleep(random.uniform(1, 3))
        
        # 输出统计信息
        logging.info("爬取完成!")
        logging.info(f"成功下载: {len(self.downloaded_urls)} 个文件")
        logging.info(f"下载失败: {len(self.failed_urls)} 个文件")
        logging.info(f"文件保存在: {self.download_dir.absolute()}")
        
        # 保存失败的URL
        if self.failed_urls:
            with open(self.download_dir / "failed_urls.txt", 'w', encoding='utf-8') as f:
                for url in self.failed_urls:
                    f.write(f"{url}\n")

def main():
    scraper = ImprovedWallpaperScraper()
    
    try:
        scraper.scrape_all()
    except KeyboardInterrupt:
        logging.info("用户中断了爬取过程")
    except Exception as e:
        logging.error(f"爬取过程中出现错误: {e}")

if __name__ == "__main__":
    main()
