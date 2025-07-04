/**
 * 快速验证测试脚本
 * 验证测试套件的基本功能是否正常
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class QuickValidator {
  constructor() {
    this.results = [];
    this.baseUrl = 'http://localhost:3000';
  }

  // 记录结果
  logResult(testName, passed, details) {
    const result = { testName, passed, details };
    this.results.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  // 测试服务器连接
  async testServerConnection() {
    return new Promise((resolve) => {
      const req = http.get(this.baseUrl, (res) => {
        const isOk = res.statusCode === 200;
        this.logResult('服务器连接', isOk, `HTTP ${res.statusCode}`);
        resolve(isOk);
      });
      
      req.on('error', (error) => {
        this.logResult('服务器连接', false, error.message);
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        this.logResult('服务器连接', false, '连接超时');
        resolve(false);
      });
    });
  }

  // 测试文件存在性
  testFilesExist() {
    const requiredFiles = [
      'tests/desktop-mobile-test.js',
      'tests/desktop-specific-test.js', 
      'tests/mobile-specific-test.js',
      'tests/run-all-tests.html',
      'tests/test-config.json',
      'scripts/run-tests.sh'
    ];

    let allExist = true;
    
    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      
      if (!exists) {
        allExist = false;
      }
      
      this.logResult(`文件存在: ${file}`, exists, exists ? '存在' : '不存在');
    });

    return allExist;
  }

  // 测试配置文件
  testConfigFile() {
    try {
      const configPath = path.join(__dirname, 'test-config.json');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      const hasRequiredKeys = config.testConfig && config.deviceSizes && config.testSuites;
      this.logResult('配置文件解析', hasRequiredKeys, hasRequiredKeys ? '配置完整' : '配置缺失');
      
      return hasRequiredKeys;
    } catch (error) {
      this.logResult('配置文件解析', false, error.message);
      return false;
    }
  }

  // 测试脚本可执行性
  testScriptExecutable() {
    try {
      const scriptPath = path.join(__dirname, '..', 'scripts', 'run-tests.sh');
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      
      this.logResult('脚本可执行', isExecutable, isExecutable ? '可执行' : '不可执行');
      return isExecutable;
    } catch (error) {
      this.logResult('脚本可执行', false, error.message);
      return false;
    }
  }

  // 测试HTML文件
  testHtmlFile() {
    try {
      const htmlPath = path.join(__dirname, 'run-all-tests.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      const hasRequiredElements = htmlContent.includes('runDesktopTests') && 
                                 htmlContent.includes('runMobileTests') &&
                                 htmlContent.includes('runResponsiveTests');
      
      this.logResult('HTML测试页面', hasRequiredElements, hasRequiredElements ? '功能完整' : '功能缺失');
      return hasRequiredElements;
    } catch (error) {
      this.logResult('HTML测试页面', false, error.message);
      return false;
    }
  }

  // 测试JavaScript模块加载
  testJavaScriptModules() {
    const jsFiles = [
      'tests/desktop-mobile-test.js',
      'tests/desktop-specific-test.js',
      'tests/mobile-specific-test.js'
    ];

    let allValid = true;

    jsFiles.forEach(file => {
      try {
        const filePath = path.join(__dirname, '..', file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查关键类和函数是否存在
        const hasRequiredClasses = content.includes('class') && 
                                  content.includes('async') &&
                                  content.includes('logResult');
        
        if (!hasRequiredClasses) {
          allValid = false;
        }
        
        this.logResult(`JS模块: ${file}`, hasRequiredClasses, hasRequiredClasses ? '结构正确' : '结构异常');
      } catch (error) {
        allValid = false;
        this.logResult(`JS模块: ${file}`, false, error.message);
      }
    });

    return allValid;
  }

  // 运行所有验证测试
  async runValidation() {
    console.log('🔍 开始快速验证测试套件...\n');
    
    // 测试服务器连接
    await this.testServerConnection();
    
    // 测试文件存在性
    this.testFilesExist();
    
    // 测试配置文件
    this.testConfigFile();
    
    // 测试脚本可执行性
    this.testScriptExecutable();
    
    // 测试HTML文件
    this.testHtmlFile();
    
    // 测试JavaScript模块
    this.testJavaScriptModules();
    
    // 生成报告
    this.generateReport();
  }

  // 生成验证报告
  generateReport() {
    console.log('\n📊 验证报告');
    console.log('='.repeat(40));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`通过: ${passed}/${total} (${passRate}%)`);
    
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ 失败项目:');
      failedTests.forEach(test => {
        console.log(`  • ${test.testName}: ${test.details}`);
      });
    }
    
    const status = passRate >= 80 ? '✅ 测试套件就绪' : '⚠️ 需要修复问题';
    console.log(`\n状态: ${status}`);
    
    if (passRate >= 80) {
      console.log('\n🎉 测试套件验证通过！可以开始使用测试功能。');
      console.log('\n使用方法:');
      console.log('  1. 打开浏览器访问: http://localhost:3000');
      console.log('  2. 打开测试页面: tests/run-all-tests.html');
      console.log('  3. 或运行: ./scripts/run-tests.sh browser');
      console.log('\n在浏览器控制台中运行:');
      console.log('  - runDesktopTests()    # 桌面端测试');
      console.log('  - runMobileTests()     # 移动端测试');
      console.log('  - runResponsiveTests() # 综合测试');
    }
    
    return { passed, total, passRate };
  }
}

// 运行验证
if (require.main === module) {
  const validator = new QuickValidator();
  validator.runValidation().catch(console.error);
}

module.exports = QuickValidator;
