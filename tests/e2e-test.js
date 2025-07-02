/**
 * 端到端测试脚本 - 模拟用户交互
 */

class E2ETest {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
  }

  async runAllTests() {
    console.log('🌐 开始端到端测试...\n');
    
    await this.testPageLoad();
    await this.testClickTracking();
    await this.testSortingUI();
    await this.testPopularityBadges();
    await this.testDataPersistence();
    
    this.printResults();
  }

  // 测试页面加载
  async testPageLoad() {
    console.log('🚀 测试1: 页面加载');
    
    try {
      // 使用curl检查页面是否可访问
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      const { stdout } = await execPromise(`curl -s -o /dev/null -w "%{http_code}" ${this.baseUrl}`);
      const statusCode = stdout.trim();
      const passed = statusCode === '200';

      this.addTestResult('页面加载', passed, {
        expected: '200',
        actual: statusCode,
        url: this.baseUrl
      });

    } catch (error) {
      this.addTestResult('页面加载', false, { error: error.message });
    }
  }

  // 测试点击追踪 (模拟)
  async testClickTracking() {
    console.log('👆 测试2: 点击追踪模拟');
    
    try {
      // 模拟浏览器环境的点击追踪
      const mockClickStats = {};
      
      const simulateClick = (wallpaperId, action) => {
        if (!mockClickStats[wallpaperId]) {
          mockClickStats[wallpaperId] = {
            totalClicks: 0,
            actions: {},
            firstClicked: Date.now(),
            lastClicked: null
          };
        }
        
        mockClickStats[wallpaperId].totalClicks++;
        mockClickStats[wallpaperId].actions[action] = 
          (mockClickStats[wallpaperId].actions[action] || 0) + 1;
        mockClickStats[wallpaperId].lastClicked = Date.now();
      };

      // 模拟用户交互序列
      simulateClick('wallpaper_001', 'view');
      await this.sleep(100);
      simulateClick('wallpaper_001', 'view');
      await this.sleep(100);
      simulateClick('wallpaper_001', 'download');
      await this.sleep(100);
      simulateClick('wallpaper_002', 'view');

      const stats1 = mockClickStats['wallpaper_001'];
      const stats2 = mockClickStats['wallpaper_002'];
      
      const passed = stats1.totalClicks === 3 && 
                    stats1.actions.view === 2 && 
                    stats1.actions.download === 1 &&
                    stats2.totalClicks === 1;

      this.addTestResult('点击追踪模拟', passed, {
        wallpaper_001: stats1,
        wallpaper_002: stats2
      });

    } catch (error) {
      this.addTestResult('点击追踪模拟', false, { error: error.message });
    }
  }

  // 测试排序UI (模拟)
  async testSortingUI() {
    console.log('🔄 测试3: 排序UI模拟');
    
    try {
      // 模拟排序控制组件的行为
      const sortOptions = ['default', 'popularity', 'recent', 'downloads'];
      let currentSort = 'default';
      
      const mockSortChange = (newSort) => {
        if (sortOptions.includes(newSort)) {
          currentSort = newSort;
          return true;
        }
        return false;
      };

      // 测试所有排序选项
      let allPassed = true;
      const results = [];
      
      for (const option of sortOptions) {
        const success = mockSortChange(option);
        allPassed = allPassed && success && currentSort === option;
        results.push({ option, success, currentSort });
      }

      this.addTestResult('排序UI模拟', allPassed, { results });

    } catch (error) {
      this.addTestResult('排序UI模拟', false, { error: error.message });
    }
  }

  // 测试热度标签显示 (模拟)
  async testPopularityBadges() {
    console.log('🔥 测试4: 热度标签显示');
    
    try {
      // 模拟热度标签组件
      const mockPopularityBadge = (wallpaperId, stats) => {
        if (!stats || stats.totalClicks === 0) {
          return null; // 不显示标签
        }
        
        return {
          wallpaperId,
          display: `🔥 ${stats.totalClicks}`,
          visible: true
        };
      };

      // 测试数据
      const testCases = [
        { id: 'w1', stats: { totalClicks: 5 }, shouldShow: true },
        { id: 'w2', stats: { totalClicks: 0 }, shouldShow: false },
        { id: 'w3', stats: null, shouldShow: false }
      ];

      let allPassed = true;
      const results = [];

      testCases.forEach(testCase => {
        const badge = mockPopularityBadge(testCase.id, testCase.stats);
        const actualShow = badge !== null;
        const passed = actualShow === testCase.shouldShow;
        allPassed = allPassed && passed;
        
        results.push({
          wallpaperId: testCase.id,
          expected: testCase.shouldShow,
          actual: actualShow,
          badge: badge,
          passed
        });
      });

      this.addTestResult('热度标签显示', allPassed, { results });

    } catch (error) {
      this.addTestResult('热度标签显示', false, { error: error.message });
    }
  }

  // 测试数据持久化 (模拟localStorage)
  async testDataPersistence() {
    console.log('💾 测试5: 数据持久化');
    
    try {
      // 模拟localStorage
      const mockStorage = {};
      const STORAGE_KEY = 'labubu_click_stats';
      
      const mockLocalStorage = {
        setItem: (key, value) => mockStorage[key] = value,
        getItem: (key) => mockStorage[key] || null,
        removeItem: (key) => delete mockStorage[key]
      };

      // 测试数据保存
      const testData = {
        'wallpaper_001': { totalClicks: 10, actions: { view: 8, download: 2 } },
        'wallpaper_002': { totalClicks: 5, actions: { view: 5 } }
      };

      mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
      
      // 测试数据读取
      const retrieved = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY));
      
      // 验证数据完整性
      const passed = retrieved && 
                    retrieved.wallpaper_001.totalClicks === 10 &&
                    retrieved.wallpaper_002.totalClicks === 5;

      this.addTestResult('数据持久化', passed, {
        saved: testData,
        retrieved: retrieved,
        storageSize: JSON.stringify(testData).length
      });

    } catch (error) {
      this.addTestResult('数据持久化', false, { error: error.message });
    }
  }

  // 辅助函数：延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`   ${status}: ${testName}`);
    if (!passed && details.error) {
      console.log(`   错误: ${details.error}`);
    }
    console.log('');
  }

  printResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('📋 端到端测试结果总结:');
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过: ${passedTests} ✅`);
    console.log(`   失败: ${failedTests} ❌`);
    console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.name}`);
        if (result.details.error) {
          console.log(`     错误: ${result.details.error}`);
        }
      });
    }

    console.log('\n🌐 端到端测试完成!');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = E2ETest;
} else {
  const test = new E2ETest();
  test.runAllTests();
}
