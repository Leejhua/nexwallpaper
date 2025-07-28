/**
 * 简化版视口优先级配置
 * 专注于快速加载而不是复杂的优先级计算
 */

/**
 * 🎯 简化配置 - 禁用复杂的视口优先级
 */
export const viewportPriorityConfig = {
  // 禁用复杂的视口优先级功能
  enabled: false,
  
  // 保留基础配置用于兼容性
  thresholds: {
    visible: 0.1,     // 10%可见时触发
    preload: 600      // 600px预加载区域
  },
  
  // 简化的优先级规则
  priorities: {
    manual: 100,      // 用户手动操作
    visible: 50,      // 视口内可见
    preload: 0,       // 预加载
    background: -10   // 后台加载
  },
  
  // 禁用动态重新排序
  enableDynamicReorder: false,
  
  // 使用FIFO队列策略
  queueStrategy: 'fifo'
};

/**
 * 🚀 获取简化的优先级 - 只区分用户操作和自动加载
 */
export const getSimplePriority = (type = 'auto') => {
  switch (type) {
    case 'manual':
    case 'click':
    case 'user':
      return viewportPriorityConfig.priorities.manual;
    
    case 'visible':
    case 'viewport':
      return viewportPriorityConfig.priorities.visible;
    
    case 'preload':
      return viewportPriorityConfig.priorities.preload;
    
    default:
      return viewportPriorityConfig.priorities.background;
  }
};

/**
 * 📏 简化的距离计算 - 只判断是否在视口内
 */
export const isInViewport = (element) => {
  if (!element) return false;
  
  try {
    const rect = element.getBoundingClientRect();
    const threshold = viewportPriorityConfig.thresholds.preload;
    
    return (
      rect.top >= -threshold &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight + threshold &&
      rect.right <= window.innerWidth
    );
  } catch (error) {
    console.warn('视口检测失败:', error);
    return false;
  }
};

/**
 * 🔧 简化的配置获取
 */
export const getViewportConfig = () => {
  return {
    enabled: viewportPriorityConfig.enabled,
    strategy: viewportPriorityConfig.queueStrategy,
    preloadDistance: viewportPriorityConfig.thresholds.preload
  };
}; 