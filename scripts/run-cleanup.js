#!/usr/bin/env node

/**
 * 手动执行URL清理脚本
 */

import { taskScheduler } from '../src/services/scheduler.js';

console.log('🧹 手动执行URL清理任务...\n');

try {
  // 执行URL清理
  await taskScheduler.runUrlCleanupNow();
  
  console.log('\n✅ URL清理任务完成');
  process.exit(0);
  
} catch (error) {
  console.error('❌ URL清理失败:', error.message);
  process.exit(1);
} 