/**
 * 网站爬虫服务
 * 实现反爬虫机制绕过，采集新的壁纸资源
 */

import { crawlerConfig, getRandomUserAgent, getRandomDelay, generateHeaders } from '../config/crawlerConfig.js';

export class WebCrawler {
  constructor() {
    this.config = crawlerConfig;
    this.results = [];
    this.stats = {
      pagesScanned: 0,
      resourcesFound: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * 开始爬取目标网站
   */
  async crawlWebsite(targetName = 'labubuwallpaper') {
    const target = this.config.targets[targetName];
    if (!target) {
      throw new Error(`未找到目标配置: ${targetName}`);
    }

    console.log(`🚀 开始爬取 ${target.baseUrl}...`);
    this.stats.startTime = new Date();
    this.results = [];
    this.stats.pagesScanned = 0;
    this.stats.resourcesFound = 0;
    this.stats.errors = 0;

    try {
      // 爬取所有配置的页面
      for (const page of target.pages) {
        await this.crawlPage(target.baseUrl + page, target);
        
        // 页面间延迟
        await this.delay(this.config.antiBot.delays.between);
      }

      this.stats.endTime = new Date();
      console.log('✅ 爬取完成');
      
      return this.generateCrawlReport();
    } catch (error) {
      this.stats.endTime = new Date();
      console.error('❌ 爬取过程出错:', error.message);
      throw error;
    }
  }

  /**
   * 爬取单个页面
   */
  async crawlPage(pageUrl, target) {
    console.log(`📄 爬取页面: ${pageUrl}`);
    
    const maxRetries = this.config.antiBot.retry.maxAttempts;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithAntiBot(pageUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const resources = await this.extractResources(html, pageUrl, target);
        
        this.results.push(...resources);
        this.stats.pagesScanned++;
        this.stats.resourcesFound += resources.length;
        
        console.log(`✅ 页面处理完成: 找到 ${resources.length} 个资源`);
        return resources;
        
      } catch (error) {
        console.warn(`⚠️ 页面爬取失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`);
        
        if (attempt === maxRetries) {
          this.stats.errors++;
          console.error(`❌ 页面爬取彻底失败: ${pageUrl}`);
          return [];
        }
        
        // 重试延迟（指数退避）
        const retryDelay = this.config.antiBot.retry.backoffDelay * Math.pow(2, attempt - 1);
        await this.delay(retryDelay);
      }
    }
  }

  /**
   * 使用反爬虫策略获取网页
   */
  async fetchWithAntiBot(url, referer = null) {
    // 随机延迟
    await this.delay(getRandomDelay());
    
    // 生成请求头
    const headers = generateHeaders(referer);
    
    // 创建请求选项
    const options = {
      method: 'GET',
      headers,
      timeout: this.config.antiBot.retry.timeoutMs
    };

    console.log(`🌐 请求: ${url}`);
    console.log(`👤 User-Agent: ${headers['User-Agent'].substring(0, 50)}...`);
    
    return fetch(url, options);
  }

  /**
   * 从HTML中提取资源链接
   */
  async extractResources(html, pageUrl, target) {
    const resources = [];
    
    try {
      // 使用简单的正则表达式提取资源（避免引入额外依赖）
      const extractedUrls = this.extractUrlsFromHtml(html, target);
      
      for (const urlInfo of extractedUrls) {
        // 处理相对URL
        const absoluteUrl = this.resolveUrl(urlInfo.url, pageUrl);
        
        // 验证URL格式
        if (!this.isValidResourceUrl(absoluteUrl)) {
          continue;
        }

        // 检测资源类型
        const resourceType = this.detectResourceType(absoluteUrl);
        
        // 生成资源对象
        const resource = {
          url: absoluteUrl,
          title: this.generateTitle(urlInfo, absoluteUrl),
          category: this.detectCategory(absoluteUrl, urlInfo.context),
          resolution: this.detectResolution(absoluteUrl, urlInfo.context),
          source: 'com',
          type: resourceType.type,
          format: resourceType.format,
          tags: this.generateTags(absoluteUrl, urlInfo.context),
          backupUrls: this.generateBackupUrls(absoluteUrl),
          originalSource: 'com',
          pageUrl: pageUrl,
          extractionSource: 'crawler',
          crawlTime: new Date().toISOString()
        };

        resources.push(resource);
      }
      
    } catch (error) {
      console.error('❌ 资源提取失败:', error.message);
    }

    return resources;
  }

  /**
   * 从HTML中提取URL
   */
  extractUrlsFromHtml(html, target) {
    const urls = [];
    
    // 提取图片URL
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.includes('labubuwallpaper.com') && this.isImageUrl(url)) {
        urls.push({
          url: url,
          context: match[0],
          type: 'image'
        });
      }
    }

    // 提取链接中的资源URL
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.includes('labubuwallpaper.com') && (this.isImageUrl(url) || this.isVideoUrl(url))) {
        urls.push({
          url: url,
          context: match[0],
          type: this.isVideoUrl(url) ? 'video' : 'image'
        });
      }
    }

    // 提取视频URL
    const videoRegex = /<video[^>]+src=["']([^"']+)["'][^>]*>/gi;
    
    while ((match = videoRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.includes('labubuwallpaper.com')) {
        urls.push({
          url: url,
          context: match[0],
          type: 'video'
        });
      }
    }

    // 在页面内容中查找直接的资源URL
    const directUrlRegex = /https:\/\/labubuwallpaper\.com\/[^\s"'<>]+\.(jpg|jpeg|png|webp|mp4|mov)/gi;
    
    while ((match = directUrlRegex.exec(html)) !== null) {
      const url = match[0];
      urls.push({
        url: url,
        context: 'direct',
        type: this.isVideoUrl(url) ? 'video' : 'image'
      });
    }

    return urls;
  }

  /**
   * 解析相对URL为绝对URL
   */
  resolveUrl(url, baseUrl) {
    if (url.startsWith('http')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + url;
    }
    
    return new URL(url, baseUrl).href;
  }

  /**
   * 检测资源类型
   */
  detectResourceType(url) {
    const urlLower = url.toLowerCase();
    
    // 检测视频格式
    for (const format of this.config.processing.videoFormats) {
      if (urlLower.includes(`.${format}`)) {
        return { type: 'video', format };
      }
    }
    
    // 检测图片格式
    for (const format of this.config.processing.imageFormats) {
      if (urlLower.includes(`.${format}`)) {
        return { type: 'image', format };
      }
    }
    
    // 默认为图片
    return { type: 'image', format: 'jpg' };
  }

  /**
   * 生成标题
   */
  generateTitle(urlInfo, url) {
    // 从URL中提取文件名作为标题
    const filename = url.split('/').pop().split('?')[0];
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    // 清理URL编码
    const decoded = decodeURIComponent(nameWithoutExt);
    
    // 替换特殊字符为空格
    const cleaned = decoded
      .replace(/[-_+%]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 首字母大写
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * 检测分类
   */
  detectCategory(url, context) {
    const urlLower = url.toLowerCase();
    const contextLower = context.toLowerCase();
    
    if (urlLower.includes('iphone') || urlLower.includes('phone') || urlLower.includes('mobile')) {
      return 'mobile';
    }
    
    if (urlLower.includes('desktop') || urlLower.includes('pc') || urlLower.includes('computer')) {
      return 'desktop';
    }
    
    if (urlLower.includes('4k')) {
      return '4k';
    }
    
    if (urlLower.includes('live') || urlLower.includes('dynamic')) {
      return 'dynamic';
    }
    
    return 'fantasy'; // 默认分类
  }

  /**
   * 检测分辨率
   */
  detectResolution(url, context) {
    const combined = (url + ' ' + context).toLowerCase();
    
    if (combined.includes('4k')) {
      return '4K';
    }
    
    if (combined.includes('iphone') || combined.includes('phone')) {
      return 'iPhone';
    }
    
    if (combined.includes('pc') || combined.includes('desktop')) {
      return 'PC';
    }
    
    return '高清'; // 默认分辨率
  }

  /**
   * 生成标签
   */
  generateTags(url, context) {
    const tags = ['Labubu', '高清壁纸', '精美设计'];
    
    const combined = (url + ' ' + context).toLowerCase();
    
    // 根据URL和上下文添加相关标签
    if (combined.includes('pink') || combined.includes('粉色')) {
      tags.push('粉色');
    }
    
    if (combined.includes('white') || combined.includes('白色')) {
      tags.push('白色');
    }
    
    if (combined.includes('forest') || combined.includes('森林')) {
      tags.push('森林');
    }
    
    if (combined.includes('water') || combined.includes('pool') || combined.includes('swim')) {
      tags.push('游泳');
    }
    
    if (combined.includes('flashlight') || combined.includes('手电筒')) {
      tags.push('手电筒');
    }

    if (combined.includes('mobile') || combined.includes('phone')) {
      tags.push('手机壁纸', '竖屏', '移动设备', '便携');
    }

    return tags;
  }

  /**
   * 生成备用URL
   */
  generateBackupUrls(originalUrl) {
    const backupUrls = [originalUrl];
    
    // 如果是CDN URL，生成原始版本
    if (originalUrl.includes('cdn-cgi/image/')) {
      const parts = originalUrl.split('/cdn-cgi/image/');
      if (parts.length === 2) {
        const imagePath = parts[1].substring(parts[1].indexOf('/') + 1);
        const originalVersion = `https://labubuwallpaper.com/${imagePath}`;
        backupUrls.push(originalVersion);
        
        // 生成不同质量的CDN版本
        const baseUrl = 'https://labubuwallpaper.com/cdn-cgi/image/';
        const variants = [
          'width=400,height=600,fit=cover,quality=85,format=auto',
          'width=300,height=450,fit=cover,quality=75,format=auto'
        ];
        
        variants.forEach(params => {
          backupUrls.push(`${baseUrl}${params}/${imagePath}`);
        });
      }
    }
    
    return backupUrls;
  }

  /**
   * 验证资源URL是否有效
   */
  isValidResourceUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('labubuwallpaper.com') && 
             (this.isImageUrl(url) || this.isVideoUrl(url));
    } catch {
      return false;
    }
  }

  /**
   * 检查是否为图片URL
   */
  isImageUrl(url) {
    const urlLower = url.toLowerCase();
    return this.config.processing.imageFormats.some(format => 
      urlLower.includes(`.${format}`)
    );
  }

  /**
   * 检查是否为视频URL
   */
  isVideoUrl(url) {
    const urlLower = url.toLowerCase();
    return this.config.processing.videoFormats.some(format => 
      urlLower.includes(`.${format}`)
    );
  }

  /**
   * 生成爬取报告
   */
  generateCrawlReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const durationMinutes = Math.round(duration / 60000);
    
    const report = {
      summary: {
        startTime: this.stats.startTime.toISOString(),
        endTime: this.stats.endTime.toISOString(),
        duration: `${durationMinutes} 分钟`,
        pagesScanned: this.stats.pagesScanned,
        resourcesFound: this.stats.resourcesFound,
        errors: this.stats.errors,
        successRate: Math.round(((this.stats.pagesScanned / this.config.targets.labubuwallpaper.pages.length) * 100))
      },
      resources: this.results,
      categories: this.getCategoryStats(),
      types: this.getTypeStats()
    };

    this.printCrawlReport(report);
    return report;
  }

  /**
   * 获取分类统计
   */
  getCategoryStats() {
    const stats = {};
    this.results.forEach(resource => {
      stats[resource.category] = (stats[resource.category] || 0) + 1;
    });
    return stats;
  }

  /**
   * 获取类型统计
   */
  getTypeStats() {
    const stats = {};
    this.results.forEach(resource => {
      stats[resource.type] = (stats[resource.type] || 0) + 1;
    });
    return stats;
  }

  /**
   * 打印爬取报告
   */
  printCrawlReport(report) {
    console.log('\n🕷️ 爬取报告');
    console.log('='.repeat(50));
    console.log(`🕐 开始时间: ${report.summary.startTime}`);
    console.log(`🏁 结束时间: ${report.summary.endTime}`);
    console.log(`⏱️ 耗时: ${report.summary.duration}`);
    console.log(`📄 页面数: ${report.summary.pagesScanned}`);
    console.log(`🖼️ 资源数: ${report.summary.resourcesFound}`);
    console.log(`❌ 错误数: ${report.summary.errors}`);
    console.log(`📈 成功率: ${report.summary.successRate}%`);

    if (Object.keys(report.categories).length > 0) {
      console.log('\n📊 分类统计:');
      Object.entries(report.categories).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} 个`);
      });
    }

    if (Object.keys(report.types).length > 0) {
      console.log('\n🎭 类型统计:');
      Object.entries(report.types).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 个`);
      });
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取爬取结果
   */
  getResults() {
    return this.results;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.stats;
  }
}

// 导出单例实例
export const webCrawler = new WebCrawler(); 