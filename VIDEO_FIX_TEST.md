# 视频文件显示问题修复测试

## 🎯 修复目标
解决ID: 85、ID: 100等视频文件"详情可看，卡片不可看"的问题。

## 📊 问题发现
通过数据质量分析发现：
- **41个视频文件**都存在问题：原始URL + 空备用URL
- **主要问题ID**：5, 6, 7, 9, 10, 85, 100等
- **根本原因**：视频文件没有智能降级策略

## 🛠️ 修复方案

### 1. 新增视频处理工具 (`src/utils/videoUtils.js`)
```javascript
// 🎥 为视频生成完整的URL降级链
const videoUrls = getCompleteVideoUrlChain(item);

// 📋 降级优先级：
// 1. 项目自带备用URL
// 2. 原始视频URL  
// 3. CDN压缩视频
// 4. 视频预览图（静态截图）
// 5. 小尺寸预览图
```

### 2. 改进视频加载策略
```javascript
// 🔧 智能预加载策略
preload={getVideoPreloadStrategy(item)} 
// 问题视频：只加载metadata（保守）
// 正常视频：auto（正常预加载）
```

### 3. 扩展调试信息
```javascript
// 🔍 专门针对问题视频ID的调试日志
if ([5, 6, 7, 9, 10, 85, 100].includes(item.id)) {
  console.log(`🎥 视频ID ${item.id} (问题视频) URL优先级:`, urlList);
}
```

## 📋 测试步骤

### 测试1：基础视频加载
1. 打开开发者工具控制台
2. 访问网站首页
3. 滚动查找ID 85和100的视频卡片
4. **期望**：
   - 控制台显示：`🎥 视频ID 85 (问题视频) URL优先级:`
   - 控制台显示：`🎥 视频ID 100 (问题视频) URL优先级:`
   - 视频卡片正常显示（缩略图或视频）

### 测试2：URL降级验证
1. 观察控制台中视频ID的URL优先级
2. **期望**：每个问题视频至少有3-4个降级URL
3. **检查URL类型**：
   ```
   🎥 视频ID 85 (问题视频) URL优先级:
   1. https://labubuwallpaper.com/Labubu-Angel-Playing-Lute... (原始视频)
   2. https://labubuwallpaper.com/cdn-cgi/image/width=640... (压缩视频)
   3. https://labubuwallpaper.com/cdn-cgi/image/width=400... (预览图)
   4. https://labubuwallpaper.com/cdn-cgi/image/width=200... (小预览图)
   ```

### 测试3：悬停播放测试
1. 悬停在视频卡片上
2. **期望**：视频开始播放（如果原始URL可用）
3. **降级处理**：如果视频失败，显示静态预览图
4. **性能优化**：问题视频使用保守的预加载策略

### 测试4：错误处理测试
1. 如果某个视频的所有URL都失败
2. **期望**：显示错误占位符，包含：
   - 视频图标
   - "已尝试 X/Y 个地址"信息
   - "重试下一个地址"按钮
   - 视频ID信息

### 测试5：详情页对比
1. 点击视频卡片进入详情页
2. **期望**：详情页中的视频能正常播放
3. **验证**：卡片和详情页使用相同的降级策略

## 🔍 预期控制台输出

### 正常情况
```
🎥 视频ID 85 (问题视频) URL优先级:
1. https://labubuwallpaper.com/Labubu-Angel-Playing-Lute%2CLabu-Angel-Playing-Lute%2CLabu...
2. https://labubuwallpaper.com/cdn-cgi/image/width=640,height=480,fit=cover...
3. https://labubuwallpaper.com/cdn-cgi/image/width=400,height=300,fit=cover...
4. https://labubuwallpaper.com/cdn-cgi/image/width=200,height=150,fit=cover...

🎥 视频ID 100 (问题视频) URL优先级:
1. https://labubuwallpaper.com/Labubu-and-the-Jellyfish%2CLabub-and-the-Jellyfish%2CLabub...
[类似的降级URL列表]
```

### 错误恢复
```
⚠️ 视频ID 85 第1个URL加载失败，尝试降级URL
✅ 视频ID 85 使用第3个URL（预览图）加载成功
```

## 🚨 特别关注的问题ID
根据数据分析，以下视频ID需要特别关注：
- **ID 5-10**: 早期视频文件
- **ID 85, 100**: 用户反馈的具体问题
- **ID 68-99**: 中文标题的动态壁纸

## 💡 后续优化建议
1. **批量URL健康检查**：定期检测视频URL可用性
2. **智能预加载**：根据网络状况调整视频预加载策略  
3. **缓存优化**：对成功的降级URL进行本地缓存
4. **用户反馈**：添加"报告问题"功能，收集URL失效信息

## ✅ 验收标准
- [x] 所有41个问题视频都有降级URL策略
- [x] 控制台显示详细的URL优先级调试信息
- [x] 视频卡片显示正常（视频或预览图）
- [x] 错误情况有友好的用户提示
- [x] 性能优化：问题视频使用保守预加载 