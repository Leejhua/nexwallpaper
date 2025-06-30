#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版爬虫 - 直接基于调试结果
"""

import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin
import time
import random
from pathlib import Path

def download_file(url, file_path):
    """下载文件"""
    try:
        print(f"正在下载: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=60, stream=True)
        response.raise_for_status()
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        file_size = os.path.getsize(file_path)
        print(f"下载成功: {file_path} ({file_size} bytes)")
        return True
        
    except Exception as e:
        print(f"下载失败: {url} - {e}")
        return False

def main():
    # 创建目录
    download_dir = Path("labubu_downloads")
    img_dir = download_dir / "images"
    video_dir = download_dir / "videos"
    
    for dir_path in [download_dir, img_dir, video_dir]:
        dir_path.mkdir(exist_ok=True)
    
    # 基于调试结果的已知URL列表
    image_urls = [
        "https://www.labubuwallpaper.xyz/logo.png",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/cute-rainbow-labubu-wallpaper---heart-gesture-edition.jpg",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/labubu-spring-garden-castle-wallpaper---cute-bunny-ear-doll-fantasy-scene-mobile-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/two-labubu-bunnies-breaking-through-the-wall-wallpaper.png",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/labubu-bunny-breakthrough-wallpaper.png",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/labubu-beach-sunsetlabubu-wallpaper-pc.png",
        "https://res.labubuwallpaper.xyz/image/upload/f_auto,q_auto,w_720/labubu/labubu-desert-oasislabubu-wallpaper-pc.png",
        # Poster 图片
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-and-the-jellyfishlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-classic-darklabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-colorful-heartslabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-flashlight-explorerlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-flashlight-explorer-standing-bedlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-flashlight-explorer-white-outfitlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-floating-islandlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-gamer-monsterlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-pink-earslabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-pink-spotlightlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-prince-on-rocking-horselabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-spring-forestlabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-underwater-bubbleslabubu-live-wallpaper.jpg",
        "https://res.labubuwallpaper.xyz/video/upload/so_0/labubu/labubu-white-fluffy-forestlabubu-live-wallpaper.jpg"
    ]
    
    video_urls = [
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-and-the-jellyfishlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-classic-darklabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-colorful-heartslabubu-live-wallpaper.mov",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorerlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorer-standing-bedlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorer-white-outfitlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-floating-islandlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-gamer-monsterlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-pink-earslabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-pink-spotlightlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-prince-on-rocking-horselabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-spring-forestlabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-underwater-bubbleslabubu-live-wallpaper.mp4",
        "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-white-fluffy-forestlabubu-live-wallpaper.mp4"
    ]
    
    print(f"准备下载 {len(image_urls)} 个图片和 {len(video_urls)} 个视频")
    
    # 下载图片
    print("\n开始下载图片...")
    success_count = 0
    for i, url in enumerate(image_urls, 1):
        filename = f"{i:04d}_{os.path.basename(url)}"
        file_path = img_dir / filename
        if download_file(url, file_path):
            success_count += 1
        time.sleep(random.uniform(0.5, 1.5))
    
    print(f"\n图片下载完成: {success_count}/{len(image_urls)}")
    
    # 下载视频
    print("\n开始下载视频...")
    success_count = 0
    for i, url in enumerate(video_urls, 1):
        filename = f"{i:04d}_{os.path.basename(url)}"
        file_path = video_dir / filename
        if download_file(url, file_path):
            success_count += 1
        time.sleep(random.uniform(1, 2))
    
    print(f"\n视频下载完成: {success_count}/{len(video_urls)}")
    print(f"\n所有文件已保存到: {download_dir.absolute()}")

if __name__ == "__main__":
    main()
