#!/usr/bin/env node

/*
  预计算脚本: 一次性分析视频生成光束数据
  运行: npm run precompute-beam
*/

import { precomputeBeamData } from '../src/utils/precomputeBeam.js';

async function main() {
  try {
    console.log('🚀 开始预计算 Labubu 手电筒光束数据...\n');
    
    const result = await precomputeBeamData();
    
    console.log('\n🎉 预计算完成！');
    console.log('现在用户可以快速使用编辑器，无需等待视频分析。');
    
  } catch (error) {
    console.error('❌ 预计算失败:', error.message);
    process.exit(1);
  }
}

main(); 