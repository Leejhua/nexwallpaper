#!/usr/bin/env python3
"""
全面URL检测和更新脚本
检测所有分类的图片和视频URL，生成更新的JSON数据文件
"""

import requests
import re
import time
import json
from datetime import datetime
from urllib.parse import quote

class ComprehensiveURLChecker:
    def __init__(self):
        self.all_media = []
        self.results = {
            'working_urls': [],
            'broken_urls': [],
            'statistics': {},
            'last_updated': datetime.now().isoformat()
        }
        self.load_data()
    
    def load_data(self):
        """从数据文件加载媒体数据"""
        print("📂 加载数据文件...")
        
        with open('complete_gallery_data.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 解析数据
        lines = content.split('\n')
        current_item = {}
        in_image_data = False
        in_video_data = False
        
        for line in lines:
            line = line.strip()
            
            if 'completeImageData' in line:
                in_image_data = True
                continue
            elif 'completeVideoData' in line:
                in_image_data = False
                in_video_data = True
                continue
            
            if in_image_data or in_video_data:
                if 'url:' in line and '"' in line:
                    url_match = re.search(r'url:\s*"([^"]*)"', line)
                    if url_match:
                        current_item['url'] = url_match.group(1)
                elif 'title:' in line and '"' in line:
                    title_match = re.search(r'title:\s*"([^"]*)"', line)
                    if title_match:
                        current_item['title'] = title_match.group(1)
                elif 'category:' in line and '"' in line:
                    category_match = re.search(r'category:\s*"([^"]*)"', line)
                    if category_match:
                        current_item['category'] = category_match.group(1)
                elif 'source:' in line and '"' in line:
                    source_match = re.search(r'source:\s*"([^"]*)"', line)
                    if source_match:
                        current_item['source'] = source_match.group(1)
                elif 'resolution:' in line and '"' in line:
                    resolution_match = re.search(r'resolution:\s*"([^"]*)"', line)
                    if resolution_match:
                        current_item['resolution'] = resolution_match.group(1)
                elif line == '},' or line == '}':
                    if 'url' in current_item and 'title' in current_item:
                        current_item['type'] = 'video' if (current_item['url'].endswith('.mp4') or current_item['url'].endswith('.mov')) else 'image'
                        self.all_media.append(current_item.copy())
                    current_item = {}
        
        print(f"📊 加载完成: {len(self.all_media)} 个媒体文件")
    
    def check_url(self, url, timeout=10):
        """检查单个URL的可访问性"""
        try:
            response = requests.head(url, timeout=timeout, allow_redirects=True)
            return response.status_code == 200, response.status_code
        except requests.exceptions.RequestException as e:
            return False, str(e)
    
    def check_all_urls(self):
        """检查所有URL"""
        print("🔍 开始全面URL检测...")
        
        categories = {}
        sources = {}
        
        for i, item in enumerate(self.all_media, 1):
            url = item['url']
            title = item.get('title', 'Unknown')
            category = item.get('category', 'unknown')
            source = item.get('source', 'unknown')
            media_type = item.get('type', 'unknown')
            
            print(f"\n[{i}/{len(self.all_media)}] 检测: {title[:40]}...")
            print(f"分类: {category} | 来源: {source} | 类型: {media_type}")
            print(f"URL: {url}")
            
            is_working, status = self.check_url(url)
            
            # 统计信息
            if category not in categories:
                categories[category] = {'total': 0, 'working': 0, 'broken': 0}
            if source not in sources:
                sources[source] = {'total': 0, 'working': 0, 'broken': 0}
            
            categories[category]['total'] += 1
            sources[source]['total'] += 1
            
            if is_working:
                print(f"✅ 正常 (状态: {status})")
                self.results['working_urls'].append({
                    'url': url,
                    'title': title,
                    'category': category,
                    'source': source,
                    'type': media_type,
                    'status': status
                })
                categories[category]['working'] += 1
                sources[source]['working'] += 1
            else:
                print(f"❌ 失效 (状态: {status})")
                self.results['broken_urls'].append({
                    'url': url,
                    'title': title,
                    'category': category,
                    'source': source,
                    'type': media_type,
                    'error': status
                })
                categories[category]['broken'] += 1
                sources[source]['broken'] += 1
            
            # 添加延迟避免请求过快
            time.sleep(0.5)
        
        # 保存统计信息
        self.results['statistics'] = {
            'by_category': categories,
            'by_source': sources,
            'total': len(self.all_media),
            'working': len(self.results['working_urls']),
            'broken': len(self.results['broken_urls'])
        }
    
    def generate_report(self):
        """生成详细报告"""
        print("\n" + "="*80)
        print("📋 全面URL检测报告")
        print("="*80)
        
        stats = self.results['statistics']
        total = stats['total']
        working = stats['working']
        broken = stats['broken']
        
        print(f"📊 总体统计:")
        print(f"   总计: {total} 个媒体文件")
        print(f"   正常: {working} 个 ({working/total*100:.1f}%)")
        print(f"   失效: {broken} 个 ({broken/total*100:.1f}%)")
        
        print(f"\n📂 按分类统计:")
        for category, data in stats['by_category'].items():
            success_rate = data['working']/data['total']*100 if data['total'] > 0 else 0
            print(f"   {category}: {data['working']}/{data['total']} ({success_rate:.1f}%)")
        
        print(f"\n🌐 按来源统计:")
        for source, data in stats['by_source'].items():
            success_rate = data['working']/data['total']*100 if data['total'] > 0 else 0
            print(f"   {source}: {data['working']}/{data['total']} ({success_rate:.1f}%)")
        
        if self.results['broken_urls']:
            print(f"\n❌ 失效URL详情:")
            for i, item in enumerate(self.results['broken_urls'], 1):
                print(f"{i}. {item['title']}")
                print(f"   分类: {item['category']} | 来源: {item['source']} | 类型: {item['type']}")
                print(f"   URL: {item['url']}")
                print(f"   错误: {item['error']}")
                print()
    
    def generate_updated_data_file(self):
        """生成更新后的数据文件"""
        print("📝 生成更新后的数据文件...")
        
        # 分离图片和视频
        working_images = [item for item in self.results['working_urls'] if item['type'] == 'image']
        working_videos = [item for item in self.results['working_urls'] if item['type'] == 'video']
        
        # 生成新的JavaScript数据文件
        js_content = f"""// 更新的Labubu壁纸数据 - 已移除失效URL
// 最后更新时间: {self.results['last_updated']}
// 统计: {len(working_images)} 张图片, {len(working_videos)} 个视频

const completeImageData = [
"""
        
        for item in working_images:
            js_content += f"""    {{
        url: "{item['url']}",
        title: "{item['title']}",
        category: "{item['category']}",
        resolution: "{item.get('resolution', '高清')}",
        source: "{item['source']}",
        type: "原图"
    }},
"""
        
        js_content += """];

const completeVideoData = [
"""
        
        for item in working_videos:
            js_content += f"""    {{
        url: "{item['url']}",
        title: "{item['title']}",
        category: "{item['category']}",
        source: "{item['source']}"
    }},
"""
        
        js_content += "];"
        
        # 保存更新后的文件
        with open('complete_gallery_data_updated.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print("✅ 已生成 complete_gallery_data_updated.js")
    
    def save_json_report(self):
        """保存JSON格式的检测报告"""
        with open('url_check_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print("✅ 已保存 url_check_report.json")

def main():
    print("🚀 启动全面URL检测和更新系统")
    print("="*50)
    
    checker = ComprehensiveURLChecker()
    
    # 执行检测
    checker.check_all_urls()
    
    # 生成报告
    checker.generate_report()
    
    # 生成更新文件
    checker.generate_updated_data_file()
    checker.save_json_report()
    
    print("\n" + "="*50)
    print("🎉 检测和更新完成!")
    print("📁 生成的文件:")
    print("   • complete_gallery_data_updated.js - 更新后的数据文件")
    print("   • url_check_report.json - 详细检测报告")

if __name__ == "__main__":
    main()
