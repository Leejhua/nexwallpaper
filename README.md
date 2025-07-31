# 🎨 NexWallpaper - 高清壁纸画廊

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.5-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**基于React + Aceternity UI构建的现代化壁纸画廊应用**

[在线预览](https://nexwallpaper.vercel.app) • [项目文档](./DEVELOPMENT.md) • [部署指南](./DEPLOYMENT.md)

</div>

---

## ✨ 核心特性

### 🎯 用户体验
- **🎨 现代化UI设计** - 采用Aceternity UI组件库，提供精美的视觉体验
- **📱 完美响应式** - 支持桌面端、平板、手机全设备适配
- **⚡ 极速加载** - Vite构建 + 图片懒加载，页面加载速度<2秒
- **🎭 流畅动画** - Framer Motion提供丝滑的交互动画效果

### 🔍 智能搜索与筛选
- **🏷️ 多语言标签系统** - 支持中英文标签搜索和显示
- **🔍 智能搜索** - 支持标题、标签、分类多维度搜索
- **📊 分类筛选** - 6大分类（自然、抽象、几何、动物、城市、科技）
- **📈 热门排序** - 基于点击量和收藏数的智能排序

### 🖼️ 媒体处理
- **📸 高清预览** - 支持4K高清图片全屏预览
- **🎬 视频支持** - 集成视频播放和预览功能
- **⬇️ 一键下载** - 支持原图高清下载，多种格式选择
- **💾 本地存储** - IndexedDB本地缓存，提升访问速度

### 🛠️ 开发工具
- **🕷️ 智能爬虫** - 多数据源自动采集和更新
- **🧹 数据清理** - 自动验证和清理无效链接
- **📊 性能监控** - 实时性能统计和错误追踪
- **🔄 热更新** - 开发环境热重载，提升开发效率

## 🚀 快速开始

### 环境要求
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/LambdaTheory/nexwallpaper-new.git
cd nexwallpaper-new

# 安装依赖
npm install
```


### 开发模式
```bash
# 启动开发服务器
npm run dev

# 启动完整开发环境（前端+API）
npm run dev:full

# 仅启动API服务器
npm run dev:api
```

### 构建部署
```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 🏗️ 技术架构

### 前端技术栈
```javascript
const techStack = {
  framework: "React 18.2.0",           // 现代化React框架
  buildTool: "Vite 4.5.0",             // 快速构建工具
  styling: "TailwindCSS 3.3.5",        // 实用优先CSS框架
  animation: "Framer Motion 10.16.4",  // 专业动画库
  ui: "Aceternity UI",                 // 精美UI组件库
  icons: "Lucide React 0.294.0",       // 现代图标库
  state: "React Hooks",                // 内置状态管理
  utils: "clsx + tailwind-merge"       // 样式工具库
}
```

### 核心依赖
- **🎨 UI组件**：Aceternity UI + TailwindCSS
- **🎭 动画引擎**：Framer Motion
- **🖼️ 图片处理**：libheif-js（HEIC支持）
- **📦 文件处理**：jszip（批量下载）
- **🎬 GIF生成**：gif.js（动画导出）
- **🕷️ 数据采集**：cheerio + node-fetch

## 📁 项目结构

```
nexwallpaper-react/
├── 📁 src/                          # 源代码目录
│   ├── 📁 components/               # React组件
│   │   ├── 🎨 Gallery.jsx          # 主画廊组件
│   │   ├── 🖼️ GalleryItem.jsx      # 单个壁纸卡片
│   │   ├── 🔍 TagSearch.jsx        # 标签搜索组件
│   │   ├── 📱 Modal.jsx            # 预览模态框
│   │   ├── ⬇️ DownloadFormatSelector.jsx # 下载格式选择
│   │   └── 📁 ui/                  # 基础UI组件
│   ├── 📁 hooks/                   # 自定义Hooks
│   ├── 📁 services/                # 服务层
│   │   ├── 🕷️ crawler.js          # 爬虫服务
│   │   ├── 📊 dataUpdater.js      # 数据更新服务
│   │   └── 🔄 scheduler.js        # 定时任务服务
│   ├── 📁 data/                    # 数据文件
│   │   └── 📊 galleryData.js      # 壁纸数据
│   ├── 📁 utils/                   # 工具函数
│   └── 📁 styles/                  # 样式文件
├── 📁 scripts/                     # 脚本文件
│   ├── 🕷️ start-crawler.js       # 启动爬虫
│   ├── 🛑 stop-crawler.js         # 停止爬虫
│   └── 📊 crawler-status.js       # 爬虫状态
├── 📁 public/                      # 静态资源
├── 📁 tests/                       # 测试文件
└── 📄 配置文件                     # 各种配置文件
```

## 🎯 核心功能

### 1. 智能画廊系统
- **网格布局**：响应式瀑布流布局
- **懒加载**：图片按需加载，提升性能
- **无限滚动**：流畅的分页体验
- **键盘导航**：支持键盘快捷键操作

### 2. 高级搜索功能
- **实时搜索**：输入即时搜索
- **标签过滤**：多标签组合筛选
- **分类浏览**：按主题分类浏览
- **热门推荐**：智能推荐热门内容

### 3. 媒体预览系统
- **全屏预览**：沉浸式查看体验
- **图片缩放**：支持鼠标滚轮缩放
- **视频播放**：集成视频播放器
- **格式信息**：显示详细文件信息

### 4. 下载管理系统
- **多格式支持**：JPG、PNG、WebP、HEIC
- **质量选择**：可调节导出质量
- **批量下载**：支持多文件打包下载
- **下载进度**：实时显示下载状态

## 🛠️ 开发指南

### 添加新壁纸数据
```javascript
// 在 src/data/galleryData.js 中添加
{
  id: "unique-id",
  url: "https://example.com/image.jpg",
  title: "壁纸标题",
  category: "nature", // nature, abstract, geometric, animal, city, tech
  resolution: "1920x1080",
  type: "image", // image 或 video
  format: "jpg",
  tags: ["自然", "风景", "nature", "landscape"],
  likes: 0,
  downloads: 0
}
```

### 自定义主题
```javascript
// 在 tailwind.config.js 中配置
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}
```

### 爬虫配置
```javascript
// 在 src/config/crawlerConfig.js 中配置
const config = {
  sources: [
    {
      name: "数据源名称",
      url: "https://example.com",
      selector: ".image-item",
      interval: 3600000 // 1小时更新一次
    }
  ]
}
```

## 📊 性能指标

### 加载性能
- **首屏加载**：< 2秒
- **图片懒加载**：按需加载
- **缓存策略**：IndexedDB本地缓存
- **压缩优化**：图片自动压缩

### 用户体验
- **动画帧率**：60fps流畅动画
- **响应时间**：< 100ms交互响应
- **错误处理**：优雅的错误提示
- **离线支持**：基础离线功能

## 🚀 部署指南

### Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Netlify部署
```bash
# 构建项目
npm run build

# 上传dist文件夹到Netlify
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 快速测试
npm run test:quick

# 端到端测试
npm run test:e2e

# 性能测试
npm run test:stats
```

## 📈 监控与维护

### 爬虫管理
```bash
# 启动爬虫
npm run crawler:start

# 停止爬虫
npm run crawler:stop

# 查看状态
npm run crawler:status

# 手动运行清理
npm run crawler:run-cleanup

# 手动运行爬取
npm run crawler:run-crawl
```

### 性能监控
- **页面加载时间**：实时监控
- **错误率统计**：自动收集
- **用户行为分析**：点击热图
- **资源使用情况**：内存和CPU监控

## 🤝 贡献指南

1. **Fork** 项目
2. **创建** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **创建** Pull Request

## 📄 许可证

本项目采用 **MIT** 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- **[React](https://reactjs.org/)** - 用户界面库
- **[Vite](https://vitejs.dev/)** - 快速构建工具
- **[TailwindCSS](https://tailwindcss.com/)** - CSS框架
- **[Framer Motion](https://www.framer.com/motion/)** - 动画库
- **[Aceternity UI](https://ui.aceternity.com/)** - UI组件库
- **[Lucide](https://lucide.dev/)** - 图标库

## 📞 联系我们

- **项目地址**：https://github.com/LambdaTheory/nexwallpaper-new
- **在线预览**：https://nexwallpaper.vercel.app
- **问题反馈**：[GitHub Issues](https://github.com/LambdaTheory/nexwallpaper-new/issues)
- **功能建议**：[GitHub Discussions](https://github.com/LambdaTheory/nexwallpaper-new/discussions)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**

Made with ❤️ by [LEEJHSE](https://github.com/LambdaTheory)

</div>
