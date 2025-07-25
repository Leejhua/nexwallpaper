/*
  beamLoader.js
  ------------
  光束数据加载器 - 加载预设的光束数据
*/

const BEAM_DATA_SRC = '/beam-data.json';

export async function loadBeamData() {
  try {
    const response = await fetch(BEAM_DATA_SRC);
    if (!response.ok) {
      throw new Error(`无法加载光束数据: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ 光束数据加载成功:', data);
    return data;
  } catch (error) {
    console.error('❌ 光束数据加载失败:', error);
    // 降级方案：使用默认数据
    return {
      polygon: [
        { x: 486, y: 1200 },
        { x: 450, y: 600 },
        { x: 630, y: 600 },
        { x: 594, y: 1200 }
      ],
      startFrame: 55,
      endFrame: 63,
      width: 1080,
      height: 1920,
      fps: 60,
      method: 'fallback-default',
      version: '1.0.0'
    };
  }
} 