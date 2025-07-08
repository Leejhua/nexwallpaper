#!/usr/bin/env node

/**
 * 停止爬虫调度器脚本
 */

import { taskScheduler } from '../src/services/scheduler.js';

console.log('⏹️ 停止NexWallpaper爬虫调度器...\n');

try {
  // 停止调度器
  taskScheduler.stop();
  
  console.log('✅ 调度器已停止');
  
} catch (error) {
  console.error('❌ 停止失败:', error.message);
  process.exit(1);
} 