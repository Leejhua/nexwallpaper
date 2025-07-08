/**
 * 移动端专项功能测试脚本
 * 专门测试移动端特有的功能和交互
 */

class MobileTestRunner {
  constructor() {
    this.results = [];
    this.isMobile = window.innerWidth <= 768;
  }

  // 模拟触摸事件
  simulateTouch(element, eventType, options = {}) {
    const touchEvent = new TouchEvent(eventType, {
      bubbles: true,
      cancelable: true,
      touches: [{
        clientX: options.x || 0,
        clientY: options.y || 0,
        target: element
      }],
      ...options
    });
    
    element.dispatchEvent(touchEvent);
  }

  // 模拟滑动手势
  async simulateSwipe(element, direction = 'left', distance = 100) {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    let endX = startX;
    let endY = startY;
    
    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }
    
    // 触摸开始
    this.simulateTouch(element, 'touchstart', { x: startX, y: startY });
    
    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 触摸移动
    this.simulateTouch(element, 'touchmove', { x: endX, y: endY });
    
    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 触摸结束
    this.simulateTouch(element, 'touchend', { x: endX, y: endY });
  }

  // 测试移动端侧边栏
  async testMobileSidebar() {
    console.log('📱 测试移动端侧边栏...');
    
    try {
      // 查找菜单按钮
      const menuButton = document.querySelector('button[class*="menu"], .menu-btn, [aria-label*="菜单"]');
      
      if (!menuButton) {
        this.logResult('侧边栏菜单按钮', false, '未找到菜单按钮');
        return false;
      }

      // 点击菜单按钮
      menuButton.click();
      
      // 等待侧边栏出现
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
      const isVisible = sidebar && !sidebar.classList.contains('hidden') && 
                       getComputedStyle(sidebar).transform !== 'translateX(-100%)';
      
      this.logResult('侧边栏打开', isVisible, isVisible ? '成功打开' : '未能打开');
      
      if (isVisible) {
        // 测试点击遮罩关闭
        const overlay = document.querySelector('.overlay, [class*="overlay"]');
        if (overlay) {
          overlay.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const isClosed = sidebar.classList.contains('hidden') || 
                          getComputedStyle(sidebar).transform === 'translateX(-100%)';
          
          this.logResult('遮罩关闭', isClosed, isClosed ? '成功关闭' : '未能关闭');
        }
      }
      
      return isVisible;
    } catch (error) {
      this.logResult('移动端侧边栏', false, error.message);
      return false;
    }
  }

  // 测试触摸滚动
  async testTouchScroll() {
    console.log('👆 测试触摸滚动...');
    
    try {
      const gallery = document.querySelector('.gallery, [class*="gallery"]');
      
      if (!gallery) {
        this.logResult('触摸滚动', false, '未找到画廊容器');
        return false;
      }

      const initialScrollTop = window.pageYOffset;
      
      // 模拟向上滑动
      await this.simulateSwipe(gallery, 'up', 200);
      
      // 等待滚动完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalScrollTop = window.pageYOffset;
      const hasScrolled = finalScrollTop > initialScrollTop;
      
      this.logResult('触摸滚动', hasScrolled, hasScrolled ? `滚动了${finalScrollTop - initialScrollTop}px` : '未发生滚动');
      
      return hasScrolled;
    } catch (error) {
      this.logResult('触摸滚动', false, error.message);
      return false;
    }
  }

  // 测试移动端详情页
  async testMobileModal() {
    console.log('🖼️ 测试移动端详情页...');
    
    try {
      // 查找第一个画廊项目
      const firstItem = document.querySelector('.gallery-item, [class*="gallery-item"]');
      
      if (!firstItem) {
        this.logResult('移动端详情页', false, '未找到画廊项目');
        return false;
      }

      // 触摸点击打开详情页
      this.simulateTouch(firstItem, 'touchstart');
      await new Promise(resolve => setTimeout(resolve, 50));
      this.simulateTouch(firstItem, 'touchend');
      
      // 等待模态框出现
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const modal = document.querySelector('.modal, [class*="modal"]');
      const isModalOpen = modal && !modal.classList.contains('hidden');
      
      this.logResult('移动端详情页打开', isModalOpen, isModalOpen ? '成功打开' : '未能打开');
      
      if (isModalOpen) {
        // 测试移动端按钮尺寸
        const buttons = modal.querySelectorAll('button');
        let correctMobileSize = true;
        
        buttons.forEach(button => {
          const height = getComputedStyle(button).height;
          if (height !== '32px' && !button.classList.contains('download-btn')) {
            correctMobileSize = false;
          }
        });
        
        this.logResult('移动端按钮尺寸', correctMobileSize, correctMobileSize ? '32px正确' : '尺寸不正确');
        
        // 测试图片缩放
        const image = modal.querySelector('img');
        if (image) {
          // 模拟双击缩放
          this.simulateTouch(image, 'touchstart');
          this.simulateTouch(image, 'touchend');
          await new Promise(resolve => setTimeout(resolve, 50));
          this.simulateTouch(image, 'touchstart');
          this.simulateTouch(image, 'touchend');
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const transform = getComputedStyle(image).transform;
          const hasZoom = transform !== 'none' && transform.includes('scale');
          
          this.logResult('图片双击缩放', hasZoom, hasZoom ? '支持缩放' : '不支持缩放');
        }
        
        // 关闭详情页
        const closeButton = modal.querySelector('button[class*="close"], .close-btn');
        if (closeButton) {
          this.simulateTouch(closeButton, 'touchstart');
          this.simulateTouch(closeButton, 'touchend');
        }
      }
      
      return isModalOpen;
    } catch (error) {
      this.logResult('移动端详情页', false, error.message);
      return false;
    }
  }

  // 测试移动端搜索
  async testMobileSearch() {
    console.log('🔍 测试移动端搜索...');
    
    try {
      const searchInput = document.querySelector('input[type="text"], input[placeholder*="搜索"]');
      
      if (!searchInput) {
        this.logResult('移动端搜索', false, '未找到搜索框');
        return false;
      }

      // 模拟触摸聚焦
      this.simulateTouch(searchInput, 'touchstart');
      this.simulateTouch(searchInput, 'touchend');
      searchInput.focus();
      
      // 检查虚拟键盘是否触发（通过视口变化检测）
      const initialHeight = window.innerHeight;
      
      // 等待虚拟键盘出现
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalHeight = window.innerHeight;
      const keyboardAppeared = finalHeight < initialHeight;
      
      this.logResult('虚拟键盘', keyboardAppeared, keyboardAppeared ? '成功触发' : '未触发');
      
      // 输入搜索内容
      searchInput.value = '奇幻';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 等待搜索结果
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      const hasResults = galleryItems.length > 0;
      
      this.logResult('移动端搜索结果', hasResults, hasResults ? `找到${galleryItems.length}个结果` : '无搜索结果');
      
      // 清除搜索并失焦
      searchInput.value = '';
      searchInput.blur();
      
      return hasResults;
    } catch (error) {
      this.logResult('移动端搜索', false, error.message);
      return false;
    }
  }

  // 测试移动端手势
  async testMobileGestures() {
    console.log('👋 测试移动端手势...');
    
    try {
      const gallery = document.querySelector('.gallery, [class*="gallery"]');
      
      if (!gallery) {
        this.logResult('移动端手势', false, '未找到画廊容器');
        return false;
      }

      // 测试长按手势
      const firstItem = document.querySelector('.gallery-item, [class*="gallery-item"]');
      if (firstItem) {
        this.simulateTouch(firstItem, 'touchstart');
        
        // 长按500ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.simulateTouch(firstItem, 'touchend');
        
        // 检查是否有长按反馈
        const hasLongPressEffect = firstItem.classList.contains('long-pressed') ||
                                  getComputedStyle(firstItem).transform !== 'none';
        
        this.logResult('长按手势', hasLongPressEffect, hasLongPressEffect ? '支持长按' : '不支持长按');
      }
      
      // 测试下拉刷新
      const initialScrollTop = window.pageYOffset;
      window.scrollTo(0, 0);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟下拉
      await this.simulateSwipe(document.body, 'down', 150);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hasPullRefresh = document.querySelector('.pull-refresh, [class*="pull-refresh"]') ||
                            window.pageYOffset < 0;
      
      this.logResult('下拉刷新', hasPullRefresh, hasPullRefresh ? '支持下拉刷新' : '不支持下拉刷新');
      
      return true;
    } catch (error) {
      this.logResult('移动端手势', false, error.message);
      return false;
    }
  }

  // 测试移动端性能
  async testMobilePerformance() {
    console.log('⚡ 测试移动端性能...');
    
    try {
      const startTime = performance.now();
      
      // 测试滚动性能
      let frameCount = 0;
      const startScrollTime = performance.now();
      
      const scrollTest = () => {
        frameCount++;
        if (performance.now() - startScrollTime < 1000) {
          requestAnimationFrame(scrollTest);
        }
      };
      
      // 开始滚动测试
      window.scrollBy(0, 10);
      requestAnimationFrame(scrollTest);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fps = frameCount;
      const isSmoothScrolling = fps >= 30; // 30fps以上认为流畅
      
      this.logResult('滚动性能', isSmoothScrolling, `${fps} FPS`);
      
      // 测试图片懒加载
      const images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
      const hasLazyLoading = images.length > 0;
      
      this.logResult('懒加载', hasLazyLoading, hasLazyLoading ? `${images.length}个懒加载图片` : '无懒加载');
      
      // 测试内存使用
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        const isMobileOptimized = memoryUsage < 50; // 移动端内存使用应该更少
        
        this.logResult('移动端内存', isMobileOptimized, `${Math.round(memoryUsage)}MB`);
      }
      
      return isSmoothScrolling;
    } catch (error) {
      this.logResult('移动端性能', false, error.message);
      return false;
    }
  }

  // 记录测试结果
  logResult(testName, passed, details) {
    const result = {
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}: ${details}`);
  }

  // 运行所有移动端测试
  async runAllTests() {
    console.log('📱 开始移动端专项测试\n');
    
    if (!this.isMobile) {
      console.log('⚠️ 当前不是移动端环境，某些测试可能不准确');
    }
    
    await this.testMobileSidebar();
    await this.testTouchScroll();
    await this.testMobileModal();
    await this.testMobileSearch();
    await this.testMobileGestures();
    await this.testMobilePerformance();
    
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 移动端测试报告');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`通过: ${passed}/${total} (${passRate}%)`);
    
    // 显示失败的测试
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ 失败的测试:');
      failedTests.forEach(test => {
        console.log(`  • ${test.test}: ${test.details}`);
      });
    }
    
    // 显示成功的测试
    const passedTests = this.results.filter(r => r.passed);
    if (passedTests.length > 0) {
      console.log('\n✅ 通过的测试:');
      passedTests.forEach(test => {
        console.log(`  • ${test.test}: ${test.details}`);
      });
    }
    
    console.log(`\n📈 移动端适配状态: ${passRate >= 80 ? '✅ 优秀' : passRate >= 60 ? '⚠️ 良好' : '❌ 需要改进'}`);
    
    return {
      passed,
      total,
      passRate,
      results: this.results
    };
  }
}

// 浏览器环境下的测试执行器
if (typeof window !== 'undefined') {
  window.MobileTestRunner = MobileTestRunner;
  
  // 自动运行移动端测试的函数
  window.runMobileTests = async function() {
    const testRunner = new MobileTestRunner();
    return await testRunner.runAllTests();
  };
  
  console.log('📱 移动端测试工具已加载');
  console.log('💡 使用方法: 在移动端浏览器控制台中运行 runMobileTests()');
}

// Node.js环境下的导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileTestRunner;
}
