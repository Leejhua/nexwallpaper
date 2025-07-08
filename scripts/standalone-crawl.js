#!/usr/bin/env node

/**
 * 独立的爬取脚本
 * 不启动调度器，直接执行爬取任务
 */

import { webCrawler } from '../src/services/crawler.js';
import { dataUpdater } from '../src/services/dataUpdater.js';

console.log('🕷️ 执行独立爬取任务...\n');

async function runStandaloneCrawl() {
  const startTime = new Date();
  
  try {
    // 1. 执行爬虫
    console.log('🚀 开始爬取目标网站...');
    const crawlReport = await webCrawler.crawlWebsite();
    
    // 2. 打印爬取报告
    console.log('\n📊 爬取报告:');
    console.log('='.repeat(30));
    console.log(`📄 页面数: ${crawlReport.summary.pagesScanned}`);
    console.log(`🖼️ 资源数: ${crawlReport.summary.resourcesFound}`);
    console.log(`❌ 错误数: ${crawlReport.summary.errors}`);
    console.log(`📈 成功率: ${Math.round((crawlReport.summary.pagesScanned - crawlReport.summary.errors) / crawlReport.summary.pagesScanned * 100)}%`);
    
    // 3. 如果找到新资源，更新数据
    if (crawlReport.summary.resourcesFound > 0) {
      console.log(`\n🎉 爬取到 ${crawlReport.summary.resourcesFound} 个新资源，开始更新数据...`);
      
      const updateResult = await dataUpdater.updateGalleryData(crawlReport.resources);
      
      console.log(`✅ 数据更新完成: 实际新增 ${updateResult.stats.actuallyAdded} 个项目`);
      
      // 4. 打印更新统计
      console.log('\n📊 数据更新统计:');
      console.log('='.repeat(30));
      console.log(`📦 更新前: ${updateResult.stats.before.total} 个项目 (图片: ${updateResult.stats.before.images}, 视频: ${updateResult.stats.before.videos})`);
      console.log(`📥 爬取到: ${updateResult.stats.added.total} 个资源 (图片: ${updateResult.stats.added.images}, 视频: ${updateResult.stats.added.videos})`);
      console.log(`📈 更新后: ${updateResult.stats.after.total} 个项目 (图片: ${updateResult.stats.after.images}, 视频: ${updateResult.stats.after.videos})`);
      console.log(`🆕 实际新增: ${updateResult.stats.actuallyAdded} 个项目`);
      
    } else {
      console.log('\nℹ️ 未发现新资源');
    }
    
    const duration = new Date() - startTime;
    console.log(`\n⏱️ 总耗时: ${Math.round(duration / 60000)} 分钟`);
    console.log('✅ 独立爬取任务完成');
    
  } catch (error) {
    console.error('❌ 爬取任务失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行爬取任务
runStandaloneCrawl()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }); 