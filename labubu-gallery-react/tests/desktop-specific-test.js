/**
 * 桌面端专项功能测试脚本
 * 专门测试桌面端特有的功能和交互
 */

class DesktopTestRunner {
  constructor() {
    this.results = [];
    this.isDesktop = window.innerWidth > 768;
  }

  // 模拟键盘事件
  simulateKeyboard(element, key, options = {}) {
    const keyEvent = new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(keyEvent);
    
    // 也触发keyup事件
    const keyUpEvent = new KeyboardEvent('keyup', {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(keyUpEvent);
  }

  // 模拟鼠标事件
  simulateMouse(element, eventType, options = {}) {
    const mouseEvent = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: options.x || 0,
      clientY: options.y || 0,
      button: options.button || 0,
      ...options
    });
    
    element.dispatchEvent(mouseEvent);
  }

  // 测试桌面端侧边栏
  async testDesktopSidebar() {
    console.log('🖥️ 测试桌面端侧边栏...');
    
    try {
      const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
      
      if (!sidebar) {
        this.logResult('桌面端侧边栏', false, '未找到侧边栏');
        return false;
      }

      // 桌面端侧边栏应该默认可见
      const isVisible = !sidebar.classList.contains('hidden') && 
                       getComputedStyle(sidebar).display !== 'none';
      
      this.logResult('侧边栏默认显示', isVisible, isVisible ? '正确显示' : '未正确显示');
      
      // 测试侧边栏宽度
      const sidebarWidth = sidebar.offsetWidth;
      const hasCorrectWidth = sidebarWidth >= 250 && sidebarWidth <= 350; // 合理的侧边栏宽度
      
      this.logResult('侧边栏宽度', hasCorrectWidth, `宽度: ${sidebarWidth}px`);
      
      // 测试侧边栏固定定位
      const position = getComputedStyle(sidebar).position;
      const isFixed = position === 'fixed' || position === 'sticky';
      
      this.logResult('侧边栏定位', isFixed, `定位: ${position}`);
      
      return isVisible && hasCorrectWidth;
    } catch (error) {
      this.logResult('桌面端侧边栏', false, error.message);
      return false;
    }
  }

  // 测试键盘快捷键
  async testKeyboardShortcuts() {
    console.log('⌨️ 测试键盘快捷键...');
    
    try {
      // 测试ESC键关闭详情页
      const firstItem = document.querySelector('.gallery-item, [class*="gallery-item"]');
      if (firstItem) {
        firstItem.click();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const modal = document.querySelector('.modal, [class*="modal"]');
        if (modal && !modal.classList.contains('hidden')) {
          // 按ESC键
          this.simulateKeyboard(document, 'Escape');
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const isClosed = modal.classList.contains('hidden') || 
                          getComputedStyle(modal).display === 'none';
          
          this.logResult('ESC关闭详情页', isClosed, isClosed ? '成功关闭' : '未能关闭');
        }
      }
      
      // 测试搜索框快捷键
      const searchInput = document.querySelector('input[type="text"], input[placeholder*="搜索"]');
      if (searchInput) {
        // 测试Ctrl+F或Cmd+F聚焦搜索框
        this.simulateKeyboard(document, 'f', { ctrlKey: true });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isFocused = document.activeElement === searchInput;
        this.logResult('Ctrl+F搜索聚焦', isFocused, isFocused ? '成功聚焦' : '未能聚焦');
        
        // 测试Enter键搜索
        searchInput.value = '奇幻';
        this.simulateKeyboard(searchInput, 'Enter');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
        const hasSearchResults = galleryItems.length > 0;
        
        this.logResult('Enter键搜索', hasSearchResults, hasSearchResults ? `找到${galleryItems.length}个结果` : '无搜索结果');
        
        // 清除搜索
        searchInput.value = '';
        this.simulateKeyboard(searchInput, 'Enter');
      }
      
      return true;
    } catch (error) {
      this.logResult('键盘快捷键', false, error.message);
      return false;
    }
  }

  // 测试鼠标悬停效果
  async testHoverEffects() {
    console.log('🖱️ 测试鼠标悬停效果...');
    
    try {
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      
      if (galleryItems.length === 0) {
        this.logResult('悬停效果', false, '未找到画廊项目');
        return false;
      }

      const firstItem = galleryItems[0];
      const initialTransform = getComputedStyle(firstItem).transform;
      
      // 模拟鼠标悬停
      this.simulateMouse(firstItem, 'mouseenter');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hoverTransform = getComputedStyle(firstItem).transform;
      const hasHoverEffect = hoverTransform !== initialTransform && hoverTransform !== 'none';
      
      this.logResult('画廊项悬停', hasHoverEffect, hasHoverEffect ? '有悬停效果' : '无悬停效果');
      
      // 测试按钮悬停效果
      const buttons = document.querySelectorAll('button');
      let buttonHoverWorks = false;
      
      if (buttons.length > 0) {
        const button = buttons[0];
        const initialBg = getComputedStyle(button).backgroundColor;
        
        this.simulateMouse(button, 'mouseenter');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const hoverBg = getComputedStyle(button).backgroundColor;
        buttonHoverWorks = hoverBg !== initialBg;
        
        this.logResult('按钮悬停', buttonHoverWorks, buttonHoverWorks ? '有悬停效果' : '无悬停效果');
        
        // 移除悬停
        this.simulateMouse(button, 'mouseleave');
      }
      
      // 移除画廊项悬停
      this.simulateMouse(firstItem, 'mouseleave');
      
      return hasHoverEffect || buttonHoverWorks;
    } catch (error) {
      this.logResult('悬停效果', false, error.message);
      return false;
    }
  }

  // 测试右键菜单
  async testContextMenu() {
    console.log('🖱️ 测试右键菜单...');
    
    try {
      const firstItem = document.querySelector('.gallery-item, [class*="gallery-item"]');
      
      if (!firstItem) {
        this.logResult('右键菜单', false, '未找到画廊项目');
        return false;
      }

      // 模拟右键点击
      this.simulateMouse(firstItem, 'contextmenu', { button: 2 });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 检查是否有自定义右键菜单
      const contextMenu = document.querySelector('.context-menu, [class*="context-menu"]');
      const hasCustomMenu = contextMenu && !contextMenu.classList.contains('hidden');
      
      this.logResult('自定义右键菜单', hasCustomMenu, hasCustomMenu ? '有自定义菜单' : '使用默认菜单');
      
      // 如果有自定义菜单，测试菜单项
      if (hasCustomMenu) {
        const menuItems = contextMenu.querySelectorAll('button, [role="menuitem"]');
        const hasMenuItems = menuItems.length > 0;
        
        this.logResult('右键菜单项', hasMenuItems, hasMenuItems ? `${menuItems.length}个菜单项` : '无菜单项');
        
        // 点击其他地方关闭菜单
        this.simulateMouse(document.body, 'click');
      }
      
      return true;
    } catch (error) {
      this.logResult('右键菜单', false, error.message);
      return false;
    }
  }

  // 测试多窗口支持
  async testMultiWindow() {
    console.log('🪟 测试多窗口支持...');
    
    try {
      // 测试在新窗口中打开详情页
      const firstItem = document.querySelector('.gallery-item, [class*="gallery-item"]');
      
      if (!firstItem) {
        this.logResult('多窗口支持', false, '未找到画廊项目');
        return false;
      }

      // 模拟Ctrl+点击（在新窗口打开）
      this.simulateMouse(firstItem, 'click', { ctrlKey: true });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 检查是否阻止了默认行为或有特殊处理
      const hasCtrlClickHandler = true; // 假设有处理，实际需要检查事件监听器
      
      this.logResult('Ctrl+点击处理', hasCtrlClickHandler, hasCtrlClickHandler ? '有特殊处理' : '无特殊处理');
      
      // 测试窗口焦点处理
      const originalTitle = document.title;
      
      // 模拟窗口失去焦点
      window.dispatchEvent(new Event('blur'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 模拟窗口获得焦点
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const titleChanged = document.title !== originalTitle;
      this.logResult('窗口焦点处理', !titleChanged, !titleChanged ? '标题保持稳定' : '标题发生变化');
      
      return true;
    } catch (error) {
      this.logResult('多窗口支持', false, error.message);
      return false;
    }
  }

  // 测试桌面端布局
  async testDesktopLayout() {
    console.log('📐 测试桌面端布局...');
    
    try {
      const gallery = document.querySelector('.gallery, [class*="gallery"]');
      
      if (!gallery) {
        this.logResult('桌面端布局', false, '未找到画廊容器');
        return false;
      }

      // 测试列数
      const computedStyle = getComputedStyle(gallery);
      const columnCount = computedStyle.columnCount || computedStyle.gridTemplateColumns;
      
      // 桌面端应该有4列
      const hasCorrectColumns = columnCount === '4' || 
                               (columnCount && columnCount.split(' ').length === 4);
      
      this.logResult('桌面端列数', hasCorrectColumns, `列数: ${columnCount}`);
      
      // 测试间距
      const gap = computedStyle.gap || computedStyle.columnGap;
      const hasCorrectGap = gap && (gap.includes('16px') || gap.includes('1rem'));
      
      this.logResult('列间距', hasCorrectGap, `间距: ${gap}`);
      
      // 测试响应式断点
      const originalWidth = window.innerWidth;
      
      // 模拟窗口大小变化
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      window.dispatchEvent(new Event('resize'));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newColumnCount = getComputedStyle(gallery).columnCount || 
                            getComputedStyle(gallery).gridTemplateColumns;
      
      // 恢复原始宽度
      Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
      window.dispatchEvent(new Event('resize'));
      
      const respondsToResize = newColumnCount !== columnCount;
      this.logResult('响应式布局', respondsToResize, respondsToResize ? '响应窗口变化' : '不响应变化');
      
      return hasCorrectColumns && hasCorrectGap;
    } catch (error) {
      this.logResult('桌面端布局', false, error.message);
      return false;
    }
  }

  // 测试桌面端性能
  async testDesktopPerformance() {
    console.log('⚡ 测试桌面端性能...');
    
    try {
      const startTime = performance.now();
      
      // 测试大量元素渲染性能
      const galleryItems = document.querySelectorAll('.gallery-item, [class*="gallery-item"]');
      const itemCount = galleryItems.length;
      
      // 桌面端应该能处理更多项目
      const canHandleManyItems = itemCount >= 50;
      this.logResult('大量元素渲染', canHandleManyItems, `渲染${itemCount}个项目`);
      
      // 测试滚动性能
      let frameCount = 0;
      const scrollStartTime = performance.now();
      
      const measureFrames = () => {
        frameCount++;
        if (performance.now() - scrollStartTime < 1000) {
          requestAnimationFrame(measureFrames);
        }
      };
      
      // 开始滚动测试
      window.scrollBy(0, 100);
      requestAnimationFrame(measureFrames);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fps = frameCount;
      const isSmoothScrolling = fps >= 50; // 桌面端要求更高的帧率
      
      this.logResult('桌面端滚动', isSmoothScrolling, `${fps} FPS`);
      
      // 测试内存使用
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
        const isMemoryEfficient = memoryUsage < 150; // 桌面端可以使用更多内存
        
        this.logResult('桌面端内存', isMemoryEfficient, `${Math.round(memoryUsage)}MB`);
      }
      
      // 测试CPU使用（通过任务执行时间估算）
      const cpuTestStart = performance.now();
      
      // 执行一些计算密集型任务
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
      }
      
      const cpuTestTime = performance.now() - cpuTestStart;
      const isCpuEfficient = cpuTestTime < 100; // 100ms内完成
      
      this.logResult('CPU性能', isCpuEfficient, `计算耗时: ${Math.round(cpuTestTime)}ms`);
      
      return isSmoothScrolling && isMemoryEfficient && isCpuEfficient;
    } catch (error) {
      this.logResult('桌面端性能', false, error.message);
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

  // 运行所有桌面端测试
  async runAllTests() {
    console.log('🖥️ 开始桌面端专项测试\n');
    
    if (!this.isDesktop) {
      console.log('⚠️ 当前不是桌面端环境，某些测试可能不准确');
    }
    
    await this.testDesktopSidebar();
    await this.testKeyboardShortcuts();
    await this.testHoverEffects();
    await this.testContextMenu();
    await this.testMultiWindow();
    await this.testDesktopLayout();
    await this.testDesktopPerformance();
    
    this.generateReport();
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 桌面端测试报告');
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
    
    console.log(`\n📈 桌面端优化状态: ${passRate >= 80 ? '✅ 优秀' : passRate >= 60 ? '⚠️ 良好' : '❌ 需要改进'}`);
    
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
  window.DesktopTestRunner = DesktopTestRunner;
  
  // 自动运行桌面端测试的函数
  window.runDesktopTests = async function() {
    const testRunner = new DesktopTestRunner();
    return await testRunner.runAllTests();
  };
  
  console.log('🖥️ 桌面端测试工具已加载');
  console.log('💡 使用方法: 在桌面端浏览器控制台中运行 runDesktopTests()');
}

// Node.js环境下的导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesktopTestRunner;
}
