# 🐰 Labubu画廊 - React现代化版本

一个基于React 18构建的现代化Labubu壁纸画廊应用，采用Aceternity UI组件库，提供流畅的用户体验和美观的响应式界面。

## ✨ 项目特色

### 🎨 现代化设计
- **React 18** + **Vite** + **Tailwind CSS**
- **Aceternity UI** 现代化组件库
- **Framer Motion** 流畅动画效果
- **响应式设计** 完美适配各种设备

### 📊 丰富内容
- **400+高清壁纸** 真正的4K画质
- **14个动态视频** 动态壁纸体验
- **智能分类** 奇幻、桌面、手机、4K、动态、季节主题
- **无压缩画质** 保持原始高清品质

### 🔧 强大功能
- **智能搜索** 快速找到心仪壁纸
- **多种筛选** 按分类、标签、热度筛选
- **键盘快捷键** 提升操作效率
- **一键下载** 批量下载支持
- **点击统计** 智能推荐热门内容

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 预览生产版本
```bash
npm run preview
# 或
yarn preview
```

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── Gallery.jsx     # 主画廊组件
│   ├── GalleryItem.jsx # 画廊项目组件
│   ├── Header.jsx      # 头部组件
│   ├── Sidebar.jsx     # 侧边栏组件
│   ├── Modal.jsx       # 模态框组件
│   └── ...
├── data/               # 数据文件
│   └── galleryData.js  # 画廊数据
├── hooks/              # 自定义Hooks
│   ├── useGallery.js   # 画廊逻辑Hook
│   ├── useModal.js     # 模态框Hook
│   └── useClickStats.js # 统计Hook
├── services/           # 服务层
│   └── statsApi.js     # 统计API
├── styles/             # 样式文件
│   ├── index.css       # 主样式
│   └── pixiv-theme.css # 主题样式
└── utils/              # 工具函数
    └── imageUtils.js   # 图片工具
```

## 🎯 核心功能

### 🖼️ 画廊展示
- 瀑布流布局
- 懒加载优化
- 悬停预览效果
- 全屏模态框

### 🔍 搜索筛选
- 实时搜索
- 标签筛选
- 分类过滤
- 排序功能

### 📱 响应式设计
- 桌面端：4列瀑布流
- 平板端：3列布局
- 手机端：2列/1列自适应

### ⌨️ 键盘快捷键
- `Escape`: 关闭模态框
- `←/→`: 切换图片
- `Space`: 暂停/播放视频
- `F`: 全屏切换

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化React框架
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架

### UI组件
- **Aceternity UI** - 现代化组件库
- **Framer Motion** - 动画库
- **Lucide React** - 图标库

### 状态管理
- **React Hooks** - 内置状态管理
- **Context API** - 全局状态共享

### 开发工具
- **ESLint** - 代码规范检查
- **PostCSS** - CSS处理工具

## 📊 性能优化

### 图片优化
- 懒加载实现
- 渐进式加载
- 缓存策略
- 压缩优化

### 代码优化
- 组件懒加载
- 虚拟滚动
- 防抖处理
- 内存管理

## 🔧 配置说明

### 环境变量
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_STATS_ENABLED=true
```

### 构建配置
- Vite配置：`vite.config.js`
- Tailwind配置：`tailwind.config.js`
- PostCSS配置：`postcss.config.js`

## 🧪 测试

### 运行测试
```bash
npm run test
# 或
yarn test
```

### 测试覆盖
- 组件测试
- Hook测试
- 端到端测试
- 性能测试

## 📈 数据统计

### 统计功能
- 点击统计
- 下载统计
- 热度排行
- 用户行为分析

### API接口
- `GET /api/stats` - 获取统计数据
- `POST /api/stats/click` - 记录点击
- `POST /api/stats/download` - 记录下载

## 🎨 主题定制

### 颜色配置
```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --accent-color: #06b6d4;
}
```

### 响应式断点
```css
/* 手机端 */
@media (max-width: 640px) { ... }

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* 桌面端 */
@media (min-width: 1025px) { ... }
```

## 🚀 部署指南

### Vercel部署
```bash
npm run build
vercel --prod
```

### Netlify部署
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

### 代码规范
- 使用ESLint规则
- 遵循React最佳实践
- 编写单元测试
- 添加类型注释

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **Labubu** - 提供精美的壁纸资源
- **Aceternity UI** - 现代化组件库
- **React团队** - 优秀的前端框架
- **Vite团队** - 快速的构建工具

## 📞 联系方式

- **项目地址**: https://gitcode.com/LEEJHSE/hualang.git
- **问题反馈**: 请在GitHub Issues中提交
- **功能建议**: 欢迎提交Pull Request

---

**项目状态**: ✅ 活跃开发中  
**最后更新**: 2025年7月2日  
**版本**: v1.0.0  

🎉 **享受现代化的Labubu壁纸收藏体验！**
