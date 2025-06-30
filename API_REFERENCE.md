# 🔌 Labubu画廊API参考文档

## 📋 概述

本文档详细描述了Labubu高清壁纸画廊项目中的所有API接口、类方法和数据结构。

## 🏗️ 核心类：HDLabubuGallery

### 类概述
```javascript
class HDLabubuGallery {
    constructor()
    init()
    setupEventListeners()
    handleResponsive()
    filterItems(filter)
    renderGallery()
    createGalleryItem(item, index)
    generateTags(item)
    generateVideoThumbnail(video, container)
    openModal(item)
    pauseModalVideo()
    downloadFile(url, filename)
    hideLoading()
}
```

### 构造函数

#### `constructor()`
**描述**: 初始化画廊实例，设置默认参数

**参数**: 无

**属性初始化**:
```javascript
this.allItems = hdImageData || [];     // 所有媒体项目
this.filteredItems = [...this.allItems]; // 筛选后的项目
this.currentFilter = 'all';            // 当前筛选器
this.currentPage = 1;                  // 当前页码
this.pageSize = 36;                    // 每页项目数
this.totalPages = 1;                   // 总页数
```

**示例**:
```javascript
const gallery = new HDLabubuGallery();
```

### 初始化方法

#### `init()`
**描述**: 初始化画廊，设置事件监听器并加载内容

**参数**: 无

**返回值**: 无

**调用流程**:
1. `setupEventListeners()` - 设置事件监听
2. `filterItems('all')` - 加载所有项目
3. `hideLoading()` - 隐藏加载指示器

### 事件处理方法

#### `setupEventListeners()`
**描述**: 设置所有用户交互事件监听器

**参数**: 无

**返回值**: 无

**监听的事件**:
- 侧边栏切换按钮点击
- 分类筛选按钮点击
- 分页导航按钮点击
- 页面大小选择变更
- 模态框关闭事件
- 键盘导航事件
- 窗口大小变化事件

**示例**:
```javascript
// 自动调用，无需手动调用
// this.setupEventListeners();
```

#### `handleResponsive()`
**描述**: 处理响应式布局，根据屏幕尺寸调整界面

**参数**: 无

**返回值**: 无

**响应式断点**:
- `<= 768px`: 移动端模式
- `> 768px`: 桌面端模式

**行为**:
```javascript
if (window.innerWidth <= 768) {
    // 移动端：收起侧边栏
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
} else {
    // 桌面端：展开侧边栏
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('expanded');
}
```

### 数据处理方法

#### `filterItems(filter)`
**描述**: 根据指定条件筛选媒体项目

**参数**:
- `filter` (string): 筛选条件
  - `'all'`: 显示所有项目
  - `'fantasy'`: 奇幻主题
  - `'desktop'`: 桌面壁纸
  - `'mobile'`: 手机壁纸
  - `'seasonal'`: 季节主题
  - `'4k'`: 4K高清
  - `'live'`: 动态视频

**返回值**: 无

**副作用**:
- 更新 `this.filteredItems`
- 重置 `this.currentPage = 1`
- 更新筛选按钮状态
- 调用 `renderGallery()`

**示例**:
```javascript
gallery.filterItems('fantasy'); // 筛选奇幻主题
gallery.filterItems('4k');      // 筛选4K高清
```

#### `renderGallery()`
**描述**: 渲染当前页面的画廊内容

**参数**: 无

**返回值**: 无

**处理流程**:
1. 计算分页信息
2. 获取当前页项目
3. 更新分页控件状态
4. 清空并重新填充画廊容器
5. 滚动到页面顶部

**分页计算**:
```javascript
this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
const startIndex = (this.currentPage - 1) * this.pageSize;
const endIndex = startIndex + this.pageSize;
const currentItems = this.filteredItems.slice(startIndex, endIndex);
```

### 内容生成方法

#### `createGalleryItem(item, index)`
**描述**: 创建单个画廊项目的DOM元素

**参数**:
- `item` (Object): 媒体项目数据
- `index` (number): 项目索引

**返回值**: `HTMLElement` - 画廊项目DOM元素

**项目数据结构**:
```javascript
{
    url: "https://example.com/image.jpg",
    title: "图片标题",
    category: "fantasy",
    resolution: "4K",
    source: "xyz",
    type: "image", // 或 "video"
    format: "jpg"
}
```

**生成的HTML结构**:
```html
<div class="gallery-item">
    <img src="..." alt="..." loading="lazy">
    <div class="loading-placeholder" style="display: none;">加载失败</div>
    <div class="item-info">
        <div class="item-title">标题</div>
        <div class="item-tags">标签</div>
    </div>
</div>
```

#### `generateTags(item)`
**描述**: 为媒体项目生成分类标签HTML

**参数**:
- `item` (Object): 媒体项目数据

**返回值**: `string` - 标签HTML字符串

**标签类型**:
- 分类标签：基于 `item.category`
- 分辨率标签：基于 `item.resolution`

**标签样式映射**:
```javascript
const categoryMap = {
    'fantasy': '奇幻',
    'desktop': '桌面', 
    'mobile': '手机',
    'seasonal': '季节',
    '4k': '4K',
    'live': '动态'
};
```

**示例输出**:
```html
<span class="tag fantasy">奇幻</span>
<span class="tag k4">4K</span>
```

### 媒体处理方法

#### `generateVideoThumbnail(video, container)`
**描述**: 为视频生成缩略图预览

**参数**:
- `video` (HTMLVideoElement): 视频元素
- `container` (HTMLElement): 容器元素

**返回值**: 无

**技术实现**:
1. 监听视频 `loadeddata` 事件
2. 创建Canvas元素
3. 将视频跳转到第1秒
4. 将视频帧绘制到Canvas
5. 转换为图片并替换视频元素

**Canvas操作**:
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
video.currentTime = 1;

video.addEventListener('seeked', () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    // 替换视频为缩略图
}, { once: true });
```

### 模态框方法

#### `openModal(item)`
**描述**: 打开模态框预览媒体项目

**参数**:
- `item` (Object): 要预览的媒体项目

**返回值**: 无

**功能**:
- 设置模态框标题和标签
- 根据类型显示图片或视频
- 配置下载按钮
- 显示模态框

**图片模式**:
```javascript
modalImage.src = item.url;
modalImage.style.display = 'block';
modalVideo.style.display = 'none';
```

**视频模式**:
```javascript
modalVideo.src = item.url;
modalVideo.style.display = 'block';
modalImage.style.display = 'none';
```

#### `pauseModalVideo()`
**描述**: 暂停模态框中的视频播放

**参数**: 无

**返回值**: 无

**实现**:
```javascript
const modalVideo = document.getElementById('modalVideo');
if (!modalVideo.paused) {
    modalVideo.pause();
}
```

### 工具方法

#### `downloadFile(url, filename)`
**描述**: 下载指定URL的文件

**参数**:
- `url` (string): 文件URL
- `filename` (string): 文件名（不含扩展名）

**返回值**: 无

**实现原理**:
```javascript
const a = document.createElement('a');
a.href = url;
a.download = filename + '.' + url.split('.').pop();
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
```

#### `hideLoading()`
**描述**: 隐藏加载指示器

**参数**: 无

**返回值**: 无

**实现**:
```javascript
document.getElementById('loadingIndicator').style.display = 'none';
```

## 📊 数据结构

### 媒体项目对象
```typescript
interface MediaItem {
    url: string;        // 媒体文件URL
    title: string;      // 标题
    category: string;   // 分类 ('fantasy', 'desktop', 'mobile', 'seasonal', '4k', 'live')
    resolution: string; // 分辨率 ('4K', 'PC', 'iPhone', '桌面', '高清')
    source: string;     // 数据源 ('xyz', 'com')
    type: string;       // 类型 ('image', 'video')
    format: string;     // 格式 ('jpg', 'png', 'mp4', 'mov')
}
```

### 画廊配置对象
```typescript
interface GalleryConfig {
    allItems: MediaItem[];      // 所有媒体项目
    filteredItems: MediaItem[]; // 筛选后的项目
    currentFilter: string;      // 当前筛选器
    currentPage: number;        // 当前页码
    pageSize: number;          // 每页项目数
    totalPages: number;        // 总页数
}
```

## 🎯 DOM元素ID参考

### 主要容器
- `#sidebar` - 侧边栏容器
- `#mainContent` - 主内容区域
- `#galleryContainer` - 画廊项目容器
- `#imageModal` - 模态框容器

### 控制元素
- `#sidebarToggle` - 侧边栏切换按钮
- `#pageSizeSelect` - 页面大小选择器
- `#prevBtn` - 上一页按钮
- `#nextBtn` - 下一页按钮

### 信息显示
- `#currentPage` - 当前页码显示
- `#totalPages` - 总页数显示
- `#loadingIndicator` - 加载指示器

### 模态框元素
- `#modalImage` - 模态框图片
- `#modalVideo` - 模态框视频
- `#modalTitle` - 模态框标题
- `#modalTags` - 模态框标签
- `#downloadBtn` - 下载按钮

## 🎨 CSS类参考

### 布局类
- `.sidebar` - 侧边栏样式
- `.sidebar.collapsed` - 侧边栏收起状态
- `.main-content` - 主内容区域
- `.main-content.expanded` - 主内容区域展开状态

### 组件类
- `.gallery-item` - 画廊项目
- `.filter-btn` - 筛选按钮
- `.filter-btn.active` - 激活的筛选按钮
- `.page-btn` - 分页按钮
- `.page-btn:disabled` - 禁用的分页按钮

### 标签类
- `.tag` - 基础标签样式
- `.tag.fantasy` - 奇幻标签
- `.tag.desktop` - 桌面标签
- `.tag.mobile` - 手机标签
- `.tag.seasonal` - 季节标签
- `.tag.live` - 动态标签
- `.tag.k4` - 4K标签

## 🔧 事件参考

### 自定义事件
项目中主要使用标准DOM事件，未定义自定义事件。

### 监听的标准事件
- `click` - 按钮点击
- `change` - 选择器变更
- `keydown` - 键盘按下
- `resize` - 窗口大小变化
- `loadeddata` - 视频数据加载完成
- `seeked` - 视频跳转完成

## 📱 响应式断点

### 断点定义
```css
/* 大屏幕桌面 */
@media (min-width: 1201px) { /* 默认样式 */ }

/* 小屏幕桌面/平板横屏 */
@media (max-width: 1200px) { 
    column-count: 3;
    sidebar-width: 260px;
}

/* 平板竖屏/大手机 */
@media (max-width: 768px) { 
    column-count: 2;
    sidebar: full-width overlay;
}

/* 小手机 */
@media (max-width: 480px) { 
    column-count: 1;
    reduced-padding;
}
```

### 响应式行为
- **侧边栏**: 桌面端固定，移动端覆盖
- **瀑布流**: 根据屏幕宽度调整列数
- **字体大小**: 小屏幕适当缩小
- **间距**: 移动端减少内外边距

## 🚀 使用示例

### 基本初始化
```javascript
// 自动初始化（推荐）
document.addEventListener('DOMContentLoaded', () => {
    new HDLabubuGallery();
});

// 手动初始化
const gallery = new HDLabubuGallery();
```

### 程序化控制
```javascript
const gallery = new HDLabubuGallery();

// 筛选特定分类
gallery.filterItems('fantasy');

// 跳转到指定页面
gallery.currentPage = 3;
gallery.renderGallery();

// 更改页面大小
gallery.pageSize = 48;
gallery.currentPage = 1;
gallery.renderGallery();
```

### 事件监听
```javascript
// 监听筛选变化（需要自定义实现）
document.addEventListener('filterChanged', (e) => {
    console.log('当前筛选:', e.detail.filter);
});

// 监听页面变化（需要自定义实现）
document.addEventListener('pageChanged', (e) => {
    console.log('当前页面:', e.detail.page);
});
```

## 🔍 调试工具

### 控制台调试
```javascript
// 获取画廊实例（需要暴露到全局）
window.gallery = new HDLabubuGallery();

// 查看当前状态
console.log('所有项目:', gallery.allItems.length);
console.log('筛选项目:', gallery.filteredItems.length);
console.log('当前页面:', gallery.currentPage);
console.log('总页数:', gallery.totalPages);

// 测试筛选功能
gallery.filterItems('4k');
console.log('4K项目数量:', gallery.filteredItems.length);
```

### 性能监控
```javascript
// 监控渲染性能
console.time('renderGallery');
gallery.renderGallery();
console.timeEnd('renderGallery');

// 监控筛选性能
console.time('filterItems');
gallery.filterItems('fantasy');
console.timeEnd('filterItems');
```

---

**API文档版本**: v1.0  
**最后更新**: 2025年6月30日  
**兼容性**: 现代浏览器 (ES6+)  

🔌 **完整的API参考，助力二次开发！**
