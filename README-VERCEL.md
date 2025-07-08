# Vercel 全栈部署指南

## 🚀 快速部署

### 方法一：一键部署
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/labubu-gallery-react)

### 方法二：本地部署
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署项目
vercel

# 4. 第一次部署时按提示配置：
# ? Set up and deploy "xxx"? [Y/n] y
# ? Which scope do you want to deploy to? Your Account
# ? Link to existing project? [y/N] n
# ? What's your project's name? labubu-gallery
# ? In which directory is your code located? ./

# 5. 后续更新部署
vercel --prod
```

## 📁 项目结构

```
labubu-gallery-react/
├── api/                    # Vercel Serverless Functions
│   └── stats/
│       ├── record.js      # 记录统计数据 API
│       └── batch.js       # 批量获取统计数据 API
├── src/                   # React 前端代码
├── dist/                  # 构建输出目录
├── vercel.json           # Vercel 配置文件
└── package.json          # 项目依赖
```

## 🔧 工作原理

### 前端部分
- **技术栈**: React + Vite + Tailwind CSS
- **构建**: `npm run build` 生成静态文件
- **部署**: 静态文件部署到Vercel CDN

### 后端部分  
- **技术栈**: Node.js Serverless Functions
- **API路由**: 
  - `POST /api/stats/record` - 记录用户统计
  - `POST /api/stats/batch` - 批量获取统计
- **数据存储**: 临时文件系统 (/tmp)

### 数据流程
1. 用户访问网站 → Vercel CDN 提供静态文件
2. 用户操作(点击/下载/喜欢) → 调用 `/api/stats/record`
3. 页面加载 → 调用 `/api/stats/batch` 获取统计数据
4. 数据存储在 `/tmp/stats.json` (无服务器临时存储)

## ⚙️ 配置说明

### vercel.json 配置
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

### package.json 构建脚本
```json
{
  "scripts": {
    "vercel-build": "vite build"
  }
}
```

## 🗃️ 数据存储限制

**注意**: 当前使用 `/tmp` 临时存储，数据会在函数冷启动时丢失。

### 生产环境推荐升级
1. **Vercel KV** (推荐)
   ```bash
   npm install @vercel/kv
   ```

2. **外部数据库**
   - MongoDB Atlas
   - PlanetScale  
   - Supabase

3. **Vercel Postgres**
   ```bash
   npm install @vercel/postgres
   ```

## 📊 API 接口说明

### 记录统计数据
```javascript
POST /api/stats/record
Content-Type: application/json

{
  "wallpaperId": "123",
  "action": "view" | "like" | "unlike" | "download"
}

// 响应
{
  "success": true,
  "data": {
    "view_count": 1,
    "like_count": 0,
    "download_count": 0,
    "last_updated": "2024-01-01T00:00:00.000Z"
  }
}
```

### 批量获取统计
```javascript
POST /api/stats/batch  
Content-Type: application/json

{
  "wallpaperIds": ["123", "456", "789"]
}

// 响应
{
  "success": true,
  "data": {
    "123": { "view_count": 1, "like_count": 0, ... },
    "456": { "view_count": 5, "like_count": 2, ... }
  }
}
```

## 🔍 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器 (前端)
npm run dev

# 3. 启动Vercel开发环境 (前后端)
vercel dev

# 4. 访问应用
open http://localhost:3000
```

## 🚀 性能特性

- ✅ **CDN加速**: 静态资源全球分发
- ✅ **无服务器**: 按需执行，零冷启动配置  
- ✅ **自动扩容**: 流量激增时自动扩展
- ✅ **HTTPS**: 自动SSL证书
- ✅ **自定义域名**: 支持绑定自己的域名

## 🔗 有用链接

- [Vercel 文档](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Static Site Generation](https://vercel.com/docs/concepts/static-sites)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables) 