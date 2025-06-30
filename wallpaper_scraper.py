#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
壁纸网站爬虫脚本
爬取 https://www.labubuwallpaper.xyz/ 网站的图片和视频资源
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

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class WallpaperScraper:
    def __init__(self, base_url="https://www.labubuwallpaper.xyz/"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # 创建下载目录
        self.download_dir = Path("wallpaper_downloads")
        self.img_dir = self.download_dir / "images"
        self.video_dir = self.download_dir / "videos"
        
        for dir_path in [self.download_dir, self.img_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.downloaded_urls = set()
        self.failed_urls = set()

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

    def extract_media_urls(self, html_content, page_url):
        """从HTML内容中提取图片和视频URL"""
        soup = BeautifulSoup(html_content, 'html.parser')
        media_urls = {'images': [], 'videos': []}
        
        # 提取图片URL
        img_tags = soup.find_all('img')
        for img in img_tags:
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src:
                full_url = urljoin(page_url, src)
                if self.is_valid_image_url(full_url):
                    media_urls['images'].append(full_url)
                    logging.info(f"发现图片: {full_url}")
        
        # 提取视频URL
        video_tags = soup.find_all('video')
        for video in video_tags:
            src = video.get('src')
            if src:
                full_url = urljoin(page_url, src)
                media_urls['videos'].append(full_url)
                logging.info(f"发现视频: {full_url}")
            
            # 检查video标签内的source标签
            sources = video.find_all('source')
            for source in sources:
                src = source.get('src')
                if src:
                    full_url = urljoin(page_url, src)
                    media_urls['videos'].append(full_url)
                    logging.info(f"发现视频源: {full_url}")
        
        return media_urls

    def is_valid_image_url(self, url):
        """检查是否为有效的图片URL"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
        parsed_url = urlparse(url.lower())
        path = parsed_url.path
        
        # 检查文件扩展名
        for ext in image_extensions:
            if path.endswith(ext):
                return True
        
        # 检查是否包含图片相关关键词
        if any(keyword in url.lower() for keyword in ['image', 'img', 'photo', 'pic', 'wallpaper']):
            return True
            
        return False

    def download_file(self, url, file_path, retries=3):
        """下载文件"""
        if url in self.downloaded_urls:
            logging.info(f"文件已下载，跳过: {url}")
            return True
            
        for attempt in range(retries):
            try:
                logging.info(f"正在下载: {url} -> {file_path}")
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                
                self.downloaded_urls.add(url)
                logging.info(f"下载成功: {file_path}")
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
            # 如果没有文件名或扩展名，生成一个
            filename = f"file_{hash(url) % 100000}"
            if 'image' in url.lower() or any(ext in url.lower() for ext in ['.jpg', '.png', '.gif']):
                filename += '.jpg'
            elif 'video' in url.lower() or any(ext in url.lower() for ext in ['.mp4', '.avi', '.mov']):
                filename += '.mp4'
        
        # 清理文件名中的非法字符
        filename = "".join(c for c in filename if c.isalnum() or c in '.-_')
        return filename

    def discover_pages(self, start_url, max_pages=10):
        """发现网站中的所有页面"""
        discovered_urls = set([start_url])
        to_visit = [start_url]
        visited = set()
        
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue
                
            visited.add(current_url)
            logging.info(f"正在探索页面: {current_url}")
            
            html_content = self.get_page_content(current_url)
            if not html_content:
                continue
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 查找所有链接
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                full_url = urljoin(current_url, href)
                
                # 只处理同域名的链接
                if urlparse(full_url).netloc == urlparse(self.base_url).netloc:
                    if full_url not in discovered_urls and full_url not in visited:
                        discovered_urls.add(full_url)
                        to_visit.append(full_url)
        
        return list(discovered_urls)

    def scrape_all(self, max_pages=20):
        """爬取所有资源"""
        logging.info("开始爬取壁纸网站...")
        
        # 发现所有页面
        logging.info("正在发现网站页面...")
        all_pages = self.discover_pages(self.base_url, max_pages)
        logging.info(f"发现 {len(all_pages)} 个页面")
        
        all_media_urls = {'images': [], 'videos': []}
        
        # 从每个页面提取媒体URL
        for page_url in all_pages:
            html_content = self.get_page_content(page_url)
            if html_content:
                media_urls = self.extract_media_urls(html_content, page_url)
                all_media_urls['images'].extend(media_urls['images'])
                all_media_urls['videos'].extend(media_urls['videos'])
            
            # 添加随机延迟避免被封
            time.sleep(random.uniform(1, 3))
        
        # 去重
        all_media_urls['images'] = list(set(all_media_urls['images']))
        all_media_urls['videos'] = list(set(all_media_urls['videos']))
        
        logging.info(f"总共发现 {len(all_media_urls['images'])} 个图片, {len(all_media_urls['videos'])} 个视频")
        
        # 下载图片
        logging.info("开始下载图片...")
        for i, img_url in enumerate(all_media_urls['images'], 1):
            filename = self.get_filename_from_url(img_url)
            file_path = self.img_dir / f"{i:04d}_{filename}"
            self.download_file(img_url, file_path)
            time.sleep(random.uniform(0.5, 2))
        
        # 下载视频
        logging.info("开始下载视频...")
        for i, video_url in enumerate(all_media_urls['videos'], 1):
            filename = self.get_filename_from_url(video_url)
            file_path = self.video_dir / f"{i:04d}_{filename}"
            self.download_file(video_url, file_path)
            time.sleep(random.uniform(1, 3))
        
        # 输出统计信息
        logging.info("爬取完成!")
        logging.info(f"成功下载: {len(self.downloaded_urls)} 个文件")
        logging.info(f"下载失败: {len(self.failed_urls)} 个文件")
        logging.info(f"文件保存在: {self.download_dir.absolute()}")
        
        # 保存失败的URL到文件
        if self.failed_urls:
            with open(self.download_dir / "failed_urls.txt", 'w', encoding='utf-8') as f:
                for url in self.failed_urls:
                    f.write(f"{url}\n")

def main():
    scraper = WallpaperScraper()
    
    try:
        # 开始爬取，限制最多爬取50个页面
        scraper.scrape_all(max_pages=50)
    except KeyboardInterrupt:
        logging.info("用户中断了爬取过程")
    except Exception as e:
        logging.error(f"爬取过程中出现错误: {e}")

if __name__ == "__main__":
    main()
