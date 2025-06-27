# 壁纸分享站 MVP

一个简单的壁纸分享平台，支持上传、浏览、搜索和下载壁纸。

## 功能特性

- ✅ 壁纸上传（支持 JPEG、PNG、WEBP）
- ✅ 瀑布流展示
- ✅ 分类筛选
- ✅ 搜索功能
- ✅ 壁纸详情查看
- ✅ 下载功能
- ✅ 响应式设计

## 技术栈

**后端:**
- Node.js + Express
- SQLite 数据库
- Multer 文件上传
- Sharp 图片处理

**前端:**
- 原生 HTML/CSS/JavaScript
- 响应式设计

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
npm start
# 或开发模式
npm run dev
```

后端服务将运行在 http://localhost:3001

### 3. 启动前端

在另一个终端中：

```bash
cd frontend
# 使用 Python 启动简单服务器
python3 -m http.server 8000
# 或使用 Node.js
npx serve .
```

前端将运行在 http://localhost:8000

### 4. 访问应用

打开浏览器访问 http://localhost:8000

## API 接口

### 上传壁纸
- **POST** `/api/upload`
- 参数: `wallpaper` (文件), `title` (标题), `category` (分类)

### 获取壁纸列表
- **GET** `/api/wallpapers`
- 参数: `category`, `search`, `page`, `limit`

### 获取壁纸详情
- **GET** `/api/wallpapers/:id`

### 下载壁纸
- **GET** `/api/download/:id`

### 获取分类列表
- **GET** `/api/categories`

## 项目结构

```
wallpaper-share/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── uploads/          # 上传的图片文件
│   └── wallpapers.db     # SQLite 数据库
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## 下一步开发计划

- [ ] 用户系统（注册/登录）
- [ ] 图片压缩和多尺寸生成
- [ ] 标签系统
- [ ] 收藏功能
- [ ] 评论系统
- [ ] 管理后台
- [ ] 图片CDN集成
- [ ] 移动端APP

## 部署建议

### 开发环境
- 使用 nodemon 自动重启
- 前端使用 live-server 热重载

### 生产环境
- 使用 PM2 管理 Node.js 进程
- 使用 Nginx 作为反向代理
- 配置 HTTPS
- 使用云存储服务（如 AWS S3）
- 配置 CDN 加速

## 注意事项

1. 当前版本使用 SQLite，生产环境建议使用 PostgreSQL 或 MySQL
2. 文件存储在本地，建议使用云存储服务
3. 没有用户认证，所有人都可以上传
4. 没有图片审核机制
5. 没有文件大小和数量限制

## 许可证

MIT License
