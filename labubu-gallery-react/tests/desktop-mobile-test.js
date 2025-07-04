/**
 * 桌面端和移动端功能测试脚本
 * 测试React Gallery的响应式设计和功能完整性
 */

// 模拟不同设备的视口尺寸
const DEVICE_SIZES = {
  desktop: { width: 1920, height: 1080, name: '桌面端' },
  tablet: { width: 768, height: 1024, name: '平板端' },
  mobile: { width: 375, height: 667, name: '移动端' }
};

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retryCount: 3
};

class ResponsiveTestRunner {
  constructor() {
    this.results = [];
    this.currentDevice = null;
  }

  // 设置视口尺寸
  async setViewport(device) {
    this.currentDevice = device;
    console.log(`\n🔧 设置视口: ${device.name} (${device.width}x${device.height})`);
    
    // 在浏览器环境中设置视口
    if (typeof window !== 'undefined') {
      // 模拟移动端用户代理
      if (device.width <= 768) {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          configurable: true
        });
      }
    }
  }

  // 等待元素出现
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`元素 ${selector} 在 ${timeout}ms 内未找到`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  }

  // 测试页面加载
  async testPageLoad() {
    console.log('📄 测试页面加载...');
    
    try {
      const response = await fetch(TEST_CONFIG.baseUrl);
      const isLoaded = response.ok;
      
      this.logResult('页面加载', isLoaded, isLoaded ? '页面成功加载' : `HTTP ${response.status}`);
      return isLoaded;
    } catch (error) {
      this.logResult('页面加载', false, error.message);
      return false;
    }
  }

  // 测试响应式布局
  async testResponsiveLayout() {
    console.log('📱 测试响应式布局...');
    
    try {
      // 测试侧边栏响应式行为
      const sidebar = await this.waitForElement('.sidebar, [class*="sidebar"]');
      const isMobile = this.currentDevice.width <= 768;
      
      // 移动端侧边栏应该是隐藏的或可折叠的
      if (isMobile) {
        const isHidden = sidebar.classList.contains('hidden') || 
                        getComputedStyle(sidebar).transform.includes('translate');
        this.logResult('移动端侧边栏', isHidden, isHidden ? '正确隐藏' : '未正确隐藏');
      } else {
        // 桌面端侧边栏应该是可见的
        const isVisible = !sidebar.classList.contains('hidden');
        this.logResult('桌面端侧边栏', isVisible, isVisible ? '正确显示' : '未正确显示');
      }

      // 测试画廊布局
      const gallery = await this.waitForElement('.gallery, [class*="gallery"]');
      const columns = getComputedStyle(gallery).columnCount || getComputedStyle(gallery).gridTemplateColumns;
      
      let expectedColumns;
      if (this.currentDevice.width >= 1024) expectedColumns = '4'; // 桌面端4列
      else if (this.currentDevice.width >= 768) expectedColumns = '3'; // 平板端3列
      else expectedColumns = '2'; // 移动端2列
      
      const hasCorrectColumns = columns.includes(expectedColumns) || columns === expectedColumns;
      this.logResult('画廊列数', hasCorrectColumns, `期望${expectedColumns}列，实际: ${columns}`);
      
      return true;
    } catch (error) {
      this.logResult('响应式布局', false, error.message);
      return false;
    }
  }

  // 测试搜索功能
  async testSearchFunction() {
    console.log('🔍 测试搜索功能...');
    
    try {
      const searchInput = await this.waitForElement('input[type="text"], input[placeholder*="搜索"]');
      
      // 模拟搜索输入
      searchInput.value = '奇幻';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 等待搜索结果
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      const hasResults = galleryItems.length > 0;
      
      this.logResult('搜索功能', hasResults, hasResults ? `找到${galleryItems.length}个结果` : '无搜索结果');
      
      // 清除搜索
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      return hasResults;
    } catch (error) {
      this.logResult('搜索功能', false, error.message);
      return false;
    }
  }

  // 测试筛选功能
  async testFilterFunction() {
    console.log('🏷️ 测试筛选功能...');
    
    try {
      // 查找筛选按钮
      const filterButtons = document.querySelectorAll('button[class*="filter"], .filter-btn, [class*="category"]');
      
      if (filterButtons.length === 0) {
        this.logResult('筛选功能', false, '未找到筛选按钮');
        return false;
      }

      // 点击第一个筛选按钮
      const firstFilter = filterButtons[0];
      firstFilter.click();
      
      // 等待筛选结果
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      const hasFilteredResults = galleryItems.length > 0;
      
      this.logResult('筛选功能', hasFilteredResults, hasFilteredResults ? `筛选后${galleryItems.length}个结果` : '筛选无结果');
      
      return hasFilteredResults;
    } catch (error) {
      this.logResult('筛选功能', false, error.message);
      return false;
    }
  }

  // 测试详情页功能
  async testModalFunction() {
    console.log('🖼️ 测试详情页功能...');
    
    try {
      // 查找第一个画廊项目
      const firstItem = await this.waitForElement('.gallery-item, [class*="gallery-item"]');
      
      // 点击打开详情页
      firstItem.click();
      
      // 等待模态框出现
      const modal = await this.waitForElement('.modal, [class*="modal"]', 3000);
      const isModalOpen = modal && !modal.classList.contains('hidden');
      
      this.logResult('详情页打开', isModalOpen, isModalOpen ? '成功打开' : '未能打开');
      
      if (isModalOpen) {
        // 测试按钮尺寸（移动端和桌面端应该不同）
        const buttons = modal.querySelectorAll('button');
        const isMobile = this.currentDevice.width <= 768;
        
        let correctButtonSize = true;
        buttons.forEach(button => {
          const height = getComputedStyle(button).height;
          const expectedHeight = isMobile ? '32px' : '40px';
          if (height !== expectedHeight) {
            correctButtonSize = false;
          }
        });
        
        this.logResult('按钮尺寸', correctButtonSize, correctButtonSize ? '尺寸正确' : '尺寸不匹配');
        
        // 测试标签点击搜索功能
        const tags = modal.querySelectorAll('[class*="tag"], .tag');
        if (tags.length > 0) {
          const firstTag = tags[0];
          firstTag.click();
          
          // 检查是否关闭了详情页并触发了搜索
          await new Promise(resolve => setTimeout(resolve, 500));
          const isModalClosed = modal.classList.contains('hidden') || !document.body.contains(modal);
          
          this.logResult('标签点击搜索', isModalClosed, isModalClosed ? '成功触发搜索' : '未正确响应');
        }
        
        // 关闭详情页
        const closeButton = modal.querySelector('button[class*="close"], .close-btn, [aria-label*="关闭"]');
        if (closeButton) {
          closeButton.click();
        }
      }
      
      return isModalOpen;
    } catch (error) {
      this.logResult('详情页功能', false, error.message);
      return false;
    }
  }

  // 测试动画效果
  async testAnimations() {
    console.log('✨ 测试动画效果...');
    
    try {
      // 测试BlurFade动画组件
      const blurFadeElements = document.querySelectorAll('[class*="blur-fade"], .blur-fade');
      const hasBlurFade = blurFadeElements.length > 0;
      
      this.logResult('BlurFade动画', hasBlurFade, hasBlurFade ? `找到${blurFadeElements.length}个动画元素` : '未找到动画元素');
      
      // 测试悬停动画
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      if (galleryItems.length > 0) {
        const firstItem = galleryItems[0];
        
        // 模拟鼠标悬停
        firstItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const hasHoverEffect = getComputedStyle(firstItem).transform !== 'none' ||
                              getComputedStyle(firstItem).scale !== '1';
        
        this.logResult('悬停动画', hasHoverEffect, hasHoverEffect ? '动画正常' : '无悬停效果');
        
        // 移除悬停
        firstItem.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }
      
      return true;
    } catch (error) {
      this.logResult('动画效果', false, error.message);
      return false;
    }
  }

  // 测试性能指标
  async testPerformance() {
    console.log('⚡ 测试性能指标...');
    
    try {
      const startTime = performance.now();
      
      // 等待所有图片加载
      const images = document.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise(resolve => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000); // 3秒超时
          }
        });
      });
      
      await Promise.all(imagePromises);
      
      const loadTime = performance.now() - startTime;
      const isPerformant = loadTime < 5000; // 5秒内加载完成
      
      this.logResult('加载性能', isPerformant, `加载时间: ${Math.round(loadTime)}ms`);
      
      // 测试内存使用（如果可用）
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        const isMemoryEfficient = memoryUsage < 100; // 小于100MB
        
        this.logResult('内存使用', isMemoryEfficient, `内存使用: ${Math.round(memoryUsage)}MB`);
      }
      
      return isPerformant;
    } catch (error) {
      this.logResult('性能测试', false, error.message);
      return false;
    }
  }

  // 记录测试结果
  logResult(testName, passed, details) {
    const result = {
      device: this.currentDevice.name,
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${details}`);
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始运行响应式功能测试\n');
    
    for (const [deviceKey, device] of Object.entries(DEVICE_SIZES)) {
      console.log(`\n📱 测试设备: ${device.name}`);
      console.log('='.repeat(50));
      
      await this.setViewport(device);
      
      // 运行所有测试
      await this.testPageLoad();
      await this.testResponsiveLayout();
      await this.testSearchFunction();
      await this.testFilterFunction();
      await this.testModalFunction();
      await this.testAnimations();
      await this.testPerformance();
      
      console.log(`\n${device.name} 测试完成`);
    }
    
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(60));
    
    const deviceResults = {};
    
    // 按设备分组结果
    this.results.forEach(result => {
      if (!deviceResults[result.device]) {
        deviceResults[result.device] = { passed: 0, failed: 0, tests: [] };
      }
      
      if (result.passed) {
        deviceResults[result.device].passed++;
      } else {
        deviceResults[result.device].failed++;
      }
      
      deviceResults[result.device].tests.push(result);
    });
    
    // 输出每个设备的结果
    Object.entries(deviceResults).forEach(([device, stats]) => {
      const total = stats.passed + stats.failed;
      const passRate = ((stats.passed / total) * 100).toFixed(1);
      
      console.log(`\n${device}:`);
      console.log(`  通过: ${stats.passed}/${total} (${passRate}%)`);
      console.log(`  失败: ${stats.failed}/${total}`);
      
      // 显示失败的测试
      const failedTests = stats.tests.filter(test => !test.passed);
      if (failedTests.length > 0) {
        console.log('  失败项目:');
        failedTests.forEach(test => {
          console.log(`    ❌ ${test.test}: ${test.details}`);
        });
      }
    });
    
    // 总体统计
    const totalPassed = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 总体结果:`);
    console.log(`  总测试数: ${totalTests}`);
    console.log(`  通过率: ${overallPassRate}%`);
    console.log(`  状态: ${overallPassRate >= 80 ? '✅ 良好' : '⚠️ 需要改进'}`);
    
    return {
      deviceResults,
      totalPassed,
      totalTests,
      overallPassRate
    };
  }
}

// 浏览器环境下的测试执行器
if (typeof window !== 'undefined') {
  window.ResponsiveTestRunner = ResponsiveTestRunner;
  
  // 自动运行测试的函数
  window.runResponsiveTests = async function() {
    const testRunner = new ResponsiveTestRunner();
    return await testRunner.runAllTests();
  };
  
  console.log('📋 响应式测试工具已加载');
  console.log('💡 使用方法: 在浏览器控制台中运行 runResponsiveTests()');
}

// Node.js环境下的导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveTestRunner;
}
