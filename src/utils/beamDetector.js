/*
  beamDetector.js
  ----------------
  提供 detectBeam 函数：
    入参：ArrayBuffer 或 File（.mov/.mp4），可选配置 { sampleFrames: number }
    出参：
      {
        polygon: [{x,y}, ...],   // 扇形多边形顶点（基于视频分辨率像素）
        startFrame: number,      // 光束开始帧 index
        endFrame: number,        // 光束结束帧 index
        width: number,          // 视频宽
        height: number          // 视频高
      }
*/

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let cv = null;

// 初始化 FFmpeg
async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }
}

// 初始化 OpenCV.js
async function initOpenCV() {
  if (!cv && typeof window !== 'undefined') {
    return new Promise((resolve) => {
      if (window.cv) {
        cv = window.cv;
        resolve();
        return;
      }
      
      // 设置超时，避免无限等待
      const timeout = setTimeout(() => {
        console.warn('OpenCV.js loading timeout, using fallback');
        resolve();
      }, 30000);
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/opencv-dist@4.9.0/opencv.js';
      script.onload = () => {
        clearTimeout(timeout);
        cv = window.cv;
        console.log('OpenCV.js loaded successfully');
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        console.warn('Failed to load OpenCV.js, using fallback detection');
        resolve();
      };
      document.head.appendChild(script);
    });
  } else if (typeof window === 'undefined') {
    // 服务端环境，跳过
    return Promise.resolve();
  }
}

// 分析帧亮度并找到最亮区域
function analyzeFrame(imageData, width, height) {
  if (!cv) return null;
  
  try {
    // 创建 OpenCV Mat
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    
    // 转灰度
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // 高斯模糊 + 阈值分割（提取亮区）
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY); // 亮度 > 200 的区域
    
    // 找轮廓
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    let maxArea = 0;
    let bestContour = null;
    
    // 找最大亮区
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        bestContour = contour;
      }
    }
    
    let polygon = null;
    if (bestContour && maxArea > 1000) { // 最小面积阈值
      // 简化轮廓为多边形
      const approx = new cv.Mat();
      const epsilon = 0.02 * cv.arcLength(bestContour, true);
      cv.approxPolyDP(bestContour, approx, epsilon, true);
      
      // 转换为点数组
      polygon = [];
      for (let i = 0; i < approx.rows; i++) {
        const point = approx.data32S.slice(i * 2, i * 2 + 2);
        polygon.push({ x: point[0], y: point[1] });
      }
      
      approx.delete();
    }
    
    // 清理内存
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
    if (bestContour) bestContour.delete();
    
    return polygon;
  } catch (error) {
    console.error('OpenCV analysis error:', error);
    return null;
  }
}

/**
 * 抽取末尾若干帧 (默认 15) 并找到亮度峰值区域
 */
export async function detectBeam(file, { sampleFrames = 15 } = {}) {
  await Promise.all([initFFmpeg(), initOpenCV()]);
  
  // 写入虚拟 FS
  const inputName = 'input.mov';
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // 获取视频信息
  await ffmpeg.exec(['-i', inputName, '-t', '0.1', '-f', 'null', '-']);
  
  // TODO: 解析 ffmpeg 输出获取真实的帧数和分辨率
  // 这里暂时使用估算值
  const totalFrames = 300;
  const width = 1080;
  const height = 1920;
  const fps = 30;

  const startFrame = Math.max(0, totalFrames - sampleFrames);
  const startTime = startFrame / fps;
  
  // 提取最后几帧为图片
  await ffmpeg.exec([
    '-i', inputName,
    '-ss', startTime.toString(),
    '-t', (sampleFrames / fps).toString(),
    '-vf', 'fps=2', // 降低采样率，每秒2帧
    'frame_%03d.png'
  ]);

  // 分析每一帧
  let bestPolygon = null;
  let bestFrame = startFrame;
  let maxBrightness = 0;

  const frameCount = Math.ceil(sampleFrames / (fps / 2)); // 基于降采样
  
  for (let i = 1; i <= frameCount; i++) {
    const frameName = `frame_${String(i).padStart(3, '0')}.png`;
    
    try {
      const frameData = await ffmpeg.readFile(frameName);
      
      // 在浏览器中创建 ImageData
      const blob = new Blob([frameData], { type: 'image/png' });
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      await new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // 计算平均亮度
          let brightness = 0;
          for (let j = 0; j < imageData.data.length; j += 4) {
            const r = imageData.data[j];
            const g = imageData.data[j + 1];
            const b = imageData.data[j + 2];
            brightness += (r + g + b) / 3;
          }
          brightness /= (imageData.data.length / 4);
          
          // 如果是最亮帧，分析其光束形状
          if (brightness > maxBrightness) {
            maxBrightness = brightness;
            bestFrame = startFrame + Math.floor(i * (fps / 2));
            bestPolygon = analyzeFrame(imageData, canvas.width, canvas.height);
          }
          
          resolve();
        };
        img.src = URL.createObjectURL(blob);
      });
      
    } catch (error) {
      console.warn(`Failed to analyze frame ${frameName}:`, error);
    }
  }

  // 如果没有检测到有效光束或OpenCV未加载，使用默认扇形
  if (!bestPolygon) {
    console.log('Using fallback beam polygon (OpenCV detection failed or unavailable)');
    bestPolygon = [
      { x: Math.floor(width * 0.25), y: height },
      { x: Math.floor(width * 0.4), y: Math.floor(height * 0.1) },
      { x: Math.floor(width * 0.6), y: Math.floor(height * 0.1) },
      { x: Math.floor(width * 0.75), y: height },
    ];
  }

  return {
    polygon: bestPolygon,
    startFrame: Math.max(0, bestFrame - 5), // 光束开始前几帧
    endFrame: totalFrames - 1,
    width,
    height
  };
} 