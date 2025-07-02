# 🚀 快速同步指南

## 📋 仓库信息
- **仓库地址**: `gitcode.com:LEEJHSE/mycode.git`
- **项目**: Labubu壁纸画廊 (React + Node.js)

## ⚡ 一键同步 (推荐)

### 方法1: 使用快速同步脚本
```bash
# 下载并运行同步脚本
curl -O https://raw.githubusercontent.com/your-repo/quick_sync_setup.sh
chmod +x quick_sync_setup.sh
./quick_sync_setup.sh
```

### 方法2: 手动同步
```bash
# 1. 克隆仓库
git clone https://gitcode.com/LEEJHSE/mycode.git
cd mycode

# 2. 安装依赖
cd labubu-gallery-react && npm install
cd ../labubu-stats-api && npm install

# 3. 启动服务
cd .. && ./start_main_gallery.sh
```

## 🎯 访问地址
- **React画廊**: http://localhost:3000
- **统计API**: http://localhost:3002

## 📞 需要帮助？
查看完整指南: `SYNC_REPOSITORY_GUIDE.md`

---
**一键同步，立即体验！** 🎊
