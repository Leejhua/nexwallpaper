import React from 'react';

/**
 * 简化版App组件 - 用于排查白屏问题
 */
function SimpleApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🐰 Labubu画廊测试页面
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p>✅ React应用正常运行</p>
        <p>✅ 样式正常加载</p>
        <p>✅ 组件正常渲染</p>
        
        <button 
          onClick={() => alert('按钮点击正常')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0096fa',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          测试按钮
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;
