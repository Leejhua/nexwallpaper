#!/usr/bin/env python3
"""
更新React项目数据脚本
将爬取的高清数据转换为React项目格式
"""

import json
import re
import time

def convert_hd_data_to_react_format():
    """将高清数据转换为React项目格式"""
    print("🔄 开始转换数据格式...")
    
    # 读取高清数据文件
    try:
        with open('hd_gallery_data.js', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print("❌ 未找到 hd_gallery_data.js 文件")
        return
    
    # 提取图片数据
    image_match = re.search(r'const hdImageData = \[(.*?)\];', content, re.DOTALL)
    video_match = re.search(r'const hdVideoData = \[(.*?)\];', content, re.DOTALL)
    
    if not image_match:
        print("❌ 无法解析图片数据")
        return
    
    # 解析数据
    react_data = []
    item_id = 1
    
    # 处理图片数据
    image_content = image_match.group(1)
    image_items = re.findall(r'\{(.*?)\}', image_content, re.DOTALL)
    
    for item_str in image_items:
        if not item_str.strip():
            continue
            
        # 解析每个字段
        url_match = re.search(r'url: "(.*?)"', item_str)
        title_match = re.search(r'title: "(.*?)"', item_str)
        category_match = re.search(r'category: "(.*?)"', item_str)
        resolution_match = re.search(r'resolution: "(.*?)"', item_str)
        type_match = re.search(r'type: "(.*?)"', item_str)
        format_match = re.search(r'format: "(.*?)"', item_str)
        
        if url_match and title_match:
            # 生成标签
            tags = []
            title = title_match.group(1)
            if 'rainbow' in title.lower():
                tags.append('彩虹')
            if 'heart' in title.lower():
                tags.append('爱心')
            if 'cute' in title.lower():
                tags.append('可爱')
            if 'spring' in title.lower():
                tags.append('春天')
            if 'garden' in title.lower():
                tags.append('花园')
            if 'castle' in title.lower():
                tags.append('城堡')
            if 'fantasy' in title.lower():
                tags.append('奇幻')
            if 'beach' in title.lower():
                tags.append('海滩')
            if 'sunset' in title.lower():
                tags.append('日落')
            
            react_item = {
                "id": item_id,
                "url": url_match.group(1),
                "title": title,
                "category": category_match.group(1) if category_match else "4k",
                "resolution": resolution_match.group(1) if resolution_match else "4K",
                "source": "xyz",
                "type": type_match.group(1) if type_match else "image",
                "format": format_match.group(1) if format_match else "jpg",
                "tags": tags
            }
            
            react_data.append(react_item)
            item_id += 1
    
    # 处理视频数据
    if video_match:
        video_content = video_match.group(1)
        video_items = re.findall(r'\{(.*?)\}', video_content, re.DOTALL)
        
        for item_str in video_items:
            if not item_str.strip():
                continue
                
            # 解析每个字段
            url_match = re.search(r'url: "(.*?)"', item_str)
            title_match = re.search(r'title: "(.*?)"', item_str)
            category_match = re.search(r'category: "(.*?)"', item_str)
            resolution_match = re.search(r'resolution: "(.*?)"', item_str)
            type_match = re.search(r'type: "(.*?)"', item_str)
            format_match = re.search(r'format: "(.*?)"', item_str)
            
            if url_match and title_match:
                # 生成标签
                tags = ['动态', '视频']
                title = title_match.group(1)
                if 'live' in title.lower():
                    tags.append('动态壁纸')
                
                react_item = {
                    "id": item_id,
                    "url": url_match.group(1),
                    "title": title,
                    "category": "live",  # 视频都归类为动态
                    "resolution": resolution_match.group(1) if resolution_match else "4K",
                    "source": "xyz",
                    "type": "video",
                    "format": format_match.group(1) if format_match else "mp4",
                    "tags": tags
                }
                
                react_data.append(react_item)
                item_id += 1
    
    print(f"✅ 转换完成，共 {len(react_data)} 个项目")
    
    # 生成React数据文件
    react_content = f"""// 高清Labubu壁纸数据 - React版本 (更新版)
// 数据来源: labubuwallpaper.xyz
// 更新时间: {time.strftime('%Y/%m/%d %H:%M:%S')}
// 图片数量: {len([item for item in react_data if item['type'] == 'image'])}张
// 视频数量: {len([item for item in react_data if item['type'] == 'video'])}个
// 总计: {len(react_data)}个项目

export const galleryData = {json.dumps(react_data, ensure_ascii=False, indent=2)};

// 分类统计
export const categories = [
  {{ key: 'all', label: '全部', icon: '🎨', count: {len(react_data)} }},
  {{ key: '4k', label: '4K超清', icon: '🖥️', count: {len([item for item in react_data if item['category'] == '4k'])} }},
  {{ key: 'desktop', label: '桌面壁纸', icon: '💻', count: {len([item for item in react_data if item['category'] == 'desktop'])} }},
  {{ key: 'mobile', label: '手机壁纸', icon: '📱', count: {len([item for item in react_data if item['category'] == 'mobile'])} }},
  {{ key: 'fantasy', label: '奇幻世界', icon: '🦄', count: {len([item for item in react_data if item['category'] == 'fantasy'])} }},
  {{ key: 'seasonal', label: '季节主题', icon: '🌸', count: {len([item for item in react_data if item['category'] == 'seasonal'])} }},
  {{ key: 'live', label: '动态壁纸', icon: '🎬', count: {len([item for item in react_data if item['category'] == 'live'])} }}
];

// 统计信息
export const stats = {{
  total: {len(react_data)},
  images: {len([item for item in react_data if item['type'] == 'image'])},
  videos: {len([item for item in react_data if item['type'] == 'video'])},
  lastUpdate: '{time.strftime('%Y-%m-%d %H:%M:%S')}'
}};
"""
    
    # 保存到React项目
    react_data_path = 'labubu-gallery-react/src/data/galleryData.js'
    try:
        with open(react_data_path, 'w', encoding='utf-8') as f:
            f.write(react_content)
        print(f"✅ React数据已更新到 {react_data_path}")
    except Exception as e:
        print(f"❌ 保存React数据失败: {e}")
        return
    
    # 生成更新报告
    report = f"""# 🔄 数据更新报告

## 📊 更新统计
- **更新时间**: {time.strftime('%Y年%m月%d日 %H:%M:%S')}
- **总计**: {len(react_data)} 个媒体文件
- **图片**: {len([item for item in react_data if item['type'] == 'image'])} 张
- **视频**: {len([item for item in react_data if item['type'] == 'video'])} 个

## 📂 分类分布
"""
    
    # 统计分类
    categories = {}
    for item in react_data:
        cat = item['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    for category, count in sorted(categories.items()):
        percentage = (count / len(react_data)) * 100
        report += f"- **{category}**: {count} 个 ({percentage:.1f}%)\n"
    
    report += f"""
## 🔗 数据源
- **主要来源**: labubuwallpaper.xyz
- **数据格式**: 真正的高清原图，无压缩
- **URL格式**: https://res.labubuwallpaper.xyz/image/upload/[path]

## ✨ 更新内容
1. **最新数据**: 从官网获取最新的壁纸资源
2. **高清质量**: 移除所有压缩参数，确保原图质量
3. **完整分类**: 智能分类和标签生成
4. **React格式**: 转换为React项目兼容格式

## 🎯 使用说明
- 数据已自动更新到React项目
- 重启开发服务器即可看到最新内容
- 所有URL都是真正的高清原图

---
**生成时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    with open('react_update_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print("✅ 更新报告已生成: react_update_report.md")
    print("\n🎉 数据更新完成！")
    print("📁 生成的文件:")
    print("   • labubu-gallery-react/src/data/galleryData.js - 更新的React数据")
    print("   • react_update_report.md - 更新报告")
    print("\n🚀 请重启React开发服务器查看最新内容")

if __name__ == "__main__":
    print("🔄 React数据更新工具")
    print("=" * 50)
    convert_hd_data_to_react_format()
