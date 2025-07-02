#!/usr/bin/env node

/**
 * 数据验证脚本
 * 验证React应用中的数据是否完整
 */

import { galleryData, categories, stats } from './src/data/galleryData.js';

console.log('🔍 React应用数据验证');
console.log('='.repeat(50));

// 基础统计
console.log('📊 基础统计:');
console.log(`   总项目数: ${galleryData.length}`);
console.log(`   统计显示: ${stats.total}`);
console.log(`   数据一致性: ${galleryData.length === stats.total ? '✅' : '❌'}`);

// 类型统计
const actualImages = galleryData.filter(item => item.type === 'image').length;
const actualVideos = galleryData.filter(item => item.type === 'video').length;

console.log('\n🎬 媒体类型:');
console.log(`   实际图片: ${actualImages}`);
console.log(`   统计图片: ${stats.images}`);
console.log(`   图片一致性: ${actualImages === stats.images ? '✅' : '❌'}`);
console.log(`   实际视频: ${actualVideos}`);
console.log(`   统计视频: ${stats.videos}`);
console.log(`   视频一致性: ${actualVideos === stats.videos ? '✅' : '❌'}`);

// 分类统计
console.log('\n🏷️ 分类验证:');
categories.forEach(cat => {
  if (cat.key === 'all') {
    console.log(`   ${cat.icon} ${cat.label}: ${cat.count} (应该等于总数)`);
  } else if (cat.key === 'live') {
    const actualLive = galleryData.filter(item => item.type === 'video').length;
    console.log(`   ${cat.icon} ${cat.label}: ${cat.count} (实际: ${actualLive}) ${cat.count === actualLive ? '✅' : '❌'}`);
  } else {
    const actualCount = galleryData.filter(item => item.category === cat.key).length;
    console.log(`   ${cat.icon} ${cat.label}: ${cat.count} (实际: ${actualCount}) ${cat.count === actualCount ? '✅' : '❌'}`);
  }
});

// 数据样本
console.log('\n🎬 视频样本:');
const videos = galleryData.filter(item => item.type === 'video');
videos.slice(0, 3).forEach((video, index) => {
  console.log(`   ${index + 1}. ID:${video.id} - ${video.title.substring(0, 50)}...`);
});

console.log('\n📸 图片样本:');
const images = galleryData.filter(item => item.type === 'image');
images.slice(0, 3).forEach((image, index) => {
  console.log(`   ${index + 1}. ID:${image.id} - ${image.title.substring(0, 50)}...`);
});

// 数据质量检查
console.log('\n🔍 数据质量检查:');
const hasUrl = galleryData.every(item => item.url && item.url.length > 0);
const hasTitle = galleryData.every(item => item.title && item.title.length > 0);
const hasType = galleryData.every(item => item.type && ['image', 'video'].includes(item.type));
const hasCategory = galleryData.every(item => item.category && item.category.length > 0);
const hasTags = galleryData.every(item => item.tags && Array.isArray(item.tags) && item.tags.length > 0);

console.log(`   URL完整性: ${hasUrl ? '✅' : '❌'}`);
console.log(`   标题完整性: ${hasTitle ? '✅' : '❌'}`);
console.log(`   类型完整性: ${hasType ? '✅' : '❌'}`);
console.log(`   分类完整性: ${hasCategory ? '✅' : '❌'}`);
console.log(`   标签完整性: ${hasTags ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(50));
console.log('✅ 数据验证完成!');

if (galleryData.length === 400 && actualVideos === 14 && actualImages === 386) {
  console.log('🎉 数据完整性验证通过！React应用应该能正常显示所有400个项目。');
} else {
  console.log('⚠️  数据可能存在问题，请检查数据文件。');
}
