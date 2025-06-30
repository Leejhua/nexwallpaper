# 壁纸网站爬虫脚本

这个脚本用于爬取 https://www.labubuwallpaper.xyz/ 网站的所有图片和视频资源。

## 功能特点

- 自动发现网站中的所有页面
- 提取所有 `<img>` 和 `<video>` 标签中的资源
- 支持断点续传，避免重复下载
- 智能重试机制
- 详细的日志记录
- 自动创建分类文件夹

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

```bash
python wallpaper_scraper.py
```

## 输出结构

```
wallpaper_downloads/
├── images/          # 图片文件
├── videos/          # 视频文件
├── failed_urls.txt  # 下载失败的URL列表
└── scraper.log      # 详细日志
```

## 配置选项

可以在脚本中修改以下参数：
- `max_pages`: 最大爬取页面数（默认50）
- 下载延迟时间
- 重试次数
- User-Agent等请求头

## 注意事项

1. 请遵守网站的robots.txt规则
2. 不要过于频繁地请求，避免给服务器造成压力
3. 仅用于学习和个人使用
4. 尊重版权，不要用于商业用途

## 法律声明

本脚本仅供学习交流使用，使用者需要遵守相关法律法规和网站服务条款。
