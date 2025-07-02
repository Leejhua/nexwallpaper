# 🔄 Labubu壁纸画廊项目同步指南

## 📋 项目信息

- **仓库地址**: gitcode.com:LEEJHSE/mycode.git
- **项目类型**: React + Node.js 全栈项目
- **主要功能**: 400+高清壁纸画廊 + 统计API

## 🚀 在新电脑上同步步骤

### 1. 克隆仓库

```bash
# 克隆项目到本地
git clone git@gitcode.com:LEEJHSE/mycode.git
# 或使用HTTPS
git clone https://gitcode.com/LEEJHSE/mycode.git

# 进入项目目录
cd mycode
```

### 2. 环境准备

#### 安装Node.js (推荐版本18+)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (使用Homebrew)
brew install node

# Windows
# 下载并安装: https://nodejs.org/
```

#### 安装Python (如需要爬虫功能)
```bash
# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# macOS
brew install python3

# Windows
# 下载并安装: https://python.org/
```

### 3. 安装依赖

#### React前端依赖
```bash
cd labubu-gallery-react
npm install
```

#### 统计API依赖
```bash
cd ../labubu-stats-api
npm install
```

#### Python依赖 (可选)
```bash
cd ..
pip install -r requirements.txt
```

### 4. 启动服务

#### 方法1: 使用启动脚本 (推荐)
```bash
# 启动React画廊
./start_main_gallery.sh

# 检查服务状态
./check_services.sh

# 停止服务
./stop_react_services.sh
```

#### 方法2: 手动启动
```bash
# 启动React前端 (终端1)
cd labubu-gallery-react
npm run dev

# 启动统计API (终端2)
cd labubu-stats-api
npm start
```

### 5. 访问应用

- **React现代化画廊**: http://localhost:3000
- **统计API**: http://localhost:3002
- **API健康检查**: http://localhost:3002/api/health

## 🛠️ 常见问题解决

### 端口占用问题
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3002

# 杀死占用进程
kill -9 <PID>
```

### 权限问题
```bash
# 给脚本执行权限
chmod +x *.sh
```

### 依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📁 项目结构说明

```
mycode/
├── labubu-gallery-react/          # React前端项目
│   ├── src/                       # 源代码
│   ├── public/                    # 静态资源
│   ├── package.json               # 前端依赖
│   └── vite.config.js            # Vite配置
├── labubu-stats-api/              # Node.js API服务
│   ├── server.js                  # API服务器
│   ├── package.json               # API依赖
│   └── stats.db                   # SQLite数据库
├── *.html                         # 原生HTML版本画廊
├── *.py                          # Python爬虫脚本
├── *.sh                          # 启动/停止脚本
└── README.md                     # 项目说明
```

## 🔧 开发环境配置

### VS Code推荐插件
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-python.python"
  ]
}
```

### Git配置
```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 配置SSH密钥 (推荐)
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"
cat ~/.ssh/id_rsa.pub
# 将公钥添加到GitCode账户
```

## 🎯 功能验证

### 1. React画廊功能
- ✅ 400+壁纸正常显示
- ✅ 搜索和筛选功能
- ✅ 模态框预览
- ✅ 下载功能
- ✅ 分享功能 (URL参数跳转)

### 2. 统计API功能
- ✅ 点击统计记录
- ✅ 喜欢功能
- ✅ 数据持久化

### 3. 响应式设计
- ✅ 桌面端完美显示
- ✅ 移动端自适应
- ✅ 平板端优化

## 📊 性能优化

### 生产环境构建
```bash
cd labubu-gallery-react
npm run build
```

### 静态文件服务
```bash
# 使用serve托管构建文件
npm install -g serve
serve -s dist -l 3000
```

## 🔄 保持同步

### 拉取最新更新
```bash
git pull origin main
```

### 推送本地修改
```bash
git add .
git commit -m "描述修改内容"
git push origin main
```

## 📞 技术支持

如遇到问题，请检查：
1. Node.js版本是否兼容 (推荐18+)
2. 端口是否被占用
3. 依赖是否完整安装
4. 网络连接是否正常

---

**同步指南版本**: v1.0  
**更新时间**: 2025年7月2日  
**适用系统**: Windows, macOS, Linux  
**项目状态**: ✅ 生产就绪
