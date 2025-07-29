# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

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
    freetype-dev

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p temp

# 确保静态资源文件存在
RUN touch labubu-video.mov || echo "Warning: labubu-video.mov not found"
RUN touch trapezoid_beam_custom_1753676199463.png || echo "Warning: trapezoid_beam_custom_1753676199463.png not found"

# 暴露端口
EXPOSE 9091

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=9091

# 启动后端API服务器
CMD ["node", "dev-api-server-two-step.cjs"]