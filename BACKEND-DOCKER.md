# 后端Docker部署指南

本文档介绍如何使用Docker部署项目的后端API服务。

## 📋 文件说明

- `Dockerfile.backend` - 后端专用Dockerfile
- `docker-compose.backend.yml` - 后端服务Docker Compose配置
- `.dockerignore.backend` - 后端构建专用忽略文件
- `deploy-backend.sh` - 自动化部署脚本

## 🚀 快速开始

### 方法一：使用部署脚本（推荐）

```bash
# 构建Docker镜像
./deploy-backend.sh build

# 启动后端服务
./deploy-backend.sh start

# 查看服务状态
./deploy-backend.sh status

# 查看日志
./deploy-backend.sh logs
```

### 方法二：手动使用Docker Compose

```bash
# 构建并启动服务
docker-compose -f docker-compose.backend.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose.backend.yml ps

# 查看日志
docker-compose -f docker-compose.backend.yml logs -f

# 停止服务
docker-compose -f docker-compose.backend.yml down
```

## 🔧 配置说明

### 端口配置
- **API服务**: `9091:9091`
- **访问地址**: `http://localhost:9091`
- **健康检查**: `http://localhost:9091/api/health`

### 资源限制
- **内存限制**: 1GB
- **CPU限制**: 1核心
- **文件描述符**: 65536（解决"Too many open files"问题）

### 环境变量
```yaml
NODE_ENV: production
PORT: 9091
CHOKIDAR_USEPOLLING: false
WATCHPACK_POLLING: false
```

## 📁 目录挂载

- `./temp:/app/temp` - 临时文件目录

## 🛠️ 部署脚本命令

```bash
./deploy-backend.sh [命令]
```

### 可用命令：

| 命令 | 说明 |
|------|------|
| `build` | 构建Docker镜像 |
| `start` | 启动后端服务 |
| `stop` | 停止后端服务 |
| `restart` | 重启后端服务 |
| `logs` | 查看服务日志 |
| `status` | 查看服务状态 |
| `help` | 显示帮助信息 |

## 🔍 故障排除

### 1. "Too many open files" 错误

已在配置中解决：
- 设置了 `ulimits.nofile` 为 65536
- 在Dockerfile中配置了系统限制
- 禁用了文件监控功能

### 2. 端口冲突

如果9091端口被占用，可以修改 `docker-compose.backend.yml` 中的端口映射：
```yaml
ports:
  - "9092:9091"  # 将主机端口改为9092
```

### 3. 内存不足

可以调整 `docker-compose.backend.yml` 中的资源限制：
```yaml
deploy:
  resources:
    limits:
      memory: 2G  # 增加到2GB
```

### 4. 查看详细日志

```bash
# 查看实时日志
./deploy-backend.sh logs

# 或者使用docker命令
docker-compose -f docker-compose.backend.yml logs -f api
```

## 🔄 更新部署

当代码更新后，重新部署：

```bash
# 停止服务
./deploy-backend.sh stop

# 重新构建镜像
./deploy-backend.sh build

# 启动服务
./deploy-backend.sh start
```

或者一键重启：
```bash
./deploy-backend.sh restart
```

## 📊 监控和维护

### 健康检查
服务包含自动健康检查，每30秒检查一次API端点。

### 资源监控
```bash
# 查看容器资源使用情况
./deploy-backend.sh status

# 或者使用docker命令
docker stats
```

### 清理
```bash
# 停止并删除容器
docker-compose -f docker-compose.backend.yml down

# 删除镜像（可选）
docker rmi $(docker images -q labubu-gallery-react_api)
```

## 🌐 生产环境建议

1. **使用反向代理**（如Nginx）处理HTTPS和负载均衡
2. **配置日志轮转**避免日志文件过大
3. **设置监控告警**监控服务状态
4. **定期备份**重要数据和配置
5. **使用Docker Swarm或Kubernetes**进行集群部署

## 📝 注意事项

- 确保Docker和Docker Compose已正确安装
- 首次运行需要下载依赖，可能需要较长时间
- 生产环境建议使用具体的镜像版本标签而非latest
- 定期更新基础镜像以获取安全补丁