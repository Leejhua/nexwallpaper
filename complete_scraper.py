#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整版爬虫 - 爬取所有子页面资源
"""

import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin, urlparse
import time
import random
from pathlib import Path
import json
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_scraper.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class CompleteScraper:
    def __init__(self):
        self.base_url = "https://www.labubuwallpaper.xyz/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        })
        
        # 创建目录
        self.download_dir = Path("complete_labubu_collection")
        self.img_dir = self.download_dir / "images"
        self.video_dir = self.download_dir / "videos"
        
        for dir_path in [self.download_dir, self.img_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.downloaded_urls = set()
        self.failed_urls = set()
        self.all_media_urls = {'images': set(), 'videos': set()}
        
        # 访问间隔配置
        self.page_delay = (3, 6)  # 页面间隔3-6秒
        self.download_delay = (1, 3)  # 下载间隔1-3秒

    def get_page_with_delay(self, url):
        """带延迟的页面获取"""
        try:
            logging.info(f"正在访问: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # 随机延迟
            delay = random.uniform(*self.page_delay)
            logging.info(f"页面获取成功，等待 {delay:.1f} 秒...")
            time.sleep(delay)
            
            return response.text
        except Exception as e:
            logging.error(f"页面获取失败: {url} - {e}")
            return None

    def extract_media_from_page(self, html_content, page_url):
        """从页面提取媒体URL"""
        soup = BeautifulSoup(html_content, 'html.parser')
        page_media = {'images': set(), 'videos': set()}
        
        # 提取图片
        for img in soup.find_all('img'):
            src = img.get('src')
            if src and self.is_valid_image_url(src):
                full_url = urljoin(page_url, src)
                page_media['images'].add(full_url)
        
        # 提取视频
        for video in soup.find_all('video'):
            src = video.get('src')
            if src and self.is_valid_video_url(src):
                full_url = urljoin(page_url, src)
                page_media['videos'].add(full_url)
            
            # poster图片
            poster = video.get('poster')
            if poster and self.is_valid_image_url(poster):
                full_url = urljoin(page_url, poster)
                page_media['images'].add(full_url)
        
        # 正则提取
        img_patterns = [
            r'https://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp)',
        ]
        
        video_patterns = [
            r'https://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:mp4|mov|avi)',
        ]
        
        for pattern in img_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                page_media['images'].add(match)
        
        for pattern in video_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                page_media['videos'].add(match)
        
        return page_media

    def is_valid_image_url(self, url):
        """检查图片URL"""
        if not url or len(url) < 10:
            return False
        return any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])

    def is_valid_video_url(self, url):
        """检查视频URL"""
        if not url or len(url) < 10:
            return False
        return any(ext in url.lower() for ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'])

    def download_file(self, url, file_path):
        """下载文件"""
        if url in self.downloaded_urls:
            return True
            
        try:
            logging.info(f"下载: {url}")
            response = self.session.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = os.path.getsize(file_path)
            if file_size < 1024:
                os.remove(file_path)
                return False
            
            self.downloaded_urls.add(url)
            logging.info(f"下载成功: {file_size} bytes")
            
            # 下载延迟
            delay = random.uniform(*self.download_delay)
            time.sleep(delay)
            return True
            
        except Exception as e:
            self.failed_urls.add(url)
            logging.error(f"下载失败: {e}")
            return False

    def get_filename(self, url):
        """生成文件名"""
        filename = os.path.basename(urlparse(url).path)
        if not filename or '.' not in filename:
            url_hash = abs(hash(url)) % 100000
            if self.is_valid_image_url(url):
                filename = f"img_{url_hash}.jpg"
            else:
                filename = f"vid_{url_hash}.mp4"
        return re.sub(r'[^\w\-_\.]', '_', filename)

    def scrape_all_pages(self):
        """爬取所有页面"""
        # 已知的子页面列表（从分析结果中获取）
        subpages = [
            "https://www.labubuwallpaper.xyz/",  # 主页
            "https://www.labubuwallpaper.xyz/label/live",
            "https://www.labubuwallpaper.xyz/label/iphone", 
            "https://www.labubuwallpaper.xyz/label/desktop",
            "https://www.labubuwallpaper.xyz/label/4k",
        ]
        
        # 个别壁纸页面
        wallpaper_pages = [
            "https://www.labubuwallpaper.xyz/p/af97ff0df4bbfb7ec34b8774ee3c0a95",
            "https://www.labubuwallpaper.xyz/p/ec96fd09793e7efd5404ab638c8952ae",
            "https://www.labubuwallpaper.xyz/p/0930348e081c2bea3bc0fb3038eb2644",
            "https://www.labubuwallpaper.xyz/p/523c9bda7fb7d9abd1fac90feaad33c7",
            "https://www.labubuwallpaper.xyz/p/da6f70713007fb3be1a8f664bad802c4",
        ]
        
        all_pages = subpages + wallpaper_pages
        
        logging.info(f"开始爬取 {len(all_pages)} 个页面...")
        
        for i, page_url in enumerate(all_pages, 1):
            logging.info(f"处理页面 {i}/{len(all_pages)}: {page_url}")
            
            html_content = self.get_page_with_delay(page_url)
            if html_content:
                media = self.extract_media_from_page(html_content, page_url)
                self.all_media_urls['images'].update(media['images'])
                self.all_media_urls['videos'].update(media['videos'])
                
                logging.info(f"本页发现: {len(media['images'])} 图片, {len(media['videos'])} 视频")
        
        # 开始下载
        self.download_all_media()

    def download_all_media(self):
        """下载所有媒体文件"""
        all_images = list(self.all_media_urls['images'])
        all_videos = list(self.all_media_urls['videos'])
        
        logging.info(f"总共发现: {len(all_images)} 图片, {len(all_videos)} 视频")
        
        # 下载图片
        logging.info("开始下载图片...")
        for i, url in enumerate(all_images, 1):
            filename = f"{i:04d}_{self.get_filename(url)}"
            file_path = self.img_dir / filename
            self.download_file(url, file_path)
        
        # 下载视频
        logging.info("开始下载视频...")
        for i, url in enumerate(all_videos, 1):
            filename = f"{i:04d}_{self.get_filename(url)}"
            file_path = self.video_dir / filename
            self.download_file(url, file_path)
        
        # 保存统计信息
        stats = {
            'total_images': len(all_images),
            'total_videos': len(all_videos),
            'downloaded': len(self.downloaded_urls),
            'failed': len(self.failed_urls)
        }
        
        with open(self.download_dir / "stats.json", 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        
        logging.info("=" * 50)
        logging.info("爬取完成!")
        logging.info(f"发现图片: {len(all_images)} 个")
        logging.info(f"发现视频: {len(all_videos)} 个") 
        logging.info(f"成功下载: {len(self.downloaded_urls)} 个")
        logging.info(f"下载失败: {len(self.failed_urls)} 个")

def main():
    scraper = CompleteScraper()
    try:
        scraper.scrape_all_pages()
    except KeyboardInterrupt:
        logging.info("用户中断")
    except Exception as e:
        logging.error(f"错误: {e}")

if __name__ == "__main__":
    main()
