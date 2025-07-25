#!/usr/bin/env node
/*
  intelligent-beam-detection.mjs
  ------------------------------
  使用计算机视觉技术自动检测手电筒光束区域
  基于亮度分析、边缘检测和轮廓提取
*/

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const exec = promisify(execFile);

const VIDEO_SRC = './public/Labubu-White-Suit-Flashlight-iPhone-Dynamic-Lockscreen%2CLabubu-Live-Wallpaper.mov';
const OUTPUT_JSON = './public/beam-data.json';

// 检查ffmpeg路径
let ffmpegPath = 'ffmpeg';
try {
  const ffmpegStatic = await import('ffmpeg-static');
  if (ffmpegStatic.default) {
    ffmpegPath = ffmpegStatic.default;
  }
} catch {
  console.log('使用系统 ffmpeg');
}

// 高斯模糊滤波器
function gaussianBlur(imageData, radius = 2) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  const kernel = createGaussianKernel(radius);
  const kernelSize = kernel.length;
  const half = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;
      
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const idx = (py * width + px) * 4;
          const weight = kernel[ky + half][kx + half];
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
          a += data[idx + 3] * weight;
          weightSum += weight;
        }
      }
      
      const idx = (y * width + x) * 4;
      result[idx] = r / weightSum;
      result[idx + 1] = g / weightSum;
      result[idx + 2] = b / weightSum;
      result[idx + 3] = a / weightSum;
    }
  }
  
  return { data: result, width, height };
}

function createGaussianKernel(radius) {
  const size = radius * 2 + 1;
  const kernel = [];
  const sigma = radius / 3;
  let sum = 0;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[y][x] = value;
      sum += value;
    }
  }
  
  // 归一化
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }
  
  return kernel;
}

// 计算图像的亮度分布和梯度
function analyzeImageBrightness(imageData) {
  const { data, width, height } = imageData;
  const brightness = new Array(width * height);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    brightness[i / 4] = (r + g + b) / 3;
  }
  
  return brightness;
}

// 使用阈值分割找到亮区域
function findBrightRegions(brightness, width, height, threshold = 180) {
  const brightPixels = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (brightness[idx] > threshold) {
        brightPixels.push({ x, y, brightness: brightness[idx] });
      }
    }
  }
  
  return brightPixels;
}

// 计算亮区域的凸包
function computeConvexHull(points) {
  if (points.length < 3) return points;
  
  // Graham扫描算法计算凸包
  points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  
  const lower = [];
  for (const point of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  
  // 移除重复点
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// 将凸包简化为扇形多边形
function simplifyToFanShape(hull, width, height) {
  if (hull.length === 0) {
    return createDefaultFanShape(width, height);
  }
  
  // 找到最低点作为扇形的顶点
  const bottomY = Math.max(...hull.map(p => p.y));
  const bottomPoints = hull.filter(p => Math.abs(p.y - bottomY) < 50);
  const bottomCenter = bottomPoints.reduce((sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }), { x: 0, y: 0 });
  bottomCenter.x /= bottomPoints.length;
  bottomCenter.y /= bottomPoints.length;
  
  // 找到最高的亮点
  const topY = Math.min(...hull.map(p => p.y));
  const topPoints = hull.filter(p => Math.abs(p.y - topY) < 50);
  
  // 计算左右边界
  const leftMost = Math.min(...topPoints.map(p => p.x));
  const rightMost = Math.max(...topPoints.map(p => p.x));
  
  // 创建简化的四边形扇形
  return [
    { x: Math.floor(bottomCenter.x - 50), y: Math.floor(bottomCenter.y) },  // 底部左
    { x: Math.floor(leftMost), y: Math.floor(topY) },                      // 顶部左
    { x: Math.floor(rightMost), y: Math.floor(topY) },                     // 顶部右  
    { x: Math.floor(bottomCenter.x + 50), y: Math.floor(bottomCenter.y) }  // 底部右
  ];
}

function createDefaultFanShape(width, height) {
  return [
    { x: Math.floor(width * 0.45), y: Math.floor(height * 0.85) },
    { x: Math.floor(width * 0.42), y: Math.floor(height * 0.3) },
    { x: Math.floor(width * 0.58), y: Math.floor(height * 0.3) },
    { x: Math.floor(width * 0.55), y: Math.floor(height * 0.85) }
  ];
}

// 智能光束检测主函数
async function intelligentBeamDetection() {
  console.log('🔍 开始智能光束检测...');
  
  // 检查视频文件
  try {
    await fs.access(VIDEO_SRC);
  } catch {
    throw new Error(`视频文件不存在: ${VIDEO_SRC}`);
  }
  
  const tmpDir = './tmp/intelligent-analysis';
  await fs.mkdir(tmpDir, { recursive: true });
  
  try {
    // 获取视频信息
    console.log('📊 解析视频参数...');
    const probeResult = await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-t', '0.1',
      '-f', 'null',
      '-'
    ]).catch(e => e);
    
    const output = probeResult.stderr || '';
    let width = 1080, height = 1920, fps = 60, duration = 1.06;
    
    const resolutionMatch = output.match(/(\d+)x(\d+)/);
    const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
    const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/);
    
    if (resolutionMatch) {
      width = parseInt(resolutionMatch[1]);
      height = parseInt(resolutionMatch[2]);
    }
    if (fpsMatch) {
      fps = parseFloat(fpsMatch[1]);
    }
    if (durationMatch) {
      const [, hours, minutes, seconds, ms] = durationMatch;
      duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms) / 100;
    }
    
    const totalFrames = Math.floor(duration * fps);
    console.log(`📺 视频: ${width}x${height}, ${fps}fps, ${duration}s, ${totalFrames}帧`);
    
    // 提取最后几帧（光束最亮）
    const analyzeFrameCount = 5;
    const startFrame = Math.max(0, totalFrames - analyzeFrameCount);
    const startTime = startFrame / fps;
    
    console.log(`🎬 提取最后${analyzeFrameCount}帧进行分析...`);
    await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-ss', startTime.toString(),
      '-t', (analyzeFrameCount / fps).toString(),
      '-vf', 'fps=3',
      `${tmpDir}/frame_%03d.png`
    ]);
    
    // 分析每一帧
    const frameFiles = await fs.readdir(tmpDir);
    const pngFiles = frameFiles.filter(f => f.endsWith('.png')).sort();
    
    let bestPolygon = null;
    let bestFrame = startFrame;
    let maxBrightRegionArea = 0;
    
    console.log(`🔍 使用计算机视觉分析${pngFiles.length}帧...`);
    
    for (let i = 0; i < pngFiles.length; i++) {
      const framePath = path.join(tmpDir, pngFiles[i]);
      
      try {
        console.log(`📸 分析帧 ${i + 1}/${pngFiles.length}...`);
        
        const img = await loadImage(framePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);
        let imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // 1. 高斯模糊降噪
        console.log('  🌀 应用高斯模糊...');
        imageData = gaussianBlur(imageData);
        
        // 2. 计算亮度
        console.log('  💡 分析亮度分布...');
        const brightness = analyzeImageBrightness(imageData);
        
        // 3. 找到亮区域
        console.log('  🔆 检测亮区域...');
        const brightPixels = findBrightRegions(brightness, img.width, img.height, 150);
        
        if (brightPixels.length === 0) {
          console.log('  ⚠️ 未检测到足够亮的区域');
          continue;
        }
        
        console.log(`  ✨ 发现${brightPixels.length}个亮像素`);
        
        // 4. 计算凸包
        console.log('  🔺 计算凸包...');
        const hull = computeConvexHull(brightPixels);
        
        if (hull.length < 3) {
          console.log('  ⚠️ 凸包点数不足');
          continue;
        }
        
        // 5. 简化为扇形
        console.log('  📐 简化为扇形多边形...');
        const fanShape = simplifyToFanShape(hull, img.width, img.height);
        
        const regionArea = brightPixels.length;
        console.log(`  📏 亮区域面积: ${regionArea}像素`);
        
        if (regionArea > maxBrightRegionArea) {
          maxBrightRegionArea = regionArea;
          bestFrame = startFrame + Math.floor(i * fps / 3);
          bestPolygon = fanShape;
          console.log(`  🎯 找到更优的光束区域！`);
        }
        
      } catch (error) {
        console.error(`  ❌ 分析帧${i + 1}失败:`, error.message);
      }
    }
    
    // 如果检测失败，使用默认形状
    if (!bestPolygon) {
      console.log('🔄 检测失败，使用默认扇形');
      bestPolygon = createDefaultFanShape(width, height);
      bestFrame = totalFrames - 3;
    }
    
    // 计算光束时间范围
    const beamDuration = 0.3; // 0.3秒
    const beamFrames = Math.floor(beamDuration * fps);
    const endFrame = totalFrames - 1;
    const startBeamFrame = Math.max(0, endFrame - beamFrames);
    
    const result = {
      polygon: bestPolygon,
      startFrame: startBeamFrame,
      endFrame: endFrame,
      width,
      height,
      fps,
      totalFrames,
      bestFrame,
      brightRegionArea: maxBrightRegionArea,
      analyzedAt: new Date().toISOString(),
      version: "3.0.0",
      method: "computer-vision-analysis",
      algorithm: "gaussian-blur + brightness-analysis + convex-hull + fan-simplification"
    };
    
    // 保存结果
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf8');
    
    console.log('\n✅ 智能光束检测完成!');
    console.log(`📄 数据保存到: ${OUTPUT_JSON}`);
    console.log(`🎯 最佳帧: ${bestFrame}`);
    console.log(`📐 检测到的光束多边形:`);
    result.polygon.forEach((point, i) => {
      console.log(`     点${i + 1}: (${point.x}, ${point.y})`);
    });
    console.log(`⏱️ 光束时间: ${startBeamFrame/fps}s - ${endFrame/fps}s`);
    console.log(`💡 亮区域面积: ${maxBrightRegionArea}像素`);
    
    return result;
    
  } finally {
    // 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// 直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 启动智能光束检测系统...');
  console.log('🔬 使用计算机视觉算法自动分析手电筒光束区域\n');
  
  try {
    await intelligentBeamDetection();
    console.log('\n🎉 智能检测成功完成!');
  } catch (error) {
    console.error('\n❌ 智能检测失败:', error.message);
    process.exit(1);
  }
} 