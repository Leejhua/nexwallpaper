# 多阶段构建：第一阶段 - 构建前端
FROM node:18-alpine AS frontend-builder

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --include=dev

# 复制前端源代码
COPY . .

# 构建前端应用
RUN npm run build

# 第二阶段 - 生产环境
FROM node:18-alpine AS production

# 安装FFmpeg和其他系统依赖
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    nginx

# 创建必要的目录和配置文件以解决 "Too many open files" 错误
RUN mkdir -p /etc/security && \
    echo "* soft nofile 65536" > /etc/security/limits.conf && \
    echo "* hard nofile 65536" >> /etc/security/limits.conf

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 复制后端代码和配置文件
COPY backend/ ./backend/
COPY *.json ./
COPY *.js ./
COPY *.cjs ./

# 从构建阶段复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建必要的目录
RUN mkdir -p temp

# 复制静态资源文件（如果存在）
COPY . /tmp/source/
RUN cp /tmp/source/*.png /app/ 2>/dev/null || echo "Warning: PNG files not found" && \
    cp /tmp/source/*.mov /app/ 2>/dev/null || echo "Warning: MOV files not found" && \
    cp /tmp/source/*.mp4 /app/ 2>/dev/null || echo "Warning: MP4 files not found" && \
    rm -rf /tmp/source

# 配置nginx
COPY <<EOF /etc/nginx/nginx.conf
events {
    worker_connections 1024;
}
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        
        # 前端静态文件
        location / {
            root /app/dist;
            try_files \$uri \$uri/ /index.html;
        }
        
        # API代理
        location /api {
            proxy_pass http://localhost:9091;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# 暴露端口
EXPOSE 80 9091

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=9091

# 启动脚本
COPY <<EOF /app/start.sh
#!/bin/sh
# 设置文件描述符限制
ulimit -n 65536

# 禁用文件监控以减少文件描述符使用
export CHOKIDAR_USEPOLLING=false
export WATCHPACK_POLLING=false

# 启动nginx
nginx -g "daemon on;"

# 启动API服务器
node backend/dev-api-server-two-step.cjs
EOF

RUN chmod +x /app/start.sh

# 启动服务
CMD ["/app/start.sh"]