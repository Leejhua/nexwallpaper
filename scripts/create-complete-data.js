#!/usr/bin/env node

/**
 * 创建完整数据文件
 * 手动添加视频数据到现有的图片数据中
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDataPath = path.join(__dirname, '../src/data/galleryData.js');

console.log('🚀 创建完整数据文件...');

// 手动添加14个视频数据
const videoData = [
  {
    id: 387,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-and-the-jellyfishlabubu-live-wallpaper.mp4",
    title: "Labubu-and-the-Jellyfish,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["水母", "动态", "海洋"]
  },
  {
    id: 388,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-classic-darklabubu-live-wallpaper.mp4",
    title: "Labubu-Classic-Dark,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["经典", "黑暗", "动态"]
  },
  {
    id: 389,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-colorful-heartslabubu-live-wallpaper.mov",
    title: "Labubu-Colorful-Hearts,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mov",
    tags: ["彩色", "爱心", "动态"]
  },
  {
    id: 390,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorerlabubu-live-wallpaper.mp4",
    title: "Labubu-Flashlight-Explorer,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["手电筒", "探险", "动态"]
  },
  {
    id: 391,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorer-standing-bedlabubu-live-wallpaper.mp4",
    title: "Labubu-Flashlight-Explorer-Standing-Bed,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["手电筒", "床", "探险"]
  },
  {
    id: 392,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-flashlight-explorer-white-outfitlabubu-live-wallpaper.mp4",
    title: "Labubu-Flashlight-Explorer-White-Outfit,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["白色", "服装", "探险"]
  },
  {
    id: 393,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-floating-islandlabubu-live-wallpaper.mp4",
    title: "Labubu-Floating-Island,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["浮岛", "奇幻", "动态"]
  },
  {
    id: 394,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-gamer-monsterlabubu-live-wallpaper.mp4",
    title: "Labubu-Gamer-Monster,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["游戏", "怪物", "动态"]
  },
  {
    id: 395,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-pink-earslabubu-live-wallpaper.mp4",
    title: "Labubu-Pink-Ears,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["粉色", "耳朵", "可爱"]
  },
  {
    id: 396,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-pink-spotlightlabubu-live-wallpaper.mp4",
    title: "Labubu-Pink-Spotlight,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["粉色", "聚光灯", "动态"]
  },
  {
    id: 397,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-prince-on-rocking-horselabubu-live-wallpaper.mp4",
    title: "Labubu-Prince-on-Rocking-Horse,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["王子", "木马", "动态"]
  },
  {
    id: 398,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-spring-forestlabubu-live-wallpaper.mp4",
    title: "Labubu-Spring-Forest,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["春天", "森林", "动态"]
  },
  {
    id: 399,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-underwater-bubbleslabubu-live-wallpaper.mp4",
    title: "Labubu-Underwater-Bubbles,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["水下", "泡泡", "动态"]
  },
  {
    id: 400,
    url: "https://res.labubuwallpaper.xyz/video/upload/labubu/labubu-white-fluffy-forestlabubu-live-wallpaper.mp4",
    title: "Labubu-White-Fluffy-Forest,Labubu-Live-Wallpaper",
    category: "live",
    resolution: "iPhone",
    source: "xyz",
    type: "video",
    format: "mp4",
    tags: ["白色", "毛茸茸", "森林"]
  }
];

try {
  // 读取现有的图片数据
  const existingContent = fs.readFileSync(targetDataPath, 'utf8');
  const dataMatch = existingContent.match(/export const galleryData = (\[[\s\S]*?\]);/);
  
  if (!dataMatch) {
    throw new Error('无法找到现有数据');
  }
  
  const existingData = JSON.parse(dataMatch[1]);
  console.log(`📊 现有图片数据: ${existingData.length} 个`);
  
  // 合并数据
  const completeData = [...existingData, ...videoData];
  
  // 统计信息
  const imageCount = completeData.filter(item => item.type === 'image').length;
  const videoCount = completeData.filter(item => item.type === 'video').length;
  
  const categoryStats = {};
  completeData.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });
  
  console.log('📈 完整数据统计:');
  console.log(`   图片: ${imageCount} 个`);
  console.log(`   视频: ${videoCount} 个`);
  console.log(`   总计: ${completeData.length} 个`);
  console.log(`   分类分布:`);
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`     ${category}: ${count} 个`);
  });
  
  // 生成完整的React数据文件
  const completeDataContent = `// 高清Labubu壁纸数据 - React版本 (完整版)
// 数据来源: labubuwallpaper.xyz
// 更新时间: ${new Date().toLocaleString('zh-CN')}
// 图片数量: ${imageCount}张
// 视频数量: ${videoCount}个
// 总计: ${completeData.length}个项目

export const galleryData = ${JSON.stringify(completeData, null, 2)};

// 分类配置
export const categories = [
  { key: 'all', label: '全部作品', icon: '📂', count: ${completeData.length} },
  { key: 'fantasy', label: '奇幻世界', icon: '🌟', count: ${categoryStats.fantasy || 0} },
  { key: 'desktop', label: '桌面壁纸', icon: '💻', count: ${categoryStats.desktop || 0} },
  { key: 'mobile', label: '手机壁纸', icon: '📱', count: ${categoryStats.mobile || 0} },
  { key: 'seasonal', label: '季节主题', icon: '🌸', count: ${categoryStats.seasonal || 0} },
  { key: '4k', label: '4K超清', icon: '🎬', count: ${categoryStats['4k'] || 0} },
  { key: 'live', label: '动态壁纸', icon: '🎥', count: ${videoCount} }
];

// 分页配置
export const pageSizeOptions = [
  { value: 12, label: '12个作品' },
  { value: 24, label: '24个作品' },
  { value: 36, label: '36个作品' },
  { value: 48, label: '48个作品' }
];

// 导出统计信息
export const stats = {
  total: ${completeData.length},
  images: ${imageCount},
  videos: ${videoCount},
  categories: ${Object.keys(categoryStats).length}
};`;

  // 写入完整数据文件
  fs.writeFileSync(targetDataPath, completeDataContent, 'utf8');
  
  console.log('✅ 完整数据文件创建成功!');
  console.log(`📁 输出文件: ${targetDataPath}`);
  console.log(`📊 总计: ${completeData.length} 个项目`);
  console.log(`🎬 视频项目: ${videoCount} 个`);
  console.log(`📸 图片项目: ${imageCount} 个`);
  
} catch (error) {
  console.error('❌ 创建完整数据文件失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
