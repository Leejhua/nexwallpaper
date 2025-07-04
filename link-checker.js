#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 链接检查函数
function checkLink(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    const options = {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = protocol.request(url, options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        ok: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        ok: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

// 从数据文件中提取链接
function extractLinksFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const urlRegex = /https?:\/\/[^\s"']+/g;
    const matches = content.match(urlRegex) || [];
    return [...new Set(matches)]; // 去重
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// 主要检查函数
async function checkAllLinks() {
  console.log('🔍 开始检查链接...\n');

  // 要检查的文件
  const filesToCheck = [
    '/home/ljh/labubu-gallery-react/src/data/galleryData.js',
    '/home/ljh/labubu-gallery-react/src/components/ShareModal.jsx'
  ];

  let allLinks = [];
  
  // 从文件中提取链接
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const links = extractLinksFromFile(file);
      allLinks = allLinks.concat(links);
      console.log(`📁 从 ${path.basename(file)} 提取了 ${links.length} 个链接`);
    }
  });

  // 去重
  allLinks = [...new Set(allLinks)];
  console.log(`\n📊 总共需要检查 ${allLinks.length} 个唯一链接\n`);

  // 分批检查链接
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < allLinks.length; i += batchSize) {
    const batch = allLinks.slice(i, i + batchSize);
    console.log(`🔄 检查第 ${Math.floor(i/batchSize) + 1} 批 (${batch.length} 个链接)...`);
    
    const batchResults = await Promise.all(batch.map(checkLink));
    results.push(...batchResults);
    
    // 显示进度
    const progress = Math.round(((i + batch.length) / allLinks.length) * 100);
    console.log(`   进度: ${progress}%`);
    
    // 避免请求过于频繁
    if (i + batchSize < allLinks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 分析结果
  console.log('\n📋 检查结果汇总:');
  console.log('='.repeat(50));
  
  const okLinks = results.filter(r => r.ok);
  const failedLinks = results.filter(r => !r.ok);
  
  console.log(`✅ 正常链接: ${okLinks.length}`);
  console.log(`❌ 失效链接: ${failedLinks.length}`);
  
  if (failedLinks.length > 0) {
    console.log('\n❌ 失效链接详情:');
    failedLinks.forEach(link => {
      console.log(`   ${link.url}`);
      console.log(`   状态: ${link.status} ${link.error ? '- ' + link.error : ''}\n`);
    });
  }

  // 按域名分组统计
  console.log('\n📊 按域名统计:');
  const domainStats = {};
  results.forEach(result => {
    try {
      const domain = new URL(result.url).hostname;
      if (!domainStats[domain]) {
        domainStats[domain] = { total: 0, ok: 0, failed: 0 };
      }
      domainStats[domain].total++;
      if (result.ok) {
        domainStats[domain].ok++;
      } else {
        domainStats[domain].failed++;
      }
    } catch (e) {
      // 忽略无效URL
    }
  });

  Object.entries(domainStats).forEach(([domain, stats]) => {
    const successRate = Math.round((stats.ok / stats.total) * 100);
    console.log(`   ${domain}: ${stats.ok}/${stats.total} (${successRate}%)`);
  });

  return {
    total: results.length,
    ok: okLinks.length,
    failed: failedLinks.length,
    failedLinks: failedLinks
  };
}

// 运行检查
checkAllLinks().then(summary => {
  console.log('\n🎯 最终总结:');
  console.log(`   总链接数: ${summary.total}`);
  console.log(`   正常链接: ${summary.ok}`);
  console.log(`   失效链接: ${summary.failed}`);
  console.log(`   成功率: ${Math.round((summary.ok / summary.total) * 100)}%`);
  
  if (summary.failed === 0) {
    console.log('\n🎉 所有链接都正常工作！');
  } else {
    console.log('\n⚠️  发现失效链接，建议进行修复。');
  }
}).catch(error => {
  console.error('检查过程中出现错误:', error);
});
