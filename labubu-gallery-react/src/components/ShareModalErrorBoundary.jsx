import React from 'react';

/**
 * ShareModal错误边界组件
 * 防止分享功能错误导致整个应用白屏
 */
class ShareModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ShareModal Error Boundary caught an error:', error, errorInfo);
    
    // 可以将错误日志上报给错误监控服务
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `ShareModal Error: ${error.message}`,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // 降级UI - 显示简单的错误信息而不是白屏
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                分享功能暂时不可用
              </h3>
              <p className="text-gray-600 mb-4">
                抱歉，分享功能遇到了问题。请刷新页面后重试。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  刷新页面
                </button>
                <button
                  onClick={this.props.onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ShareModalErrorBoundary;
