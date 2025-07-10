import { useState, useEffect, useRef } from 'react';

/**
 * Intersection Observer Hook
 * 检测元素是否在视窗内，用于移动端视频自动播放
 */
export const useIntersectionObserver = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef(null);

  const defaultOptions = {
    threshold: 0.5, // 元素50%进入视窗时触发
    rootMargin: '0px',
    ...options
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting;
      setIsInView(inView);
      setIsIntersecting(inView);
      
      // 静默检测
    }, defaultOptions);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [defaultOptions.threshold, defaultOptions.rootMargin]);

  return [elementRef, isInView, isIntersecting];
};

/**
 * 视频自动播放Hook
 * 结合视窗检测和设备类型，智能控制视频播放
 */
export const useVideoAutoPlay = (item, isMobile = false) => {
  const [videoRef, isInView] = useIntersectionObserver({
    threshold: 0.6, // 60%进入视窗时开始播放
    rootMargin: '-10% 0px -10% 0px' // 上下留10%边距，确保在主视角
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const internalVideoRef = useRef(null);

  // 🎯 自动播放策略：移动端基于视窗，桌面端基于hover
  useEffect(() => {
    if (isMobile) {
      // 📱 移动端：进入主视角自动播放
      setShouldAutoPlay(isInView);
    }
  }, [isInView, isMobile, item.id]);

  // 🎮 执行播放/暂停
  useEffect(() => {
    const video = internalVideoRef.current;
    if (!video || item.type !== 'video') return;

    const handlePlay = async () => {
      if (shouldAutoPlay && !isPlaying) {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.warn(`❌ 视频 ID ${item.id} 播放失败:`, error.message);
        }
      }
    };

    const handlePause = () => {
      if (!shouldAutoPlay && isPlaying) {
        video.pause();
        setIsPlaying(false);
      }
    };

    if (shouldAutoPlay) {
      handlePlay();
    } else {
      handlePause();
    }
  }, [shouldAutoPlay, isPlaying, item.id, item.type]);

  // 🎯 桌面端hover控制
  const handleDesktopHover = (isHovered) => {
    if (!isMobile) {
      setShouldAutoPlay(isHovered);
    }
  };

  return {
    containerRef: videoRef, // 用于视窗检测的容器ref
    videoRef: internalVideoRef, // 视频元素ref
    isInView,
    isPlaying,
    shouldAutoPlay,
    handleDesktopHover
  };
}; 