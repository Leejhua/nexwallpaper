import { useState, useCallback } from 'react';
import { useScrollPosition } from './useScrollPosition';

/**
 * 模态框管理Hook - 修复属性名匹配问题
 * 处理图片/视频预览功能，支持滚动位置记忆
 */
export const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // 修改属性名匹配App.jsx
  const [selectedItem, setSelectedItem] = useState(null); // 修改属性名匹配App.jsx
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();

  // 打开模态框
  const openModal = useCallback((item) => {
    // 💾 打开详情页前保存当前滚动位置
    saveScrollPosition();
    
    setSelectedItem(item);
    setIsModalOpen(true);
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
  }, [saveScrollPosition]);

  // 关闭模态框
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
    // 恢复背景滚动
    document.body.style.overflow = 'unset';
    
    // 🔄 多阶段恢复，确保状态完全恢复
    setTimeout(() => {
      // 第一阶段：等待Modal完全关闭
      requestAnimationFrame(() => {
        // 第二阶段：等待DOM更新完成
        setTimeout(() => {
          restoreScrollPosition();
        }, 50);
      });
    }, 150); // 增加初始延迟
  }, [restoreScrollPosition]);

  // 下载文件
  const downloadFile = useCallback((url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'nexwallpaper';
      link.target = '_blank';
      link.rel = 'noopener noreferrer'; // 安全性优化
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // 如果下载失败，尝试在新窗口打开
      window.open(url, '_blank');
    }
  }, []);

  return {
    isModalOpen, // 匹配App.jsx中的使用
    selectedItem, // 匹配App.jsx中的使用
    openModal,
    closeModal,
    downloadFile
  };
};
