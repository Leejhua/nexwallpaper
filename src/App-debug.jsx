import React, { useState, useEffect } from 'react';

/**
 * 调试版App组件 - 逐步排查问题
 */
function DebugApp() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // 测试数据加载
    try {
      console.log('Step 1: Testing data import...');
      import('./data/galleryData.js').then(module => {
        console.log('Step 2: Data loaded successfully:', module.galleryData?.length);
        setDataLoaded(true);
        setStep(2);
      }).catch(err => {
        console.error('Data loading failed:', err);
        setError('数据加载失败: ' + err.message);
      });
    } catch (err) {
      console.error('Import error:', err);
      setError('导入错误: ' + err.message);
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff' }}>
        <h1>❌ 错误信息</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1>🔍 Labubu画廊调试页面</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>调试步骤:</h2>
        <p>✅ Step 1: React应用启动</p>
        <p>{dataLoaded ? '✅' : '⏳'} Step 2: 数据加载 {dataLoaded && '(成功)'}</p>
        <p>当前步骤: {step}</p>
      </div>

      {step >= 2 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3>✅ 基础功能正常</h3>
          <button 
            onClick={() => setStep(3)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0096fa',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            测试下一步
          </button>
        </div>
      )}

      {step >= 3 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>🎯 准备加载完整组件</h3>
          <p>基础测试通过，可以尝试加载完整应用</p>
        </div>
      )}
    </div>
  );
}

export default DebugApp;
