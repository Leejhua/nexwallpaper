# 后端API服务

这个文件夹包含了项目的所有后端API相关文件。

## 文件结构

```
backend/
├── dev-api-server-two-step.cjs    # 主API服务器文件
└── api/                           # API路由模块
    ├── health.js                  # 健康检查API
    ├── make-heif.js              # HEIF图片处理API
    └── stats/                    # 统计相关API
        ├── batch.js              # 批量统计处理
        ├── record.js             # 记录统计数据
        └── storage.js            # 统计数据存储
```

## 启动服务

### 开发环境
```bash
# 启动API服务器
npm run dev:api

# 或直接运行
node backend/dev-api-server-two-step.cjs
```

### 生产环境
```bash
# 使用Docker
docker-compose up

# 或直接运行
NODE_ENV=production node backend/dev-api-server-two-step.cjs
```

## API端点

- `GET /api/health` - 健康检查
- `POST /api/stats/record` - 记录用户操作统计
- `POST /api/stats/batch` - 批量处理统计数据
- `POST /api/make-heif` - HEIF图片处理
- `POST /api/share` - 分享功能
- `GET /api/download/:wallpaperId` - 下载壁纸
- `GET /api/stats/all` - 获取所有统计数据

## 端口配置

- 开发环境：`http://localhost:9091`
- 生产环境：通过Nginx代理到端口80

## 注意事项

1. 确保所有依赖已安装：`npm install`
2. 开发时前端会自动代理API请求到9091端口
3. 生产环境使用Docker时，API和前端都通过Nginx统一提供服务