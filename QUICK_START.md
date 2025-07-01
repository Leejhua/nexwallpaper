# 🚀 Labubu壁纸画廊 - 快速开始指南

## 🌟 主要版本 - React现代化画廊

### 一键启动
```bash
# 启动React主要版本（推荐）
./start_main_gallery.sh
```

### 访问地址
- **🎭 React现代化画廊**: http://localhost:3000

### 功能特色
- 🎨 **Aceternity UI**: 现代化组件库
- 🎭 **Framer Motion**: 流畅动画效果
- 🔍 **智能搜索**: 支持标题和标签搜索
- ⌨️ **键盘快捷键**: 完整的键盘导航
- 📱 **响应式设计**: 完美适配所有设备
- 🖼️ **全屏预览**: 高清图片和视频预览
- ⬇️ **一键下载**: 支持原图下载

### 键盘快捷键
- `Ctrl/Cmd + K`: 聚焦搜索框
- `←/→`: 上一页/下一页
- `Esc`: 关闭模态框

### 停止服务
```bash
./stop_main_gallery.sh
```

## 🎨 辅助版本 - 原生HTML画廊

### 高清版本 (400+媒体文件)
```bash
# 启动高清画廊
./start_hd_gallery.sh

# 访问地址
http://localhost:8080/hd_sidebar_gallery.html
```

### 经典版本 (54媒体文件)
```bash
# 启动经典画廊
./start_gallery.sh

# 访问地址
http://localhost:8080/video_thumbnail_gallery.html
```

## 🔧 环境要求

### React版本要求
- Node.js 16+
- npm 或 yarn

### HTML版本要求
- Python 3.x
- 现代浏览器

## 🧪 测试和检查

### 检查React项目状态
```bash
./check_react_status.sh
```

### 快速测试React画廊
```bash
./test_react_gallery.sh
```

## 📊 项目数据
- **总媒体文件**: 400个
- **高清图片**: 386张 (真正4K)
- **动态视频**: 14个
- **分类数量**: 6个
- **画质**: 无压缩原图

## 🎯 推荐使用流程

1. **首次使用**: 运行 `./check_react_status.sh` 检查环境
2. **启动画廊**: 运行 `./start_main_gallery.sh`
3. **访问画廊**: 打开 http://localhost:3000
4. **享受浏览**: 使用搜索、筛选、预览功能
5. **停止服务**: 运行 `./stop_main_gallery.sh`

## 🆘 常见问题

### Q: React版本启动失败？
A: 运行 `./check_react_status.sh` 检查环境，确保Node.js 16+已安装

### Q: 端口被占用？
A: 运行 `./stop_main_gallery.sh` 停止现有服务

### Q: 数据加载慢？
A: React版本支持智能分页，可以调节页面大小

### Q: 想要离线版本？
A: 使用HTML版本 `./start_hd_gallery.sh`，无需Node.js

---

🎉 **享受你的Labubu壁纸收藏之旅！**

**推荐版本**: React现代化版本 (http://localhost:3000)  
**技术支持**: React 18 + Vite + Tailwind CSS + Framer Motion
