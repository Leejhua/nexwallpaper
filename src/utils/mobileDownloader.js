/**
 * 移动端下载工具 - 适配iOS Safari、Android Chrome、微信等主流浏览器
 */

// 检测设备和浏览器类型
export const detectMobileEnvironment = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    // 操作系统检测
    iOS: /iphone|ipad|ipod/.test(userAgent),
    Android: /android/.test(userAgent),
    
    // 浏览器检测
    Safari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
    Chrome: /chrome/.test(userAgent),
    Firefox: /firefox/.test(userAgent),
    
    // 特殊环境检测
    WeChat: /micromessenger/.test(userAgent),
    QQ: /qq/.test(userAgent),
    UC: /ucbrowser/.test(userAgent),
    Baidu: /baidubrowser/.test(userAgent),
    
    // 设备类型
    isMobile: /mobile|android|iphone|ipad|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos|skyfire|puffin|blazer|bolt|gobrowser|iris|maemo|semc|teashark|uzard/.test(userAgent),
    isTablet: /ipad|android(?!.*mobile)|tablet|playbook|silk/.test(userAgent)
  };
};

// 创建移动端友好的下载提示
export const createMobileDownloadGuide = (url, filename, env) => {
  const messages = {
    iOS: {
      title: '📱 iOS 下载提示',
      content: `由于iOS限制，请按以下步骤操作：\n\n1. 点击"确定"打开新页面\n2. 长按图片/视频\n3. 选择"存储到相册"或"下载"\n\n文件名：${filename}`,
      action: () => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // 如果被拦截，尝试创建链接点击
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    },
    
    Android: {
      title: '🤖 Android 下载提示',
      content: `请按以下步骤操作：\n\n1. 点击"确定"打开新页面\n2. 长按文件\n3. 选择"下载"或"保存"\n\n如果无法下载，请尝试：\n- 使用Chrome浏览器\n- 检查下载权限设置\n\n文件名：${filename}`,
      action: () => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    
    WeChat: {
      title: '💬 微信浏览器下载',
      content: `微信内置浏览器限制下载，请：\n\n1. 点击右上角"..."菜单\n2. 选择"在浏览器中打开"\n3. 重新点击下载\n\n或者：\n1. 复制链接到剪贴板\n2. 在Safari/Chrome中访问\n\n文件名：${filename}`,
      action: () => {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(url).then(() => {
          alert('链接已复制到剪贴板！\n请在浏览器中粘贴访问');
        }).catch(() => {
          prompt('请复制此链接到浏览器中打开：', url);
        });
      }
    },
    
    default: {
      title: '📥 下载提示',
      content: `点击"确定"在新页面打开文件\n然后右键选择"另存为"\n\n文件名：${filename}`,
      action: () => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };
  
  // 选择合适的提示信息
  let guide;
  if (env.WeChat) {
    guide = messages.WeChat;
  } else if (env.iOS) {
    guide = messages.iOS;
  } else if (env.Android) {
    guide = messages.Android;
  } else {
    guide = messages.default;
  }
  
  return guide;
};

// 移动端下载主函数
export const mobileDownload = async (url, filename = 'download') => {
  const env = detectMobileEnvironment();
  
  // 清理文件名
  const cleanFilename = filename.replace(/[<>:"/\\|?*]/g, '_');
  
  try {
    // 方案1：现代浏览器先尝试标准下载
    if (!env.WeChat && !env.QQ && (env.Chrome || env.Firefox)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          
          // 创建下载链接
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = cleanFilename;
          link.style.display = 'none';
          
          // 添加触摸和点击事件处理
          link.onclick = () => {
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
              document.body.removeChild(link);
            }, 100);
          };
          
          document.body.appendChild(link);
          
          // 在移动端，需要模拟用户手势
          if (env.isMobile) {
            // 创建触摸事件来模拟用户手势，兼容性处理
            try {
              const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true
              });
              link.dispatchEvent(touchEvent);
            } catch (touchError) {
              // 某些浏览器不支持TouchEvent构造函数，使用MouseEvent
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
              });
              link.dispatchEvent(clickEvent);
            }
          }
          
          link.click();
          
          // 成功则返回
          return { success: true, method: 'blob' };
        }
      } catch (fetchError) {
        console.warn('Blob下载失败:', fetchError);
      }
    }
    
    // 方案2：尝试直接下载（适用于同域资源）
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = cleanFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 等待一下检查是否成功
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, method: 'direct' };
    } catch (directError) {
      console.warn('直接下载失败:', directError);
    }
    
    // 方案3：移动端引导下载
    const guide = createMobileDownloadGuide(url, cleanFilename, env);
    
    const userConfirmed = confirm(guide.content);
    
    if (userConfirmed) {
      guide.action();
      return { success: true, method: 'guide' };
    }
    
    return { success: false, method: 'cancelled' };
    
  } catch (error) {
    console.error('移动端下载失败:', error);
    
    // 最终降级方案：复制链接
    try {
      await navigator.clipboard.writeText(url);
      alert(`下载遇到问题，链接已复制到剪贴板\n请在浏览器中粘贴访问\n\n文件名：${cleanFilename}`);
      return { success: true, method: 'clipboard' };
    } catch (clipboardError) {
      // 最后的手动复制
      const userWantsCopy = confirm(`下载失败，是否复制链接手动下载？\n\n文件名：${cleanFilename}`);
      if (userWantsCopy) {
        prompt('请复制此链接:', url);
        return { success: true, method: 'manual' };
      }
      return { success: false, method: 'failed' };
    }
  }
};

// 检查下载能力
export const checkDownloadCapability = () => {
  const env = detectMobileEnvironment();
  
  return {
    canDownloadBlob: !env.iOS || (env.iOS && env.Chrome), // iOS Safari不支持blob下载
    canDownloadDirect: !env.WeChat && !env.QQ, // 微信/QQ浏览器限制
    needsGuide: env.iOS || env.WeChat || env.QQ, // 需要用户引导
    supportedMethods: [
      ...((!env.iOS || env.Chrome) ? ['blob'] : []),
      ...(!env.WeChat && !env.QQ ? ['direct'] : []),
      'guide',
      'clipboard'
    ]
  };
};

// 获取最佳下载策略
export const getBestDownloadStrategy = (url, filename) => {
  const env = detectMobileEnvironment();
  const capability = checkDownloadCapability();
  
  if (env.WeChat || env.QQ) {
    return {
      strategy: 'guide',
      message: '建议在浏览器中打开下载',
      requiresConfirm: true
    };
  }
  
  if (env.iOS && env.Safari) {
    return {
      strategy: 'guide', 
      message: '将在新页面打开，请长按保存',
      requiresConfirm: true
    };
  }
  
  if (capability.canDownloadBlob) {
    return {
      strategy: 'blob',
      message: '正在下载...',
      requiresConfirm: false
    };
  }
  
  return {
    strategy: 'guide',
    message: '将为您打开下载页面',
    requiresConfirm: true
  };
};

// 显示下载进度和状态
export const createDownloadStatus = (container) => {
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    min-width: 200px;
  `;
  
  const update = (message, isError = false) => {
    statusDiv.innerHTML = `
      <div style="margin-bottom: 10px;">
        ${isError ? '❌' : '📥'}
      </div>
      <div style="font-size: 14px;">
        ${message}
      </div>
    `;
    statusDiv.style.background = isError ? 'rgba(220, 38, 38, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  };
  
  const show = () => {
    (container || document.body).appendChild(statusDiv);
  };
  
  const hide = () => {
    if (statusDiv.parentNode) {
      statusDiv.parentNode.removeChild(statusDiv);
    }
  };
  
  return { update, show, hide };
}; 