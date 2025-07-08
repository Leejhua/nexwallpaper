#!/usr/bin/env node

/**
 * 独立的URL清理脚本
 * 不启动调度器，直接执行清理任务
 */

import { urlValidator } from '../src/services/urlValidator.js';
import { dataUpdater } from '../src/services/dataUpdater.js';

console.log('🧹 执行独立URL清理任务...\n');

async function runStandaloneCleanup() {
  const startTime = new Date();
  
  try {
    // 1. 加载当前数据
    console.log('📊 加载现有数据...');
    const currentData = await dataUpdater.loadCurrentGalleryData();
    
    // 2. 验证所有URL
    console.log('🔍 验证URL有效性...');
    const validationReport = await urlValidator.validateGalleryData(currentData);
    
    // 3. 生成验证报告
    urlValidator.generateReport();
    
    // 4. 如果有失效URL，进行清理
    if (validationReport.summary.invalid > 0) {
      console.log(`❌ 发现 ${validationReport.summary.invalid} 个失效URL，开始清理...`);
      
      const cleanupResult = urlValidator.cleanupInvalidUrls(currentData, validationReport);
      
      // 5. 更新数据文件
      await dataUpdater.generateNewDataFile(cleanupResult.cleanedData);
      
      console.log(`✅ URL清理完成: 移除 ${cleanupResult.stats.removedUrls} 个失效URL，${cleanupResult.stats.removedItems} 个项目`);
      
      // 6. 打印清理统计
      console.log('\n📊 清理统计:');
      console.log('='.repeat(30));
      console.log(`📦 原始项目: ${cleanupResult.stats.originalItems}`);
      console.log(`🧹 清理后项目: ${cleanupResult.stats.cleanedItems}`);
      console.log(`🗑️ 移除项目: ${cleanupResult.stats.removedItems}`);
      console.log(`❌ 移除URL: ${cleanupResult.stats.removedUrls}`);
      
    } else {
      console.log('✅ 所有URL都正常，无需清理');
    }
    
    // 7. 清理旧备份
    try {
      await dataUpdater.cleanupOldBackups();
    } catch (error) {
      console.warn('⚠️ 清理备份失败:', error.message);
    }
    
    const duration = new Date() - startTime;
    console.log(`\n⏱️ 总耗时: ${Math.round(duration / 1000)} 秒`);
    console.log('✅ 独立清理任务完成');
    
  } catch (error) {
    console.error('❌ 清理任务失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行清理任务
runStandaloneCleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }); 