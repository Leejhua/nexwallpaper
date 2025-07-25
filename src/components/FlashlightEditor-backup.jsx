import React, { useRef, useState, useCallback } from 'react';
// 预计算的光束数据文件路径
const BEAM_DATA_SRC = '/beam-data.json';

function FlashlightEditor() {
  const [userImage, setUserImage] = useState(null);
  const [maskPng, setMaskPng] = useState(null);
  const [beamData, setBeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageTransform, setImageTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [detectionStatus, setDetectionStatus] = useState('等待加载');

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // 选择图片
  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('请选择有效的图片文件 (JPG, PNG, WebP)');
      return;
    }
    
    try {
      // 清除之前的错误
      setError(null);
      
      // 创建对象URL
      const url = URL.createObjectURL(file);
      console.log('📁 文件上传成功:', file.name, '大小:', file.size, 'bytes');
      console.log('🔗 对象URL:', url);
      
      // 预加载图片以验证有效性
      const img = new Image();
      img.onload = () => {
        console.log('✅ 图片预加载成功:', img.width, 'x', img.height);
        setUserImage(url);
        // 重置变换
        setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
        // 清除之前的遮罩
        setMaskPng(null);
        setBeamData(null);
      };
      
      img.onerror = () => {
        console.error('❌ 图片文件损坏或格式不支持');
        setError('图片文件损坏或格式不支持，请选择其他图片');
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('文件处理错误:', error);
      setError('文件处理失败，请重试');
    }
  };

  // 拖拽开始
  const handleMouseDown = useCallback((e) => {
    if (!userImage || !beamData) return;
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - imageTransform.x,
      y: e.clientY - rect.top - imageTransform.y
    });
    e.preventDefault();
  }, [userImage, beamData, imageTransform]);

  // 拖拽中
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setImageTransform(prev => ({
      ...prev,
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    }));
  }, [isDragging, dragStart]);

  // 拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 缩放
  const handleScale = (delta) => {
    setImageTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale + delta))
    }));
  };

  // 旋转
  const handleRotate = (delta) => {
    setImageTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + delta) % 360
    }));
  };

  // 绘制预览
  const drawPreview = useCallback(() => {
    if (!userImage || !beamData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸
    canvas.width = beamData.width;
    canvas.height = beamData.height;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制半透明背景显示光束区域
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制光束轮廓
    ctx.save();
    ctx.beginPath();
    beamData.polygon.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 在光束区域内显示用户图片
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      
      // 应用变换
      const centerX = imageTransform.x + (img.width * imageTransform.scale) / 2;
      const centerY = imageTransform.y + (img.height * imageTransform.scale) / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((imageTransform.rotation * Math.PI) / 180);
      ctx.scale(imageTransform.scale, imageTransform.scale);
      
      // 裁剪到光束区域
      ctx.beginPath();
      beamData.polygon.forEach((p, idx) => {
        const transformedX = (p.x - centerX) / imageTransform.scale;
        const transformedY = (p.y - centerY) / imageTransform.scale;
        if (idx === 0) ctx.moveTo(transformedX, transformedY);
        else ctx.lineTo(transformedX, transformedY);
      });
      ctx.closePath();
      ctx.clip();
      
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.onerror = () => {
      console.warn('⚠️ 预览图片加载失败');
    };
    img.src = userImage;
    
    ctx.restore();
  }, [userImage, beamData, imageTransform]);

  // 清除错误
  const clearError = () => setError(null);

  // 加载预计算的光束数据
  const loadBeamData = async () => {
    try {
      const response = await fetch(BEAM_DATA_SRC);
      if (!response.ok) {
        throw new Error(`无法加载光束数据: ${response.status}`);
      }
      const data = await response.json();
      
      // 验证加载的数据
      if (!data.width || !data.height || !data.polygon || data.polygon.length < 3) {
        console.warn('⚠️ 加载的光束数据无效，使用默认数据');
        throw new Error('光束数据格式无效');
      }
      
      console.log('✅ 光束数据加载成功:', data);
      return data;
    } catch (error) {
      console.error('❌ 光束数据加载失败:', error);
      console.log('🔄 使用默认光束数据');
      
      // 降级方案：使用可靠的默认数据（正确的倒梯形）
      const defaultData = {
        polygon: [
          { x: 520, y: 1824 },  // 底部左（窄）
          { x: 350, y: 384 },   // 顶部左（宽）
          { x: 730, y: 384 },   // 顶部右（宽）
          { x: 560, y: 1824 }   // 底部右（窄）
        ],
        startFrame: 55,
        endFrame: 63,
        width: 1080,
        height: 1920,
        fps: 60,
        method: 'fallback-inverted-trapezoid',
        version: '1.1.0'
      };
      
      return defaultData;
    }
  };

  // 简化的光束数据加载
  const loadBeamDataWithStatus = async () => {
    try {
      setDetectionStatus('📁 正在加载光束数据...');
      const data = await loadBeamData();
      setBeamData(data);
      setDetectionStatus('✅ 光束数据加载完成');
      console.log('✅ 光束数据加载成功:', data);
      return data;
    } catch (error) {
      console.error('❌ 光束数据加载失败:', error);
      setDetectionStatus('⚠️ 数据加载失败');
      throw error;
    }
  };

  // 生成 α-mask PNG
  const generateMask = async () => {
    if (!userImage) {
      setError('请先上传图片');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Step1: 智能检测或加载预计算的光束数据
      let beam;
      
      // 加载光束数据
      beam = await loadBeamDataWithStatus();
      
      if (!beam) {
        throw new Error('光束数据加载失败');
      }

      // Step2: 等待当前变换状态稳定后生成遮罩
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 验证光束数据完整性
      console.log('🔍 验证光束数据:', {
        width: beam.width,
        height: beam.height,
        polygonLength: beam.polygon?.length,
        polygon: beam.polygon
      });
      
      if (!beam.width || beam.width <= 0) {
        throw new Error(`光束数据宽度无效: ${beam.width}`);
      }
      if (!beam.height || beam.height <= 0) {
        throw new Error(`光束数据高度无效: ${beam.height}`);
      }
      if (!beam.polygon || !Array.isArray(beam.polygon)) {
        throw new Error('光束多边形数据缺失或无效');
      }
      if (beam.polygon.length < 3) {
        throw new Error(`光束多边形点数不足: ${beam.polygon.length} (需要至少3个点)`);
      }
      
      // 验证多边形坐标有效性
      const invalidPoints = beam.polygon.filter(p => 
        typeof p.x !== 'number' || typeof p.y !== 'number' || 
        p.x < 0 || p.y < 0 || p.x > beam.width || p.y > beam.height
      );
      if (invalidPoints.length > 0) {
        throw new Error(`光束多边形包含无效坐标: ${JSON.stringify(invalidPoints)}`);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(100, beam.width); // 最小宽度100px
      canvas.height = Math.max(100, beam.height); // 最小高度100px
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas 2D上下文');
      }
      
      console.log('📐 Canvas尺寸:', canvas.width, 'x', canvas.height);

      const img = new Image();
      img.crossOrigin = 'anonymous'; // 避免跨域问题
      
      img.onload = () => {
        console.log('🖼️ 图片加载成功，尺寸:', img.width, 'x', img.height);
        
        try {
          // 清空并准备canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 设置透明背景
          ctx.globalCompositeOperation = 'source-over';
          
          // 1. 先绘制多边形遮罩区域
          ctx.save();
          ctx.beginPath();
          beam.polygon.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.clip(); // 裁剪到光束区域
          
          // 2. 在裁剪区域内绘制变换后的图片
          const centerX = imageTransform.x + (img.width * imageTransform.scale) / 2;
          const centerY = imageTransform.y + (img.height * imageTransform.scale) / 2;
          
          ctx.translate(centerX, centerY);
          ctx.rotate((imageTransform.rotation * Math.PI) / 180);
          ctx.scale(imageTransform.scale, imageTransform.scale);
          
          // 绘制图片
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
          
          // 检查canvas是否有内容
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasContent = imageData.data.some((value, index) => {
            // 检查alpha通道 (每4个值的第4个)
            return index % 4 === 3 && value > 0;
          });
          
          if (!hasContent) {
            console.warn('⚠️ Canvas内容为空，可能是图片位置或光束区域不匹配');
          }
          
          // 3. 转换为blob
          console.log('🔄 开始Canvas转换...');
          
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error('❌ Canvas toBlob失败');
              setError('生成遮罩失败：Canvas转换错误 - 可能是图片格式不支持');
              setLoading(false);
              return;
            }
            
            if (blob.size === 0) {
              console.error('❌ 生成的blob大小为0');
              setError('生成遮罩失败：生成的遮罩为空');
              setLoading(false);
              return;
            }
            
            console.log('✅ 遮罩生成成功，大小:', blob.size, 'bytes');
            setMaskPng(blob);
            setLoading(false);
          }, 'image/png', 1.0); // 最高质量
          
        } catch (drawError) {
          console.error('❌ Canvas绘制错误:', drawError);
          setError(`Canvas绘制失败: ${drawError.message}`);
          setLoading(false);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ 图片加载失败:', error);
        setError('图片加载失败，请重新上传');
        setLoading(false);
      };
      
      console.log('🔄 开始加载图片:', userImage);
      console.log('📊 光束数据:', beam);
      console.log('🎨 变换状态:', imageTransform);
      
      // 验证图片URL有效性
      if (!userImage || typeof userImage !== 'string') {
        throw new Error('无效的图片URL');
      }
      
      img.src = userImage;
      
    } catch (error) {
      console.error('Generate mask error:', error);
      
      // 不再重试，直接显示错误
      
      setError(`生成遮罩失败: ${error.message}`);
      setLoading(false);
    }
  };

  // 上传到后端生成 HEIF
  const handleExport = async () => {
    if (!maskPng || !beamData) return;
    setLoading(true);
    setError(null);
    
    try {
      const form = new FormData();
      form.append('mask', maskPng, 'mask.png');
      form.append('meta', JSON.stringify({
        polygon: beamData.polygon,
        startFrame: beamData.startFrame,
        endFrame: beamData.endFrame
      }));
      
      const resp = await fetch('/api/make-heif', { method: 'POST', body: form });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.details || `服务器错误: ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labubu-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError(`导出失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 实时预览效果
  React.useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // 调试模式：显示光束多边形轮廓
  const [debugMode, setDebugMode] = useState(false);
  
  const drawDebugOverlay = useCallback(() => {
    if (!debugMode || !beamData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 绘制光束多边形轮廓
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    beamData.polygon.forEach((point, index) => {
      const x = (point.x / beamData.width) * canvas.width;
      const y = (point.y / beamData.height) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    
    // 重置线型
    ctx.setLineDash([]);
  }, [debugMode, beamData]);
  
  // 在drawPreview后添加调试覆盖层
  React.useEffect(() => {
    if (debugMode) {
      drawDebugOverlay();
    }
  }, [debugMode, drawDebugOverlay, userImage, imageTransform]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          🔦 Labubu Flashlight Editor
        </h2>

              {/* 智能检测控制面板 */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">🔦 光束数据</h3>
          <span className="text-sm px-3 py-1 bg-white rounded-full border text-gray-600">
            {detectionStatus}
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded text-red-600"
            />
            <span className="text-sm font-medium">显示光束轮廓</span>
          </label>
          
          <button
            onClick={loadBeamDataWithStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
          >
            🔄 重新加载数据
          </button>
        </div>
        
        {beamData && (
          <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border-l-4 border-blue-500">
            <div><strong>检测方法:</strong> {beamData.method || '预设数据'}</div>
            <div><strong>光束版本:</strong> {beamData.version || 'N/A'}</div>
            {beamData.detectedArea && (
              <div><strong>检测面积:</strong> {beamData.detectedArea} 像素</div>
            )}
          </div>
        )}
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧控制面板 */}
          <div className="space-y-4">
            {/* 上传图片 */}
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-lg mb-2">📷 选择图片</p>
              <p className="text-sm text-gray-400">支持 JPG, PNG, WebP</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* 变换控制 */}
            {userImage && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">🎛️ 调整图片</h3>
                
                {/* 缩放 */}
                <div className="mb-3">
                  <label className="block text-sm mb-1">缩放: {imageTransform.scale.toFixed(2)}</label>
                  <div className="flex gap-2">
                    <button onClick={() => handleScale(-0.1)} className="px-3 py-1 bg-blue-600 rounded">-</button>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="3" 
                      step="0.1" 
                      value={imageTransform.scale}
                      onChange={(e) => setImageTransform(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                      className="flex-1"
                    />
                    <button onClick={() => handleScale(0.1)} className="px-3 py-1 bg-blue-600 rounded">+</button>
                  </div>
                </div>

                {/* 旋转 */}
                <div className="mb-3">
                  <label className="block text-sm mb-1">旋转: {imageTransform.rotation}°</label>
                  <div className="flex gap-2">
                    <button onClick={() => handleRotate(-15)} className="px-3 py-1 bg-green-600 rounded">↺ -15°</button>
                    <button onClick={() => handleRotate(15)} className="px-3 py-1 bg-green-600 rounded">↻ +15°</button>
                  </div>
                </div>

                {/* 重置 */}
                <button 
                  onClick={() => setImageTransform({ x: 0, y: 0, scale: 1, rotation: 0 })}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                >
                  重置位置
                </button>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-red-400 mr-2">⚠️</span>
                    <span className="text-red-200">{error}</span>
                  </div>
                  <button 
                    onClick={clearError}
                    className="text-red-400 hover:text-red-200 ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              <button 
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={generateMask} 
                disabled={!userImage || loading}
              >
                {loading && !maskPng ? '⚡ 生成遮罩中...' : '🎭 生成遮罩'}
              </button>
              
              <button 
                className="w-full bg-pink-600 hover:bg-pink-700 px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                onClick={handleExport} 
                disabled={!maskPng || loading}
              >
                {loading && maskPng ? '🎬 合成视频中...' : '📥 导出视频'}
              </button>
            </div>
          </div>

          {/* 右侧预览 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">👁️ 实时预览</h3>
            <div className="border border-gray-600 rounded overflow-hidden">
              <canvas 
                ref={canvasRef}
                className="w-full h-auto cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2 space-y-1">
              <div>🖼️ 图片: {userImage ? '已上传' : '未上传'}</div>
              <div>🎭 遮罩: {maskPng ? '已生成' : '未生成'}</div>
              <div>⚙️ 变换: 缩放 {imageTransform.scale.toFixed(2)}x, 旋转 {imageTransform.rotation}°</div>
            </div>
            
            {beamData && (
              <p className="text-xs text-gray-400 mt-2">
                🎯 检测到光束区域: {beamData.polygon.length} 个顶点 | 
                帧范围: {beamData.startFrame}-{beamData.endFrame}
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-center">
                {!maskPng ? '正在生成遮罩...' : '正在合成视频，请稍候...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlashlightEditor; 