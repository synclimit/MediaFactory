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

  // Load Background Image if available
  let bgImg = null;
  const bgObj = payload.background || (payload.bgPool && payload.bgPool[0]) || {};
  const bgPath = bgObj.sourcePath || bgObj.uri;
  if (bgPath && fs.existsSync(bgPath)) {
    try {
      bgImg = await loadImage(bgPath);
      job.logs.push(`[M3 V2] Loaded background image: ${bgPath}`);
    } catch (e) {
      console.warn('[M3 V2] Failed to load background image:', e.message);
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

  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    const timeSec = frameIdx / fps;
    const audioState = VisualizerV4Audio.generateSyntheticState(timeSec, 64);

    // 0. Clear canvas frame
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height);
      const darkness = bgObj.settings?.overlayDarkness !== undefined ? bgObj.settings.overlayDarkness : 30;
      if (darkness > 0) {
        ctx.fillStyle = `rgba(0,0,0,${darkness / 100})`;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw all Visualizer V4 Objects
    for (const obj of objects) {
      if (obj.visible === false) continue;
      if (obj.type === 'visualizer4' || obj.type?.includes('visualizer')) {
        const ox = Math.round(obj.x !== undefined ? obj.x - (obj.width || 800) / 2 : (width - 800) / 2);
        const oy = Math.round(obj.y !== undefined ? obj.y - (obj.height || 300) / 2 : (height - 300) / 2);
        const ow = Math.round(obj.width || 800);
        const oh = Math.round(obj.height || 300);

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
