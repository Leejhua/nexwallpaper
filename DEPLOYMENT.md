# 🚀 Labubu Gallery 部署指南

## 📋 项目架构

这是一个**全栈React应用**，包含：

### 🎨 前端技术栈
- **框架**: React 18 + Vite
- **样式**: Tailwind CSS + Framer Motion
- **UI组件**: Aceternity UI + Lucide Icons
- **功能**: GIF转换、图片下载、统计分析

### ⚙️ 后端技术栈
- **平台**: Vercel Serverless Functions (Node.js 18.x)
- **API路由**: `/api/health`, `/api/stats/record`, `/api/stats/batch`
- **数据存储**: JSON文件存储（支持扩展到数据库）
- **CORS**: 已配置跨域支持

## 🌍 部署方式

### 方式一：Vercel部署（推荐）

#### 特点
✅ **前后端一体化部署**  
✅ **Serverless函数自动扩容**  
✅ **全球CDN加速**  
✅ **SSL证书自动配置**  
✅ **持续集成/部署(CI/CD)**

#### 部署步骤

1. **准备代码**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **连接Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 导入GitHub仓库
   - 选择本项目

3. **配置部署**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **环境变量**（可选）
   ```
   NODE_ENV=production
   STORAGE_TYPE=file
   ```

5. **部署完成**
   - Vercel自动构建和部署
   - 获得 `https://your-app.vercel.app` 域名
   - API可通过 `https://your-app.vercel.app/api/*` 访问

### 方式二：其他平台部署

#### 前端部署
支持任何静态托管平台：
- **Netlify**: 拖拽`dist`文件夹
- **GitHub Pages**: 使用GitHub Actions
- **Cloudflare Pages**: 连接Git仓库

#### 后端部署
需要迁移API到对应平台：
- **Netlify Functions**: 需要改写函数格式
- **Cloudflare Workers**: 需要改写为Worker格式
- **传统服务器**: 使用Express.js（见开发环境配置）

## 🛠 开发环境

### 启动完整开发环境
```bash
# 安装依赖
npm install

# 启动前端+API服务器
npm run dev:full

# 或分别启动
npm run dev      # 前端 (端口3000)
npm run dev:api  # API服务器 (端口3001)
```

### 开发环境特点
- **前端**: http://192.168.163.183:3000
- **API**: http://192.168.163.183:3001/api
- **数据存储**: `./dev-stats.json` 本地文件
- **热重载**: 前端和API都支持
- **CORS**: 已配置跨域访问

## 📊 数据存储

### 当前方案：文件存储
```json
{
  "metadata": {
    "created": "2025-07-07T09:55:22.762Z",
    "lastUpdated": "2025-07-07T09:55:22.762Z",
    "version": "1.0.0",
    "totalRecords": 1
  },
  "stats": {
    "wallpaper-id": {
      "view_count": 10,
      "like_count": 5,
      "download_count": 3,
      "created": "2025-07-07T09:55:13.722Z",
      "last_updated": "2025-07-07T09:55:22.762Z"
    }
  }
}
```

### 升级方案（可选）
- **MongoDB Atlas**: 云端NoSQL数据库
- **Supabase**: 开源Firebase替代
- **PlanetScale**: 云端MySQL
- **Vercel KV**: Redis兼容键值存储

## 🔧 配置项

### 环境变量
```bash
# 存储类型
STORAGE_TYPE=file          # file | memory | database

# API配置
VITE_STATS_API_URL=        # 自定义API地址（可选）

# 数据库配置（如果使用数据库存储）
DATABASE_URL=              # 数据库连接串
```

### Vercel配置文件 (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": { "runtime": "nodejs18.x" }
  }
}
```

## 🚀 生产环境特性

### 性能优化
- **代码分割**: Vite自动分割
- **树摇优化**: 移除未使用代码
- **资源压缩**: Gzip + Brotli
- **图片优化**: 懒加载 + WebP支持

### 安全特性
- **CORS配置**: 限制跨域访问
- **输入验证**: API参数校验
- **错误处理**: 统一错误响应
- **日志记录**: 调试和监控

### 监控和分析
- **Vercel Analytics**: 页面性能监控
- **API日志**: Serverless函数日志
- **错误追踪**: 自动错误收集

## 🔄 升级迁移

### 从localStorage迁移到API
当前已完成：数据自动从localStorage同步到API

### 数据库迁移
如需升级到数据库存储：
1. 修改`api/stats/storage.js`
2. 添加数据库连接配置
3. 实现DatabaseStorage类
4. 更新环境变量

## 🆘 故障排除

### 常见问题

1. **API调用失败**
   - 检查开发API服务器是否启动 (端口3001)
   - 检查CORS配置
   - 检查网络连接

2. **Vercel部署失败**
   - 检查`package.json`脚本
   - 检查Node.js版本兼容性
   - 查看Vercel构建日志

3. **数据丢失**
   - 开发环境：检查`dev-stats.json`文件
   - 生产环境：Serverless函数使用`/tmp`目录（重启会丢失）

### 日志查看
```bash
# 开发环境API日志
npm run dev:api

# Vercel生产环境日志
vercel logs
```

## 📈 后续优化建议

1. **数据持久化**: 迁移到数据库存储
2. **缓存优化**: 添加Redis缓存层
3. **CDN优化**: 图片资源CDN加速
4. **监控告警**: 添加性能监控和告警
5. **用户认证**: 添加用户系统和权限控制

---

**当前状态**: ✅ 完整的前后端一体化应用，支持本地开发和生产部署 