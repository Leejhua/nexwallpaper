#!/usr/bin/env node
/*
  precompute-beam-native.mjs
  -------------------------
  使用系统FFmpeg分析视频，提取真实的手电筒光束区域
  运行: node scripts/precompute-beam-native.mjs
*/

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const exec = promisify(execFile);

const VIDEO_SRC = './public/Labubu-White-Suit-Flashlight-iPhone-Dynamic-Lockscreen%2CLabubu-Live-Wallpaper.mov';
const OUTPUT_JSON = './public/beam-data.json';

// 检查是否有 ffmpeg
let ffmpegPath = 'ffmpeg';
try {
  const ffmpegStatic = await import('ffmpeg-static');
  if (ffmpegStatic.default) {
    ffmpegPath = ffmpegStatic.default;
  }
} catch {
  console.log('使用系统 ffmpeg');
}

// 分析帧中的亮度分布，检测光束区域
function analyzeBeamArea(imageData, width, height) {
  const data = imageData.data;
  const brightnessThreshold = 200; // 亮度阈值
  const brightPixels = [];
  
  // 找到所有亮像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness > brightnessThreshold) {
        brightPixels.push({ x, y, brightness });
      }
    }
  }
  
  if (brightPixels.length === 0) {
    console.log('未检测到足够亮的区域，使用默认光束形状');
    return createDefaultBeamPolygon(width, height);
  }
  
  // 计算亮区域的边界
  const minX = Math.min(...brightPixels.map(p => p.x));
  const maxX = Math.max(...brightPixels.map(p => p.x));
  const minY = Math.min(...brightPixels.map(p => p.y));
  const maxY = Math.max(...brightPixels.map(p => p.y));
  
  console.log(`🔦 检测到光束区域: x=${minX}-${maxX}, y=${minY}-${maxY}`);
  
  // 创建扇形多边形来匹配光束形状
  // 假设光束从底部中心向上扩散
  const centerX = width / 2;
  const bottomY = height;
  
  // 根据检测到的亮区域调整扇形参数
  const beamTopY = Math.max(minY, height * 0.1); // 光束顶部
  const beamLeftX = Math.max(minX, width * 0.2);  // 光束左边界
  const beamRightX = Math.min(maxX, width * 0.8); // 光束右边界
  
  return [
    { x: Math.floor(beamLeftX), y: bottomY },     // 左下
    { x: Math.floor(beamLeftX * 0.7 + beamRightX * 0.3), y: Math.floor(beamTopY) }, // 左上
    { x: Math.floor(beamLeftX * 0.3 + beamRightX * 0.7), y: Math.floor(beamTopY) }, // 右上
    { x: Math.floor(beamRightX), y: bottomY }     // 右下
  ];
}

// 创建默认光束多边形
function createDefaultBeamPolygon(width, height) {
  return [
    { x: Math.floor(width * 0.25), y: height },
    { x: Math.floor(width * 0.4), y: Math.floor(height * 0.1) },
    { x: Math.floor(width * 0.6), y: Math.floor(height * 0.1) },
    { x: Math.floor(width * 0.75), y: height }
  ];
}

export async function precomputeBeamData() {
  console.log('🔍 开始使用系统FFmpeg分析视频...');
  
  // 检查视频文件是否存在
  try {
    await fs.access(VIDEO_SRC);
  } catch {
    throw new Error(`视频文件不存在: ${VIDEO_SRC}`);
  }
  
  // 创建临时目录
  const tmpDir = './tmp/beam-analysis';
  await fs.mkdir(tmpDir, { recursive: true });
  
  try {
    // 获取视频信息
    console.log('📊 获取视频信息...');
    const probeResult = await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-t', '0.1',
      '-f', 'null',
      '-'
    ]).catch(e => e);
    
    // 解析视频参数
    const output = probeResult.stderr || '';
    let width = 1080, height = 1920, fps = 30, duration = 1.06;
    
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
    console.log(`📺 视频参数: ${width}x${height}, ${fps}fps, 时长: ${duration}s, 总帧数: ${totalFrames}`);
    
    // 提取关键帧进行分析（最后几帧，光束最亮的时候）
    const analyzeFrames = 10;
    const startFrame = Math.max(0, totalFrames - analyzeFrames);
    const startTime = startFrame / fps;
    
    console.log(`🎬 提取帧 ${startFrame}-${totalFrames} 进行分析...`);
    
    await exec(ffmpegPath, [
      '-i', VIDEO_SRC,
      '-ss', startTime.toString(),
      '-t', (analyzeFrames / fps).toString(),
      '-vf', 'fps=5', // 降低采样率
      `${tmpDir}/frame_%03d.png`
    ]);
    
    let bestPolygon = null;
    let bestFrame = startFrame;
    let maxBrightness = 0;
    
    // 分析提取的帧
    const frameFiles = await fs.readdir(tmpDir);
    const pngFiles = frameFiles.filter(f => f.endsWith('.png')).sort();
    
    console.log(`🔍 分析 ${pngFiles.length} 个帧...`);
    
    for (let i = 0; i < pngFiles.length; i++) {
      const framePath = path.join(tmpDir, pngFiles[i]);
      
      try {
        // 使用canvas加载和分析图片
        const img = await loadImage(framePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // 计算平均亮度
        let totalBrightness = 0;
        for (let j = 0; j < imageData.data.length; j += 4) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          totalBrightness += (r + g + b) / 3;
        }
        const avgBrightness = totalBrightness / (imageData.data.length / 4);
        
        console.log(`📸 帧 ${i + 1}: 平均亮度 ${avgBrightness.toFixed(2)}`);
        
        // 如果是最亮的帧，分析其光束形状
        if (avgBrightness > maxBrightness) {
          maxBrightness = avgBrightness;
          bestFrame = startFrame + Math.floor(i * fps / 5);
          bestPolygon = analyzeBeamArea(imageData, img.width, img.height);
          console.log(`✨ 找到更亮的帧 ${bestFrame}, 亮度: ${avgBrightness.toFixed(2)}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ 分析帧 ${pngFiles[i]} 失败:`, error.message);
      }
    }
    
    // 如果没有找到合适的光束，使用默认形状
    if (!bestPolygon) {
      console.log('🔄 使用默认光束多边形');
      bestPolygon = createDefaultBeamPolygon(width, height);
      bestFrame = totalFrames - 5; // 倒数第5帧
    }
    
    // 计算光束显示的帧范围（最后几帧）
    const beamDuration = 0.5; // 光束持续时间（秒）
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
      maxBrightness: maxBrightness.toFixed(2),
      analyzedAt: new Date().toISOString(),
      version: "2.0.0",
      method: "native-ffmpeg-analysis"
    };
    
    // 保存结果
    await fs.writeFile(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf8');
    
    console.log('✅ 光束数据预计算完成!');
    console.log(`📄 数据已保存到: ${OUTPUT_JSON}`);
    console.log(`🎯 最佳帧: ${bestFrame}, 光束区域: ${bestPolygon.length} 个顶点`);
    console.log(`⏱️ 光束时间: ${startBeamFrame/fps}s - ${endFrame/fps}s`);
    
    return result;
    
  } finally {
    // 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 开始预计算 Labubu 手电筒光束数据...');
  console.log();
  
  try {
    await precomputeBeamData();
    console.log();
    console.log('🎉 预计算成功完成!');
  } catch (error) {
    console.error('❌ 预计算失败:', error.message);
    process.exit(1);
  }
} 