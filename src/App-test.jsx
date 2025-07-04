import React, { useState, useEffect } from 'react';
import { testData } from './data/testData.js';

/**
 * 测试版App组件 - 使用小数据集
 */
function TestApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      console.log('Loading test data...', testData);
      setTimeout(() => {
        setItems(testData);
        setLoading(false);
        console.log('Test data loaded successfully');
      }, 500);
    } catch (err) {
      console.error('Error loading test data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>❌ 加载错误</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#fafafa',
        minHeight: '100vh'
      }}>
        <h1>⏳ 加载中...</h1>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0096fa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🐰 Labubu画廊测试版
      </h1>
      
      <p style={{ marginBottom: '20px', color: '#666' }}>
        ✅ 成功加载 {items.length} 个测试项目
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {items.map(item => (
          <div 
            key={item.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <img 
              src={item.url}
              alt={item.title}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{ display: 'none', height: '200px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              图片加载失败
            </div>
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
                {item.title}
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {item.category}
                </span>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#f3e5f5',
                  color: '#7b1fa2',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {item.resolution}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestApp;
