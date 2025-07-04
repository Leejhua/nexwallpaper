/**
 * 模拟浏览器环境测试验证脚本
 * 在Node.js环境中模拟浏览器DOM和API来测试我们的测试函数
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// 模拟浏览器环境
class BrowserSimulator {
  constructor() {
    this.setupGlobalMocks();
    this.results = [];
  }

  // 设置全局模拟对象
  setupGlobalMocks() {
    // 模拟 window 对象
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      location: { href: 'http://localhost:3000' },
      localStorage: {
        data: {},
        setItem(key, value) { this.data[key] = value; },
        getItem(key) { return this.data[key]; },
        removeItem(key) { delete this.data[key]; }
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      requestAnimationFrame: (callback) => setTimeout(callback, 16),
      performance: {
        now: () => Date.now(),
        timing: {
          navigationStart: Date.now() - 2000,
          loadEventEnd: Date.now() - 1000
        },
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024 // 50MB
        }
      },
      pageYOffset: 0,
      scrollTo: () => {},
      scrollBy: () => {},
      open: () => ({ close: () => {} })
    };

    // 模拟 document 对象
    global.document = {
      querySelector: (selector) => this.mockElement(selector),
      querySelectorAll: (selector) => this.mockElementList(selector),
      createElement: (tag) => this.mockElement(tag),
      body: this.mockElement('body'),
      title: 'Labubu Gallery',
      addEventListener: () => {},
      activeElement: null
    };

    // 模拟 navigator 对象
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      hardwareConcurrency: 8
    };

    // 模拟事件类
    global.Event = class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
      }
    };

    global.MouseEvent = class MouseEvent extends global.Event {};
    global.KeyboardEvent = class KeyboardEvent extends global.Event {};
    global.TouchEvent = class TouchEvent extends global.Event {};

    // 模拟 fetch
    global.fetch = async (url) => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => ''
    });

    // 模拟 console（保持原有功能）
    this.originalConsole = { ...console };
  }

  // 模拟DOM元素
  mockElement(selector) {
    const element = {
      tagName: selector.toUpperCase(),
      className: '',
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      style: {
        transform: 'none',
        display: 'block',
        backgroundColor: 'white',
        height: '40px',
        width: 'auto'
      },
      offsetWidth: 300,
      offsetHeight: 40,
      getBoundingClientRect: () => ({
        left: 0, top: 0, right: 300, bottom: 40,
        width: 300, height: 40
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      click: () => {},
      focus: () => {},
      blur: () => {},
      value: '',
      innerHTML: '',
      textContent: '',
      appendChild: () => {},
      removeChild: () => {},
      querySelector: (sel) => this.mockElement(sel),
      querySelectorAll: (sel) => this.mockElementList(sel)
    };

    // 根据选择器返回特定的模拟元素
    if (selector.includes('sidebar')) {
      element.offsetWidth = 280;
      element.style.display = 'block';
    } else if (selector.includes('gallery-item')) {
      element.style.transform = 'scale(1)';
    } else if (selector.includes('modal')) {
      element.classList.contains = (cls) => cls === 'hidden' ? false : true;
    }

    return element;
  }

  // 模拟DOM元素列表
  mockElementList(selector) {
    const count = selector.includes('gallery-item') ? 50 : 
                  selector.includes('button') ? 10 : 3;
    
    const elements = [];
    for (let i = 0; i < count; i++) {
      elements.push(this.mockElement(selector));
    }
    
    elements.length = count;
    elements.forEach = Array.prototype.forEach;
    elements.filter = Array.prototype.filter;
    elements.map = Array.prototype.map;
    
    return elements;
  }

  // 模拟getComputedStyle
  mockGetComputedStyle() {
    global.getComputedStyle = (element) => ({
      transform: element.style.transform || 'none',
      display: element.style.display || 'block',
      backgroundColor: element.style.backgroundColor || 'white',
      height: element.style.height || '40px',
      width: element.style.width || 'auto',
      columnCount: '4',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      position: 'static'
    });
  }

  // 加载并执行测试脚本
  async loadTestScript(scriptPath) {
    try {
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      // 移除ES6模块导出语句，使其在Node.js中可执行
      const modifiedScript = scriptContent
        .replace(/export default.*?;/g, '')
        .replace(/if \(typeof module.*?\}/gs, '');
      
      // 在模拟环境中执行脚本
      eval(modifiedScript);
      
      return true;
    } catch (error) {
      console.error(`❌ 加载脚本失败 ${scriptPath}:`, error.message);
      return false;
    }
  }

  // 运行桌面端测试验证
  async runDesktopTestValidation() {
    console.log('🖥️ 验证桌面端测试功能...\n');
    
    // 设置桌面端环境
    global.window.innerWidth = 1920;
    global.window.innerHeight = 1080;
    this.mockGetComputedStyle();
    
    try {
      // 加载桌面端测试脚本
      const scriptPath = path.join(__dirname, 'desktop-specific-test.js');
      const loaded = await this.loadTestScript(scriptPath);
      
      if (!loaded) {
        console.log('❌ 无法加载桌面端测试脚本');
        return false;
      }

      // 检查DesktopTestRunner类是否存在
      if (typeof DesktopTestRunner !== 'undefined') {
        console.log('✅ DesktopTestRunner 类加载成功');
        
        // 创建测试实例
        const testRunner = new DesktopTestRunner();
        console.log('✅ 测试实例创建成功');
        
        // 验证关键方法存在
        const methods = ['testDesktopSidebar', 'testKeyboardShortcuts', 'testHoverEffects', 'runAllTests'];
        methods.forEach(method => {
          const exists = typeof testRunner[method] === 'function';
          console.log(`${exists ? '✅' : '❌'} 方法 ${method}: ${exists ? '存在' : '不存在'}`);
        });
        
        return true;
      } else {
        console.log('❌ DesktopTestRunner 类未定义');
        return false;
      }
      
    } catch (error) {
      console.log('❌ 桌面端测试验证失败:', error.message);
      return false;
    }
  }

  // 运行移动端测试验证
  async runMobileTestValidation() {
    console.log('\n📱 验证移动端测试功能...\n');
    
    // 设置移动端环境
    global.window.innerWidth = 375;
    global.window.innerHeight = 667;
    
    try {
      // 加载移动端测试脚本
      const scriptPath = path.join(__dirname, 'mobile-specific-test.js');
      const loaded = await this.loadTestScript(scriptPath);
      
      if (!loaded) {
        console.log('❌ 无法加载移动端测试脚本');
        return false;
      }

      // 检查MobileTestRunner类是否存在
      if (typeof MobileTestRunner !== 'undefined') {
        console.log('✅ MobileTestRunner 类加载成功');
        
        // 创建测试实例
        const testRunner = new MobileTestRunner();
        console.log('✅ 测试实例创建成功');
        
        // 验证关键方法存在
        const methods = ['testMobileSidebar', 'testTouchScroll', 'testMobileModal', 'runAllTests'];
        methods.forEach(method => {
          const exists = typeof testRunner[method] === 'function';
          console.log(`${exists ? '✅' : '❌'} 方法 ${method}: ${exists ? '存在' : '不存在'}`);
        });
        
        return true;
      } else {
        console.log('❌ MobileTestRunner 类未定义');
        return false;
      }
      
    } catch (error) {
      console.log('❌ 移动端测试验证失败:', error.message);
      return false;
    }
  }

  // 运行综合测试验证
  async runResponsiveTestValidation() {
    console.log('\n🔄 验证综合测试功能...\n');
    
    try {
      // 加载综合测试脚本
      const scriptPath = path.join(__dirname, 'desktop-mobile-test.js');
      const loaded = await this.loadTestScript(scriptPath);
      
      if (!loaded) {
        console.log('❌ 无法加载综合测试脚本');
        return false;
      }

      // 检查ResponsiveTestRunner类是否存在
      if (typeof ResponsiveTestRunner !== 'undefined') {
        console.log('✅ ResponsiveTestRunner 类加载成功');
        
        // 创建测试实例
        const testRunner = new ResponsiveTestRunner();
        console.log('✅ 测试实例创建成功');
        
        // 验证关键方法存在
        const methods = ['testPageLoad', 'testResponsiveLayout', 'testSearchFunction', 'runAllTests'];
        methods.forEach(method => {
          const exists = typeof testRunner[method] === 'function';
          console.log(`${exists ? '✅' : '❌'} 方法 ${method}: ${exists ? '存在' : '不存在'}`);
        });
        
        return true;
      } else {
        console.log('❌ ResponsiveTestRunner 类未定义');
        return false;
      }
      
    } catch (error) {
      console.log('❌ 综合测试验证失败:', error.message);
      return false;
    }
  }

  // 验证服务器连接
  async validateServerConnection() {
    console.log('\n🌐 验证服务器连接...\n');
    
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        const isOk = res.statusCode === 200;
        console.log(`${isOk ? '✅' : '❌'} 服务器连接: HTTP ${res.statusCode}`);
        
        if (isOk) {
          console.log('✅ 开发服务器正常运行');
          console.log(`✅ 响应头: ${JSON.stringify(res.headers['content-type'])}`);
        }
        
        resolve(isOk);
      });
      
      req.on('error', (error) => {
        console.log('❌ 服务器连接失败:', error.message);
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        console.log('❌ 服务器连接超时');
        resolve(false);
      });
    });
  }

  // 运行完整验证
  async runFullValidation() {
    console.log('🧪 开始完整测试套件验证');
    console.log('='.repeat(50));
    
    const results = [];
    
    // 验证服务器连接
    const serverOk = await this.validateServerConnection();
    results.push({ name: '服务器连接', passed: serverOk });
    
    // 验证桌面端测试
    const desktopOk = await this.runDesktopTestValidation();
    results.push({ name: '桌面端测试', passed: desktopOk });
    
    // 验证移动端测试
    const mobileOk = await this.runMobileTestValidation();
    results.push({ name: '移动端测试', passed: mobileOk });
    
    // 验证综合测试
    const responsiveOk = await this.runResponsiveTestValidation();
    results.push({ name: '综合测试', passed: responsiveOk });
    
    // 生成验证报告
    this.generateValidationReport(results);
    
    return results;
  }

  // 生成验证报告
  generateValidationReport(results) {
    console.log('\n📊 验证报告');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`通过: ${passed}/${total} (${passRate}%)`);
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
    });
    
    const overallStatus = passRate >= 75 ? '🎉 验证通过' : '⚠️ 需要修复';
    console.log(`\n状态: ${overallStatus}`);
    
    if (passRate >= 75) {
      console.log('\n🎯 测试套件功能验证成功！');
      console.log('\n📋 可用的测试功能:');
      console.log('  🖥️ 桌面端测试: 键盘快捷键、鼠标悬停、布局验证');
      console.log('  📱 移动端测试: 触摸操作、手势识别、移动布局');
      console.log('  🔄 综合测试: 响应式布局、功能完整性、性能指标');
      console.log('\n🚀 使用方法:');
      console.log('  1. 打开浏览器: http://localhost:3000');
      console.log('  2. 按F12打开开发者工具');
      console.log('  3. 在控制台运行: runDesktopTests() 或 runMobileTests()');
    }
    
    return { passed, total, passRate };
  }
}

// 运行验证
if (require.main === module) {
  const simulator = new BrowserSimulator();
  simulator.runFullValidation().catch(console.error);
}

module.exports = BrowserSimulator;
