const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let _canvasMod = null;
function getCanvas() {
  if (!_canvasMod) {
    try {
      _canvasMod = require('canvas');
    } catch (e) {
      console.warn('[M3 V2] Warning: canvas native module failed to load:', e.message);
    }
  }
  return _canvasMod;
}

let VisualizerV4Core = null;
let VisualizerV4Audio = null;

async function loadV4Modules() {
  if (!VisualizerV4Core) {
    const coreMod = await import('../../src/visualizers/v4/VisualizerV4Core.js');
    VisualizerV4Core = coreMod.VisualizerV4Core;
  }
  if (!VisualizerV4Audio) {
    const audioMod = await import('../../src/visualizers/v4/VisualizerV4Audio.js');
    VisualizerV4Audio = audioMod.VisualizerV4Audio;
  }
}

// In-Memory Render Job Tracker
const activeJobs = new Map();

/**
 * POST /api/m3_v2/verify-parity
 */
router.post('/verify-parity', async (req, res) => {
  try {
    await loadV4Modules();
    const canvasMod = getCanvas();
    if (!canvasMod) throw new Error('Canvas native module unavailable');
    const { createCanvas } = canvasMod;
    const { config = {}, timestamp = 1.0, width = 800, height = 300 } = req.body;
    const w = parseInt(width, 10) || 800;
    const h = parseInt(height, 10) || 300;

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    const audioState = VisualizerV4Audio.generateSyntheticState(timestamp, 64);
    VisualizerV4Core.renderFrame(ctx, w, h, audioState, config);

    const dataUrl = canvas.toDataURL('image/png');
    return res.json({ success: true, dataUrl, width: w, height: h, timestamp });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m3_v2/render/:id
 */
router.get('/render/:id', (req, res) => {
  const job = activeJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json({
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    OUTPUT_PATH: job.OUTPUT_PATH,
    FILE_SIZE: job.FILE_SIZE,
    RENDER_DURATION: job.RENDER_DURATION,
    logs: job.logs.join('\n')
  });
});

/**
 * POST /api/m3_v2/render
 */
router.post('/render', async (req, res) => {
  try {
    await loadV4Modules();
    const jobData = req.body;
    const jobId = jobData.id || ('m3v2_q_' + Date.now());

    const job = {
      id: jobId,
      status: 'Rendering',
      progress: 5,
      stage: 'Initializing V4 Pipeline',
      logs: ['[M3 V2] Single Pure Engine render job started...']
    };
    activeJobs.set(jobId, job);

    // Run export in background
    executeV4Render(jobId, jobData).catch(err => {
      console.error('[M3 V2 Render Error]:', err);
      job.status = 'FAILED';
      job.logs.push(`[ERROR] ${err.message}`);
    });

    return res.json({ success: true, jobId, message: 'Render started' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function executeV4Render(jobId, jobData) {
  const startTime = Date.now();
  const job = activeJobs.get(jobId);
  const payload = jobData.m3Payload || jobData;
  const objects = payload.objects || payload.m3Objects || [];
  const width = 1920;
  const height = 1080;
  const fps = 30;
  const durationSec = Math.max(5, Math.min(60, payload.totalDurationSec || 10));
  const totalFrames = Math.round(durationSec * fps);

  // Setup Output Directory
  const outputFolder = jobData.outputFolder || path.join(process.cwd(), 'Output', 'M3_V2');
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
  const outputFilename = payload.outputFilename || 'M3_V2_Visualizer_Render.mp4';
  const outputPath = path.join(outputFolder, outputFilename);

  job.stage = 'Rendering Frames';
  job.logs.push(`[M3 V2] Total Frames: ${totalFrames} (${durationSec}s @ ${fps}fps) -> ${outputPath}`);

  const canvasMod = getCanvas();
  if (!canvasMod) throw new Error('Canvas native module unavailable');
  const { createCanvas, loadImage } = canvasMod;

  // Load Background Image if available (support Disk Path, Stream URL, and Base64 Data URL)
  let bgImg = null;
  const bgObj = payload.background || (payload.m3BgPool && payload.m3BgPool[0]) || (payload.bgPool && payload.bgPool[0]) || {};
  let bgPath = bgObj.sourcePath || bgObj.uri || bgObj.url || bgObj.preview || bgObj.filename;
  
  if (bgPath && typeof bgPath === 'string') {
    if (bgPath.includes('/api/m2/stream?uri=')) {
      const match = bgPath.match(/uri=([^&]+)/);
      if (match) bgPath = decodeURIComponent(match[1]);
    }
  }

  if (bgPath && typeof bgPath === 'string' && bgPath.startsWith('data:')) {
    try {
      const base64Data = bgPath.split(';base64,').pop();
      const buf = Buffer.from(base64Data, 'base64');
      bgImg = await loadImage(buf);
      job.logs.push(`[M3 V2] Loaded base64 background image`);
    } catch (e) {
      console.warn('[M3 V2] Failed to load base64 background:', e.message);
    }
  } else if (bgPath && typeof bgPath === 'string') {
    let resolvedBgPath = bgPath;
    if (!fs.existsSync(resolvedBgPath)) {
      const candidates = [
        path.resolve(bgPath),
        path.resolve('public', bgPath),
        path.resolve('public/assets', bgPath),
        path.resolve('public/assets/Backgrounds', bgPath)
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) { resolvedBgPath = cand; break; }
      }
    }

    if (fs.existsSync(resolvedBgPath)) {
      try {
        bgImg = await loadImage(resolvedBgPath);
        job.logs.push(`[M3 V2] Loaded background image: ${resolvedBgPath}`);
      } catch (e) {
        console.warn('[M3 V2] Failed to load background image:', e.message);
      }
    } else {
      console.warn('[M3 V2] Background path not found on disk:', bgPath);
    }
  }

  // FFmpeg Path resolution
  const ffmpegPath = path.join(process.cwd(), 'backend', 'bin', 'ffmpeg.exe');
  const bin = fs.existsSync(ffmpegPath) ? ffmpegPath : 'ffmpeg';

  const ffmpegArgs = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'bgra',
    '-s', `${width}x${height}`,
    '-r', `${fps}`,
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    outputPath
  ];

  const ffmpeg = spawn(bin, ffmpegArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const parseCoord = (val, stageDim, defaultCenter) => {
    if (val === undefined || val === null || val === '') return defaultCenter;
    const str = String(val).trim();
    if (str.endsWith('%')) {
      const pct = parseFloat(str);
      return isNaN(pct) ? defaultCenter : (pct / 100) * stageDim;
    }
    const num = parseFloat(str);
    if (isNaN(num)) return defaultCenter;
    if (num <= 1.0 && num > 0) return num * stageDim;
    return num;
  };

  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    const timeSec = frameIdx / fps;
    const audioState = VisualizerV4Audio.generateSyntheticState(timeSec, 64);

    // 0. Clear canvas frame
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height);
      const darkness = bgObj.settings?.overlayDarkness !== undefined ? bgObj.settings.overlayDarkness : (bgObj.overlayDarkness !== undefined ? bgObj.overlayDarkness : 30);
      if (darkness > 0) {
        ctx.fillStyle = `rgba(0,0,0,${darkness / 100})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw all Visualizer V4 / V3 / V2 Objects
    for (const obj of objects) {
      if (obj.visible === false) continue;
      if (obj.type === 'visualizer4' || obj.type?.includes('visualizer') || obj.type === 'spectrum') {
        const ow = Math.round(parseCoord(obj.width, width, 800));
        const oh = Math.round(parseCoord(obj.height, height, 300));
        const cx = parseCoord(obj.x, width, width / 2);
        const cy = parseCoord(obj.y, height, height / 2);

        const ox = Math.round(cx - ow / 2);
        const oy = Math.round(cy - oh / 2);

        ctx.save();
        ctx.translate(ox, oy);
        VisualizerV4Core.renderFrame(ctx, ow, oh, audioState, obj);
        ctx.restore();
      }
    }

    // Write raw BGRA buffer to FFmpeg stdin
    const rawBuf = canvas.toBuffer('raw');
    if (!ffmpeg.stdin.write(rawBuf)) {
      await new Promise(r => ffmpeg.stdin.once('drain', r));
    }

    job.progress = Math.round(5 + (frameIdx / totalFrames) * 90);
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
    ffmpeg.on('error', reject);
  });

  const renderDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const fileSize = fs.existsSync(outputPath) ? (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2) : '0';

  job.status = 'COMPLETED';
  job.progress = 100;
  job.stage = 'Done';
  job.OUTPUT_PATH = outputPath;
  job.FILE_SIZE = fileSize;
  job.RENDER_DURATION = renderDuration;
  job.logs.push(`[M3 V2 SUCCESS] Video exported: ${outputPath} (${fileSize} MB in ${renderDuration}s)`);
}

module.exports = router;
