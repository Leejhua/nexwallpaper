#!/usr/bin/env node

/**
 * 启动爬虫调度器脚本
 */

import { taskScheduler } from '../src/services/scheduler.js';

console.log('🚀 启动NexWallpaper爬虫调度器...\n');

try {
  // 启动调度器
  taskScheduler.start();
  
  // 打印状态
  setTimeout(() => {
    taskScheduler.printStatus();
  }, 2000);
  
  console.log('\n💡 使用以下命令管理调度器:');
  console.log('   npm run crawler:status  - 查看状态');
  console.log('   npm run crawler:stop    - 停止调度器');
  console.log('   npm run crawler:run-cleanup  - 手动执行URL清理');
  console.log('   npm run crawler:run-crawl    - 手动执行爬取任务');
  
} catch (error) {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
} 