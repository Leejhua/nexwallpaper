#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试版爬虫脚本 - 只爬取首页进行测试
"""

import requests
from bs4 import BeautifulSoup
import urllib.parse
from urllib.parse import urljoin
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_scraper():
    url = "https://www.labubuwallpaper.xyz/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        logging.info(f"正在测试访问: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        logging.info(f"响应状态码: {response.status_code}")
        logging.info(f"响应内容长度: {len(response.text)}")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找图片标签
        img_tags = soup.find_all('img')
        logging.info(f"发现 {len(img_tags)} 个img标签")
        
        for i, img in enumerate(img_tags[:5]):  # 只显示前5个
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src:
                full_url = urljoin(url, src)
                logging.info(f"图片 {i+1}: {full_url}")
        
        # 查找视频标签
        video_tags = soup.find_all('video')
        logging.info(f"发现 {len(video_tags)} 个video标签")
        
        for i, video in enumerate(video_tags[:5]):  # 只显示前5个
            src = video.get('src')
            if src:
                full_url = urljoin(url, src)
                logging.info(f"视频 {i+1}: {full_url}")
        
        # 查找链接
        links = soup.find_all('a', href=True)
        logging.info(f"发现 {len(links)} 个链接")
        
        return True
        
    except requests.RequestException as e:
        logging.error(f"请求失败: {e}")
        return False
    except Exception as e:
        logging.error(f"解析失败: {e}")
        return False

if __name__ == "__main__":
    test_scraper()
