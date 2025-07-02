# 🐰 Hualang React画廊 Docker配置
# 基于Node.js 18 Alpine镜像

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=http://localhost:3001

# 安装系统依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# 启动应用
CMD ["npm", "run", "preview"]
