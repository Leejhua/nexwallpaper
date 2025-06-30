#!/usr/bin/env python3
"""
高清图片爬虫
从labubuwallpaper.xyz获取真正的高清图片URL
"""

import requests
import json
import re
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os

class HDImageScraper:
    def __init__(self):
        self.base_url = "https://www.labubuwallpaper.xyz"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.all_images = []
        self.all_videos = []
    
    def get_main_page_data(self):
        """获取主页的图片数据"""
        print("🔍 获取主页数据...")
        
        try:
            response = self.session.get(f"{self.base_url}/?ref=producthunt")
            response.raise_for_status()
            
            # 查找Next.js数据
            soup = BeautifulSoup(response.text, 'html.parser')
            script_tag = soup.find('script', {'id': '__NEXT_DATA__'})
            
            if script_tag:
                data = json.loads(script_tag.string)
                images = data.get('props', {}).get('pageProps', {}).get('images', [])
                print(f"📊 从主页获取到 {len(images)} 个媒体文件")
                return images
            else:
                print("❌ 未找到Next.js数据")
                return []
                
        except Exception as e:
            print(f"❌ 获取主页数据失败: {e}")
            return []
    
    def get_detail_page_hd_url(self, asset_id):
        """获取详情页面的高清图片URL"""
        detail_url = f"{self.base_url}/p/{asset_id}"
        
        try:
            response = self.session.get(detail_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找高清图片URL
            # 方法1: 查找og:image meta标签
            og_image = soup.find('meta', {'property': 'og:image'})
            if og_image:
                hd_url = og_image.get('content')
                if hd_url and 'res.labubuwallpaper.xyz' in hd_url:
                    # 移除压缩参数，获取原图
                    hd_url = re.sub(r',w_\d+', '', hd_url)
                    hd_url = re.sub(r'/f_auto,q_auto', '', hd_url)
                    return hd_url
            
            # 方法2: 查找img标签中的高分辨率URL
            img_tags = soup.find_all('img')
            for img in img_tags:
                src = img.get('src', '')
                if 'res.labubuwallpaper.xyz' in src and 'labubu' in src:
                    # 移除压缩参数
                    hd_url = re.sub(r',w_\d+', '', src)
                    hd_url = re.sub(r'/f_auto,q_auto', '', hd_url)
                    return hd_url
            
            # 方法3: 查找Next.js数据中的原始URL
            script_tag = soup.find('script', {'id': '__NEXT_DATA__'})
            if script_tag:
                data = json.loads(script_tag.string)
                # 查找图片数据
                page_props = data.get('props', {}).get('pageProps', {})
                if 'image' in page_props:
                    public_id = page_props['image'].get('public_id', '')
                    format_ext = page_props['image'].get('format', 'jpg')
                    if public_id:
                        return f"https://res.labubuwallpaper.xyz/image/upload/{public_id}.{format_ext}"
            
            return None
            
        except Exception as e:
            print(f"❌ 获取详情页失败 {asset_id}: {e}")
            return None
    
    def process_media_item(self, item):
        """处理单个媒体项目"""
        asset_id = item.get('asset_id', '')
        title = item.get('metadata', {}).get('en_title', 'Unknown')
        public_id = item.get('public_id', '')
        format_ext = item.get('format', 'jpg')
        tags = item.get('tags', [])
        resource_type = item.get('resource_type', 'image')
        
        print(f"🔄 处理: {title}")
        
        # 构建高清URL
        if public_id:
            if resource_type == 'video':
                hd_url = f"https://res.labubuwallpaper.xyz/video/upload/{public_id}.{format_ext}"
            else:
                hd_url = f"https://res.labubuwallpaper.xyz/image/upload/{public_id}.{format_ext}"
        else:
            # 尝试从详情页获取
            hd_url = self.get_detail_page_hd_url(asset_id)
        
        if not hd_url:
            print(f"⚠️  无法获取高清URL: {title}")
            return None
        
        # 分类映射
        category = self.determine_category(tags, title)
        
        # 分辨率信息
        resolution = self.determine_resolution(tags, item)
        
        media_data = {
            'url': hd_url,
            'title': title,
            'category': category,
            'resolution': resolution,
            'source': 'xyz',
            'type': resource_type,
            'asset_id': asset_id,
            'format': format_ext,
            'tags': tags
        }
        
        return media_data
    
    def determine_category(self, tags, title):
        """根据标签和标题确定分类"""
        tags_lower = [tag.lower() for tag in tags]
        title_lower = title.lower()
        
        if 'live' in tags_lower or 'live' in title_lower:
            return 'live'
        elif '4k' in tags_lower or '4k' in title_lower:
            return '4k'
        elif 'phone' in tags_lower or 'iphone' in tags_lower or 'mobile' in title_lower:
            return 'mobile'
        elif 'pc' in tags_lower or 'desktop' in tags_lower or 'computer' in title_lower:
            return 'desktop'
        elif any(season in title_lower for season in ['spring', 'summer', 'fall', 'winter', 'christmas', 'halloween']):
            return 'seasonal'
        else:
            return 'fantasy'
    
    def determine_resolution(self, tags, item):
        """确定分辨率信息"""
        tags_lower = [tag.lower() for tag in tags]
        
        if '4k' in tags_lower:
            return '4K'
        elif 'phone' in tags_lower or 'iphone' in tags_lower:
            return 'iPhone'
        elif 'pc' in tags_lower:
            return 'PC'
        elif 'desktop' in tags_lower:
            return '桌面'
        else:
            # 尝试从尺寸信息获取
            width = item.get('width', 0)
            height = item.get('height', 0)
            
            if width >= 3840 or height >= 2160:
                return '4K'
            elif width >= 1920 or height >= 1080:
                return '高清'
            else:
                return '标清'
    
    def scrape_all_media(self):
        """爬取所有媒体文件"""
        print("🚀 开始爬取高清媒体文件...")
        
        # 获取主页数据
        main_page_items = self.get_main_page_data()
        
        if not main_page_items:
            print("❌ 无法获取主页数据")
            return
        
        print(f"📊 开始处理 {len(main_page_items)} 个媒体文件...")
        
        for i, item in enumerate(main_page_items, 1):
            print(f"\n[{i}/{len(main_page_items)}]", end=" ")
            
            media_data = self.process_media_item(item)
            
            if media_data:
                if media_data['type'] == 'video':
                    self.all_videos.append(media_data)
                    print(f"✅ 视频: {media_data['title']}")
                else:
                    self.all_images.append(media_data)
                    print(f"✅ 图片: {media_data['title']}")
            
            # 添加延迟避免请求过快
            time.sleep(0.5)
        
        print(f"\n🎉 爬取完成!")
        print(f"📸 图片: {len(self.all_images)} 张")
        print(f"🎬 视频: {len(self.all_videos)} 个")
    
    def save_to_js_file(self, filename='hd_gallery_data.js'):
        """保存为JavaScript数据文件"""
        print(f"💾 保存数据到 {filename}...")
        
        js_content = f"""// 高清Labubu壁纸数据 - 真正的高清版本
// 爬取时间: {time.strftime('%Y-%m-%d %H:%M:%S')}
// 图片数量: {len(self.all_images)}
// 视频数量: {len(self.all_videos)}

const hdImageData = [
"""
        
        for item in self.all_images:
            js_content += f"""    {{
        url: "{item['url']}",
        title: "{item['title']}",
        category: "{item['category']}",
        resolution: "{item['resolution']}",
        source: "{item['source']}",
        type: "{item['type']}",
        format: "{item['format']}"
    }},
"""
        
        js_content += """];

const hdVideoData = [
"""
        
        for item in self.all_videos:
            js_content += f"""    {{
        url: "{item['url']}",
        title: "{item['title']}",
        category: "{item['category']}",
        resolution: "{item['resolution']}",
        source: "{item['source']}",
        type: "{item['type']}",
        format: "{item['format']}"
    }},
"""
        
        js_content += "];"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print(f"✅ 数据已保存到 {filename}")
    
    def save_analysis_report(self, filename='hd_scraping_report.md'):
        """保存分析报告"""
        print(f"📝 生成分析报告 {filename}...")
        
        # 统计信息
        total_items = len(self.all_images) + len(self.all_videos)
        
        # 按分类统计
        categories = {}
        for item in self.all_images + self.all_videos:
            cat = item['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        # 按分辨率统计
        resolutions = {}
        for item in self.all_images + self.all_videos:
            res = item['resolution']
            resolutions[res] = resolutions.get(res, 0) + 1
        
        report = f"""# 🔍 高清图片爬取报告

## 📊 爬取统计
- **爬取时间**: {time.strftime('%Y年%m月%d日 %H:%M:%S')}
- **总计**: {total_items} 个媒体文件
- **图片**: {len(self.all_images)} 张
- **视频**: {len(self.all_videos)} 个

## 📂 分类分布
"""
        
        for category, count in sorted(categories.items()):
            percentage = (count / total_items) * 100
            report += f"- **{category}**: {count} 个 ({percentage:.1f}%)\n"
        
        report += f"""
## 📐 分辨率分布
"""
        
        for resolution, count in sorted(resolutions.items()):
            percentage = (count / total_items) * 100
            report += f"- **{resolution}**: {count} 个 ({percentage:.1f}%)\n"
        
        report += f"""
## 🔗 URL示例

### 高清图片URL格式
```
https://res.labubuwallpaper.xyz/image/upload/[public_id].[format]
```

### 视频URL格式
```
https://res.labubuwallpaper.xyz/video/upload/[public_id].[format]
```

## ✨ 改进点
1. **真正的高清**: 移除了所有压缩参数，获取原始高清图片
2. **完整数据**: 包含了所有可用的媒体文件
3. **准确分类**: 基于标签和标题的智能分类
4. **详细信息**: 包含格式、分辨率等完整元数据

## 🎯 使用建议
- 高清图片适合桌面壁纸和打印
- 视频文件适合动态壁纸
- 根据设备选择合适的分辨率
- 注意文件大小，高清图片通常较大

---
**生成时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"✅ 报告已保存到 {filename}")

def main():
    print("🐰 高清Labubu壁纸爬虫")
    print("=" * 50)
    
    scraper = HDImageScraper()
    
    try:
        # 爬取所有媒体
        scraper.scrape_all_media()
        
        # 保存数据
        scraper.save_to_js_file()
        scraper.save_analysis_report()
        
        print("\n" + "=" * 50)
        print("🎉 高清图片爬取完成!")
        print("📁 生成的文件:")
        print("   • hd_gallery_data.js - 高清数据文件")
        print("   • hd_scraping_report.md - 爬取报告")
        
    except KeyboardInterrupt:
        print("\n⏹️  用户中断爬取")
    except Exception as e:
        print(f"\n❌ 爬取过程出错: {e}")

if __name__ == "__main__":
    main()
