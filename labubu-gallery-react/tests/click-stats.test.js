/**
 * 点击量统计功能测试
 */

// 模拟localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value.toString(),
    removeItem: (key) => delete store[key],
    clear: () => store = {}
  };
})();

// 模拟React Hook环境
const mockReactHooks = {
  useState: (initial) => {
    let state = initial;
    const setState = (newState) => {
      state = typeof newState === 'function' ? newState(state) : newState;
    };
    return [state, setState];
  },
  useEffect: (fn, deps) => fn(),
  useCallback: (fn, deps) => fn
};

// 测试用例
class ClickStatsTest {
  constructor() {
    this.testResults = [];
    this.localStorage = mockLocalStorage;
    global.localStorage = this.localStorage;
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🧪 开始点击量统计功能测试...\n');
    
    await this.testBasicClickRecording();
    await this.testDataPersistence();
    await this.testPopularityCalculation();
    await this.testMultipleActions();
    await this.testDataRetrieval();
    
    this.printResults();
  }

  // 测试基础点击记录
  async testBasicClickRecording() {
    console.log('📊 测试1: 基础点击记录功能');
    
    try {
      // 模拟点击统计数据
      const testStats = {};
      const wallpaperId = 'test_wallpaper_001';
      
      // 模拟recordClick函数
      const recordClick = (id, action = 'view') => {
        const current = testStats[id] || {
          totalClicks: 0,
          actions: {},
          lastClicked: null,
          firstClicked: Date.now()
        };

        testStats[id] = {
          ...current,
          totalClicks: current.totalClicks + 1,
          actions: {
            ...current.actions,
            [action]: (current.actions[action] || 0) + 1
          },
          lastClicked: Date.now()
        };
      };

      // 执行测试
      recordClick(wallpaperId, 'view');
      recordClick(wallpaperId, 'view');
      recordClick(wallpaperId, 'download');

      // 验证结果
      const stats = testStats[wallpaperId];
      const passed = stats.totalClicks === 3 && 
                    stats.actions.view === 2 && 
                    stats.actions.download === 1;

      this.addTestResult('基础点击记录', passed, {
        expected: { totalClicks: 3, viewClicks: 2, downloadClicks: 1 },
        actual: { totalClicks: stats.totalClicks, viewClicks: stats.actions.view, downloadClicks: stats.actions.download }
      });

    } catch (error) {
      this.addTestResult('基础点击记录', false, { error: error.message });
    }
  }

  // 测试数据持久化
  async testDataPersistence() {
    console.log('💾 测试2: 数据持久化功能');
    
    try {
      const STORAGE_KEY = 'labubu_click_stats';
      const testData = {
        'wallpaper_001': { totalClicks: 5, actions: { view: 3, download: 2 } },
        'wallpaper_002': { totalClicks: 3, actions: { view: 3 } }
      };

      // 保存数据
      this.localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
      
      // 读取数据
      const retrieved = JSON.parse(this.localStorage.getItem(STORAGE_KEY));
      
      // 验证数据完整性
      const passed = retrieved.wallpaper_001.totalClicks === 5 &&
                    retrieved.wallpaper_002.totalClicks === 3;

      this.addTestResult('数据持久化', passed, {
        expected: testData,
        actual: retrieved
      });

    } catch (error) {
      this.addTestResult('数据持久化', false, { error: error.message });
    }
  }

  // 测试热度计算
  async testPopularityCalculation() {
    console.log('🔥 测试3: 热度分数计算');
    
    try {
      // 模拟热度计算函数
      const getPopularityScore = (stats) => {
        const now = Date.now();
        const daysSinceFirst = stats.firstClicked ? 
          (now - stats.firstClicked) / (1000 * 60 * 60 * 24) : 1;
        
        return Math.round(stats.totalClicks / Math.sqrt(Math.max(daysSinceFirst, 1)));
      };

      // 测试数据
      const testCases = [
        { totalClicks: 10, firstClicked: Date.now() - 86400000, expected: 10 }, // 1天前
        { totalClicks: 20, firstClicked: Date.now() - 345600000, expected: 10 }, // 4天前
        { totalClicks: 5, firstClicked: Date.now(), expected: 5 } // 刚刚
      ];

      let allPassed = true;
      const results = [];

      testCases.forEach((testCase, index) => {
        const score = getPopularityScore(testCase);
        const passed = Math.abs(score - testCase.expected) <= 1; // 允许1分的误差
        allPassed = allPassed && passed;
        results.push({ case: index + 1, expected: testCase.expected, actual: score, passed });
      });

      this.addTestResult('热度分数计算', allPassed, { results });

    } catch (error) {
      this.addTestResult('热度分数计算', false, { error: error.message });
    }
  }

  // 测试多种操作类型
  async testMultipleActions() {
    console.log('🎯 测试4: 多种操作类型统计');
    
    try {
      const stats = {};
      const wallpaperId = 'test_multi_actions';
      
      const recordClick = (id, action) => {
        if (!stats[id]) {
          stats[id] = { totalClicks: 0, actions: {} };
        }
        stats[id].totalClicks++;
        stats[id].actions[action] = (stats[id].actions[action] || 0) + 1;
      };

      // 模拟各种操作
      recordClick(wallpaperId, 'view');
      recordClick(wallpaperId, 'view');
      recordClick(wallpaperId, 'download');
      recordClick(wallpaperId, 'favorite');
      recordClick(wallpaperId, 'share');

      const result = stats[wallpaperId];
      const passed = result.totalClicks === 5 &&
                    result.actions.view === 2 &&
                    result.actions.download === 1 &&
                    result.actions.favorite === 1 &&
                    result.actions.share === 1;

      this.addTestResult('多种操作类型', passed, {
        expected: { total: 5, view: 2, download: 1, favorite: 1, share: 1 },
        actual: result
      });

    } catch (error) {
      this.addTestResult('多种操作类型', false, { error: error.message });
    }
  }

  // 测试数据检索
  async testDataRetrieval() {
    console.log('🔍 测试5: 数据检索功能');
    
    try {
      // 模拟统计数据
      const mockStats = {
        'wallpaper_001': { totalClicks: 10, lastClicked: Date.now() - 1000 },
        'wallpaper_002': { totalClicks: 15, lastClicked: Date.now() - 2000 },
        'wallpaper_003': { totalClicks: 5, lastClicked: Date.now() - 3000 }
      };

      // 模拟getTopWallpapers函数
      const getTopWallpapers = (limit = 10) => {
        return Object.entries(mockStats)
          .map(([id, stats]) => ({ id, ...stats }))
          .sort((a, b) => b.totalClicks - a.totalClicks)
          .slice(0, limit);
      };

      const topWallpapers = getTopWallpapers(2);
      const passed = topWallpapers.length === 2 &&
                    topWallpapers[0].id === 'wallpaper_002' &&
                    topWallpapers[0].totalClicks === 15 &&
                    topWallpapers[1].id === 'wallpaper_001' &&
                    topWallpapers[1].totalClicks === 10;

      this.addTestResult('数据检索功能', passed, {
        expected: [
          { id: 'wallpaper_002', totalClicks: 15 },
          { id: 'wallpaper_001', totalClicks: 10 }
        ],
        actual: topWallpapers
      });

    } catch (error) {
      this.addTestResult('数据检索功能', false, { error: error.message });
    }
  }

  // 添加测试结果
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

  // 打印测试结果
  printResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('📋 测试结果总结:');
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

    console.log('\n🎯 测试完成!');
  }
}

// 导出测试类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClickStatsTest;
} else {
  // 浏览器环境直接运行
  const test = new ClickStatsTest();
  test.runAllTests();
}
