/*
  梯形光束生成器
  ================
  根据标注坐标文件生成梯形光束图像
  
  光束特点：
  - 梯形形状，短边（底边）为光源位置
  - 从左右两侧透明度逐渐变强
  - 中心部分透明，模拟手电筒光束效果
  - 两侧有柔和的白光扩散效果
*/

const fs = require('fs');
const path = require('path');
const { createCanvas, createImageData } = require('canvas');

// 读取梯形坐标数据
function loadBeamData() {
  try {
    const beamDataPath = path.join(__dirname, 'public', 'beam-data.json');
    const data = fs.readFileSync(beamDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 无法读取梯形坐标数据:', error);
    // 使用默认数据
    return {
      polygon: [
        { x: 165, y: 11 },
        { x: 1071, y: 11 },
        { x: 502, y: 1310 },
        { x: 422, y: 1304 }
      ],
      width: 1080,
      height: 1920
    };
  }
}

// 判断点是否在多边形内部（射线法）
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// 计算点到多边形边界的最短距离
function distanceToPolygonEdge(x, y, polygon) {
  let minDistance = Infinity;
  
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    // 计算点到线段的距离
    const A = x - p1.x;
    const B = y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

// 计算梯形的左右边界距离（用于左右渐变效果）
function calculateHorizontalGradient(x, y, polygon) {
  // 找到梯形的左右边界
  const topLeft = polygon[0];
  const topRight = polygon[1];
  const bottomRight = polygon[2];
  const bottomLeft = polygon[3];
  
  // 计算当前y坐标对应的左右边界x坐标
  const leftX = topLeft.x + (bottomLeft.x - topLeft.x) * (y - topLeft.y) / (bottomLeft.y - topLeft.y);
  const rightX = topRight.x + (bottomRight.x - topRight.x) * (y - topRight.y) / (bottomRight.y - topRight.y);
  
  // 计算到左右边界的距离
  const distToLeft = Math.abs(x - leftX);
  const distToRight = Math.abs(x - rightX);
  const width = rightX - leftX;
  
  // 返回归一化的距离（0-1），越靠近边界值越大
  const normalizedDistToLeft = distToLeft / (width / 2);
  const normalizedDistToRight = distToRight / (width / 2);
  
  // 取较小值，表示到最近边界的距离
  return Math.min(normalizedDistToLeft, normalizedDistToRight);
}

// 生成梯形光束图像
function generateTrapezoidBeam(beamData, options = {}) {
  const {
    width,
    height,
    polygon
  } = beamData;
  
  const {
    maxOpacity = 0.8,        // 最大不透明度
    edgeFeather = 50,        // 边缘羽化距离
    centerTransparency = 0.1, // 中心透明度
    glowIntensity = 0.6,     // 发光强度
    outputPath = './trapezoid_beam_generated.png'
  } = options;
  
  console.log('🎨 开始生成梯形光束图像...');
  console.log(`📐 画布尺寸: ${width}x${height}`);
  console.log(`🔺 梯形坐标:`, polygon);
  
  // 创建画布
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 创建图像数据
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  // 遍历每个像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // 检查是否在梯形内部
      const isInside = isPointInPolygon(x, y, polygon);
      
      if (isInside) {
        // 计算到边界的距离
        const distToEdge = distanceToPolygonEdge(x, y, polygon);
        
        // 计算水平渐变（左右边界效果）
        const horizontalGradient = calculateHorizontalGradient(x, y, polygon);
        
        // 边缘羽化效果
        const edgeFactor = Math.min(1, distToEdge / edgeFeather);
        
        // 组合效果：
        // 1. 中心透明，边缘不透明（水平渐变）
        // 2. 边缘羽化
        // 3. 整体发光效果
        
        // 水平渐变：越靠近左右边界，不透明度越高
        const horizontalAlpha = horizontalGradient * maxOpacity;
        
        // 边缘羽化：越靠近边界，不透明度越低
        const edgeAlpha = edgeFactor;
        
        // 中心透明效果：距离中心越远，不透明度越高
        const centerAlpha = Math.max(centerTransparency, horizontalAlpha);
        
        // 最终透明度
        const finalAlpha = centerAlpha * edgeAlpha * glowIntensity;
        
        // 设置像素颜色（白色光束）
        data[index] = 255;     // R
        data[index + 1] = 255; // G
        data[index + 2] = 255; // B
        data[index + 3] = Math.round(finalAlpha * 255); // A
      } else {
        // 梯形外部完全透明
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 0;
      }
    }
    
    // 显示进度
    if (y % 100 === 0) {
      const progress = ((y / height) * 100).toFixed(1);
      console.log(`📊 生成进度: ${progress}%`);
    }
  }
  
  // 将图像数据绘制到画布
  ctx.putImageData(imageData, 0, 0);
  
  // 保存为PNG文件
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log('✅ 梯形光束图像生成完成！');
  console.log(`💾 已保存到: ${outputPath}`);
  
  return {
    width,
    height,
    outputPath,
    polygon
  };
}

// 生成多种光束效果
function generateMultipleBeamEffects(beamData) {
  console.log('🌟 生成多种光束效果...');
  
  const effects = [
    {
      name: 'soft',
      options: {
        maxOpacity: 0.6,
        edgeFeather: 80,
        centerTransparency: 0.05,
        glowIntensity: 0.5,
        outputPath: './trapezoid_beam_soft.png'
      }
    },
    {
      name: 'bright',
      options: {
        maxOpacity: 0.9,
        edgeFeather: 30,
        centerTransparency: 0.2,
        glowIntensity: 0.8,
        outputPath: './trapezoid_beam_bright.png'
      }
    },
    {
      name: 'default',
      options: {
        maxOpacity: 0.7,
        edgeFeather: 50,
        centerTransparency: 0.1,
        glowIntensity: 0.6,
        outputPath: './trapezoid_beam_default.png'
      }
    }
  ];
  
  const results = [];
  
  for (const effect of effects) {
    console.log(`\n🎨 生成 ${effect.name} 效果...`);
    const result = generateTrapezoidBeam(beamData, effect.options);
    results.push({
      name: effect.name,
      ...result
    });
  }
  
  return results;
}

// 主函数
function main() {
  console.log('🚀 梯形光束生成器启动...');
  
  try {
    // 加载梯形坐标数据
    const beamData = loadBeamData();
    
    // 生成多种光束效果
    const results = generateMultipleBeamEffects(beamData);
    
    console.log('\n🎉 所有光束效果生成完成！');
    console.log('📁 生成的文件:');
    results.forEach(result => {
      console.log(`   - ${result.name}: ${result.outputPath}`);
    });
    
    // 生成配置文件
    const config = {
      beamData,
      effects: results,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    fs.writeFileSync('./beam-generation-config.json', JSON.stringify(config, null, 2));
    console.log('📋 配置文件已保存: beam-generation-config.json');
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  loadBeamData,
  generateTrapezoidBeam,
  generateMultipleBeamEffects
};