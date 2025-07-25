/*
  smartBeamDetector.js
  --------------------
  智能光束检测器 - 在浏览器端使用OpenCV.js实时分析视频帧
  自动识别手电筒光束区域并生成精确的多边形
*/

import { loadBeamData } from './beamLoader.js';

let cv = null;
let isOpenCVReady = false;

// 初始化OpenCV.js
async function initOpenCV() {
  if (isOpenCVReady) return true;
  
  try {
    if (!window.cv) {
      console.log('🔄 正在加载OpenCV.js...');
      // 动态加载OpenCV.js
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // 等待OpenCV完全加载
    await new Promise((resolve) => {
      if (window.cv && window.cv.Mat) {
        resolve();
      } else {
        window.cv = {
          onRuntimeInitialized: resolve
        };
      }
    });
    
    cv = window.cv;
    isOpenCVReady = true;
    console.log('✅ OpenCV.js 加载完成');
    return true;
  } catch (error) {
    console.warn('⚠️ OpenCV.js 加载失败:', error);
    return false;
  }
}

// 高斯模糊和亮度分析
function preprocessImage(src) {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  
  // 转换为灰度图
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  
  // 高斯模糊降噪
  const ksize = new cv.Size(15, 15);
  cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
  
  gray.delete();
  return blurred;
}

// 自适应阈值分割
function findBrightRegions(src) {
  const binary = new cv.Mat();
  const morphed = new cv.Mat();
  
  // 自适应阈值 - 找到最亮的区域
  cv.adaptiveThreshold(src, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, -10);
  
  // 形态学操作 - 填充空洞和连接区域
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(7, 7));
  cv.morphologyEx(binary, morphed, cv.MORPH_CLOSE, kernel);
  cv.morphologyEx(morphed, morphed, cv.MORPH_OPEN, kernel);
  
  kernel.delete();
  binary.delete();
  return morphed;
}

// 寻找最大的亮区域轮廓
function findLargestContour(binary) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  
  // 查找轮廓
  cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  let maxArea = 0;
  let bestContour = null;
  
  // 找到面积最大的轮廓
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    if (area > maxArea && area > 5000) { // 最小面积阈值
      maxArea = area;
      if (bestContour) bestContour.delete();
      bestContour = contour.clone();
    }
    contour.delete();
  }
  
  contours.delete();
  hierarchy.delete();
  
  return { contour: bestContour, area: maxArea };
}

// 将轮廓简化为扇形多边形
function simplifyToFanPolygon(contour, imageWidth, imageHeight) {
  if (!contour) {
    return createDefaultFanShape(imageWidth, imageHeight);
  }
  
  // 计算轮廓的边界矩形
  const rect = cv.boundingRect(contour);
  
  // 计算轮廓的重心
  const moments = cv.moments(contour);
  const centerX = moments.m10 / moments.m00;
  const centerY = moments.m01 / moments.m00;
  
  // 找到轮廓的极值点
  const hull = new cv.Mat();
  cv.convexHull(contour, hull);
  
  const points = [];
  for (let i = 0; i < hull.rows; i++) {
    const point = hull.intPtr(i, 0);
    points.push({
      x: point[0],
      y: point[1]
    });
  }
  
  hull.delete();
  
  if (points.length < 3) {
    return createDefaultFanShape(imageWidth, imageHeight);
  }
  
  // 根据位置创建扇形
  // 假设光束从底部向上发散
  const bottomY = Math.max(...points.map(p => p.y));
  const topY = Math.min(...points.map(p => p.y));
  const leftX = Math.min(...points.map(p => p.x));
  const rightX = Math.max(...points.map(p => p.x));
  
  // 创建四边形扇形
  const fanPolygon = [
    { x: Math.floor(leftX + (rightX - leftX) * 0.3), y: Math.floor(bottomY) },     // 底部左
    { x: Math.floor(leftX), y: Math.floor(topY) },                                 // 顶部左
    { x: Math.floor(rightX), y: Math.floor(topY) },                                // 顶部右
    { x: Math.floor(leftX + (rightX - leftX) * 0.7), y: Math.floor(bottomY) }     // 底部右
  ];
  
  console.log('🔆 检测到的光束区域:', {
    bounds: { leftX, rightX, topY, bottomY },
    center: { centerX: Math.floor(centerX), centerY: Math.floor(centerY) },
    area: cv.contourArea(contour),
    polygon: fanPolygon
  });
  
  return fanPolygon;
}

function createDefaultFanShape(width, height) {
  return [
    { x: Math.floor(width * 0.45), y: Math.floor(height * 0.85) },
    { x: Math.floor(width * 0.42), y: Math.floor(height * 0.3) },
    { x: Math.floor(width * 0.58), y: Math.floor(height * 0.3) },
    { x: Math.floor(width * 0.55), y: Math.floor(height * 0.85) }
  ];
}

// 从视频帧中检测光束
export async function detectBeamFromFrame(videoElement, currentTime) {
  console.log('🔍 开始智能光束检测...');
  
  // 初始化OpenCV
  const opencvReady = await initOpenCV();
  if (!opencvReady) {
    console.log('⚠️ OpenCV不可用，加载预设数据');
    return await loadBeamData();
  }
  
  try {
    // 创建canvas来捕获视频帧
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth || 1080;
    canvas.height = videoElement.videoHeight || 1920;
    
    // 绘制当前帧
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 创建OpenCV Mat
    const src = cv.matFromImageData(imageData);
    
    console.log('📸 分析视频帧:', {
      width: canvas.width,
      height: canvas.height,
      time: currentTime
    });
    
    // 1. 预处理 - 高斯模糊和灰度化
    console.log('  🌀 图像预处理...');
    const processed = preprocessImage(src);
    
    // 2. 找到亮区域
    console.log('  🔆 检测亮区域...');
    const binary = findBrightRegions(processed);
    
    // 3. 查找最大轮廓
    console.log('  🔍 寻找光束轮廓...');
    const { contour, area } = findLargestContour(binary);
    
    // 4. 简化为扇形多边形
    console.log('  📐 生成扇形多边形...');
    const polygon = simplifyToFanPolygon(contour, canvas.width, canvas.height);
    
    // 清理OpenCV对象
    src.delete();
    processed.delete();
    binary.delete();
    if (contour) contour.delete();
    
    // 构建结果
    const result = {
      polygon,
      startFrame: Math.floor((currentTime - 0.3) * 60), // 假设60fps
      endFrame: Math.floor(currentTime * 60),
      width: canvas.width,
      height: canvas.height,
      fps: 60,
      detectedArea: area,
      analyzedAt: new Date().toISOString(),
      version: "4.0.0",
      method: "real-time-opencv-analysis"
    };
    
    console.log('✅ 智能检测完成!', {
      polygon: result.polygon,
      area: area,
      frames: `${result.startFrame}-${result.endFrame}`
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ 光束检测失败:', error);
    console.log('🔄 回退到预设数据');
    return await loadBeamData();
  }
}

// 实时光束检测 - 在视频播放时调用
export async function enableSmartBeamDetection(videoElement, onDetectionComplete) {
  console.log('🚀 启用智能光束检测...');
  
  let detectionTriggered = false;
  
  const detectOnTimeUpdate = async () => {
    const currentTime = videoElement.currentTime;
    const duration = videoElement.duration;
    
    // 在视频最后0.5秒时触发检测
    if (!detectionTriggered && currentTime >= duration - 0.5) {
      detectionTriggered = true;
      console.log('⏰ 触发智能光束检测 - 视频接近结束');
      
      try {
        const beamData = await detectBeamFromFrame(videoElement, currentTime);
        onDetectionComplete(beamData);
      } catch (error) {
        console.error('智能检测失败:', error);
        const fallbackData = await loadBeamData();
        onDetectionComplete(fallbackData);
      }
    }
  };
  
  videoElement.addEventListener('timeupdate', detectOnTimeUpdate);
  
  // 返回清理函数
  return () => {
    videoElement.removeEventListener('timeupdate', detectOnTimeUpdate);
  };
} 