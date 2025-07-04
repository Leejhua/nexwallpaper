/**
 * 测试服务器
 * 为测试页面提供HTTP服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class TestServer {
  constructor(port = 8080) {
    this.port = port;
    this.testDir = __dirname;
  }

  // 获取MIME类型
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'text/plain';
  }

  // 处理请求
  handleRequest(req, res) {
    let filePath = req.url === '/' ? '/live-browser-test.html' : req.url;
    filePath = path.join(this.testDir, filePath);

    // 安全检查，防止目录遍历
    if (!filePath.startsWith(this.testDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error');
        }
        return;
      }

      const mimeType = this.getMimeType(filePath);
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  }

  // 启动服务器
  start() {
    const server = http.createServer((req, res) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`🧪 测试服务器已启动`);
      console.log(`📋 测试页面: http://localhost:${this.port}`);
      console.log(`🌐 主应用: http://localhost:3000`);
      console.log(`⏹️ 停止服务器: Ctrl+C`);
    });

    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n🛑 正在关闭测试服务器...');
      server.close(() => {
        console.log('✅ 测试服务器已关闭');
        process.exit(0);
      });
    });

    return server;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const testServer = new TestServer();
  testServer.start();
}

module.exports = TestServer;
