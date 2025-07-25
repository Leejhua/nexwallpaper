const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use((req, res, next) => {
    res.setHeader('Connection', 'keep-alive');
    req.setTimeout(600000); // 10分钟超时
    res.setTimeout(600000);
    next();
});
const PORT = 9091;

app.use(cors());
app.use(express.json({ 
  limit: '100mb',
  extended: true,
  parameterLimit: 50000
}));
app.use(express.urlencoded({ 
  limit: '100mb', 
  extended: true,
  parameterLimit: 50000
}));
app.use(express.static('.'));

const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cropping: '两步处理版梯形裁切'
  });
});

// 创建梯形遮罩SVG
function createTrapezoidMask(polygon, width, height) {
  const points = polygon.map(p => `${p.x},${p.y}`).join(' ');
  
  const svgMask = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="trapezoidMask">
      <rect width="100%" height="100%" fill="black"/>
      <polygon points="${points}" fill="white"/>
    </mask>
  </defs>
  <rect width="100%" height="100%" fill="white" mask="url(#trapezoidMask)"/>
</svg>`;

  return svgMask;
}

// 执行FFmpeg命令的Promise包装
function runFFmpeg(args, description) {
  return new Promise((resolve, reject) => {
    console.log(`🎬 ${description}...`);
    console.log(`🔧 FFmpeg命令: ffmpeg ${args.join(' ')}`);
    const ffmpeg = spawn('ffmpeg', args);
    
    let ffmpegOutput = '';
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      ffmpegOutput += output;
      // 实时输出FFmpeg进度
      if (output.includes('time=') || output.includes('frame=')) {
        console.log(`📊 FFmpeg进度: ${output.trim()}`);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description}成功`);
        resolve();
      } else {
        console.error(`❌ ${description}失败 (退出码: ${code}):`);
        console.error(ffmpegOutput);
        reject(new Error(`${description}失败`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(`❌ ${description}启动失败:`, error);
      reject(error);
    });
  });
}

app.post('/generate-timed-video', async (req, res) => {
  console.log('📥 收到两步处理请求');
  console.log('📦 请求体大小:', JSON.stringify(req.body).length, '字符');
  
  try {
    const { images, beamData, timingData, imageTransform } = req.body;
    
    if (!images || !beamData || !timingData) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    console.log('📍 梯形坐标:', beamData.polygon);
    if (imageTransform) {
      console.log('🎛️ 用户调整参数:', imageTransform);
    }
    
    // 分析梯形形状
    const topLeft = beamData.polygon[0];
    const topRight = beamData.polygon[1];
    const bottomRight = beamData.polygon[2];
    const bottomLeft = beamData.polygon[3];
    
    const topWidth = topRight.x - topLeft.x;
    const bottomWidth = bottomRight.x - bottomLeft.x;
    const height = Math.max(bottomLeft.y, bottomRight.y) - Math.min(topLeft.y, topRight.y);
    
    console.log('🔺 梯形:', `顶部${topWidth}px, 底部${bottomWidth}px, 高度${height}px`);

    const inputVideo = './labubu-video.mov';
    if (!fs.existsSync(inputVideo)) {
      throw new Error('找不到输入视频文件');
    }

    const selectedImage = images[0];
    const imageBuffer = Buffer.from(selectedImage.data.split(',')[1], 'base64');
    const imagePath = path.join(tempDir, `input_${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, imageBuffer);

    // 创建梯形遮罩
    const maskSvg = createTrapezoidMask(beamData.polygon, beamData.width, beamData.height);
    const maskPath = path.join(tempDir, `trapezoid_mask_${Date.now()}.svg`);
    fs.writeFileSync(maskPath, maskSvg);

    const timestamp = Date.now();
    const fullVideoPath = path.join(tempDir, `full_${timestamp}.mp4`);
    const finalVideoPath = path.join(tempDir, `final_${timestamp}.mp4`);
    const outputFileName = `two_step_${timestamp}.mp4`;

    // 时间设置
    const startTime = timingData.effectStartTime || 0.5;
    const fadeInDuration = timingData.fadeTransition.fadeIn.duration || 0.8;
    const maxOpacity = timingData.fadeTransition.fadeIn.endOpacity || 0.5;
    const endTime = timingData.effectEndTime || 2.5;

    console.log('🎯 两步处理方案:');
    console.log('   步骤1: 生成完整5秒效果视频');
    console.log('   步骤2: 剪短到原视频长度');
    console.log(`   时间轴: ${startTime}s-${endTime}s`);

    try {
      // 步骤1: 生成完整的5秒效果视频
      const transform = imageTransform || { x: 0, y: 0, scale: 1.0 };
      
      // 🔧 关键修复：完整分析坐标转换链路
      // 
      // 前端预览逻辑分析：
      // 1. canvas尺寸：displayWidth = 300, displayHeight = 300 * aspectRatio
      // 2. 视频缩放：scale = displayWidth / videoWidth = 300 / beamData.width
      // 3. 用户变换：translate(displayWidth/2 + imageTransform.x, displayHeight/2 + imageTransform.y)
      // 4. 用户缩放：scale(imageTransform.scale, imageTransform.scale)
      // 5. 绘制图片：drawImage(userImageElement, -displayWidth/2, -displayHeight/2, displayWidth, displayHeight)
      //
      // 坐标转换链路：
      // - imageTransform.x/y 是相对于300px预览canvas的像素偏移
      // - 需要转换为相对于实际视频尺寸的偏移
      // - 转换公式：实际偏移 = 预览偏移 * (实际尺寸 / 预览尺寸)
      
      const displayWidth = 300; // 前端固定预览宽度
      const displayHeight = Math.round(displayWidth * (beamData.height / beamData.width));
      const centerX = beamData.width / 2;
      const centerY = beamData.height / 2;
      
      // 🔧 关键修复：分析"向左移动放大远大于向右移动"的问题
      // 
      // 问题分析：
      // 用户反馈向左移动的"放大"远大于向右移动，这表明坐标转换存在方向性问题
      // 
      // 前端预览坐标系统：
      // 1. canvas尺寸：displayWidth = 300, displayHeight = 300 * aspectRatio
      // 2. 用户变换：translate(displayWidth/2 + imageTransform.x, displayHeight/2 + imageTransform.y)
      // 3. imageTransform.x/y 是相对于canvas中心的像素偏移
      // 4. 正值向右/向下，负值向左/向上
      //
      // 坐标转换修复：
      // 问题可能在于我们直接按比例缩放偏移量，但没有考虑坐标系原点的差异
      // 前端以canvas中心为参考，FFmpeg以左上角为参考
      
      // 🔧 关键修复：完全重新理解坐标转换逻辑
      // 
      // 问题分析：用户反馈水平和垂直方向都有"放大"问题
      // 
      // 前端坐标系统：
      // 1. Canvas尺寸：300 x (300 * aspectRatio) = 300 x 533
      // 2. 视频尺寸：1080 x 1920
      // 3. 前端缩放比例：300/1080 = 0.278 (前端显示是实际的27.8%)
      // 4. API缩放比例：1080/300 = 3.6 (实际是前端的3.6倍)
      // 
      // 前端绘制逻辑：
      // - translate(displayWidth/2 + imageTransform.x, displayHeight/2 + imageTransform.y)
      // - drawImage(userImageElement, -displayWidth/2, -displayHeight/2, displayWidth, displayHeight)
      // 
      // 关键理解：
      // - imageTransform.x/y 是相对于300px canvas中心的像素偏移
      // - 这个偏移应该按照相同的比例转换到1080px视频
      // - 转换比例应该是 1080/300 = 3.6
      // 
      // 但是！问题可能在于我们对"偏移"的理解
      // 前端的偏移是相对于canvas中心的，API的偏移也应该相对于视频中心
      
      const frontendToVideoRatio = 1; // e.g., 1080 / 300 = 3.6
      
      // 直接按比例转换偏移量
      const actualOffsetX = transform.x * frontendToVideoRatio;  
      const actualOffsetY = transform.y * frontendToVideoRatio;  
      
      // 实际视频中的图片中心位置
      const videoCenterX = beamData.width / 2;   // 540
      const videoCenterY = beamData.height / 2;  // 960
      
      // 🔧 终极修复：所有坐标和缩放计算都在FFmpeg内部完成，以完全模拟前端逻辑
      // 1. `scale=${beamData.width}:-1` 模拟前端将图片fit到预览框宽度的行为
      // 2. `scale=iw*${transform.scale}:ih*${transform.scale}` 应用用户缩放
      // 3. `overlay=x='(W-w)/2 + ${actualOffsetX}'` 将图片中心对齐视频中心，并应用转换后的偏移
      
      console.log(`🎛️ 前端变换: 位置(${transform.x}, ${transform.y}), 缩放${transform.scale}x`);
      console.log(`📏 前端Canvas尺寸: ${displayWidth}x${displayHeight}`);
      console.log(`📺 实际视频尺寸: ${beamData.width}x${beamData.height}`);
      console.log(`🔢 转换比例: ${frontendToVideoRatio.toFixed(3)}`);
      console.log(`🔄 实际偏移: (${actualOffsetX.toFixed(1)}, ${actualOffsetY.toFixed(1)})`);
      console.log(`🎯 视频中心: (${videoCenterX}, ${videoCenterY})`);
      
      const step1Args = [
        '-y',
        '-i', inputVideo,
        '-i', imagePath,
        '-i', maskPath,
        '-filter_complex', [
          // 🔧 新流程：三步处理方案（修复标签冲突）
          // 步骤1: 处理图片 - 缩放、定位、应用梯形遮罩
          `[1:v]scale=${beamData.width}:-1[base_img]`, 
          `[base_img]scale=iw*${transform.scale}:ih*${transform.scale}[scaled_img]`, 
          `color=black:size=${beamData.width}x${beamData.height}:duration=5[bg]`, 
          `[bg][scaled_img]overlay=x='(W-w)/2+${actualOffsetX}':y='(H-h)/2+${actualOffsetY}'[positioned_img]`, 
          `[2:v]scale=${beamData.width}:${beamData.height}[img_mask]`, 
          `[positioned_img][img_mask]alphamerge[masked_img]`, 
          
          // 步骤2: 创建光束效果 - 中间清晰，两侧模糊白光
          // 创建白色基础光束
          `color=white:size=${beamData.width}x${beamData.height}:duration=5[light_base]`,
          // 水平渐变：中心完全不透明(255)，边缘完全透明(0)
          `[light_base]geq=r='255':g='255':b='255':a='255*max(0,1-2*abs(X/W-0.5))'[light_gradient]`,
          // 应用高斯模糊使两侧柔和扩散
          `[light_gradient]gblur=sigma=25[blurred_light]`,
          // 为光束创建独立的遮罩副本
          `[2:v]scale=${beamData.width}:${beamData.height}[light_mask]`,
          // 应用梯形遮罩
          `[blurred_light][light_mask]alphamerge[masked_light]`,
          
          // 步骤3: 图片与光束叠加形成复合图片
          // 先降低光束强度，然后使用screen混合模式实现柔和叠加
          `[masked_light]colorchannelmixer=aa=0.4[dimmed_light]`,
          `[masked_img][dimmed_light]overlay=0:0:eval=frame:format=auto[composite_img]`,
          
          // 步骤4: 复合图片转为视频流并添加渐出效果
          `[composite_img]loop=loop=-1:size=300:start=0[img_loop]`,
          // 渐入效果：从startTime开始，持续fadeInDuration
          `[img_loop]fade=t=in:st=${startTime}:d=${fadeInDuration}:alpha=1[fade_in]`,
          // 渐出效果：在视频结束前开始渐出
          `[fade_in]fade=t=out:st=${endTime-0.3}:d=0.3:alpha=1[fade_out]`,
          `[fade_out]format=yuva420p[final_composite]`,
          
          // 步骤5: 将复合图片覆盖到原视频上
          `[0:v][final_composite]overlay=0:0:enable='between(t,${startTime},${endTime})'[output]`
        ].join(';'),
        '-map', '[output]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-t', '5',  // 先生成完整5秒视频
        fullVideoPath
      ];

      await runFFmpeg(step1Args, '步骤1: 生成完整效果视频');

      // 步骤2: 剪短到原视频长度
      const step2Args = [
        '-y',
        '-i', fullVideoPath,
        '-t', '1.06',  // 剪短到原视频长度
        '-c', 'copy',  // 直接复制，不重新编码
        finalVideoPath
      ];

      await runFFmpeg(step2Args, '步骤2: 剪短视频');

      // 清理临时文件
      [imagePath, maskPath, fullVideoPath].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      if (fs.existsSync(finalVideoPath)) {
        const stats = fs.statSync(finalVideoPath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log('✅ 两步处理完成！');
        console.log(`🔺 完整效果已生成并剪短到1.06秒`);

        // 复制到公共目录
        const publicPath = path.join('.', outputFileName);
        fs.copyFileSync(finalVideoPath, publicPath);

        res.json({
          success: true,
          message: `两步处理成功！完整效果 + 短视频`,
          videoUrl: `/${outputFileName}`,
          fileName: outputFileName,
          fileSize: fileSizeKB + ' KB',
          timingInfo: {
            originalDuration: '5秒（完整效果）',
            finalDuration: '1.06秒（剪短后）',
            startTime: startTime + '秒',
            endTime: endTime + '秒',
            fadeInDuration: fadeInDuration + '秒',
            fadeOutDuration: '无渐出',
            maxOpacity: (maxOpacity * 100) + '%'
          },
          croppingInfo: {
            method: '两步处理梯形遮罩',
            shape: '向下收窄的梯形',
            topWidth: topWidth + 'px',
            bottomWidth: bottomWidth + 'px',
            height: height + 'px',
            coordinates: beamData.polygon,
            explanation: '先生成完整5秒效果，再剪短到原视频长度'
          },
          processingSteps: [
            '步骤1: 生成完整5秒梯形裁切效果',
            '步骤2: 剪短到1.06秒保持效果完整'
          ]
        });
      } else {
        throw new Error('最终视频文件未生成');
      }

    } catch (ffmpegError) {
      // 清理临时文件
      [imagePath, maskPath, fullVideoPath, finalVideoPath].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      throw ffmpegError;
    }

  } catch (error) {
    console.error('❌ 两步处理错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 两步处理API运行在: http://localhost:${PORT}`);
  console.log(`🎯 方案: 完整效果生成 → 剪短输出`);
  console.log(`⏰ 最终时长: 1.06秒（原视频长度）`);
  console.log(`✨ 效果: 保持完整梯形裁切效果`);
});
