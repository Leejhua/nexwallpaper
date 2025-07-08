import React from 'react';

/**
 * 简化版App组件 - 用于排查白屏问题
 */
function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🐰 Labubu Gallery - 测试页面</h1>
      <p>如果你能看到这个页面，说明React应用基础功能正常。</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>基础测试：</h2>
        <ul>
          <li>✅ React组件渲染正常</li>
          <li>✅ JavaScript执行正常</li>
          <li>✅ 样式加载正常</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h3>下一步：</h3>
        <p>1. 检查这个页面是否正常显示</p>
        <p>2. 如果正常，我们将逐步恢复功能</p>
        <p>3. 如果异常，我们需要检查更基础的配置</p>
      </div>
      
      <button 
        onClick={() => alert('按钮点击正常！JavaScript事件正常工作。')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        测试JavaScript事件
      </button>
    </div>
  );
}

export default SimpleApp;
