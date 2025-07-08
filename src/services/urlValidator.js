/**
 * URL验证和清理服务
 * 定期检查URL有效性，移除失效链接
 */

import { crawlerConfig } from '../config/crawlerConfig.js';

export class UrlValidator {
  constructor() {
    this.config = crawlerConfig.validation;
    this.results = [];
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      lastCheck: null
    };
  }

  /**
   * 检查单个URL是否有效
   */
  async validateUrl(url, timeout = this.config.timeout) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      .then(response => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        const isValid = this.config.validStatusCodes.includes(response.status);
        
        resolve({
          url,
          valid: isValid,
          status: response.status,
          responseTime,
          timestamp: new Date().toISOString(),
          error: null
        });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        resolve({
          url,
          valid: false,
          status: 'ERROR',
          responseTime,
          timestamp: new Date().toISOString(),
          error: error.name === 'AbortError' ? 'TIMEOUT' : error.message
        });
      });
    });
  }

  /**
   * 批量验证URL列表
   */
  async validateUrls(urls) {
    console.log(`🔍 开始验证 ${urls.length} 个URL...`);
    
    this.results = [];
    this.stats = {
      total: urls.length,
      valid: 0,
      invalid: 0,
      lastCheck: new Date().toISOString()
    };

    // 分批处理避免过载
    for (let i = 0; i < urls.length; i += this.config.batchSize) {
      const batch = urls.slice(i, i + this.config.batchSize);
      
      const batchPromises = batch.map(url => this.validateUrl(url));
      const batchResults = await Promise.all(batchPromises);
      
      this.results.push(...batchResults);
      
      // 更新统计
      batchResults.forEach(result => {
        if (result.valid) {
          this.stats.valid++;
        } else {
          this.stats.invalid++;
        }
      });

      // 显示进度
      const progress = Math.min(i + this.config.batchSize, urls.length);
      const percentage = Math.round((progress / urls.length) * 100);
      console.log(`📊 验证进度: ${progress}/${urls.length} (${percentage}%)`);

      // 批次间延迟，避免被限制
      if (i + this.config.batchSize < urls.length) {
        await this.delay(1000);
      }
    }

    console.log('✅ URL验证完成');
    return this.generateReport();
  }

  /**
   * 验证画廊数据中的所有URL
   */
  async validateGalleryData(galleryData) {
    console.log('🖼️ 开始验证画廊数据中的URL...');
    
    // 提取所有主URL和备用URL
    const allUrls = new Set();
    
    galleryData.forEach(item => {
      if (item.url) {
        allUrls.add(item.url);
      }
      
      if (item.backupUrls && Array.isArray(item.backupUrls)) {
        item.backupUrls.forEach(backupUrl => {
          if (backupUrl) {
            allUrls.add(backupUrl);
          }
        });
      }
    });

    const urlList = Array.from(allUrls);
    return await this.validateUrls(urlList);
  }

  /**
   * 清理失效URL，返回清理后的数据
   */
  cleanupInvalidUrls(galleryData, validationResults) {
    console.log('🧹 开始清理失效URL...');
    
    // 创建无效URL集合以便快速查找
    const invalidUrls = new Set(
      validationResults.invalidUrls.map(result => result.url)
    );

    let cleanedData = [];
    let removedItems = 0;
    let cleanedUrls = 0;

    galleryData.forEach(item => {
      const cleanedItem = { ...item };
      let hasValidUrl = false;

      // 检查主URL
      if (cleanedItem.url && !invalidUrls.has(cleanedItem.url)) {
        hasValidUrl = true;
      } else if (cleanedItem.url && invalidUrls.has(cleanedItem.url)) {
        console.log(`❌ 移除失效主URL: ${cleanedItem.url}`);
        cleanedUrls++;
        
        // 尝试从备用URL中找到有效的作为新主URL
        if (cleanedItem.backupUrls && cleanedItem.backupUrls.length > 0) {
          const validBackup = cleanedItem.backupUrls.find(url => !invalidUrls.has(url));
          if (validBackup) {
            cleanedItem.url = validBackup;
            hasValidUrl = true;
            console.log(`✅ 使用备用URL作为主URL: ${validBackup}`);
          }
        }
      }

      // 清理备用URL列表
      if (cleanedItem.backupUrls && cleanedItem.backupUrls.length > 0) {
        const originalCount = cleanedItem.backupUrls.length;
        cleanedItem.backupUrls = cleanedItem.backupUrls.filter(url => {
          const isValid = !invalidUrls.has(url);
          if (!isValid) {
            console.log(`❌ 移除失效备用URL: ${url}`);
            cleanedUrls++;
          }
          return isValid;
        });

        // 移除重复的主URL
        if (cleanedItem.url) {
          cleanedItem.backupUrls = cleanedItem.backupUrls.filter(url => url !== cleanedItem.url);
        }
      }

      // 只保留至少有一个有效URL的项目
      if (hasValidUrl) {
        cleanedData.push(cleanedItem);
      } else {
        console.log(`🗑️ 移除整个项目 (ID: ${item.id}): 所有URL均失效`);
        removedItems++;
      }
    });

    console.log(`🧹 清理完成: 移除 ${cleanedUrls} 个失效URL, ${removedItems} 个项目`);
    
    return {
      cleanedData,
      stats: {
        originalItems: galleryData.length,
        cleanedItems: cleanedData.length,
        removedItems,
        removedUrls: cleanedUrls
      }
    };
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    const validUrls = this.results.filter(r => r.valid);
    const invalidUrls = this.results.filter(r => !r.valid);
    
    // 按错误类型分组
    const errorStats = {};
    invalidUrls.forEach(result => {
      const errorType = result.error || `HTTP_${result.status}`;
      errorStats[errorType] = (errorStats[errorType] || 0) + 1;
    });

    const report = {
      summary: {
        total: this.stats.total,
        valid: this.stats.valid,
        invalid: this.stats.invalid,
        successRate: Math.round((this.stats.valid / this.stats.total) * 100),
        timestamp: this.stats.lastCheck
      },
      validUrls,
      invalidUrls,
      errorStats,
      recommendations: this.generateRecommendations(invalidUrls)
    };

    this.printReport(report);
    return report;
  }

  /**
   * 生成修复建议
   */
  generateRecommendations(invalidUrls) {
    const recommendations = [];
    
    const timeoutCount = invalidUrls.filter(r => r.error === 'TIMEOUT').length;
    const notFoundCount = invalidUrls.filter(r => r.status === 404).length;
    const serverErrorCount = invalidUrls.filter(r => r.status >= 500).length;

    if (timeoutCount > 0) {
      recommendations.push(`🕐 发现 ${timeoutCount} 个超时URL，建议增加超时时间或检查网络`);
    }
    
    if (notFoundCount > 0) {
      recommendations.push(`🔍 发现 ${notFoundCount} 个404错误，这些资源已被删除`);
    }
    
    if (serverErrorCount > 0) {
      recommendations.push(`🔧 发现 ${serverErrorCount} 个服务器错误，可能是临时问题`);
    }

    return recommendations;
  }

  /**
   * 打印验证报告
   */
  printReport(report) {
    console.log('\n📋 URL验证报告');
    console.log('='.repeat(50));
    console.log(`🕐 验证时间: ${report.summary.timestamp}`);
    console.log(`📊 总URL数: ${report.summary.total}`);
    console.log(`✅ 有效URL: ${report.summary.valid}`);
    console.log(`❌ 失效URL: ${report.summary.invalid}`);
    console.log(`📈 成功率: ${report.summary.successRate}%`);

    if (report.summary.invalid > 0) {
      console.log('\n❌ 错误统计:');
      Object.entries(report.errorStats).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} 个`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 修复建议:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.stats;
  }

  /**
   * 获取验证结果
   */
  getResults() {
    return this.results;
  }
}

// 导出单例实例
export const urlValidator = new UrlValidator(); 