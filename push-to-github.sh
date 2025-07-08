#!/bin/bash

# 推送Labubu Gallery到GitHub的脚本
# 使用方法: ./push-to-github.sh 你的GitHub仓库URL

if [ $# -eq 0 ]; then
    echo "❌ 请提供GitHub仓库URL"
    echo "使用方法: ./push-to-github.sh https://github.com/用户名/labubu-gallery-react.git"
    exit 1
fi

GITHUB_URL=$1

echo "🚀 开始推送到GitHub..."
echo "📦 目标仓库: $GITHUB_URL"

# 添加GitHub远程仓库
echo "🔗 添加GitHub远程仓库..."
git remote add github $GITHUB_URL

# 检查远程仓库
echo "📋 当前远程仓库:"
git remote -v

# 推送到GitHub
echo "⬆️ 推送代码到GitHub..."
git push -u github main

if [ $? -eq 0 ]; then
    echo "✅ 成功推送到GitHub!"
    echo "🌐 你的仓库地址: $GITHUB_URL"
    echo ""
    echo "🚀 下一步: Vercel部署"
    echo "1. 访问 https://vercel.com"
    echo "2. 登录并点击 'New Project'"
    echo "3. 导入你的GitHub仓库"
    echo "4. 选择Framework Preset: Vite"
    echo "5. 点击Deploy"
    echo ""
    echo "📚 详细说明请查看: DEPLOYMENT.md"
else
    echo "❌ 推送失败，请检查："
    echo "- GitHub仓库URL是否正确"
    echo "- 是否有推送权限"
    echo "- 网络连接是否正常"
fi 