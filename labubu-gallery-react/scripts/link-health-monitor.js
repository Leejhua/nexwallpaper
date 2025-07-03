#!/usr/bin/env node

/**
 * 链接健康监控脚本
 * 定期检查项目中的外部链接是否正常工作
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class LinkHealthMonitor {
  constructor() {
    this.results = [];
    this.config = {
      timeout: 10000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      batchSize: 5,
      delay: 1000
    };
  }

  // 检查单个链接
  async checkLink(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https:') ? https : http;
      const options = {
        method: 'HEAD',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent
        }
      };

      const req = protocol.request(url, options, (res) => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          timestamp: new Date().toISOString()
        });
      });

      req.on('error', (err) => {
        resolve({
          url,
          status: 'ERROR',
          ok: false,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 'TIMEOUT',
          ok: false,
          error: 'Request timeout',
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    });
  }

  // 从文件提取链接
  extractLinks(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const urlRegex = /https?:\/\/[^\s"']+/g;
      const matches = content.match(urlRegex) || [];
      return [...new Set(matches)];
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return [];
    }
  }

  // 获取所有需要检查的链接
  getAllLinks() {
    const filesToCheck = [
      path.join(__dirname, '../src/data/galleryData.js'),
      path.join(__dirname, '../src/components/ShareModal.jsx')
    ];

    let allLinks = [];
    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        const links = this.extractLinks(file);
        allLinks = allLinks.concat(links);
      }
    });

    return [...new Set(allLinks)];
  }

  // 批量检查链接
  async checkAllLinks() {
    const links = this.getAllLinks();
    console.log(`🔍 开始检查 ${links.length} 个链接...`);

    const results = [];
    
    for (let i = 0; i < links.length; i += this.config.batchSize) {
      const batch = links.slice(i, i + this.config.batchSize);
      const batchResults = await Promise.all(batch.map(link => this.checkLink(link)));
      results.push(...batchResults);
      
      const progress = Math.round(((i + batch.length) / links.length) * 100);
      console.log(`📊 进度: ${progress}% (${i + batch.length}/${links.length})`);
      
      if (i + this.config.batchSize < links.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.delay));
      }
    }

    return results;
  }

  // 生成报告
  generateReport(results) {
    const okLinks = results.filter(r => r.ok);
    const failedLinks = results.filter(r => !r.ok);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        ok: okLinks.length,
        failed: failedLinks.length,
        successRate: Math.round((okLinks.length / results.length) * 100)
      },
      failedLinks: failedLinks,
      domainStats: this.getDomainStats(results)
    };

    return report;
  }

  // 获取域名统计
  getDomainStats(results) {
    const stats = {};
    results.forEach(result => {
      try {
        const domain = new URL(result.url).hostname;
        if (!stats[domain]) {
          stats[domain] = { total: 0, ok: 0, failed: 0 };
        }
        stats[domain].total++;
        if (result.ok) {
          stats[domain].ok++;
        } else {
          stats[domain].failed++;
        }
      } catch (e) {
        // 忽略无效URL
      }
    });
    return stats;
  }

  // 保存报告
  saveReport(report) {
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filename = `link-health-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 报告已保存: ${filepath}`);
  }

  // 打印控制台报告
  printReport(report) {
    console.log('\n📋 链接健康检查报告');
    console.log('='.repeat(50));
    console.log(`🕐 检查时间: ${report.timestamp}`);
    console.log(`📊 总链接数: ${report.summary.total}`);
    console.log(`✅ 正常链接: ${report.summary.ok}`);
    console.log(`❌ 失效链接: ${report.summary.failed}`);
    console.log(`📈 成功率: ${report.summary.successRate}%`);

    if (report.failedLinks.length > 0) {
      console.log('\n❌ 失效链接详情:');
      report.failedLinks.forEach(link => {
        console.log(`   ${link.url}`);
        console.log(`   状态: ${link.status} ${link.error ? '- ' + link.error : ''}`);
        console.log(`   时间: ${link.timestamp}\n`);
      });
    }

    console.log('\n📊 域名统计:');
    Object.entries(report.domainStats).forEach(([domain, stats]) => {
      const rate = Math.round((stats.ok / stats.total) * 100);
      const status = rate === 100 ? '✅' : rate >= 80 ? '⚠️' : '❌';
      console.log(`   ${status} ${domain}: ${stats.ok}/${stats.total} (${rate}%)`);
    });
  }

  // 运行监控
  async run() {
    try {
      console.log('🚀 启动链接健康监控...\n');
      
      const results = await this.checkAllLinks();
      const report = this.generateReport(results);
      
      this.printReport(report);
      this.saveReport(report);
      
      if (report.summary.failed === 0) {
        console.log('\n🎉 所有链接都正常工作！');
        process.exit(0);
      } else {
        console.log('\n⚠️  发现失效链接，建议进行修复。');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 监控过程中出现错误:', error);
      process.exit(1);
    }
  }
}

// 运行监控
if (require.main === module) {
  const monitor = new LinkHealthMonitor();
  monitor.run();
}

module.exports = LinkHealthMonitor;
