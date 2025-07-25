#!/usr/bin/env node
/*
  analyze-video-beam.mjs
  ----------------------
  真正分析视频中的手电筒光束位置
  通过FFmpeg提取帧 + 图像分析找到实际的光束坐标
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

// 分析图像中的亮度分布 (优化版本，避免堆栈溢出)
function analyzeImageBrightness(imageData) {
  const { data, width, height } = imageData;
  
  // 对于大图像，进行降采样以避免内存问题
  const maxPixels = 500000; // 最大像素数
  let sampleRate = 1;
  if (width * height > maxPixels) {
    sampleRate = Math.ceil(Math.sqrt((width * height) / maxPixels));
    console.log(`  📏 图像降采样: ${sampleRate}x (${width}x${height} -> ${Math.floor(width/sampleRate)}x${Math.floor(height/sampleRate)})`);
  }
  
  const brightness = [];
  
  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      if (i < data.length) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // 使用加权平均计算亮度 (人眼感知)
        brightness.push({
          x: x,
          y: y,
          brightness: (0.299 * r + 0.587 * g + 0.114 * b)
        });
      }
    }
  }
  
  return brightness;
}

// 找到最亮的区域 (适配新数据结构)
function findBrightestRegion(brightnessList, width, height, threshold = 0.8) {
  if (brightnessList.length === 0) {
    console.log(`  ❌ 没有亮度数据`);
    return null;
  }
  
  // 计算亮度统计信息
  const brightnessValues = brightnessList.map(p => p.brightness);
  const maxBrightness = Math.max(...brightnessValues);
  const minBrightness = Math.min(...brightnessValues);
  const brightThreshold = minBrightness + (maxBrightness - minBrightness) * threshold;
  
  console.log(`  💡 亮度范围: ${minBrightness.toFixed(1)} - ${maxBrightness.toFixed(1)}`);
  console.log(`  🔆 亮度阈值: ${brightThreshold.toFixed(1)}`);
  
  const brightPixels = brightnessList.filter(p => p.brightness > brightThreshold);
  
  console.log(`  ✨ 找到 ${brightPixels.length} 个亮像素 (从 ${brightnessList.length} 个采样点中)`);
  
  if (brightPixels.length === 0) {
    return null;
  }
  
  // 计算亮区域的边界
  const minX = Math.min(...brightPixels.map(p => p.x));
  const maxX = Math.max(...brightPixels.map(p => p.x));
  const minY = Math.min(...brightPixels.map(p => p.y));
  const maxY = Math.max(...brightPixels.map(p => p.y));
  
  // 计算重心
  let centerX = 0, centerY = 0, totalBrightness = 0;
  brightPixels.forEach(p => {
    centerX += p.x * p.brightness;
    centerY += p.y * p.brightness;
    totalBrightness += p.brightness;
  });
  centerX /= totalBrightness;
  centerY /= totalBrightness;
  
  return {
    bounds: { minX, maxX, minY, maxY },
    center: { x: Math.round(centerX), y: Math.round(centerY) },
    pixelCount: brightPixels.length,
    avgBrightness: totalBrightness / brightPixels.length
  };
}

// 基于亮区域创建扇形多边形
function createFanPolygonFromBrightRegion(region, width, height) {
  if (!region) {
    console.log('  ⚠️ 没有检测到亮区域，使用默认扇形');
    return createDefaultFanShape(width, height);
  }
  
  const { bounds, center } = region;
  
  console.log(`  📐 亮区域边界: x=${bounds.minX}-${bounds.maxX}, y=${bounds.minY}-${bounds.maxY}`);
  console.log(`  🎯 重心位置: (${center.x}, ${center.y})`);
  
  // 根据检测到的光束形状创建倒梯形
  // 手电筒在底部，光束向上扩散（倒梯形：下窄上宽）
  
  // 计算手电筒位置 (底部中心点)
  const flashlightY = Math.max(bounds.maxY, height * 0.9); // 底部位置
  const flashlightX = center.x; // 使用重心的x坐标
  
  // 计算光束顶部边界
  const beamTopY = Math.min(bounds.minY, height * 0.2); // 顶部位置
  
  // 计算光束宽度（底部窄，顶部宽）
  const bottomWidth = Math.min(80, (bounds.maxX - bounds.minX) * 0.3); // 底部窄
  const topWidth = Math.max(200, (bounds.maxX - bounds.minX) * 1.5);   // 顶部宽
  
  // 创建倒梯形 (从底部窄点向上扩散)
  const polygon = [
    { x: Math.round(flashlightX - bottomWidth / 2), y: Math.round(flashlightY) },  // 底部左
    { x: Math.round(flashlightX - topWidth / 2), y: Math.round(beamTopY) },        // 顶部左
    { x: Math.round(flashlightX + topWidth / 2), y: Math.round(beamTopY) },        // 顶部右
    { x: Math.round(flashlightX + bottomWidth / 2), y: Math.round(flashlightY) }   // 底部右
  ];
  
  console.log(`  📊 生成的扇形多边形:`);
  polygon.forEach((point, i) => {
    console.log(`     点${i + 1}: (${point.x}, ${point.y})`);
  });
  
  return polygon;
}

function createDefaultFanShape(width, height) {
  // 创建正确的倒梯形：手电筒在底部，光束向上扩散
  const centerX = width / 2;
  const bottomY = height * 0.95;
  const topY = height * 0.2;
  const bottomWidth = 40;  // 底部窄
  const topWidth = 380;    // 顶部宽
  
  return [
    { x: Math.floor(centerX - bottomWidth / 2), y: Math.floor(bottomY) },  // 底部左
    { x: Math.floor(centerX - topWidth / 2), y: Math.floor(topY) },        // 顶部左
    { x: Math.floor(centerX + topWidth / 2), y: Math.floor(topY) },        // 顶部右
    { x: Math.floor(centerX + bottomWidth / 2), y: Math.floor(bottomY) }   // 底部右
  ];
}

async function analyzeVideoBeam() {
  console.log('🎬 开始分析视频中的真实光束位置...');
  
  // 检查视频文件
  try {
    await fs.access(VIDEO_SRC);
  } catch {
    throw new Error(`视频文件不存在: ${VIDEO_SRC}`);
  }
  
  const tmpDir = './tmp/video-analysis';
  await fs.mkdir(tmpDir, { recursive: true });
  
  try {
    // 获取视频信息
    console.log('📊 获取视频信息...');
    const probeResult = await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-f', 'null',
      '-'
    ]).catch(e => e);
    
    const output = probeResult.stderr || '';
    let width = 1080, height = 1920, fps = 60, duration = 1.06;
    
    // 更精确的正则表达式匹配
    const resolutionMatch = output.match(/yuvj?\d+p.*?(\d+)x(\d+)/);
    const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
    const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/);
    
    console.log(`  🔍 视频流信息片段:`, output.split('\n').find(line => line.includes('Stream') && line.includes('Video')));
    
    if (resolutionMatch) {
      width = parseInt(resolutionMatch[1]);
      height = parseInt(resolutionMatch[2]);
      console.log(`  📐 检测到分辨率: ${width}x${height}`);
    } else {
      console.log(`  ⚠️ 未能检测到分辨率，使用默认值: ${width}x${height}`);
    }
    if (fpsMatch) {
      fps = parseFloat(fpsMatch[1]);
      console.log(`  🎬 检测到帧率: ${fps}fps`);
    }
    if (durationMatch) {
      const [, hours, minutes, seconds, ms] = durationMatch;
      duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms) / 100;
      console.log(`  ⏱️ 检测到时长: ${duration}s`);
    }
    
    const totalFrames = Math.floor(duration * fps);
    console.log(`📺 视频参数: ${width}x${height}, ${fps}fps, ${duration}s, ${totalFrames}帧`);
    
    // 提取最后几帧进行分析
    const analyzeFrameCount = 8;
    const startFrame = Math.max(0, totalFrames - analyzeFrameCount);
    const startTime = Math.max(0, duration - 0.35); // 从倒数0.35秒开始
    const extractDuration = Math.min(0.3, duration - startTime); // 提取0.3秒
    
    console.log(`🎬 提取最后部分帧进行分析 (从 ${startTime.toFixed(2)}s 开始，时长 ${extractDuration.toFixed(2)}s)...`);
    
    await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-ss', startTime.toString(),
      '-t', extractDuration.toString(),
      '-vf', 'fps=6', // 每秒6帧，获得更多样本
      `${tmpDir}/frame_%03d.png`
    ]);
    
    // 分析提取的帧
    const frameFiles = await fs.readdir(tmpDir);
    const pngFiles = frameFiles.filter(f => f.endsWith('.png')).sort();
    
    console.log(`🔍 分析 ${pngFiles.length} 个帧...`);
    
    let bestPolygon = null;
    let bestFrame = startFrame;
    let maxRegionScore = 0;
    let allRegions = [];
    
    for (let i = 0; i < pngFiles.length; i++) {
      const framePath = path.join(tmpDir, pngFiles[i]);
      const frameNumber = startFrame + Math.floor(i * fps / 4);
      
      console.log(`📸 分析帧 ${i + 1}/${pngFiles.length} (帧号: ${frameNumber})...`);
      
      try {
        const img = await loadImage(framePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // 分析亮度
        const brightness = analyzeImageBrightness(imageData);
        
        // 找到最亮区域
        const region = findBrightestRegion(brightness, img.width, img.height, 0.7);
        
        if (region) {
          const score = region.pixelCount * region.avgBrightness;
          allRegions.push({ frameNumber, region, score });
          
          console.log(`  📈 得分: ${score.toFixed(2)} (像素: ${region.pixelCount}, 平均亮度: ${region.avgBrightness.toFixed(1)})`);
          
          if (score > maxRegionScore) {
            maxRegionScore = score;
            bestFrame = frameNumber;
            bestPolygon = createFanPolygonFromBrightRegion(region, img.width, img.height);
            console.log(`  🎯 新的最佳帧!`);
          }
        } else {
          console.log(`  ❌ 未检测到明显的亮区域`);
        }
        
      } catch (error) {
        console.error(`  ❌ 分析帧 ${i + 1} 失败:`, error.message);
      }
    }
    
    // 如果没有检测到有效光束，使用默认形状
    if (!bestPolygon) {
      console.log('🔄 未检测到有效光束，使用默认扇形');
      bestPolygon = createDefaultFanShape(width, height);
      bestFrame = totalFrames - 5;
    }
    
    // 计算光束显示的帧范围
    const beamDuration = 0.4; // 0.4秒
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
      maxRegionScore: maxRegionScore.toFixed(2),
      analyzedFrames: pngFiles.length,
      detectedRegions: allRegions.length,
      analyzedAt: new Date().toISOString(),
      version: "4.0.0",
      method: "real-video-analysis",
      algorithm: "brightness-analysis + weighted-centroid + fan-approximation"
    };
    
    // 保存结果
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf8');
    
    console.log('\n✅ 视频光束分析完成!');
    console.log(`📄 数据保存到: ${OUTPUT_JSON}`);
    console.log(`🎯 最佳帧: ${bestFrame} (得分: ${maxRegionScore.toFixed(2)})`);
    console.log(`📐 检测到的光束多边形:`);
    result.polygon.forEach((point, i) => {
      console.log(`     点${i + 1}: (${point.x}, ${point.y})`);
    });
    console.log(`⏱️ 光束时间: ${startBeamFrame/fps}s - ${endFrame/fps}s`);
    console.log(`🔍 分析了 ${allRegions.length}/${pngFiles.length} 个有效帧`);
    
    return result;
    
  } finally {
    // 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// 直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 启动真实视频光束分析...');
  console.log('📹 将分析视频中手电筒光束的实际位置\n');
  
  try {
    await analyzeVideoBeam();
    console.log('\n🎉 分析成功完成!');
  } catch (error) {
    console.error('\n❌ 分析失败:', error.message);
    process.exit(1);
  }
} 