#!/usr/bin/env python3
"""
修复失效URL脚本
检查并修复数据文件中的失效图片链接
"""

import requests
import re
import time
from urllib.parse import quote

def check_url(url, timeout=10):
    """检查URL是否可访问"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code == 200, response.status_code
    except requests.exceptions.RequestException as e:
        return False, str(e)

def fix_url_encoding(url):
    """修复URL编码问题"""
    # 常见的URL编码问题修复
    fixes = [
        # 移除可能的重复参数
        (r'\?[^?]*\?', '?'),
        # 修复空格问题
        (' ', '%20'),
        # 修复单引号问题
        ("'", '%27'),
    ]
    
    fixed_url = url
    for pattern, replacement in fixes:
        if pattern.startswith('r'):
            fixed_url = re.sub(pattern[2:-1], replacement, fixed_url)
        else:
            fixed_url = fixed_url.replace(pattern, replacement)
    
    return fixed_url

def find_alternative_url(original_url, title):
    """尝试找到替代URL"""
    base_url = original_url.split('/')
    domain = '/'.join(base_url[:3])
    
    # 尝试不同的URL变体
    alternatives = []
    
    if 'labubuwallpaper.com' in original_url:
        # 尝试移除特殊字符
        clean_title = re.sub(r"[''']", '', title)
        clean_title = re.sub(r'[^\w\s-]', '', clean_title)
        clean_title = re.sub(r'\s+', '-', clean_title.strip())
        
        alternatives.extend([
            original_url.replace("'s", 's'),
            original_url.replace("'", ''),
            original_url.replace(' ', '-'),
            f"{domain}/{clean_title},Labubu-Wallpaper.png",
            f"{domain}/{clean_title},Labubu-Desktop-Wallpaper.png",
        ])
    
    return alternatives

def main():
    print("🔍 开始检查桌面分类图片URL...")
    
    # 读取数据文件
    with open('complete_gallery_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 更简单的方法：逐行解析
    lines = content.split('\n')
    desktop_items = []
    current_item = {}
    
    for line in lines:
        line = line.strip()
        if 'url:' in line and '"' in line:
            url_match = re.search(r'url:\s*"([^"]*)"', line)
            if url_match:
                current_item['url'] = url_match.group(1)
        elif 'title:' in line and '"' in line:
            title_match = re.search(r'title:\s*"([^"]*)"', line)
            if title_match:
                current_item['title'] = title_match.group(1)
        elif 'category:' in line and '"desktop"' in line:
            current_item['category'] = 'desktop'
        elif line == '},' or line == '}':
            if current_item.get('category') == 'desktop' and 'url' in current_item:
                # 确保是图片而不是视频
                if not (current_item['url'].endswith('.mp4') or current_item['url'].endswith('.mov')):
                    desktop_items.append(current_item)
            current_item = {}
    
    print(f"📊 找到 {len(desktop_items)} 个桌面分类图片")
    
    if len(desktop_items) == 0:
        print("⚠️  没有找到桌面分类图片，请检查数据文件格式")
        return
    
    broken_urls = []
    working_urls = []
    
    for i, item in enumerate(desktop_items, 1):
        url = item['url']
        title = item.get('title', 'Unknown')
        
        print(f"\n[{i}/{len(desktop_items)}] 测试: {title[:30]}...")
        print(f"URL: {url}")
        
        is_working, status = check_url(url)
        
        if is_working:
            print(f"✅ 正常 (状态: {status})")
            working_urls.append((url, title))
        else:
            print(f"❌ 失效 (状态: {status})")
            broken_urls.append((url, title, status))
        
        # 添加延迟避免请求过快
        time.sleep(1)
    
    # 生成报告
    print("\n" + "="*60)
    print("📋 检查报告")
    print("="*60)
    print(f"✅ 正常URL: {len(working_urls)}")
    print(f"❌ 失效URL: {len(broken_urls)}")
    
    total = len(working_urls) + len(broken_urls)
    if total > 0:
        print(f"📊 成功率: {len(working_urls)/total*100:.1f}%")
    
    if broken_urls:
        print(f"\n❌ 失效的URL列表:")
        for i, (url, title, status) in enumerate(broken_urls, 1):
            print(f"{i}. {title}")
            print(f"   URL: {url}")
            print(f"   状态: {status}")
            print()
    else:
        print("\n🎉 所有桌面分类图片URL都正常工作!")

if __name__ == "__main__":
    main()
