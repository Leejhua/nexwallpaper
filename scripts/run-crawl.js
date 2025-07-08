#!/usr/bin/env node

/**
 * 手动执行爬取任务脚本
 */

import { taskScheduler } from '../src/services/scheduler.js';

console.log('🕷️ 手动执行爬取任务...\n');

try {
  // 执行爬取任务
  await taskScheduler.runCrawlingNow();
  
  console.log('\n✅ 爬取任务完成');
  process.exit(0);
  
} catch (error) {
  console.error('❌ 爬取任务失败:', error.message);
  process.exit(1);
} 