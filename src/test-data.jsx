import React from 'react';
import { galleryData, categories, stats } from './data/galleryData';

/**
 * 数据测试组件 - 验证数据是否正确加载
 */
const TestData = () => {
  const videos = galleryData.filter(item => item.type === 'video');
  const images = galleryData.filter(item => item.type === 'image');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 数据加载测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>📊 统计信息</h2>
        <ul>
          <li>总项目数: <strong>{stats.total}</strong></li>
          <li>图片数量: <strong>{stats.images}</strong></li>
          <li>视频数量: <strong>{stats.videos}</strong></li>
          <li>分类数量: <strong>{stats.categories}</strong></li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🏷️ 分类配置</h2>
        <ul>
          {categories.map(cat => (
            <li key={cat.key}>
              {cat.icon} {cat.label}: <strong>{cat.count}</strong>个
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🎬 视频样本 ({videos.length}个)</h2>
        {videos.slice(0, 3).map(video => (
          <div key={video.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <strong>ID {video.id}:</strong> {video.title}<br/>
            <small>分类: {video.category} | 格式: {video.format} | 标签: {video.tags.join(', ')}</small>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📸 图片样本 ({images.length}个)</h2>
        {images.slice(0, 3).map(image => (
          <div key={image.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <strong>ID {image.id}:</strong> {image.title}<br/>
            <small>分类: {image.category} | 分辨率: {image.resolution} | 标签: {image.tags.join(', ')}</small>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>🔍 数据验证</h2>
        <ul>
          <li>数据数组长度: <strong>{galleryData.length}</strong></li>
          <li>实际图片数: <strong>{images.length}</strong></li>
          <li>实际视频数: <strong>{videos.length}</strong></li>
          <li>数据完整性: <strong>{galleryData.length === stats.total ? '✅ 正确' : '❌ 错误'}</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default TestData;
