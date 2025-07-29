# Docker 部署指南

本项目提供了完整的Docker化解决方案，支持后端API服务器的容器化部署。

## 文件说明

- `Dockerfile` - 后端API服务器的Docker镜像构建文件
- `docker-compose.yml` - 完整应用栈的编排文件
- `.dockerignore` - Docker构建时忽略的文件列表

## 快速开始

### 方式一：仅运行后端API服务器

```bash
# 构建Docker镜像
docker build -t labubu-gallery-api .

# 运行容器
docker run -d \
  --name labubu-api \
  -p 9091:9091 \
  -v $(pwd)/temp:/app/temp \
  -v $(pwd)/labubu-video.mov:/app/labubu-video.mov:ro \
  -v $(pwd)/trapezoid_beam_custom_1753676199463.png:/app/trapezoid_beam_custom_1753676199463.png:ro \
  labubu-gallery-api
```

### 方式二：使用Docker Compose（推荐）

```bash
# 仅启动后端API服务器
docker-compose up -d api

# 启动完整开发环境（包括前端）
docker-compose --profile dev up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

## 服务访问

- **后端API服务器**: http://localhost:9091
- **健康检查**: http://localhost:9091/health
- **前端开发服务器** (开发模式): http://localhost:9090

## 环境要求

### 系统依赖
- Docker 20.10+
- Docker Compose 2.0+

### 必需文件
确保以下文件存在于项目根目录：
- `labubu-video.mov` - 基础视频文件
- `trapezoid_beam_custom_1753676199463.png` - 覆盖图片
- `trapezoid_beam_*.png` - 其他光束效果图片

## 配置说明

### 环境变量
- `NODE_ENV` - 运行环境 (production/development)
- `PORT` - API服务器端口 (默认: 9091)

### 数据卷
- `./temp` - 临时文件存储目录
- 静态资源文件以只读方式挂载

## 开发模式

```bash
# 启动开发环境（包括前端热重载）
docker-compose --profile dev up

# 仅重启API服务器
docker-compose restart api

# 进入容器调试
docker-compose exec api sh
```

## 生产部署

```bash
# 构建生产镜像
docker build -t labubu-gallery-api:latest .

# 运行生产容器
docker-compose up -d api

# 设置自动重启
docker update --restart=always labubu-api
```

## 故障排除

### 常见问题

1. **FFmpeg相关错误**
   ```bash
   # 检查FFmpeg是否正确安装
   docker-compose exec api ffmpeg -version
   ```

2. **文件权限问题**
   ```bash
   # 确保temp目录有写权限
   chmod 755 temp/
   ```

3. **静态文件缺失**
   ```bash
   # 检查必需文件是否存在
   ls -la *.mov *.png
   ```

### 日志查看

```bash
# 查看API服务器日志
docker-compose logs -f api

# 查看所有服务日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100 api
```

### 性能监控

```bash
# 查看容器资源使用情况
docker stats

# 查看容器详细信息
docker-compose exec api top
```

## 清理

```bash
# 停止所有服务
docker-compose down

# 删除容器和网络
docker-compose down --volumes

# 删除镜像
docker rmi labubu-gallery-api

# 清理未使用的Docker资源
docker system prune -a
```

## 注意事项

1. **资源要求**: 视频处理需要较多CPU和内存资源
2. **存储空间**: temp目录会存储临时视频文件，需要足够空间
3. **网络**: 确保9091端口未被占用
4. **文件大小**: 大型媒体文件建议使用数据卷挂载而非复制到镜像中

## 扩展配置

### 自定义配置
可以通过环境变量或配置文件自定义以下参数：
- 视频处理质量
- 临时文件清理策略
- API超时设置
- 日志级别

### 集群部署
对于高负载场景，可以使用Docker Swarm或Kubernetes进行集群部署。