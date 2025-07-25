import { useState, useEffect } from 'react';

/**
 * 检测滚动方向的自定义Hook
 * @param {number} threshold - 触发滚动检测的阈值（像素）
 * @returns {Object} { scrollDirection, scrollY, isScrollingUp, isScrollingDown }
 */
export const useScrollDirection = (threshold = 10) => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      // 更新滚动位置
      setScrollY(currentScrollY);
      
      // 如果滚动距离超过阈值，更新滚动方向
      if (Math.abs(currentScrollY - lastScrollY) >= threshold) {
        setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
        setLastScrollY(currentScrollY);
      }
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    
    // 初始化滚动位置
    setScrollY(window.scrollY);
    setLastScrollY(window.scrollY);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [lastScrollY, threshold]);

  return {
    scrollDirection,
    scrollY,
    isScrollingUp: scrollDirection === 'up',
    isScrollingDown: scrollDirection === 'down'
  };
};