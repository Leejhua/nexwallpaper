import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Eye, Settings, Video, Camera, MapPin, CheckCircle, XCircle, Download } from 'lucide-react';

function VideoGenerator() {
  // 滑块样式
  const sliderStyle = {
    WebkitAppearance: 'none',
    appearance: 'none',
    height: '6px',
    borderRadius: '3px',
    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  const [userImage, setUserImage] = useState(null);
  const [beamData, setBeamData] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const canvasRef = useRef(null);
  const backgroundImgRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // 交互状态变量
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  // 控制参数
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [scale, setScale] = useState(1.5); // 增加初始缩放比例，让照片更大更好调整
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 加载配置数据
  useEffect(() => {
    const loadConfigData = async () => {
      try {
        const [beamResponse, timingResponse] = await Promise.all([
          fetch('/public/beam-data.json'),
          fetch('/public/timing-data.json')
        ]);
        
        if (beamResponse.ok && timingResponse.ok) {
          const beamData = await beamResponse.json();
          const timingData = await timingResponse.json();
          setBeamData(beamData);
          setTimingData(timingData);
        }
      } catch (error) {
        console.error('加载配置数据失败:', error);
      }
    };
    
    loadConfigData();
  }, []);

  // 防抖渲染预览函数
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const backgroundImg = backgroundImgRef.current;
    
    if (!canvas || !backgroundImg || !beamData) return;
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制背景帧（整个画布背景）
    if (backgroundImg.complete && backgroundImg.naturalWidth > 0) {
      // 计算背景图片的显示尺寸，保持宽高比
      const imgAspect = backgroundImg.naturalWidth / backgroundImg.naturalHeight;
      const canvasAspect = canvasWidth / canvasHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // 图片更宽，以高度为准
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        // 图片更高，以宽度为准
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
      }
      
      ctx.drawImage(backgroundImg, drawX, drawY, drawWidth, drawHeight);
    } else {
      // 如果背景图片未加载，使用黑色背景
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // 计算缩放比例
    const canvasScale = canvasWidth / beamData.width;
    
    // 只有上传图片后才绘制用户图片
    if (userImage) {
      // 创建临时画布来处理用户图片的遮罩
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        tempCtx.save();
        
        // 移动到画布中心
        tempCtx.translate(canvasWidth / 2, canvasHeight / 2);
        
        // 应用用户变换
        tempCtx.translate(positionX * canvasScale, positionY * canvasScale);
        tempCtx.scale(scale, scale);
        
        // 移除透明度设置，显示完全不透明的图片
        tempCtx.globalAlpha = 1.0;
        
        // 计算图片显示尺寸
        const imgScale = canvasWidth / img.width;
        const displayWidth = img.width * imgScale;
        const displayHeight = img.height * imgScale;
        
        // 绘制图片到临时画布
        tempCtx.drawImage(
          img,
          -displayWidth / 2,
          -displayHeight / 2,
          displayWidth,
          displayHeight
        );
        
        tempCtx.restore();
        
        // 应用梯形遮罩裁切
        console.log('🖼️ 预览模式：应用梯形裁切');
        
        // 创建梯形遮罩
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
        const maskCtx = maskCanvas.getContext('2d');
        
        // 绘制梯形遮罩（白色梯形在透明背景上）
        maskCtx.fillStyle = 'white';
        maskCtx.beginPath();
        const polygon = beamData.polygon;
        maskCtx.moveTo(polygon[0].x * canvasScale, polygon[0].y * canvasScale);
        for (let i = 1; i < polygon.length; i++) {
          maskCtx.lineTo(polygon[i].x * canvasScale, polygon[i].y * canvasScale);
        }
        maskCtx.closePath();
        maskCtx.fill();
        
        // 应用遮罩到图片
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(maskCanvas, 0, 0);
        tempCtx.globalCompositeOperation = 'source-over'; // 重置合成操作
        
        // 将处理后的图片绘制到主画布
        ctx.drawImage(tempCanvas, 0, 0);
        
        // 绘制梯形边框（弱化显示）
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // 虚线效果
        ctx.beginPath();
        ctx.moveTo(polygon[0].x * canvasScale, polygon[0].y * canvasScale);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x * canvasScale, polygon[i].y * canvasScale);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // 重置虚线
      };
      img.src = userImage;
    } else {
      // 没有用户图片时，只绘制梯形边框
      if (beamData.polygon) {
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // 虚线效果
        ctx.beginPath();
        const polygon = beamData.polygon;
        ctx.moveTo(polygon[0].x * canvasScale, polygon[0].y * canvasScale);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x * canvasScale, polygon[i].y * canvasScale);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // 重置虚线
      }
    }
  }, [userImage, positionX, positionY, scale, beamData]);

  // 防抖的渲染预览
  const debouncedRenderPreview = useCallback(
    (() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(renderPreview, 50); // 50ms防抖延迟
      };
    })(),
    [renderPreview]
  );

  // 监听参数变化重新渲染
  useEffect(() => {
    debouncedRenderPreview();
  }, [userImage, positionX, positionY, scale, beamData, debouncedRenderPreview]);

  // 文件上传处理
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 生成视频
  const generateVideo = async () => {
    if (!userImage) {
      setError('请先上传图片');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);
    
    let progressInterval;
    
    try {
      // 模拟进度
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            return 85; // 保持在85%等待服务器响应
          }
          return prev + 5;
        });
      }, 300);
      
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
      
      console.log('开始发送视频生成请求...');
      
      // 准备发送给后端的数据格式
      const requestData = {
        images: [{ data: userImage }],
        beamData: beamData,
        timingData: timingData,
        imageTransform: {
          x: positionX,
          y: positionY,
          scale: scale
        }
      };
      
      console.log('发送数据:', {
        hasImages: !!requestData.images,
        hasBeamData: !!requestData.beamData,
        hasTimingData: !!requestData.timingData,
        imageTransform: requestData.imageTransform
      });
      
      // 调用API生成视频
      const response = await fetch('http://localhost:9091/generate-timed-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      
      console.log('收到服务器响应，状态:', response.status);
      
      if (response.ok) {
        setProgress(95);
        const result = await response.json();
        console.log('解析响应成功:', result);
        setProgress(100);
        setResult(result);
      } else {
        const errorText = await response.text();
        console.error('服务器错误响应:', errorText);
        throw new Error(`服务器错误: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('视频生成错误:', error);
      
      if (error.name === 'AbortError') {
        setError('请求超时，请重试');
      } else if (error.message.includes('Failed to fetch')) {
        setError('网络连接失败，请检查服务器状态');
      } else {
        setError(error.message || '生成失败');
      }
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
      className="min-h-screen lg:p-8 md:p-6 sm:p-4 p-2"
    >
        {/* 主要内容区域 - 垂直布局 */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 1. 图片上传 */}
          <div className="bg-white/85 dark:bg-gray-700/85 backdrop-blur-lg rounded-2xl lg:p-8 md:p-6 sm:p-4 p-4 shadow-xl border border-white/40">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-500" />
              图片上传
            </h2>
            <div 
              className="border-2 border-dashed border-blue-400 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 cursor-pointer transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mb-4">
                <Camera className="w-16 h-16 mx-auto text-blue-500" />
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-lg font-semibold">
                选择图片文件
                <br />
                <small className="text-gray-600 dark:text-gray-400 font-normal">支持 JPG, PNG 格式</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* 2. 预览区域 */}
          <div className="bg-white/85 dark:bg-gray-700/85 backdrop-blur-lg rounded-2xl lg:p-8 md:p-6 sm:p-4 p-4 shadow-xl border border-white/40">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-green-500" />
              实时预览
            </h2>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={300}
                height={533}
                className="max-w-80 rounded-xl shadow-xl bg-black border-3 border-white/80"
              />
            </div>
            <img
              ref={backgroundImgRef}
              src="/public/labubu-background-frame.jpg"
              style={{ display: 'none' }}
              crossOrigin="anonymous"
              onLoad={renderPreview}
            />
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              <p className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                梯形遮罩区域预览
              </p>
              <small>调整参数可实时查看效果</small>
            </div>
          </div>

          {/* 3. 参数调整 */}
          <div className="bg-white/85 dark:bg-gray-700/85 backdrop-blur-lg rounded-2xl lg:p-8 md:p-6 sm:p-4 p-4 shadow-xl border border-white/40">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-purple-500" />
              参数调整
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">水平位置</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="2"
                  value={positionX}
                  onChange={(e) => setPositionX(Number(e.target.value))}
                  className="w-full"
                  style={sliderStyle}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{positionX}</span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">垂直位置</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="2"
                  value={positionY}
                  onChange={(e) => setPositionY(Number(e.target.value))}
                  className="w-full"
                  style={sliderStyle}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{positionY}</span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">缩放比例</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                  style={sliderStyle}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{scale.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* 4. 视频生成 */}
          <div className="bg-white/85 dark:bg-gray-700/85 backdrop-blur-lg rounded-2xl lg:p-8 md:p-6 sm:p-4 p-4 shadow-xl border border-white/40">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Video className="w-6 h-6 text-red-500" />
              视频生成
            </h2>
            <button
              onClick={generateVideo}
              disabled={!userImage || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Video className="w-5 h-5 animate-pulse" />
                  生成中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  生成视频
                </span>
              )}
            </button>
            
            {/* 进度条 */}
            {isGenerating && (
              <div className="mt-4">
                <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center mt-2 text-gray-600 dark:text-gray-400">正在处理... {progress}%</p>
              </div>
            )}
            
            {/* 错误显示 */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-red-800 dark:text-red-400 font-semibold flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  生成失败
                </h3>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* 5. 视频预览 */}
          {result && (
            <div className="bg-white/85 dark:bg-gray-700/85 backdrop-blur-lg rounded-2xl lg:p-8 md:p-6 sm:p-4 p-4 shadow-xl border border-white/40">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Video className="w-6 h-6 text-indigo-500" />
                视频预览
              </h2>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
                <h3 className="text-green-800 dark:text-green-400 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  视频生成成功！
                </h3>
                <video controls className="w-full rounded-lg mb-4">
                  <source src={result.videoUrl} type="video/mp4" />
                </video>
                <div className="text-center">
                  <a 
                    href={result.downloadUrl} 
                    download
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    下载视频
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
    </motion.div>
  );
}

export default VideoGenerator;