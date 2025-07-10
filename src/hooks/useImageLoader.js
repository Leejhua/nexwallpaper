import { useState, useCallback, useRef, useEffect } from 'react';
import { getLoadingConfig } from '../utils/loadingConfig';

// 简化版图片加载队列 - FIFO策略，专注于快速可靠
class SimpleImageLoadQueue {
  constructor() {
    const config = getLoadingConfig();
    this.maxConcurrent = config.maxConcurrent; // 3个并发
    this.currentLoading = 0;
    this.queue = [];
    this.loadingSet = new Set();
    this.retryAttempts = config.trigger.retryAttempts;
  }

  async addToQueue(imageUrl, priority = 0) {
    return new Promise((resolve, reject) => {
      const loadTask = {
        url: imageUrl,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
        attempts: 0
      };
      
      // 🎯 简化优先级策略：高优先级插到前面，其他按顺序排队
      if (priority > 0) {
        // 高优先级（用户点击等）插入到队列前部
        const insertIndex = this.queue.findIndex(task => task.priority <= 0);
        if (insertIndex === -1) {
          this.queue.push(loadTask);
        } else {
          this.queue.splice(insertIndex, 0, loadTask);
        }
      } else {
        // 普通优先级直接加到队列末尾（FIFO）
        this.queue.push(loadTask);
      }
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.currentLoading >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    this.currentLoading++;
    this.loadingSet.add(task.url);

    try {
      const result = await this.loadImage(task.url);
      task.resolve(result);
    } catch (error) {
      // 🔄 简化重试策略
      task.attempts++;
      if (task.attempts < this.retryAttempts) {
        // 重新加入队列，但优先级降低
        task.priority = Math.min(task.priority - 1, -10);
        this.queue.unshift(task); // 放到队列前面重试
      } else {
        console.warn(`❌ 图片加载失败，已达最大重试次数: ${task.url.substring(0, 50)}...`);
        task.reject(error);
      }
    } finally {
      this.currentLoading--;
      this.loadingSet.delete(task.url);
      
      // 🎯 修复时序问题：延迟处理下一个队列，等待图片真正渲染
      // 使用 requestAnimationFrame 确保DOM更新完成后再处理下一个
      requestAnimationFrame(() => {
        // 再添加一个短暂延迟，确保图片完全渲染
        setTimeout(() => {
          this.processQueue();
        }, 50);
      });
    }
  }

  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId = null;
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      // 设置加载超时（防止卡住）
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${url}`));
      }, 15000); // 15秒超时

      img.onload = () => {
        cleanup();
        
        // 🎯 修复：确保图片真正可以显示后再resolve
        // 检查图片是否真正加载完成（有尺寸信息）
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          // 🕐 关键修复：添加延迟确保图片解码和渲染准备完成
          // 这个延迟让浏览器有时间完成图片解码，为真正的DOM渲染做准备
          setTimeout(() => {
            resolve({
              url,
              width: img.naturalWidth,
              height: img.naturalHeight,
              element: img,
              timestamp: Date.now()
            });
          }, 25); // 25ms确保解码完成
        } else {
          // 如果没有尺寸信息，说明图片可能有问题
          reject(new Error(`Invalid image dimensions: ${url}`));
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  isLoading(url) {
    return this.loadingSet.has(url);
  }

  getQueueSize() {
    return this.queue.length;
  }

  getCurrentLoading() {
    return this.currentLoading;
  }

  // 🧹 简化清理方法
  clear() {
    this.queue = [];
    // 当前正在加载的会自然完成
  }
}

// 全局队列实例
const globalImageQueue = new SimpleImageLoadQueue();

/**
 * 简化版图片加载Hook - 专注于快速显示
 */
export const useImageLoader = () => {
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [loadedImages, setLoadedImages] = useState(new Map());

  // 🎯 简化的图片加载方法
  const loadImage = useCallback(async (url, priority = 0) => {
    if (!url) return null;

    // 如果已经加载过，直接返回
    if (loadedImages.has(url)) {
      return loadedImages.get(url);
    }

    // 如果正在加载，返回现有的Promise
    if (loadingStates.has(url)) {
      return loadingStates.get(url);
    }

    // 创建新的加载Promise
    const loadPromise = globalImageQueue.addToQueue(url, priority);

    // 更新加载状态
    setLoadingStates(prev => new Map(prev.set(url, loadPromise)));

    try {
      const result = await loadPromise;
      
      // 更新已加载状态
      setLoadedImages(prev => new Map(prev.set(url, result)));
      
      return result;
    } catch (error) {
      console.warn(`Image load failed: ${url.substring(0, 50)}...`, error.message);
      throw error;
    } finally {
      // 清理加载状态
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
    }
  }, [loadingStates, loadedImages]);

  // 🚀 简化的预加载方法
  const preloadImage = useCallback((url) => {
    if (!url || loadedImages.has(url) || loadingStates.has(url)) {
      return;
    }
    
    // 预加载使用最低优先级
    loadImage(url, -5).catch(() => {
      // 预加载失败不影响主流程
    });
  }, [loadImage, loadedImages, loadingStates]);

  // 📦 批量预加载（简化版）
  const preloadImages = useCallback((urls) => {
    const config = getLoadingConfig();
    
    urls.slice(0, config.preloadBatchSize).forEach((url, index) => {
      // 错开加载时间，避免同时请求
      setTimeout(() => {
        preloadImage(url);
      }, index * 200); // 200ms间隔
    });
  }, [preloadImage]);

  // 🔍 状态检查方法
  const isLoading = useCallback((url) => {
    return loadingStates.has(url) || globalImageQueue.isLoading(url);
  }, [loadingStates]);

  const isLoaded = useCallback((url) => {
    return loadedImages.has(url);
  }, [loadedImages]);

  // 📊 获取简化的队列状态
  const getQueueStatus = useCallback(() => {
    return {
      queueSize: globalImageQueue.getQueueSize(),
      currentLoading: globalImageQueue.getCurrentLoading(),
      maxConcurrent: globalImageQueue.maxConcurrent,
      totalLoaded: loadedImages.size
    };
  }, [loadedImages.size]);

  // 🧹 组件卸载时清理
  useEffect(() => {
    // 🔍 调试接口：将队列状态暴露到window对象
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.imageLoader = {
        getQueueStatus: () => ({
          queueSize: globalImageQueue.getQueueSize(),
          currentLoading: globalImageQueue.getCurrentLoading(),
          maxConcurrent: globalImageQueue.maxConcurrent,
          totalLoaded: loadedImages.size,
          loadingStates: loadingStates.size,
          // 队列详细信息
          queueDetails: globalImageQueue.queue?.slice(0, 5).map(task => ({
            url: task.url.substring(0, 50) + '...',
            priority: task.priority,
            attempts: task.attempts,
            timestamp: task.timestamp
          })) || []
        }),
        // 强制清理队列（调试用）
        clearQueue: () => globalImageQueue.clear(),
        // 获取队列实例（高级调试）
        getQueue: () => globalImageQueue
      };
    }
    
    return () => {
      globalImageQueue.clear();
      // 清理调试接口
      if (typeof window !== 'undefined' && window.imageLoader) {
        delete window.imageLoader;
      }
    };
  }, [loadedImages.size, loadingStates.size]);

  return {
    loadImage,
    preloadImage,
    preloadImages,
    isLoading,
    isLoaded,
    getQueueStatus,
    loadedCount: loadedImages.size
  };
}; 