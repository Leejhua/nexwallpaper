#!/usr/bin/env node

/**
 * 查看爬虫调度器状态脚本
 */

import { taskScheduler } from '../src/services/scheduler.js';

console.log('📊 NexWallpaper爬虫调度器状态\n');

try {
  // 打印详细状态
  taskScheduler.printStatus();
  process.exit(0);
  
} catch (error) {
  console.error('❌ 获取状态失败:', error.message);
  process.exit(1);
} 