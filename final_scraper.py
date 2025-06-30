#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最终版壁纸爬虫脚本 - 基于调试结果优化
"""

import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin, urlparse
import time
import random
from pathlib import Path
import logging
import json

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('final_scraper.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class FinalWallpaperScraper:
    def __init__(self, base_url="https://www.labubuwallpaper.xyz/"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        
        # 创建下载目录
        self.download_dir = Path("labubu_wallpapers")
        self.img_dir = self.download_dir / "images"
        self.video_dir = self.download_dir / "videos"
        
        for dir_path in [self.download_dir, self.img_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.downloaded_urls = set()
        self.failed_urls = set()

    def get_page_content(self, url):
        """获取页面内容"""
        try:
            logging.info(f"正在获取页面: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logging.error(f"获取页面失败: {e}")
            return None

    def extract_all_media_urls(self, html_content, page_url):
        """提取所有媒体URL"""
        soup = BeautifulSoup(html_content, 'html.parser')
        media_urls = {'images': set(), 'videos': set()}
        
        # 1. 从img标签提取图片URL
        img_tags = soup.find_all('img')
        for img in img_tags:
            src = img.get('src')
            if src and self.is_valid_image_url(src):
                full_url = urljoin(page_url, src)
                media_urls['images'].add(full_url)
                logging.info(f"从img标签发现图片: {full_url}")
        
        # 2. 从video标签提取视频URL和poster图片
        video_tags = soup.find_all('video')
        for video in video_tags:
            # 视频源
            src = video.get('src')
            if src and self.is_valid_video_url(src):
                full_url = urljoin(page_url, src)
                media_urls['videos'].add(full_url)
                logging.info(f"从video标签发现视频: {full_url}")
            
            # poster图片
            poster = video.get('poster')
            if poster and self.is_valid_image_url(poster):
                full_url = urljoin(page_url, poster)
                media_urls['images'].add(full_url)
                logging.info(f"从video poster发现图片: {full_url}")
        
        # 3. 使用正则表达式从页面源码中提取URL
        # 图片URL模式
        img_patterns = [
            r'https://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp)',
            r'https://[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|bmp|webp|svg)'
        ]
        
        for pattern in img_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if self.is_valid_image_url(match):
                    media_urls['images'].add(match)
                    logging.info(f"从源码正则发现图片: {match}")
        
        # 视频URL模式
        video_patterns = [
            r'https://res\.labubuwallpaper\.xyz/[^\s"\'<>]+\.(?:mp4|mov|avi)',
            r'https://[^\s"\'<>]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv)'
        ]
        
        for pattern in video_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if self.is_valid_video_url(match):
                    media_urls['videos'].add(match)
                    logging.info(f"从源码正则发现视频: {match}")
        
        return media_urls

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

    def download_file(self, url, file_path):
        """下载文件"""
        if url in self.downloaded_urls:
            logging.info(f"文件已下载，跳过: {url}")
            return True
            
        try:
            logging.info(f"正在下载: {url}")
            response = self.session.get(url, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = os.path.getsize(file_path)
            if file_size < 1024:  # 小于1KB可能是错误页面
                logging.warning(f"文件太小，删除: {file_path} ({file_size} bytes)")
                os.remove(file_path)
                return False
            
            self.downloaded_urls.add(url)
            logging.info(f"下载成功: {file_path} ({file_size} bytes)")
            return True
            
        except Exception as e:
            self.failed_urls.add(url)
            logging.error(f"下载失败: {url} - {e}")
            return False

    def get_filename_from_url(self, url):
        """从URL生成文件名"""
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        if not filename or '.' not in filename:
            # 生成文件名
            url_hash = abs(hash(url)) % 100000
            if self.is_valid_image_url(url):
                filename = f"image_{url_hash}.jpg"
            elif self.is_valid_video_url(url):
                filename = f"video_{url_hash}.mp4"
        
        # 清理文件名
        filename = re.sub(r'[^\w\-_\.]', '_', filename)
        return filename

    def scrape_all(self):
        """开始爬取"""
        logging.info("开始爬取Labubu壁纸网站...")
        
        # 获取主页内容
        html_content = self.get_page_content(self.base_url)
        if not html_content:
            logging.error("无法获取主页内容")
            return
        
        # 提取所有媒体URL
        media_urls = self.extract_all_media_urls(html_content, self.base_url)
        
        # 转换为列表
        all_images = list(media_urls['images'])
        all_videos = list(media_urls['videos'])
        
        logging.info(f"总共发现 {len(all_images)} 个图片, {len(all_videos)} 个视频")
        
        # 保存发现的URL列表
        url_data = {
            'images': all_images,
            'videos': all_videos,
            'total_images': len(all_images),
            'total_videos': len(all_videos)
        }
        
        with open(self.download_dir / "discovered_urls.json", 'w', encoding='utf-8') as f:
            json.dump(url_data, f, indent=2, ensure_ascii=False)
        
        # 下载图片
        logging.info("开始下载图片...")
        for i, img_url in enumerate(all_images, 1):
            filename = self.get_filename_from_url(img_url)
            file_path = self.img_dir / f"{i:04d}_{filename}"
            self.download_file(img_url, file_path)
            time.sleep(random.uniform(0.5, 1.5))  # 随机延迟
        
        # 下载视频
        logging.info("开始下载视频...")
        for i, video_url in enumerate(all_videos, 1):
            filename = self.get_filename_from_url(video_url)
            file_path = self.video_dir / f"{i:04d}_{filename}"
            self.download_file(video_url, file_path)
            time.sleep(random.uniform(1, 2))  # 视频文件较大，延迟稍长
        
        # 输出统计信息
        logging.info("=" * 50)
        logging.info("爬取完成!")
        logging.info(f"发现图片: {len(all_images)} 个")
        logging.info(f"发现视频: {len(all_videos)} 个")
        logging.info(f"成功下载: {len(self.downloaded_urls)} 个文件")
        logging.info(f"下载失败: {len(self.failed_urls)} 个文件")
        logging.info(f"文件保存在: {self.download_dir.absolute()}")
        
        # 保存失败的URL
        if self.failed_urls:
            with open(self.download_dir / "failed_downloads.txt", 'w', encoding='utf-8') as f:
                for url in self.failed_urls:
                    f.write(f"{url}\n")
            logging.info(f"失败的URL已保存到: failed_downloads.txt")

def main():
    scraper = FinalWallpaperScraper()
    
    try:
        scraper.scrape_all()
    except KeyboardInterrupt:
        logging.info("用户中断了爬取过程")
    except Exception as e:
        logging.error(f"爬取过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
