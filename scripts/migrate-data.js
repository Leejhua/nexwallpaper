#!/usr/bin/env node

/**
 * 数据迁移脚本
 * 将原版的高清数据转换为React版本格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取原始数据文件
const originalDataPath = path.join(__dirname, '../../hd_gallery_data.js');
const targetDataPath = path.join(__dirname, '../src/data/galleryData.js');

console.log('🚀 开始数据迁移...');

try {
  // 读取原始数据
  const originalContent = fs.readFileSync(originalDataPath, 'utf8');
  
  // 使用动态导入来加载数据
  const tempFilePath = path.join(__dirname, 'temp-data.mjs');
  const moduleContent = originalContent.replace('const hdImageData', 'export const hdImageData');
  fs.writeFileSync(tempFilePath, moduleContent);
  
  // 动态导入数据
  const { hdImageData } = await import(tempFilePath);
  
  // 清理临时文件
  fs.unlinkSync(tempFilePath);
  
  console.log(`📊 找到 ${hdImageData.length} 个媒体项目`);
  
  // 转换数据格式
  const convertedData = hdImageData.map((item, index) => {
    // 生成标签
    const tags = [];
    
    // 根据标题生成标签
    const title = item.title.toLowerCase();
    if (title.includes('rainbow')) tags.push('彩虹');
    if (title.includes('heart')) tags.push('爱心');
    if (title.includes('cute')) tags.push('可爱');
    if (title.includes('spring')) tags.push('春天');
    if (title.includes('garden')) tags.push('花园');
    if (title.includes('castle')) tags.push('城堡');
    if (title.includes('fantasy')) tags.push('奇幻');
    if (title.includes('magical')) tags.push('魔法');
    if (title.includes('forest')) tags.push('森林');
    if (title.includes('adventure')) tags.push('冒险');
    if (title.includes('night')) tags.push('夜晚');
    if (title.includes('sky')) tags.push('天空');
    if (title.includes('star')) tags.push('星空');
    if (title.includes('dreamy')) tags.push('梦幻');
    if (title.includes('beach')) tags.push('海滩');
    if (title.includes('sunset')) tags.push('日落');
    if (title.includes('christmas')) tags.push('圣诞');
    if (title.includes('winter')) tags.push('冬天');
    if (title.includes('snow')) tags.push('雪花');
    if (title.includes('dancing')) tags.push('舞蹈');
    if (title.includes('music')) tags.push('音乐');
    
    // 如果没有标签，添加默认标签
    if (tags.length === 0) {
      tags.push('精美', 'Labubu');
    }
    
    return {
      id: index + 1,
      url: item.url,
      title: item.title,
      category: item.category,
      resolution: item.resolution,
      source: item.source,
      type: item.type,
      format: item.format,
      tags: tags
    };
  });
  
  // 统计信息
  const imageCount = convertedData.filter(item => item.type === 'image').length;
  const videoCount = convertedData.filter(item => item.type === 'video').length;
  
  const categoryStats = {};
  convertedData.forEach(item => {
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
  });
  
  console.log('📈 数据统计:');
  console.log(`   图片: ${imageCount} 个`);
  console.log(`   视频: ${videoCount} 个`);
  console.log(`   分类分布:`);
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`     ${category}: ${count} 个`);
  });
  
  // 生成React数据文件
  const reactDataContent = `// 高清Labubu壁纸数据 - React版本
// 数据来源: labubuwallpaper.xyz
// 迁移时间: ${new Date().toLocaleString('zh-CN')}
// 图片数量: ${imageCount}张
// 视频数量: ${videoCount}个

export const galleryData = ${JSON.stringify(convertedData, null, 2)};

// 分类配置
export const categories = [
  { key: 'all', label: '全部作品', icon: '📂', count: ${convertedData.length} },
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
  total: ${convertedData.length},
  images: ${imageCount},
  videos: ${videoCount},
  categories: ${Object.keys(categoryStats).length}
};`;

  // 写入新文件
  fs.writeFileSync(targetDataPath, reactDataContent, 'utf8');
  
  console.log('✅ 数据迁移完成!');
  console.log(`📁 输出文件: ${targetDataPath}`);
  console.log(`📊 总计: ${convertedData.length} 个项目`);
  
} catch (error) {
  console.error('❌ 数据迁移失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
