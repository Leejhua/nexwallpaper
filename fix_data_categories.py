#!/usr/bin/env python3
"""
数据分类修复脚本
自动检查和修复静态图片被错误分类为动态的问题
"""

import re

def fix_gallery_data():
    """修复画廊数据中的分类错误"""
    
    # 读取原始数据文件
    with open('complete_gallery_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔍 开始检查数据分类问题...")
    
    # 查找所有被分类为 "live" 的静态图片
    static_extensions = ['.jpg', '.png', '.jpeg', '.webp']
    video_extensions = ['.mp4', '.mov', '.avi', '.webm']
    
    issues_found = []
    fixes_made = 0
    
    # 使用正则表达式查找所有条目
    pattern = r'\{[^}]*url:\s*"([^"]*)"[^}]*category:\s*"([^"]*)"[^}]*\}'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for url, category in matches:
        # 检查是否是静态文件但被分类为 live
        is_static = any(url.lower().endswith(ext) for ext in static_extensions)
        is_video = any(url.lower().endswith(ext) for ext in video_extensions)
        
        if is_static and category == "live":
            # 根据URL内容判断合适的分类
            if 'phone' in url.lower() or 'iphone' in url.lower():
                suggested_category = 'mobile'
            elif 'desktop' in url.lower() or 'pc' in url.lower():
                suggested_category = 'desktop'
            elif '4k' in url.lower():
                suggested_category = '4k'
            else:
                suggested_category = 'mobile'  # 默认分类
                
            issues_found.append({
                'url': url,
                'current_category': category,
                'file_type': 'static',
                'suggested_category': suggested_category
            })
        elif is_video and category != "live":
            issues_found.append({
                'url': url,
                'current_category': category,
                'file_type': 'video',
                'suggested_category': 'live'
            })
    
    print(f"📊 发现 {len(issues_found)} 个分类问题:")
    
    for i, issue in enumerate(issues_found, 1):
        print(f"  {i}. {issue['file_type'].upper()} 文件分类错误:")
        print(f"     URL: {issue['url'][:80]}...")
        print(f"     当前分类: {issue['current_category']}")
        print(f"     建议分类: {issue['suggested_category']}")
        print()
    
    # 自动修复静态图片的分类
    for issue in issues_found:
        if issue['file_type'] == 'static':
            # 使用更精确的替换
            url_escaped = re.escape(issue['url'])
            pattern_to_replace = f'(url: "{url_escaped}"[^}}]*category: ")({issue["current_category"]})(")'
            replacement = f'\\1{issue["suggested_category"]}\\3'
            
            new_content = re.sub(pattern_to_replace, replacement, content)
            if new_content != content:
                content = new_content
                fixes_made += 1
                print(f"✅ 已修复: {issue['url'][:50]}... -> {issue['suggested_category']}")
    
    # 写回修复后的文件
    if fixes_made > 0:
        with open('complete_gallery_data.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n🎉 修复完成! 共修复了 {fixes_made} 个分类问题")
    else:
        print("\n✅ 没有发现需要修复的问题")
    
    return fixes_made

def validate_data():
    """验证数据的正确性"""
    print("\n🔍 验证数据正确性...")
    
    with open('complete_gallery_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 统计各类别数量
    categories = {}
    static_in_live = 0
    video_not_in_live = 0
    
    pattern = r'\{[^}]*url:\s*"([^"]*)"[^}]*category:\s*"([^"]*)"[^}]*\}'
    matches = re.findall(pattern, content, re.DOTALL)
    
    for url, category in matches:
        categories[category] = categories.get(category, 0) + 1
        
        is_static = any(url.lower().endswith(ext) for ext in ['.jpg', '.png', '.jpeg', '.webp'])
        is_video = any(url.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.webm'])
        
        if is_static and category == "live":
            static_in_live += 1
        elif is_video and category != "live":
            video_not_in_live += 1
    
    print("📊 分类统计:")
    for category, count in sorted(categories.items()):
        print(f"  {category}: {count} 项")
    
    print(f"\n⚠️  问题统计:")
    print(f"  静态文件错误分类为live: {static_in_live}")
    print(f"  视频文件未分类为live: {video_not_in_live}")
    
    if static_in_live == 0 and video_not_in_live == 0:
        print("✅ 数据分类完全正确!")
    
    return static_in_live == 0 and video_not_in_live == 0

if __name__ == "__main__":
    print("🐰 Labubu画廊数据分类修复工具")
    print("=" * 50)
    
    # 修复数据
    fixes_made = fix_gallery_data()
    
    # 验证修复结果
    is_valid = validate_data()
    
    print("\n" + "=" * 50)
    if is_valid:
        print("🎉 数据修复完成，所有分类都正确!")
    else:
        print("⚠️  仍有一些问题需要手动检查")
