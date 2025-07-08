/**
 * 定时任务调度器
 * 管理URL清理和爬虫任务的定时执行
 */

import { crawlerConfig } from '../config/crawlerConfig.js';
import { urlValidator } from './urlValidator.js';
import { webCrawler } from './crawler.js';
import { dataUpdater } from './dataUpdater.js';

export class TaskScheduler {
  constructor() {
    this.config = crawlerConfig.scheduling;
    this.intervals = new Map();
    this.isRunning = false;
    this.lastRuns = {
      urlCleanup: null,
      crawling: null
    };
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastError: null
    };
  }

  /**
   * 启动调度器
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ 调度器已经在运行中');
      return;
    }

    console.log('🚀 启动定时任务调度器...');
    this.isRunning = true;

    // 启动URL清理任务
    this.scheduleUrlCleanup();

    // 启动爬虫任务
    this.scheduleCrawling();

    console.log('✅ 调度器已启动');
    console.log(`⏰ URL清理间隔: ${this.config.cleanupInterval / (60 * 60 * 1000)} 小时`);
    console.log(`🕷️ 爬取间隔: ${this.config.crawlInterval / (60 * 60 * 1000)} 小时`);
    console.log(`🌙 工作时间: ${this.config.workingHours.start}:00 - ${this.config.workingHours.end}:00`);
  }

  /**
   * 停止调度器
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ 调度器未在运行');
      return;
    }

    console.log('⏹️ 停止定时任务调度器...');
    
    // 清除所有定时器
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    
    this.isRunning = false;
    console.log('✅ 调度器已停止');
  }

  /**
   * 调度URL清理任务
   */
  scheduleUrlCleanup() {
    const intervalId = setInterval(async () => {
      if (this.shouldRunTask()) {
        await this.runUrlCleanupTask();
      }
    }, this.config.cleanupInterval);

    this.intervals.set('urlCleanup', intervalId);
    
    // 如果是首次启动，立即执行一次（如果在工作时间内）
    if (this.shouldRunTask()) {
      setTimeout(() => this.runUrlCleanupTask(), 5000); // 5秒后执行
    }
  }

  /**
   * 调度爬虫任务
   */
  scheduleCrawling() {
    const intervalId = setInterval(async () => {
      if (this.shouldRunTask()) {
        await this.runCrawlingTask();
      }
    }, this.config.crawlInterval);

    this.intervals.set('crawling', intervalId);
    
    // 如果是首次启动，延迟执行（避免与URL清理冲突）
    if (this.shouldRunTask()) {
      setTimeout(() => this.runCrawlingTask(), 30000); // 30秒后执行
    }
  }

  /**
   * 检查是否应该运行任务
   */
  shouldRunTask() {
    if (!this.isRunning) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    
    // 检查是否在工作时间内
    const { start, end } = this.config.workingHours;
    if (currentHour < start || currentHour >= end) {
      return false;
    }

    return true;
  }

  /**
   * 执行URL清理任务
   */
  async runUrlCleanupTask() {
    console.log('\n🧹 开始执行URL清理任务...');
    const startTime = new Date();
    
    try {
      this.stats.totalRuns++;
      
      // 加载当前数据
      const currentData = await dataUpdater.loadCurrentGalleryData();
      
      // 验证所有URL
      const validationReport = await urlValidator.validateGalleryData(currentData);
      
      // 如果有失效URL，进行清理
      if (validationReport.summary.invalid > 0) {
        console.log(`❌ 发现 ${validationReport.summary.invalid} 个失效URL，开始清理...`);
        
        const cleanupResult = urlValidator.cleanupInvalidUrls(currentData, validationReport);
        
        // 更新数据文件
        await dataUpdater.generateNewDataFile(cleanupResult.cleanedData);
        
        console.log(`✅ URL清理完成: 移除 ${cleanupResult.stats.removedUrls} 个失效URL，${cleanupResult.stats.removedItems} 个项目`);
      } else {
        console.log('✅ 所有URL都正常，无需清理');
      }
      
      this.lastRuns.urlCleanup = startTime;
      this.stats.successfulRuns++;
      
      // 清理旧备份
      await dataUpdater.cleanupOldBackups();
      
    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastError = error.message;
      console.error('❌ URL清理任务失败:', error.message);
    }
    
    const duration = new Date() - startTime;
    console.log(`⏱️ URL清理任务耗时: ${Math.round(duration / 1000)} 秒`);
  }

  /**
   * 执行爬虫任务
   */
  async runCrawlingTask() {
    console.log('\n🕷️ 开始执行爬虫任务...');
    const startTime = new Date();
    
    try {
      this.stats.totalRuns++;
      
      // 执行爬虫
      const crawlReport = await webCrawler.crawlWebsite();
      
      if (crawlReport.summary.resourcesFound > 0) {
        console.log(`🎉 爬取到 ${crawlReport.summary.resourcesFound} 个新资源`);
        
        // 更新数据
        const updateResult = await dataUpdater.updateGalleryData(crawlReport.resources);
        
        console.log(`✅ 数据更新完成: 实际新增 ${updateResult.stats.actuallyAdded} 个项目`);
        
        // 打印详细统计
        this.printUpdateStats(updateResult.stats);
        
      } else {
        console.log('ℹ️ 未发现新资源');
      }
      
      this.lastRuns.crawling = startTime;
      this.stats.successfulRuns++;
      
    } catch (error) {
      this.stats.failedRuns++;
      this.stats.lastError = error.message;
      console.error('❌ 爬虫任务失败:', error.message);
    }
    
    const duration = new Date() - startTime;
    console.log(`⏱️ 爬虫任务耗时: ${Math.round(duration / 60000)} 分钟`);
  }

  /**
   * 手动执行URL清理
   */
  async runUrlCleanupNow() {
    console.log('🔧 手动执行URL清理任务...');
    await this.runUrlCleanupTask();
  }

  /**
   * 手动执行爬虫任务
   */
  async runCrawlingNow() {
    console.log('🔧 手动执行爬虫任务...');
    await this.runCrawlingTask();
  }

  /**
   * 打印更新统计信息
   */
  printUpdateStats(stats) {
    console.log('\n📊 数据更新统计:');
    console.log('='.repeat(30));
    console.log(`📦 更新前: ${stats.before.total} 个项目 (图片: ${stats.before.images}, 视频: ${stats.before.videos})`);
    console.log(`📥 爬取到: ${stats.added.total} 个资源 (图片: ${stats.added.images}, 视频: ${stats.added.videos})`);
    console.log(`📈 更新后: ${stats.after.total} 个项目 (图片: ${stats.after.images}, 视频: ${stats.after.videos})`);
    console.log(`🆕 实际新增: ${stats.actuallyAdded} 个项目`);
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastRuns: this.lastRuns,
      stats: this.stats,
      activeIntervals: Array.from(this.intervals.keys()),
      nextRuns: this.getNextRunTimes()
    };
  }

  /**
   * 获取下次运行时间
   */
  getNextRunTimes() {
    if (!this.isRunning) {
      return null;
    }

    const now = new Date();
    const nextRuns = {};

    // 计算下次URL清理时间
    if (this.lastRuns.urlCleanup) {
      const nextCleanup = new Date(this.lastRuns.urlCleanup.getTime() + this.config.cleanupInterval);
      nextRuns.urlCleanup = nextCleanup;
    } else {
      nextRuns.urlCleanup = new Date(now.getTime() + 5000); // 5秒后首次运行
    }

    // 计算下次爬虫时间
    if (this.lastRuns.crawling) {
      const nextCrawl = new Date(this.lastRuns.crawling.getTime() + this.config.crawlInterval);
      nextRuns.crawling = nextCrawl;
    } else {
      nextRuns.crawling = new Date(now.getTime() + 30000); // 30秒后首次运行
    }

    return nextRuns;
  }

  /**
   * 打印状态报告
   */
  printStatus() {
    const status = this.getStatus();
    
    console.log('\n📋 调度器状态报告');
    console.log('='.repeat(40));
    console.log(`🔄 运行状态: ${status.isRunning ? '✅ 运行中' : '❌ 已停止'}`);
    console.log(`📊 总运行次数: ${status.stats.totalRuns}`);
    console.log(`✅ 成功次数: ${status.stats.successfulRuns}`);
    console.log(`❌ 失败次数: ${status.stats.failedRuns}`);
    
    if (status.stats.lastError) {
      console.log(`🔴 最后错误: ${status.stats.lastError}`);
    }
    
    if (status.lastRuns.urlCleanup) {
      console.log(`🧹 最后清理: ${status.lastRuns.urlCleanup.toLocaleString('zh-CN')}`);
    }
    
    if (status.lastRuns.crawling) {
      console.log(`🕷️ 最后爬取: ${status.lastRuns.crawling.toLocaleString('zh-CN')}`);
    }
    
    if (status.nextRuns && status.isRunning) {
      console.log(`⏰ 下次清理: ${status.nextRuns.urlCleanup.toLocaleString('zh-CN')}`);
      console.log(`⏰ 下次爬取: ${status.nextRuns.crawling.toLocaleString('zh-CN')}`);
    }
  }

  /**
   * 重启调度器
   */
  restart() {
    console.log('🔄 重启调度器...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    console.log('⚙️ 更新调度器配置...');
    
    // 合并配置
    this.config = { ...this.config, ...newConfig };
    
    // 如果正在运行，重启以应用新配置
    if (this.isRunning) {
      this.restart();
    }
    
    console.log('✅ 配置已更新');
  }
}

// 导出单例实例
export const taskScheduler = new TaskScheduler();

// 进程退出时清理
process.on('SIGINT', () => {
  console.log('\n🛑 接收到退出信号，停止调度器...');
  taskScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 接收到终止信号，停止调度器...');
  taskScheduler.stop();
  process.exit(0);
}); 