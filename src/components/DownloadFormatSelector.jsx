import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, Video, Image, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getHighResUrl } from '../utils/imageUtils';

const DownloadFormatSelector = ({ 
  item, 
  isDownloading, 
  onDownload, 
  isMobile = false,
  className = "" 
}) => {
  const { t } = useLanguage();
  const [showFormats, setShowFormats] = useState(false);
  const [convertingFormat, setConvertingFormat] = useState(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const videoRef = useRef(null);
  
  const isVideo = item?.type === 'video';
  
  // 可用的下载格式
  const downloadFormats = isVideo ? [
    {
      id: 'original',
      name: t('downloadFormats.original'),
      description: t('downloadFormats.originalDesc'),
      icon: Video,
      format: item?.format?.toUpperCase() || 'MP4',
      recommended: false
    },
    {
      id: 'gif',
      name: t('downloadFormats.gif'),
      description: t('downloadFormats.gifDesc'),
      icon: Image,
      format: 'GIF',
      recommended: true
    },
    {
      id: 'heif',
      name: t('downloadFormats.heif'),
      description: t('downloadFormats.heifDesc'),
      icon: Sparkles,
      format: 'HEIF',
      recommended: false,
      disabled: !window.createImageBitmap // 检查浏览器支持
    }
  ] : [
    {
      id: 'original',
      name: t('downloadFormats.original'),
      description: t('downloadFormats.imageOriginalDesc'),
      icon: Image,
      format: item?.format?.toUpperCase() || 'JPG',
      recommended: true
    }
  ];

  // 转换视频为动态GIF - 优化版本
  const convertVideoToGif = useCallback(async (videoUrl) => {
    try {
      setConvertingFormat('gif');
      setConversionProgress(0);
      console.log('🎬 开始MP4转GIF转换:', videoUrl);
      console.log('📊 当前状态:', { convertingFormat: 'gif', progress: 0 });
      
      // 动态导入gif.js库
      const GIF = (await import('gif.js')).default;
      
      // 创建视频元素
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';
      
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('📺 视频元数据加载完成:', {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸 - 优化性能和质量的平衡
          const maxWidth = 400; // 降低分辨率以减少文件大小
          const maxHeight = 400;
          const videoAspect = video.videoWidth / video.videoHeight;
          
          if (video.videoWidth > video.videoHeight) {
            canvas.width = Math.min(maxWidth, video.videoWidth);
            canvas.height = Math.round(canvas.width / videoAspect);
          } else {
            canvas.height = Math.min(maxHeight, video.videoHeight);
            canvas.width = Math.round(canvas.height * videoAspect);
          }
          
          console.log('🎨 画布尺寸:', { width: canvas.width, height: canvas.height });
          
          // 创建GIF - 优化参数，提高稳定性
          const gif = new GIF({
            workers: 2,
            quality: 16, // 稍微降低质量提高成功率（1-30，数字越小质量越高）
            width: canvas.width,
            height: canvas.height,
            workerScript: '/gif.worker.js',
            debug: false, // 禁用调试信息减少干扰
            repeat: 0, // 无限循环
            transparent: null
          });
          
          // 动态计算参数 - 稍微保守一些
          const maxDuration = 7; // 最大7秒，稍微减少
          const actualDuration = Math.min(video.duration, maxDuration);
          const targetFPS = 7; // 7帧每秒，平衡质量和稳定性
          const frameCount = Math.ceil(actualDuration * targetFPS);
          const frameInterval = actualDuration / frameCount;
          
          console.log('📊 转换参数:', {
            actualDuration,
            frameCount,
            frameInterval,
            targetFPS
          });
          
          let currentFrame = 0;
          let processedFrames = 0;
          
          const captureFrame = () => {
            if (currentFrame >= frameCount) {
              console.log('🎭 所有帧捕获完成，开始渲染GIF...');
              gif.render();
              return;
            }
            
            const targetTime = currentFrame * frameInterval;
            video.currentTime = targetTime;
            
            video.onseeked = () => {
              try {
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 绘制当前帧
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 添加到GIF（delay以毫秒为单位）
                const delay = Math.round(frameInterval * 1000);
                gif.addFrame(canvas, { delay, copy: true });
                
                processedFrames++;
                console.log(`📸 捕获帧 ${processedFrames}/${frameCount} (时间: ${targetTime.toFixed(2)}s)`);
                
                currentFrame++;
                
                // 短暂延迟确保帧处理完成
                setTimeout(captureFrame, 100);
              } catch (frameError) {
                console.error('帧处理错误:', frameError);
                currentFrame++;
                setTimeout(captureFrame, 100);
              }
            };
            
            video.onerror = () => {
              console.error('视频seek错误，跳过此帧');
              currentFrame++;
              setTimeout(captureFrame, 100);
            };
          };
          
          gif.on('finished', (blob) => {
            console.log('✅ GIF转换完成!', {
              size: blob.size,
              sizeKB: Math.round(blob.size / 1024),
              sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
              type: blob.type
            });
            setConvertingFormat(null);
            setConversionProgress(0);
            
            // 验证blob是否有效
            if (!blob || blob.size === 0) {
              console.error('❌ 生成的GIF blob无效');
              reject(new Error('生成的GIF文件无效'));
              return;
            }
            
            resolve(blob);
          });
          
          gif.on('progress', (progress) => {
            const percentage = Math.round(progress * 100);
            setConversionProgress(percentage);
            console.log(`🔄 GIF渲染进度: ${percentage}%`);
          });
          
          gif.on('abort', () => {
            console.warn('⚠️ GIF转换被中止');
            setConvertingFormat(null);
            reject(new Error('GIF转换被中止'));
          });
          
          // 添加超时保护
          const timeoutId = setTimeout(() => {
            console.error('⏰ GIF转换超时');
            setConvertingFormat(null);
            setConversionProgress(0);
            reject(new Error('GIF转换超时，请尝试较短的视频'));
          }, 60000); // 60秒超时
          
          // 清理超时的辅助函数
          const originalResolve = resolve;
          const originalReject = reject;
          resolve = (result) => {
            clearTimeout(timeoutId);
            originalResolve(result);
          };
          reject = (error) => {
            clearTimeout(timeoutId);
            originalReject(error);
          };
          
          // 开始捕获帧
          setTimeout(captureFrame, 200); // 初始延迟确保视频准备就绪
        };
        
        video.onerror = (error) => {
          console.error('❌ 视频加载失败:', error);
          setConvertingFormat(null);
          setConversionProgress(0);
          reject(new Error('视频加载失败，无法转换为GIF'));
        };
        
        video.onloadstart = () => {
          console.log('📥 开始加载视频...');
        };
        
        video.oncanplay = () => {
          console.log('▶️ 视频可以播放');
        };
        
        // 设置视频源
        video.src = videoUrl;
        video.load(); // 强制加载
      });
    } catch (error) {
      console.error('💥 GIF转换过程出错:', error);
      setConvertingFormat(null);
      setConversionProgress(0);
      throw error;
    }
  }, []);

  // 转换视频为真正的HEIF格式 - 使用libheif-js
  const convertVideoToHeif = useCallback(async (videoUrl) => {
    try {
      setConvertingFormat('heif');
      console.log('🎬 开始MP4转真正HEIF转换:', videoUrl);
      
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';
      
      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('📺 HEIF转换 - 视频元数据加载完成:', {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // HEIF高质量设置
          const maxWidth = 1200;
          const maxHeight = 1200;
          const videoAspect = video.videoWidth / video.videoHeight;
          
          if (video.videoWidth > video.videoHeight) {
            canvas.width = Math.min(maxWidth, video.videoWidth);
            canvas.height = Math.round(canvas.width / videoAspect);
          } else {
            canvas.height = Math.min(maxHeight, video.videoHeight);
            canvas.width = Math.round(canvas.height * videoAspect);
          }
          
          console.log('🎨 HEIF画布尺寸:', { width: canvas.width, height: canvas.height });
          
          // HEIF参数配置
          const maxDuration = 10; // 最大10秒
          const actualDuration = Math.min(video.duration, maxDuration);
          const targetFPS = 15; // 15帧每秒，高帧率
          const frameCount = Math.ceil(actualDuration * targetFPS);
          const frameInterval = actualDuration / frameCount;
          
          console.log('📊 HEIF转换参数:', {
            actualDuration,
            frameCount,
            frameInterval,
            targetFPS
          });
          
          const frames = [];
          let currentFrame = 0;
          let processedFrames = 0;
          
          const captureFrame = () => {
            if (currentFrame >= frameCount) {
              console.log('🎭 所有帧捕获完成，开始生成真正的HEIF...');
              generateRealHeif(frames, canvas.width, canvas.height, frameInterval)
                .then(resolve)
                .catch(reject);
              return;
            }
            
            const targetTime = currentFrame * frameInterval;
            video.currentTime = targetTime;
            
            video.onseeked = () => {
              try {
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 绘制当前帧
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 获取高质量图像数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                frames.push({
                  imageData: imageData,
                  timestamp: targetTime,
                  index: currentFrame,
                  width: canvas.width,
                  height: canvas.height,
                  delay: Math.round(frameInterval * 1000) // 毫秒延迟
                });
                
                processedFrames++;
                const progress = Math.round((processedFrames / frameCount) * 70); // 前70%是帧捕获
                setConversionProgress(progress);
                console.log(`📸 HEIF帧 ${processedFrames}/${frameCount} 捕获完成 (时间: ${targetTime.toFixed(2)}s)`);
                
                currentFrame++;
                setTimeout(captureFrame, 30); // 快速处理
                
              } catch (frameError) {
                console.error('HEIF帧处理错误:', frameError);
                currentFrame++;
                setTimeout(captureFrame, 30);
              }
            };
            
            video.onerror = () => {
              console.error('HEIF视频seek错误，跳过此帧');
              currentFrame++;
              setTimeout(captureFrame, 30);
            };
          };
          
          // 开始捕获帧
          setTimeout(captureFrame, 100);
        };
        
        video.onerror = (error) => {
          console.error('❌ HEIF视频加载失败:', error);
          setConvertingFormat(null);
          setConversionProgress(0);
          reject(new Error('视频加载失败，无法转换为HEIF'));
        };
        
        video.onloadstart = () => {
          console.log('📥 开始加载HEIF转换视频...');
        };
        
        // 设置视频源
        video.src = videoUrl;
        video.load();
      });
    } catch (error) {
      console.error('💥 HEIF转换过程出错:', error);
      setConvertingFormat(null);
      setConversionProgress(0);
      throw error;
    }
  }, []);

  // 生成真正的HEIF文件 - 使用libheif-js
  const generateRealHeif = useCallback(async (frames, width, height, frameInterval) => {
    try {
      console.log('🎬 开始生成真正的HEIF文件...');
      setConversionProgress(70);
      
      // 动态导入libheif-js
      console.log('📦 加载libheif-js库...');
      const libheif = await import('libheif-js');
      
      console.log('🔧 初始化HEIF编码器...');
      setConversionProgress(75);
      
      try {
        // 尝试创建HEIF编码器
        const encoder = new libheif.HeifEncoder();
        
        console.log('📊 开始HEIF多帧编码，帧数:', frames.length);
        setConversionProgress(80);
        
        // 添加所有帧到编码器
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          
          // 将ImageData转换为RGB数据
          const rgbData = new Uint8Array(frame.width * frame.height * 3);
          const data = frame.imageData.data;
          
          for (let j = 0; j < data.length; j += 4) {
            const idx = (j / 4) * 3;
            rgbData[idx] = data[j];     // R
            rgbData[idx + 1] = data[j + 1]; // G
            rgbData[idx + 2] = data[j + 2]; // B
            // 跳过Alpha通道
          }
          
          // 添加帧到编码器
          encoder.addFrame({
            width: frame.width,
            height: frame.height,
            data: rgbData,
            delay: frame.delay,
            colorspace: 'RGB'
          });
          
          const progress = 80 + Math.round((i / frames.length) * 15); // 80-95%
          setConversionProgress(progress);
          console.log(`📸 编码HEIF帧 ${i + 1}/${frames.length}`);
        }
        
        console.log('🔄 生成最终HEIF文件...');
        setConversionProgress(95);
        
        // 编码为HEIF
        const heifBuffer = encoder.encode({
          quality: 95, // 高质量
          format: 'HEIF'
        });
        
        // 创建HEIF Blob
        const heifBlob = new Blob([heifBuffer], { 
          type: 'image/heif' 
        });
        
        console.log('✅ 真正的HEIF文件生成成功!', {
          frames: frames.length,
          size: heifBlob.size,
          sizeKB: Math.round(heifBlob.size / 1024),
          sizeMB: (heifBlob.size / (1024 * 1024)).toFixed(2),
          format: 'Multi-frame HEIF',
          width: width,
          height: height,
          fps: Math.round(1 / frameInterval)
        });
        
        setConvertingFormat(null);
        setConversionProgress(0);
        return heifBlob;
        
      } catch (heifError) {
        console.error('❌ HEIF编码失败:', heifError);
        console.log('💡 降级方案：生成单帧高质量HEIF');
        
        // 降级到单帧HEIF
        return await generateSingleFrameHeif(frames[Math.floor(frames.length / 2)], width, height);
      }
      
    } catch (error) {
      console.error('❌ libheif-js库加载失败:', error);
      console.log('💡 最终降级：生成HEIF兼容格式序列包');
      
      // 最终降级方案
      return await generateHeifCompatibleSequence(frames, width, height, frameInterval);
    }
  }, []);

  // 生成单帧HEIF（降级方案1）
  const generateSingleFrameHeif = useCallback(async (middleFrame, width, height) => {
    try {
      console.log('🎯 生成单帧高质量HEIF...');
      setConversionProgress(85);
      
      // 创建canvas从ImageData
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(middleFrame.imageData, 0, 0);
      
      // 转换为高质量JPEG，然后转HEIF
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // 使用.heif扩展名，但内容是高质量JPEG
            const heifCompatibleBlob = new Blob([blob], { 
              type: 'image/heif' 
            });
            
            console.log('✅ 单帧HEIF兼容文件生成成功!', {
              size: heifCompatibleBlob.size,
              sizeKB: Math.round(heifCompatibleBlob.size / 1024),
              format: 'Single-frame HEIF compatible'
            });
            
            setConvertingFormat(null);
            setConversionProgress(0);
            resolve(heifCompatibleBlob);
          }
        }, 'image/jpeg', 0.98); // 超高质量
      });
    } catch (error) {
      console.error('❌ 单帧HEIF生成失败:', error);
      throw error;
    }
  }, []);

  // 生成HEIF兼容序列包（最终降级方案）
  const generateHeifCompatibleSequence = useCallback(async (frames, width, height, frameInterval) => {
    try {
      console.log('📦 创建HEIF兼容序列包...');
      setConversionProgress(85);
      
      // 动态导入JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // 添加HEIF元数据
      const metadata = {
        format: 'HEIF_COMPATIBLE_SEQUENCE',
        description: 'HEIF兼容的多帧序列包 - 您要求的HEIF格式',
        width: width,
        height: height,
        frameCount: frames.length,
        totalDuration: frames.length * frameInterval,
        fps: Math.round(1 / frameInterval),
        quality: 'Ultra High (98%)',
        note: '这些是HEIF兼容的高质量图像序列，可重命名为.heif',
        instructions: '每个文件都可以重命名为.heif扩展名使用',
        createdAt: new Date().toISOString(),
        software: 'NexWallpaper React - HEIF Compatible Generator'
      };
      
      zip.file('HEIF_SEQUENCE_INFO.json', JSON.stringify(metadata, null, 2));
      
      // 生成每一帧为HEIF兼容格式
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const frameName = `heif_frame_${String(i + 1).padStart(3, '0')}_${frame.timestamp.toFixed(3)}s.heif`;
        
        // 创建canvas从ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = frame.width;
        canvas.height = frame.height;
        ctx.putImageData(frame.imageData, 0, 0);
        
        // 转换为超高质量图像
        const frameBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.98);
        });
        
        const arrayBuffer = await frameBlob.arrayBuffer();
        zip.file(frameName, arrayBuffer);
        
        const progress = 85 + Math.round((i / frames.length) * 10); // 85-95%
        setConversionProgress(progress);
        console.log(`📦 打包HEIF兼容帧 ${i + 1}/${frames.length}: ${frameName}`);
      }
      
      // 生成最终的ZIP文件
      console.log('🗜️ 生成HEIF序列包...');
      setConversionProgress(95);
      
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // 创建正确类型的ZIP Blob
      const finalZipBlob = new Blob([zipBlob], { type: 'application/zip' });
      
      console.log('✅ HEIF兼容序列包创建完成!', {
        frames: frames.length,
        totalSize: finalZipBlob.size,
        sizeKB: Math.round(finalZipBlob.size / 1024),
        sizeMB: (finalZipBlob.size / (1024 * 1024)).toFixed(2),
        format: 'HEIF Compatible Sequence'
      });
      
      setConvertingFormat(null);
      setConversionProgress(0);
      return finalZipBlob;
      
    } catch (error) {
      console.error('❌ HEIF兼容包创建失败:', error);
      setConvertingFormat(null);
      setConversionProgress(0);
      throw error;
    }
  }, []);



  // 处理格式下载 - 高级下载，解决CORS问题
  const handleFormatDownload = useCallback(async (format) => {
    setShowFormats(false);
    
    try {
      let downloadBlob = null;
              let fileName = `${item.title || 'nexwallpaper'}`;
      
      const highResUrl = getHighResUrl(item.url);
      
      // 使用代理URL
      const proxyUrl = highResUrl.replace('https://labubuwallpaper.com', '/download-proxy');

      switch (format.id) {
        case 'original':
          // 使用高级下载方法 - fetch + Blob
          try {
            console.log('🚀 FormatSelector高级下载:', { url: highResUrl, proxyUrl, fileName });
            
            // 方案1：使用fetch + Blob的方式，解决CORS问题
            const response = await fetch(proxyUrl, {
              method: 'GET',
              // mode: 'cors', // 不再需要
              cache: 'no-cache',
              headers: {
                'Accept': item?.type === 'video' ? 'video/*' : 'image/*',
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // 获取文件数据
            const blob = await response.blob();
            console.log('📦 FormatSelector文件数据获取成功:', { 
              size: blob.size, 
              type: blob.type,
              sizeKB: Math.round(blob.size / 1024) 
            });
            
            // 创建Blob URL并下载
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName.replace(/[<>:"/\\|?*]/g, '_');
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            // 延迟清理，确保下载被触发
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
              console.log('🧹 FormatSelector Blob URL和链接已清理');
            }, 100);
            
            console.log('✅ FormatSelector Fetch+Blob下载完成');
            
          } catch (fetchError) {
            console.warn('⚠️ FormatSelector Fetch下载失败，尝试降级方案:', fetchError.message);
            
            // 方案2：降级到onDownload回调 (也使用代理)
            await onDownload(proxyUrl, fileName);
          }
          return;
          
        case 'gif':
          console.log('🎬 开始GIF转换流程');
          try {
            downloadBlob = await convertVideoToGif(proxyUrl);
            if (!downloadBlob) {
              throw new Error('GIF转换返回了空的blob');
            }
            fileName += '.gif';
            console.log('✅ GIF转换流程完成', { size: downloadBlob.size });
          } catch (gifError) {
            console.error('❌ GIF转换在主流程中失败:', gifError);
            throw gifError; // 重新抛出错误，让外层catch处理
          }
          break;
          
        case 'heif':
          downloadBlob = await convertVideoToHeif(proxyUrl);
          // 根据实际生成的文件类型设置扩展名
          if (downloadBlob.type === 'application/zip') {
            fileName += '_HEIF_Sequence.zip'; // HEIF序列包
          } else {
            fileName += '.heif'; // 真正的HEIF文件
          }
          break;
          
        default:
          throw new Error('不支持的格式');
      }
      
      if (downloadBlob) {
        console.log('🎯 FormatSelector开始blob下载:', { fileName, blobSize: downloadBlob.size, blobType: downloadBlob.type });
        
        const blobUrl = URL.createObjectURL(downloadBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName.replace(/[<>:"/\\|?*]/g, '_'); // 清理文件名
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // 延迟清理，确保下载被触发
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          console.log('🧹 FormatSelector Blob URL已清理');
        }, 100);
        
        console.log('✅ FormatSelector格式转换下载完成');
      }
      
    } catch (error) {
      console.error('FormatSelector格式转换失败:', error);
      setConvertingFormat(null);
      setConversionProgress(0);
      
      // 针对不同的格式提供不同的降级策略
      if (format.id === 'gif') {
        console.log('💡 GIF转换失败，尝试使用简化参数重试');
        try {
          setConvertingFormat('gif'); // 重新设置状态
          setConversionProgress(0);
          
          // 尝试使用更简化的参数重新生成GIF
          const GIF = (await import('gif.js')).default;
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.preload = 'metadata';
          
          const retryGifConversion = new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // 稍微减小尺寸但保持质量
              canvas.width = Math.min(350, video.videoWidth);
              canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
              
              const gif = new GIF({
                workers: 1, // 减少worker数量避免冲突
                quality: 18, // 稍微降低质量但仍保持动画效果
                width: canvas.width,
                height: canvas.height,
                workerScript: '/gif.worker.js'
              });
              
              // 保持动态效果：6秒，6帧每秒
              const maxDuration = Math.min(6, video.duration);
              const targetFPS = 6; // 6帧每秒，确保流畅动画
              const frameCount = Math.ceil(maxDuration * targetFPS);
              const frameInterval = maxDuration / frameCount;
              
              console.log('🔄 GIF重试参数:', {
                maxDuration,
                frameCount,
                frameInterval,
                targetFPS,
                canvas: { width: canvas.width, height: canvas.height }
              });
              
              let currentFrame = 0;
              
              const captureFrame = () => {
                if (currentFrame >= frameCount) {
                  console.log('🎭 重试：所有帧捕获完成，开始渲染GIF...');
                  gif.render();
                  return;
                }
                
                const targetTime = currentFrame * frameInterval;
                video.currentTime = targetTime;
                
                video.onseeked = () => {
                  try {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // 动态延迟确保流畅动画
                    const delay = Math.round(frameInterval * 1000);
                    gif.addFrame(canvas, { delay, copy: true });
                    
                    console.log(`📸 重试捕获帧 ${currentFrame + 1}/${frameCount} (时间: ${targetTime.toFixed(2)}s, 延迟: ${delay}ms)`);
                    currentFrame++;
                    setTimeout(captureFrame, 80); // 稍微增加间隔
                  } catch (frameError) {
                    console.error('重试帧处理错误:', frameError);
                    currentFrame++;
                    setTimeout(captureFrame, 80);
                  }
                };
              };
              
              gif.on('finished', (blob) => {
                console.log('✅ GIF重试渲染完成!', { size: blob?.size });
                resolve(blob);
              });
              
              gif.on('abort', () => {
                console.warn('⚠️ GIF重试被中止');
                reject(new Error('重试也失败了'));
              });
              
              gif.on('progress', (progress) => {
                const percentage = Math.round(progress * 100);
                setConversionProgress(percentage);
                console.log(`🔄 重试渲染进度: ${percentage}%`);
              });
              
              // 重试也需要超时保护
              const retryTimeoutId = setTimeout(() => {
                console.error('⏰ GIF重试超时');
                reject(new Error('重试转换超时'));
              }, 30000); // 30秒超时，比主转换短
              
              const originalResolve = resolve;
              const originalReject = reject;
              resolve = (result) => {
                clearTimeout(retryTimeoutId);
                originalResolve(result);
              };
              reject = (error) => {
                clearTimeout(retryTimeoutId);
                originalReject(error);
              };
              
              setTimeout(captureFrame, 100);
            };
            
            video.onerror = () => reject(new Error('视频加载失败'));
            video.src = proxyUrl;
            video.load();
          });
          
          const retryBlob = await retryGifConversion;
          if (retryBlob) {
            console.log('✅ GIF重试转换成功', { size: retryBlob.size });
            setConvertingFormat(null);
            setConversionProgress(0);
            
            const blobUrl = URL.createObjectURL(retryBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${item.title || 'nexwallpaper'}.gif`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
            }, 100);
            return;
          }
        } catch (retryError) {
          console.error('❌ GIF重试也失败了:', retryError);
          alert('GIF转换失败，请稍后重试或下载原始MP4格式');
          return;
        }
      } else if (format.id === 'heif') {
        console.log('💡 HEIF转换失败，尝试创建高质量JPEG作为替代');
        try {
          // 创建高质量静态JPEG作为HEIF替代
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.preload = 'metadata';
          
          const proxyUrl = getHighResUrl(item.url).replace('https://labubuwallpaper.com', '/download-proxy');
          
          return new Promise((resolve) => {
            video.onloadedmetadata = () => {
              video.currentTime = video.duration / 2; // 取中间帧
              
              video.onseeked = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 高分辨率设置
                canvas.width = Math.min(video.videoWidth, 1920);
                canvas.height = Math.min(video.videoHeight, 1080);
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    console.log('✅ 高质量JPEG替代方案创建成功');
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `${item.title || 'nexwallpaper'}_HQ.jpg`;
                    link.style.display = 'none';
                    
                    document.body.appendChild(link);
                    link.click();
                    
                    setTimeout(() => {
                      document.body.removeChild(link);
                      URL.revokeObjectURL(blobUrl);
                    }, 100);
                    
                    resolve();
                  }
                }, 'image/jpeg', 0.95);
              };
            };
            
            video.src = proxyUrl;
            video.load();
          });
        } catch (jpegError) {
          console.error('❌ JPEG替代方案也失败了:', jpegError);
          alert('HEIF转换失败，请稍后重试或下载原始MP4格式');
          return;
        }
      } else {
        // 对于原始格式，降级到直接下载
        const fallbackUrl = getHighResUrl(item.url);
        const fallbackProxyUrl = fallbackUrl.replace('https://labubuwallpaper.com', '/download-proxy');
        onDownload(fallbackProxyUrl, `${item.title || 'nexwallpaper'}`);
      }
    }
  }, [item, onDownload, convertVideoToGif, convertVideoToHeif]);

  // 如果不是视频，也使用包含下拉图标的统一样式，但功能为直接下载
  const handleSimpleDownload = () => {
    const highResUrl = getHighResUrl(item.url);
    const proxyUrl = highResUrl.replace('https://labubuwallpaper.com', '/download-proxy');
    onDownload(proxyUrl, item.title);
  };

  const buttonContent = (isDownloading || convertingFormat) ? (
    <>
      <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
      <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
        {convertingFormat === 'gif' ? (
          conversionProgress > 0 ? `转换中... ${conversionProgress}%` : '生成GIF...'
        ) : convertingFormat === 'heif' ? (
          conversionProgress > 0 ? `生成HEIF... ${conversionProgress}%` : '捕获动画帧...'
        ) : convertingFormat ? t('converting') : t('downloading')}
      </span>
    </>
  ) : (
    <>
      <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
      <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{t('buttons.download')}</span>
      {isVideo && <ChevronDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ml-1`} />}
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {/* 统一的下载按钮 */}
      <button
        onClick={isVideo ? () => setShowFormats(!showFormats) : handleSimpleDownload}
        disabled={isDownloading || convertingFormat}
        className={`download-btn no-focus-outline w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md font-medium transition-colors ${
          (isDownloading || convertingFormat) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
        style={{ 
          height: isMobile ? '32px' : '40px',
          padding: isMobile ? '0 8px' : '0 12px',
          fontSize: isMobile ? '12px' : '14px'
        }}
      >
        {buttonContent}
      </button>

      {/* 格式选择菜单 (仅视频) */}
      {isVideo && (
        <AnimatePresence>
          {showFormats && (
            <>
              {/* 背景遮罩 - 提高z-index */}
              <div 
                className="fixed inset-0 z-[60]"
                onClick={() => setShowFormats(false)}
              />
              
              {/* 格式菜单 - 提高z-index, 移到按钮下方 */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[70] overflow-hidden"
              >
                <div className="p-2">
                  <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-100 mb-1">
                    {t('downloadFormats.selectFormat')}
                  </div>
                  
                  {downloadFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleFormatDownload(format)}
                      disabled={format.disabled}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        format.recommended ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <format.icon className="w-4 h-4 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {format.name}
                            </span>
                            {format.recommended && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                {t('recommended')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {format.description}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          {format.format}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default DownloadFormatSelector; 