#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
子页面分析脚本 - 发现网站的所有子页面
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random

def analyze_subpages():
    base_url = "https://www.labubuwallpaper.xyz/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"正在分析主页: {base_url}")
        response = requests.get(base_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找所有链接
        links = soup.find_all('a', href=True)
        print(f"发现 {len(links)} 个链接")
        
        subpages = set()
        base_domain = urlparse(base_url).netloc
        
        for link in links:
            href = link['href']
            full_url = urljoin(base_url, href)
            parsed_url = urlparse(full_url)
            
            # 只处理同域名的链接
            if parsed_url.netloc == base_domain:
                # 过滤掉锚点和查询参数
                clean_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                if clean_url != base_url and clean_url not in subpages:
                    subpages.add(clean_url)
                    print(f"发现子页面: {clean_url}")
                    print(f"  链接文本: {link.get_text(strip=True)[:50]}")
        
        print(f"\n总共发现 {len(subpages)} 个子页面:")
        for i, page in enumerate(sorted(subpages), 1):
            print(f"{i:2d}. {page}")
        
        return sorted(subpages)
        
    except Exception as e:
        print(f"分析失败: {e}")
        return []

if __name__ == "__main__":
    subpages = analyze_subpages()
