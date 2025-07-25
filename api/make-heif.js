// Vercel Serverless Function: /api/make-heif
// -------------------------
// 接收 multipart/form-data：mask.png
// TODO: 在生产环境中还需同时上传原始视频或从固定路径读取
// 返回生成的 .heic 文件流

import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';

const exec = promisify(execFile);
export const config = {
  api: {
    bodyParser: false, // 让 formidable 处理 multipart
    sizeLimit: '100mb'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 1. 解析 multipart
    const data = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const maskFile = data.files?.mask;
    if (!maskFile) {
      return res.status(400).json({ error: 'mask file required' });
    }

    let meta = null;
    if (data.fields?.meta) {
      try { meta = JSON.parse(data.fields.meta); } catch (_) {}
    }

    // 2. 准备临时目录
    const tmpDir = path.join('/tmp', `labubu_${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const maskPath = path.join(tmpDir, 'mask.png');
    await fs.copyFile(maskFile.filepath, maskPath);

    // 3. 读取固定视频并获取元数据
    const videoSrc = path.join(process.cwd(), 'public', 'Labubu-White-Suit-Flashlight-iPhone-Dynamic-Lockscreen%2CLabubu-Live-Wallpaper.mov');
    const outputMp4 = path.join(tmpDir, 'output.mp4');

    // 获取视频信息（时长、帧率等）
    let videoDuration = 10; // 默认值
    let fps = 30;
    
    try {
      const probeResult = await exec(ffmpegPath, [
        '-i', videoSrc, 
        '-f', 'null', 
        '-'
      ], { timeout: 10000 }).catch(e => e);
      
      // 从 stderr 解析时长和帧率
      const output = probeResult.stderr || '';
      const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+)\.(\d+)/);
      const fpsMatch = output.match(/(\d+(?:\.\d+)?) fps/);
      
      if (durationMatch) {
        const [, hours, minutes, seconds, ms] = durationMatch;
        videoDuration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms) / 100;
      }
      if (fpsMatch) {
        fps = parseFloat(fpsMatch[1]);
      }
    } catch (probeError) {
      console.warn('Failed to probe video, using defaults:', probeError.message);
    }

    // 计算覆盖时间区间
    let overlayFilter = '[1:v]format=rgba[ov];[0:v][ov]overlay';
    if (meta?.startFrame !== undefined && meta?.endFrame !== undefined) {
      const start = meta.startFrame / fps;
      const end = meta.endFrame / fps;
      
      // 确保时间范围有效
      const safeStart = Math.max(0, start);
      const safeEnd = Math.min(videoDuration, end);
      
      overlayFilter += `:enable='between(t\,${start}\,${end})'`;
      
      console.log(`Applying overlay from ${safeStart}s to ${safeEnd}s (frames ${meta.startFrame}-${meta.endFrame} @ ${fps}fps)`);
    }

    await exec(ffmpegPath, [
      '-i', videoSrc,
      '-i', maskPath,
      '-filter_complex', overlayFilter,
      '-c:v', 'libx265', '-x265-params', 'hevc-aq=1',
      '-movflags', '+faststart',
      '-y', outputMp4
    ]);

    // 检查输出文件是否生成成功
    try {
      await fs.access(outputMp4);
    } catch (accessError) {
      throw new Error('Video processing failed - output file not generated');
    }

    // 4. 返回处理后的视频 (TODO: 后续可用 libheif 封装为 HEIF)
    const fileBuf = await fs.readFile(outputMp4);
    
    // 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true });
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="labubu-output.mp4"');
    res.setHeader('Content-Length', fileBuf.length);
    res.send(fileBuf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: err.message,
      timestamp: new Date().toISOString() 
    });
  }
} 