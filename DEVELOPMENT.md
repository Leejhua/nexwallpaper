# 🛠️ 开发指南

## 📋 项目概述

这是Labubu高清壁纸画廊的React重构版本，使用现代化的技术栈构建。

## 🏗️ 技术架构对比

### 原版 vs React版

| 特性 | 原版 (原生JS) | React版 |
|------|--------------|---------|
| **框架** | 原生JavaScript | React 18 |
| **样式** | 原生CSS | Tailwind CSS |
| **动画** | CSS Transitions | Framer Motion |
| **状态管理** | ES6 Class | React Hooks |
| **构建工具** | 无 | Vite |
| **包大小** | ~50KB | ~200KB |
| **开发体验** | 手动管理 | 热重载 |
| **维护性** | 中等 | 高 |

## 🚀 开发环境设置

### 1. 环境要求
```bash
Node.js >= 16.0.0
npm >= 7.0.0
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 📁 项目结构详解

```
src/
├── components/              # React组件
│   ├── Sidebar.jsx         # 侧边栏 - 筛选和分页控制
│   ├── Gallery.jsx         # 画廊网格 - 壁纸展示
│   ├── GalleryItem.jsx     # 壁纸卡片 - 单个项目
│   ├── Modal.jsx           # 预览模态框 - 全屏查看
│   └── Header.jsx          # 页面头部 - 标题和统计
├── hooks/                  # 自定义Hooks
│   ├── useGallery.js       # 画廊数据管理
│   └── useModal.js         # 模态框状态管理
├── data/                   # 数据文件
│   └── galleryData.js      # 壁纸数据和配置
├── styles/                 # 样式文件
│   └── index.css           # 全局样式和Tailwind
└── App.jsx                 # 主应用组件
```

## 🎨 组件设计原则

### 1. 单一职责
每个组件只负责一个特定功能：
- `Sidebar` - 只处理筛选和分页
- `Gallery` - 只处理网格布局
- `GalleryItem` - 只处理单个卡片

### 2. Props接口设计
```jsx
// 清晰的Props接口
const GalleryItem = ({ 
  item,           // 数据对象
  onPreview,      // 预览回调
  index           // 索引（用于动画延迟）
}) => {
  // 组件逻辑
};
```

### 3. 状态提升
所有共享状态都提升到App组件，通过props传递。

## 🔧 自定义Hooks详解

### useGallery Hook
```javascript
const {
  currentPageData,    // 当前页数据
  currentFilter,      // 当前筛选条件
  loading,           // 加载状态
  totalPages,        // 总页数
  handleFilter,      // 筛选处理函数
  handlePageChange   // 分页处理函数
} = useGallery();
```

### useModal Hook
```javascript
const {
  isOpen,           // 模态框开启状态
  currentItem,      // 当前预览项目
  openModal,        // 打开模态框
  closeModal,       // 关闭模态框
  downloadFile      // 下载文件
} = useModal();
```

## 🎭 动画系统

### Framer Motion配置
```jsx
// 页面进入动画
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* 内容 */}
</motion.div>

// 悬停动画
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  按钮
</motion.button>
```

### 动画最佳实践
1. **性能优先**: 使用transform而非position
2. **用户体验**: 动画时长控制在0.2-0.5s
3. **可访问性**: 支持prefers-reduced-motion

## 🎨 样式系统

### Tailwind CSS配置
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#667eea',
        600: '#5a67d8',
      },
      secondary: {
        500: '#764ba2',
      }
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
    }
  }
}
```

### 自定义CSS类
```css
/* 玻璃效果 */
.glass-effect {
  @apply bg-white/95 backdrop-blur-md border border-white/20;
}

/* 渐变文字 */
.gradient-text {
  @apply bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent;
}
```

## 📱 响应式设计

### 断点系统
```javascript
// 响应式Hook
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);  // 桌面端默认展开
    } else {
      setSidebarOpen(false); // 移动端默认收起
    }
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 网格适配
```jsx
// 响应式网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
  {/* 网格项目 */}
</div>
```

## ⚡ 性能优化

### 1. 图片懒加载
```jsx
<img
  src={item.url}
  loading="lazy"
  onLoad={() => setImageLoaded(true)}
  onError={() => setImageError(true)}
/>
```

### 2. 组件懒加载
```jsx
const Modal = React.lazy(() => import('./components/Modal'));

// 使用Suspense包装
<Suspense fallback={<div>Loading...</div>}>
  <Modal />
</Suspense>
```

### 3. 状态优化
```javascript
// 使用useMemo缓存计算结果
const filteredData = useMemo(() => {
  return galleryData.filter(item => 
    item.category === currentFilter
  );
}, [currentFilter]);
```

## 🧪 测试策略

### 组件测试
```jsx
// GalleryItem.test.jsx
import { render, screen } from '@testing-library/react';
import GalleryItem from './GalleryItem';

test('renders gallery item with title', () => {
  const mockItem = {
    id: 1,
    title: 'Test Image',
    url: 'test.jpg'
  };
  
  render(<GalleryItem item={mockItem} />);
  expect(screen.getByText('Test Image')).toBeInTheDocument();
});
```

### Hook测试
```javascript
// useGallery.test.js
import { renderHook, act } from '@testing-library/react';
import { useGallery } from './useGallery';

test('should filter items correctly', () => {
  const { result } = renderHook(() => useGallery());
  
  act(() => {
    result.current.handleFilter('fantasy');
  });
  
  expect(result.current.currentFilter).toBe('fantasy');
});
```

## 🚀 部署指南

### 1. 构建优化
```bash
# 生产构建
npm run build

# 分析包大小
npm run build -- --analyze
```

### 2. 环境变量
```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_CDN_URL=https://cdn.example.com
```

### 3. 部署到Vercel
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 🔍 调试技巧

### 1. React DevTools
- 安装React DevTools浏览器扩展
- 查看组件树和props
- 监控状态变化

### 2. 性能分析
```jsx
// 使用React Profiler
import { Profiler } from 'react';

<Profiler id="Gallery" onRender={onRenderCallback}>
  <Gallery />
</Profiler>
```

### 3. 错误边界
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## 📚 学习资源

### React生态系统
- [React官方文档](https://reactjs.org/)
- [React Hooks指南](https://reactjs.org/docs/hooks-intro.html)
- [Framer Motion文档](https://www.framer.com/motion/)

### 样式和设计
- [Tailwind CSS文档](https://tailwindcss.com/)
- [Aceternity UI组件](https://ui.aceternity.com/)
- [设计系统最佳实践](https://designsystemsrepo.com/)

## 🤝 贡献指南

### 1. 代码规范
- 使用ESLint和Prettier
- 遵循React最佳实践
- 编写清晰的注释

### 2. 提交规范
```bash
# 功能添加
git commit -m "✨ feat: 添加新的筛选功能"

# Bug修复
git commit -m "🐛 fix: 修复图片加载问题"

# 文档更新
git commit -m "📝 docs: 更新开发指南"
```

### 3. Pull Request
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

---

**开发愉快！** 🚀
