# Labubu Stats API

轻量级的壁纸统计API服务器，用于跨浏览器同步统计数据。

## 功能特性

- ✅ 跨浏览器统计数据同步
- ✅ SQLite数据库存储
- ✅ 防刷限流保护
- ✅ 批量操作支持
- ✅ 热门壁纸排行
- ✅ 用户行为追踪

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 使用脚本启动
./start.sh
```

### 停止服务器
```bash
./stop.sh
```

## API端点

### 健康检查
```
GET /api/health
```

### 获取统计数据
```
GET /api/stats/:wallpaperId
POST /api/stats/batch
```

### 记录用户操作
```
POST /api/stats/:wallpaperId/action
Body: { "action": "view|like|unlike|download" }
```

### 获取热门壁纸
```
GET /api/popular?limit=10
```

## 数据库结构

### wallpaper_stats 表
- `id`: 壁纸ID (主键)
- `view_count`: 浏览次数
- `like_count`: 喜欢次数
- `download_count`: 下载次数
- `created_at`: 创建时间
- `updated_at`: 更新时间

### user_actions 表
- `id`: 操作ID (自增主键)
- `wallpaper_id`: 壁纸ID
- `action_type`: 操作类型
- `ip_address`: IP地址
- `user_agent`: 用户代理
- `timestamp`: 操作时间

## 安全特性

- **CORS保护**: 只允许指定域名访问
- **限流保护**: 防止API滥用
- **SQL注入防护**: 使用参数化查询
- **输入验证**: 严格的参数验证

## 部署建议

### 本地开发
```bash
./start.sh
```

### 生产部署
- 使用PM2进程管理
- 配置Nginx反向代理
- 设置SSL证书
- 定期备份数据库

## 监控和维护

### 日志查看
服务器日志会输出到控制台，包含：
- API请求记录
- 错误信息
- 性能统计

### 数据库维护
```bash
# 查看数据库文件
ls -la stats.db

# 备份数据库
cp stats.db stats_backup_$(date +%Y%m%d).db
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   lsof -ti:3001
   kill -9 <PID>
   ```

2. **数据库锁定**
   - 重启服务器
   - 检查并发访问

3. **CORS错误**
   - 检查前端域名配置
   - 更新server.js中的CORS设置

## 性能优化

- 使用连接池
- 添加缓存层
- 数据库索引优化
- 批量操作优化
