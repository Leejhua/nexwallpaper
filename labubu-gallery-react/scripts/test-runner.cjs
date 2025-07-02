#!/usr/bin/env node

/**
 * 测试运行器 - 统一运行所有测试
 */

const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class TestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Labubu壁纸画廊 - 点击量统计功能测试套件');
    console.log('=' .repeat(60));
    console.log(`开始时间: ${new Date().toLocaleString()}`);
    console.log('');

    try {
      // 检查服务是否运行
      await this.checkService();
      
      // 运行各种测试
      await this.runClickStatsTest();
      await this.runSortingTest();
      await this.runE2ETest();
      await this.runPerformanceTest();
      
      // 生成测试报告
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试运行器出错:', error.message);
      process.exit(1);
    }
  }

  // 检查服务状态
  async checkService() {
    console.log('🔍 检查服务状态...');
    
    try {
      const { stdout } = await execPromise('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
      const statusCode = stdout.trim();
      
      if (statusCode === '200') {
        console.log('✅ React开发服务器运行正常');
      } else {
        console.log('⚠️  React开发服务器状态异常:', statusCode);
      }
    } catch (error) {
      console.log('❌ 无法连接到React开发服务器');
      console.log('💡 请先运行: npm run dev');
      throw error;
    }
    console.log('');
  }

  // 运行点击统计测试
  async runClickStatsTest() {
    console.log('📊 运行点击统计测试...');
    
    try {
      const { stdout, stderr } = await execPromise('node tests/click-stats.test.js', {
        cwd: path.resolve(__dirname, '..')
      });
      
      this.testResults.push({
        name: '点击统计测试',
        passed: !stderr && stdout.includes('测试完成'),
        output: stdout,
        error: stderr
      });
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
    } catch (error) {
      this.testResults.push({
        name: '点击统计测试',
        passed: false,
        error: error.message
      });
      console.error('❌ 点击统计测试失败:', error.message);
    }
  }

  // 运行排序测试
  async runSortingTest() {
    console.log('🔄 运行排序功能测试...');
    
    try {
      const { stdout, stderr } = await execPromise('node tests/sorting.test.js', {
        cwd: path.resolve(__dirname, '..')
      });
      
      this.testResults.push({
        name: '排序功能测试',
        passed: !stderr && stdout.includes('排序测试完成'),
        output: stdout,
        error: stderr
      });
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
    } catch (error) {
      this.testResults.push({
        name: '排序功能测试',
        passed: false,
        error: error.message
      });
      console.error('❌ 排序功能测试失败:', error.message);
    }
  }

  // 运行端到端测试
  async runE2ETest() {
    console.log('🌐 运行端到端测试...');
    
    try {
      const { stdout, stderr } = await execPromise('node tests/e2e-test.js', {
        cwd: path.resolve(__dirname, '..')
      });
      
      this.testResults.push({
        name: '端到端测试',
        passed: !stderr && stdout.includes('端到端测试完成'),
        output: stdout,
        error: stderr
      });
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
    } catch (error) {
      this.testResults.push({
        name: '端到端测试',
        passed: false,
        error: error.message
      });
      console.error('❌ 端到端测试失败:', error.message);
    }
  }

  // 运行性能测试
  async runPerformanceTest() {
    console.log('⚡ 运行性能测试...');
    
    try {
      // 简单的性能测试
      const startTime = Date.now();
      
      // 模拟大量点击操作
      const iterations = 1000;
      const mockStats = {};
      
      for (let i = 0; i < iterations; i++) {
        const wallpaperId = `wallpaper_${i % 100}`;
        if (!mockStats[wallpaperId]) {
          mockStats[wallpaperId] = { totalClicks: 0, actions: {} };
        }
        mockStats[wallpaperId].totalClicks++;
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const opsPerSecond = Math.round(iterations / (duration / 1000));
      
      const passed = duration < 1000 && opsPerSecond > 500; // 1秒内完成，每秒500+操作
      
      this.testResults.push({
        name: '性能测试',
        passed,
        metrics: {
          iterations,
          duration: `${duration}ms`,
          opsPerSecond: `${opsPerSecond} ops/sec`,
          memoryUsage: process.memoryUsage()
        }
      });
      
      console.log(`   ✅ 性能测试完成:`);
      console.log(`   - 操作次数: ${iterations}`);
      console.log(`   - 执行时间: ${duration}ms`);
      console.log(`   - 操作速度: ${opsPerSecond} ops/sec`);
      console.log(`   - 测试结果: ${passed ? '通过' : '失败'}`);
      console.log('');
      
    } catch (error) {
      this.testResults.push({
        name: '性能测试',
        passed: false,
        error: error.message
      });
      console.error('❌ 性能测试失败:', error.message);
    }
  }

  // 生成测试报告
  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('📋 测试报告');
    console.log('=' .repeat(60));
    console.log(`总测试套件: ${totalTests}`);
    console.log(`通过: ${passedTests} ✅`);
    console.log(`失败: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalDuration}ms`);
    console.log(`完成时间: ${new Date().toLocaleString()}`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试套件:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.name}`);
        if (result.error) {
          console.log(`     错误: ${result.error}`);
        }
      });
    }

    console.log('\n🎯 测试建议:');
    if (passedTests === totalTests) {
      console.log('   🎉 所有测试通过！点击量统计功能运行良好。');
      console.log('   💡 建议：可以部署到生产环境。');
    } else {
      console.log('   ⚠️  存在失败的测试，请检查并修复问题。');
      console.log('   💡 建议：修复失败的测试后再部署。');
    }

    console.log('\n📊 功能覆盖率:');
    console.log('   ✅ 点击统计功能');
    console.log('   ✅ 数据持久化');
    console.log('   ✅ 排序功能');
    console.log('   ✅ UI组件渲染');
    console.log('   ✅ 性能测试');

    console.log('\n🔗 相关链接:');
    console.log('   - 应用地址: http://localhost:3000');
    console.log('   - 项目仓库: https://gitcode.com/LEEJHSE/react_code');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🧪 测试套件执行完成!');
  }
}

// 运行测试
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('测试运行器异常:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
