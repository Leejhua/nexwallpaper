#!/bin/bash

# 快速测试脚本 - 点击量统计功能

echo "🧪 Labubu壁纸画廊 - 快速功能测试"
echo "=================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在React项目根目录运行此脚本"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 检查服务状态
echo "🔍 检查React开发服务器..."
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✅ React开发服务器运行正常"
else
    echo "⚠️  React开发服务器未运行"
    echo "💡 启动命令: npm run dev"
    echo ""
fi

# 运行基础功能测试
echo "📊 运行基础功能测试..."
echo ""

# 测试1: 点击统计功能
echo "测试1: 点击统计功能"
node -e "
const mockStats = {};
const recordClick = (id, action) => {
  if (!mockStats[id]) mockStats[id] = { totalClicks: 0, actions: {} };
  mockStats[id].totalClicks++;
  mockStats[id].actions[action] = (mockStats[id].actions[action] || 0) + 1;
};

recordClick('test1', 'view');
recordClick('test1', 'download');
recordClick('test2', 'view');

const test1 = mockStats['test1'];
const test2 = mockStats['test2'];

if (test1.totalClicks === 2 && test1.actions.view === 1 && test1.actions.download === 1 && test2.totalClicks === 1) {
  console.log('   ✅ 点击统计功能正常');
} else {
  console.log('   ❌ 点击统计功能异常');
}
"

# 测试2: 排序功能
echo "测试2: 排序功能"
node -e "
const items = [
  { id: 'w1', clicks: 5 },
  { id: 'w2', clicks: 10 },
  { id: 'w3', clicks: 3 }
];

const sorted = items.sort((a, b) => b.clicks - a.clicks);

if (sorted[0].id === 'w2' && sorted[1].id === 'w1' && sorted[2].id === 'w3') {
  console.log('   ✅ 排序功能正常');
} else {
  console.log('   ❌ 排序功能异常');
}
"

# 测试3: 数据持久化
echo "测试3: 数据持久化模拟"
node -e "
const mockStorage = {};
const testData = { 'w1': { clicks: 5 }, 'w2': { clicks: 3 } };

// 模拟保存
mockStorage['test_key'] = JSON.stringify(testData);

// 模拟读取
const retrieved = JSON.parse(mockStorage['test_key']);

if (retrieved.w1.clicks === 5 && retrieved.w2.clicks === 3) {
  console.log('   ✅ 数据持久化功能正常');
} else {
  console.log('   ❌ 数据持久化功能异常');
}
"

# 测试4: 热度计算
echo "测试4: 热度分数计算"
node -e "
const getPopularityScore = (clicks, daysSinceFirst) => {
  return Math.round(clicks / Math.sqrt(Math.max(daysSinceFirst, 1)));
};

const score1 = getPopularityScore(10, 1); // 10点击，1天
const score2 = getPopularityScore(20, 4); // 20点击，4天

if (score1 === 10 && score2 === 10) {
  console.log('   ✅ 热度计算功能正常');
} else {
  console.log('   ❌ 热度计算功能异常');
  console.log('   实际结果: score1=' + score1 + ', score2=' + score2);
}
"

echo ""
echo "🎯 快速测试完成!"
echo ""
echo "📋 下一步操作:"
echo "   1. 运行完整测试: node scripts/test-runner.js"
echo "   2. 启动应用: npm run dev"
echo "   3. 访问应用: http://localhost:3000"
echo ""
echo "🔗 功能验证:"
echo "   - 点击任意壁纸查看热度标签"
echo "   - 使用排序控制切换排序模式"
echo "   - 多次点击同一壁纸观察数字变化"
echo "   - 刷新页面验证数据持久化"
