import { detectDevice } from './shareUtils';

/**
 * 简化版加载配置 - 统一用户体验策略
 * 所有设备使用相同配置，专注于快速显示和平滑滚动
 */
export const getLoadingConfig = () => {
  // 🎯 统一配置：简单、快速、可靠
  // 🎯 按行加载：批量大小与列数配合，实现一行一行加载
  const getResponsiveBatchSize = () => {
    const width = window.innerWidth;
    if (width < 640) return 1;          // 移动端：1列 × 1行 = 1张
    else if (width < 1024) return 2;    // 平板：2列 × 1行 = 2张  
    else if (width < 1280) return 3;    // 小桌面：3列 × 1行 = 3张
    else return 4;                      // 大桌面：4列 × 1行 = 4张
  };
  
  const columnCount = getResponsiveBatchSize();
  
  return {
    initialBatch: columnCount * 3,      // 首屏3行（12、9、6、3张）
    batchSize: columnCount,             // 每批1行（按列数加载）
    threshold: 0.1,         // 统一阈值10%（合理触发）
    rootMargin: '600px',    // 统一预加载区域（1屏高度）
    preloadBatchSize: 3,    // 简化预加载（3张足够）
    maxConcurrent: 3,       // 简化并发控制（3张同时加载）
    
    // 📊 质量策略配置
    quality: {
      thumbnail: 'width=300,height=450,fit=cover,quality=70,format=auto',  // 闪电首屏
      standard: 'width=350,height=525,fit=cover,quality=80,format=auto',   // 标准显示
      high: 'width=400,height=600,fit=cover,quality=90,format=auto'        // 高质量版本
    },
    
    // ⚡ 无感知自动加载配置 - 极致连贯体验
    trigger: {
      scrollDistance: 2.5,    // 距离底部2.5屏时触发（超前加载）
      debounceDelay: 50,      // 滚动防抖50ms（极速响应）
      retryAttempts: 3,       // 失败重试3次
      upgradeDelay: 2000      // 用户停留2秒后升级画质
    }
  };
};

/**
 * 检查是否为移动设备（保留用于其他功能）
 */
export const isMobileDevice = () => {
  return detectDevice().isMobile;
};

/**
 * 获取图片URL模板
 */
export const getImageUrlTemplate = (quality = 'standard') => {
  const config = getLoadingConfig();
  return config.quality[quality] || config.quality.standard;
}; 