#!/bin/bash

# 推送README文档脚本
echo "🚀 开始推送README文档..."

# 检查当前目录
echo "📁 当前目录: $(pwd)"

# 检查README文件
if [ -f "README.md" ]; then
    echo "✅ README.md 文件存在"
else
    echo "❌ README.md 文件不存在"
    exit 1
fi

# 检查git状态
echo "📊 检查git状态..."
git status

# 添加README文件
echo "📝 添加README.md到暂存区..."
git add README.md

# 提交更改
echo "💾 提交更改..."
git commit -m "docs: 重新生成专业README文档 - 添加完整项目介绍、技术架构、部署指南"

# 推送到新仓库
echo "🚀 推送到 react-new 仓库..."
git push react-new main

# 推送功能分支
echo "🔄 推送功能分支..."
git push react-new feature/next-iteration

echo "✅ 推送完成！"
echo "📖 查看新README: https://github.com/LambdaTheory/nexwallpaper-new" 