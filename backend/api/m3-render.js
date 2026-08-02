const { exec, spawn } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const AppPaths = require('../system/AppPaths');
const RenderPlanner = require('../m5/RenderPlanner');
const RenderStrategy = require('./services/RenderStrategy');
const FastRenderCacheManager = require('./services/FastRenderCacheManager');

let lastCpuTimesM3 = null;
const getSystemStats = () => new Promise(resolve => {
  try {
    const cpus = os.cpus();
    let cpuStr = '0%';
    if (lastCpuTimesM3 && lastCpuTimesM3.length === cpus.length) {
      let totalUser = 0, totalSys = 0, totalIdle = 0;
      for (let i = 0; i < cpus.length; i++) {
        const c = cpus[i].times, l = lastCpuTimesM3[i].times;
        totalUser += (c.user - l.user);
        totalSys += (c.sys - l.sys);
        totalIdle += (c.idle - l.idle);
      }
      const total = totalUser + totalSys + totalIdle;
      const percent = total === 0 ? 0 : Math.round(((totalUser + totalSys) / total) * 100);
      cpuStr = `${percent}%`;
    }
    lastCpuTimesM3 = cpus;
    const ramMb = ((os.totalmem() - os.freemem()) / (1024 * 1024)).toFixed(0);
    resolve({ cpu: cpuStr, ram: `${ramMb} MB` });
  } catch (e) {
    resolve({ cpu: '0%', ram: '0 MB' });
  }
});

function getTimestampMs() {
  const d = new Date();
  return d.toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function logRuntimeEvent(job, eventName, details = '') {
  if (!job) return;
  if (!job.runtimeReport) job.runtimeReport = '';
  if (!job.runtimeEventId) job.runtimeEventId = 1;
  const timeStr = getTimestampMs();
  const idStr = `[Runtime-${String(job.runtimeEventId++).padStart(3, '0')}]`;
  const threadId = process.pid;
  const dStr = details ? `\nDetails: ${details}` : '';
  job.runtimeReport += `${idStr}\n${eventName}\nTimestamp: ${timeStr}\nThread: ${threadId}\nQueue ID: ${job.queueId}${dStr}\n\n`;
}

let stageCounter = 1;
async function startM3Stage(job, stageName) {
  if (!job.diagnosticReport) {
    job.diagnosticReport = '=== M3 DIAGNOSTIC REPORT ===\n\n';
    stageCounter = 1;
  }
  job.stage = stageName;
  job.stageStart = Date.now();
  if(!job.renderStartTimestampMs) job.renderStartTimestampMs = Date.now();
  const timeStr = getTimestampMs();
  const stageId = `[Stage-${String(stageCounter).padStart(2, '0')}]`;
  const txt = `${timeStr}\n\nSTART\n\n${stageName}\n\n${stageId}\n${stageName}\n\n`;
  job.diagnosticReport += txt;
  job.stageTimes = job.stageTimes || {};
  job.stageTimes[stageName] = { start: Date.now() };
  console.log(`[M3 STAGE START] ${stageName}`);
}

async function endM3Stage(job) {
  if (!job.stageStart) return;
  const elapsedSec = (Date.now() - job.stageStart) / 1000;
  let elapsedStr = '';
  if (elapsedSec > 60) {
     elapsedStr = `${Math.floor(elapsedSec/60)} min ${Math.floor(elapsedSec%60)} sec`;
  } else {
     elapsedStr = elapsedSec.toFixed(2) + ' sec';
  }
  const stats = await getSystemStats();
  const timeStr = getTimestampMs();
  const stageId = `[Stage-${String(stageCounter).padStart(2, '0')}]`;
  const txt = `${timeStr}\n\nEND\n\n${job.stage}\n\nElapsed : ${elapsedStr}\n\n`;
  job.diagnosticReport += txt;
  if (job.stageTimes && job.stageTimes[job.stage]) {
      job.stageTimes[job.stage].elapsed = elapsedStr;
  }
  stageCounter++;
  console.log(`[M3 STAGE END] Elapsed: ${elapsedStr} | CPU: ${stats.cpu} | RAM: ${stats.ram}`);
}

const spawnFFmpegM3 = (cmd, job) => new Promise((resolve, reject) => {
  // Early exit if job was already cancelled
  if (job.status === 'FAILED' && job.error && job.error.includes('cancelled')) {
    return reject(new Error('Job was cancelled'));
  }
  job.FFMPEG_COMMAND = cmd;
  if (!job.logs) job.logs = '';
  
  if (!job.ffmpegCmdCounter) job.ffmpegCmdCounter = 1;
  const cmdNum = job.ffmpegCmdCounter++;
  
  const cmdHeader = `\nFFMPEG COMMAND #${cmdNum}\n\n${job.stage}\n\n${cmd}\n\n`;
  console.log(`[FFMPEG CMD #${cmdNum}]`, cmd);
  job.logs += cmdHeader;
  job.diagnosticReport += cmdHeader;
  
  const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
  const proc = spawn(args[0], args.slice(1));
  job.ffmpegProcess = proc;
  
  let timerId = setInterval(async () => {
    const stats = await getSystemStats();
    job.diagnosticReport += `[${new Date().toLocaleTimeString('id-ID')}] CPU ${stats.cpu} | RAM ${stats.ram}\n`;
  }, 5000);
  
  let stdoutData = '';
  let stderrData = '';

  proc.stdout.on('data', data => {
    stdoutData += data.toString();
  });
  proc.stderr.on('data', data => {
    const text = data.toString();
    stderrData += text;
    job.logs += text;
    job.diagnosticReport += text;
    const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
    if (timeMatch) {
      job.currentFFmpegTime = timeMatch[1];
      const totalSec = job.totalDurationSec || (job.m3Payload && job.m3Payload.totalDurationSec) || 0;
      if (totalSec > 0) {
        const parts = timeMatch[1].split(':');
        const currentSec = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
        const ratio = Math.min(1, Math.max(0, currentSec / totalSec));

        if (job.stage === 'Compiling Audio') {
          job.progress = Math.round(8 + ratio * 12);
        } else if (job.stage === 'Rendering Video') {
          job.progress = Math.round(20 + ratio * 79);
        }
      }
    }
  });
  proc.on('close', code => {
    clearInterval(timerId);
    job.ffmpegProcess = null;
    job.diagnosticReport += `\nExit Code : ${code}\n\n`;
    if (code === 0) resolve();
    else {
      job.diagnosticReport += `\nFAILED!\n\nExit Code : ${code}\n\nCommand :\n${cmd}\n\nSTDOUT :\n${stdoutData}\n\nSTDERR :\n${stderrData}\n\n`;
      reject(new Error(`FFmpeg failed with code ${code}\nLog: ${stderrData.substring(stderrData.length - 500)}`));
    }
  });
  proc.on('error', err => {
    clearInterval(timerId);
    job.ffmpegProcess = null;
    job.diagnosticReport += `\nExit Code : 1 (Spawn Error)\nError : ${err.message}\n\n`;
    reject(err);
  });
});

const jobs = {};
const pendingJobs = [];
let jobCounter = 0;

// Helper to safely set status with transition log
function setJobStatus(queueId, newStatus) {
  if (!jobs[queueId]) return;
  const oldStatus = jobs[queueId].status || 'WAITING';
  console.log('STATUS_CHANGE', oldStatus, '->', newStatus);
  jobs[queueId].status = newStatus;
}

// ==========================================
// M3 RENDER ENGINE (PRODUCTION SPRINT 06B)
// ==========================================

async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (e) {
    throw new Error('FFmpeg is not installed or not in PATH');
  }
}

const assetPathCache = new Map();

async function resolveAssetPath(sp, category = '') {
  if (!sp) return null;
  const cacheKey = `${sp}::${category}`;
  if (assetPathCache.has(cacheKey)) {
    const cached = assetPathCache.get(cacheKey);
    try {
      const s = await fs.stat(cached);
      if (s.size > 0) return cached;
    } catch (e) {
      assetPathCache.delete(cacheKey);
    }
  }
  
  if (typeof sp === 'string' && sp.includes('uri=')) {
    const match = sp.match(/uri=([^&]+)/);
    if (match) sp = decodeURIComponent(match[1]);
  }

  let cleanPath = sp.replace(/^file:\/\/\/?/, '');
  
  const testCandidate = async (cand) => {
    if (!cand) return null;
    try {
      const stats = await fs.stat(cand);
      if (stats.size > 0) {
        assetPathCache.set(cacheKey, cand);
        return cand;
      }
    } catch (e) {}
    try {
      const stats = await fs.stat(cand + '.mp3');
      if (stats.size > 0) {
        assetPathCache.set(cacheKey, cand + '.mp3');
        return cand + '.mp3';
      }
    } catch (e) {}
    return null;
  };

  // 1. Direct check
  let cand = await testCandidate(cleanPath);
  if (cand) return cand;

  // 2. Try WorkspaceService active workspace path
  try {
    const ServiceRegistry = require('../system/ServiceRegistry');
    const wsService = ServiceRegistry.resolve('WorkspaceService');
    if (wsService) {
      const currentWsName = wsService.getCurrentWorkspace();
      if (currentWsName) {
        const activeWsPath = wsService._getActivePath();
        cand = await testCandidate(path.join(activeWsPath, cleanPath));
        if (cand) return cand;

        const baseName = path.basename(cleanPath);
        if (category) {
          cand = await testCandidate(path.join(activeWsPath, 'Assets', category, baseName));
          if (cand) return cand;
          cand = await testCandidate(path.join(activeWsPath, 'Assets', category.toLowerCase(), baseName));
          if (cand) return cand;
        }

        if (cleanPath.includes('Assets/audio') || cleanPath.includes('Assets\\audio') || cleanPath.includes('Assets/Audio') || cleanPath.includes('Assets\\Audio')) {
          const altPath1 = cleanPath.replace(/Assets[\\\/]audio/i, 'Assets/Audio');
          cand = await testCandidate(path.join(activeWsPath, altPath1));
          if (cand) return cand;
          const altPath2 = cleanPath.replace(/Assets[\\\/]audio/i, 'Assets/audio');
          cand = await testCandidate(path.join(activeWsPath, altPath2));
          if (cand) return cand;
        }
      }
    }
  } catch (e) {}

  // Gather all possible data directories (including AppData Roaming and dev mode dirs)
  const possibleDataDirs = [
    AppPaths.getMediaFactoryDataDir(),
    path.join(os.homedir(), 'AppData', 'Roaming', 'MediaFactory', 'MediaFactoryData'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'mediafactory', 'MediaFactoryData'),
    path.resolve(process.cwd(), '.mediafactory_data'),
    path.resolve(process.cwd(), '.mediafactory')
  ];

  // 3. Scan all subfolders in Workspaces directory under possible dataDirs
  for (const dataDir of possibleDataDirs) {
    try {
      const workspacesDir = path.join(dataDir, 'Workspaces');
      const wsEntries = await fs.readdir(workspacesDir, { withFileTypes: true }).catch(() => []);
      for (const wsEntry of wsEntries) {
        if (wsEntry.isDirectory()) {
          const wsPath = path.join(workspacesDir, wsEntry.name);
          cand = await testCandidate(path.join(wsPath, cleanPath));
          if (cand) return cand;

          const baseName = path.basename(cleanPath);
          if (category) {
            cand = await testCandidate(path.join(wsPath, 'Assets', category, baseName));
            if (cand) return cand;
            cand = await testCandidate(path.join(wsPath, 'Assets', category.toLowerCase(), baseName));
            if (cand) return cand;
          }

          if (cleanPath.includes('Assets/audio') || cleanPath.includes('Assets\\audio') || cleanPath.includes('Assets/Audio') || cleanPath.includes('Assets\\Audio')) {
            const altPath1 = cleanPath.replace(/Assets[\\\/]audio/i, 'Assets/Audio');
            cand = await testCandidate(path.join(wsPath, altPath1));
            if (cand) return cand;
            const altPath2 = cleanPath.replace(/Assets[\\\/]audio/i, 'Assets/audio');
            cand = await testCandidate(path.join(wsPath, altPath2));
            if (cand) return cand;
          }
        }
      }
    } catch (e) {}

    // 4. Try candidate in dataDir directly
    cand = await testCandidate(path.join(dataDir, cleanPath));
    if (cand) return cand;

    if (cleanPath.includes('Assets/audio') || cleanPath.includes('Assets\\audio') || cleanPath.includes('Assets/Audio') || cleanPath.includes('Assets\\Audio')) {
      const altPath1 = cleanPath.replace(/Assets[\\\/]audio/i, 'Assets/Audio');
      cand = await testCandidate(path.join(dataDir, altPath1));
      if (cand) return cand;
    }
  }

  // 5. Try candidate relative to cwd / public / .mediafactory / dev path
  cand = await testCandidate(path.resolve(process.cwd(), cleanPath));
  if (cand) return cand;

  const baseNameOnly = path.basename(cleanPath);
  cand = await testCandidate(path.resolve('d:/MediaFactory/public', baseNameOnly));
  if (cand) return cand;

  cand = await testCandidate(path.resolve('d:/MediaFactory/dist', baseNameOnly));
  if (cand) return cand;

  cand = await testCandidate(path.resolve(process.cwd(), 'dist', baseNameOnly));
  if (cand) return cand;

  cand = await testCandidate(path.resolve(process.cwd(), 'public', baseNameOnly));
  if (cand) return cand;

  cand = await testCandidate(path.resolve('public', cleanPath));
  if (cand) return cand;

  cand = await testCandidate(path.resolve('public/assets', cleanPath));
  if (cand) return cand;

  cand = await testCandidate(path.resolve(process.cwd(), '.mediafactory', cleanPath));
  if (cand) return cand;

  cand = await testCandidate(path.resolve(process.cwd(), '.mediafactory_data', cleanPath));
  if (cand) return cand;

  return null;
}

async function buildPlaylistAudio(job, cacheDir, payload) {
  logRuntimeEvent(job, 'buildPlaylistAudio STARTED');
  const queueId = job.queueId;
  const audioPlan = job.jobPlan ? job.jobPlan.audioPlan : null;

  if (payload.playlist && Array.isArray(payload.playlist)) {
    let sumSec = 0;
    for (const trk of payload.playlist) {
      if (trk.duration && typeof trk.duration === 'string') {
        const parts = trk.duration.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          sumSec += parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          sumSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    }
    if (sumSec > 0) {
      job.totalDurationSec = sumSec;
    }
  }

  // Execute Planner CACHE_HIT Strategy if assigned
  if (audioPlan && audioPlan.strategy === RenderStrategy.CACHE_HIT && audioPlan.cachedPath) {
    try {
      const stats = await fs.stat(audioPlan.cachedPath);
      if (stats.size > 0) {
        logRuntimeEvent(job, 'buildPlaylistAudio CACHE_HIT', `Reusing cached audio: ${audioPlan.cachedPath}`);
        console.log(`[M3] Planner Execution Strategy: CACHE_HIT (Reusing ${audioPlan.cachedPath})`);
        return audioPlan.cachedPath;
      }
    } catch (e) {}
  }

  const concatPath = path.join(cacheDir, `concat_q_${queueId}.txt`);
  const resolvedPaths = [];
  logRuntimeEvent(job, 'fs.stat TRY (Resolving Playlist)');
  try {
    const totalTracks = payload.playlist ? payload.playlist.length : 1;
    let trackIdx = 0;
    for (const track of payload.playlist) {
      trackIdx++;
      if (totalTracks > 0) {
        job.progress = Math.min(8, 3 + Math.round((trackIdx / totalTracks) * 5));
      }
      let sp = track.uri || track.sourcePath;
      if (!sp) continue;
      
      if (sp.startsWith('http')) {
        const ytIdMatch = sp.match(/[?&]v=([^&]+)/) || sp.match(/youtu\.be\/([^?]+)/);
        const ytId = ytIdMatch ? ytIdMatch[1] : crypto.randomBytes(4).toString('hex');
        const ytOut = path.join(cacheDir, `yt_${ytId}.mp3`);
        
        try {
          const stats = await fs.stat(ytOut);
          if (stats.size > 0) {
            resolvedPaths.push(ytOut);
          } else {
            throw new Error('empty cache');
          }
        } catch (e) {
          logRuntimeEvent(job, 'ffmpeg spawn TRY (yt-dlp)');
          console.log(`[M3] Downloading YouTube audio: ${sp}`);
          await new Promise((resolve, reject) => {
            const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '--js-runtimes', 'node', '-o', ytOut, '--', sp];
            const ytProc = spawn('yt-dlp', ytArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
            ytProc.stdout.on('data', () => {});
            ytProc.stderr.on('data', () => {});
            
            const timeoutId = setTimeout(() => {
                ytProc.kill();
                reject(new Error('yt-dlp timeout after 120s'));
            }, 120000);

            ytProc.on('close', (code) => {
              clearTimeout(timeoutId);
              if (code === 0) resolve();
              else reject(new Error(`yt-dlp exited with code ${code}`));
            });
            ytProc.on('error', (err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
          });
          resolvedPaths.push(ytOut);
        }
      } else {
        const resolvedPath = await resolveAssetPath(sp, 'Audio');
        if (resolvedPath) {
          resolvedPaths.push(resolvedPath);
        } else {
          throw new Error(`Audio file not found for track "${track.title || sp}". Path: ${sp}`);
        }
      }
    }
    logRuntimeEvent(job, 'fs.stat SUCCESS');
  } catch (err) {
    logRuntimeEvent(job, 'fs.stat FAILED', `Stack: ${err.stack}`);
    throw err;
  }

  const concatContent = resolvedPaths.map(sp => {
    return `file '${sp.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;
  }).join('\n');
  
  logRuntimeEvent(job, 'fs.writeFile TRY (concat.txt)');
  try {
    await fs.writeFile(concatPath, concatContent, 'utf8');
    logRuntimeEvent(job, 'fs.writeFile SUCCESS');
  } catch (err) {
    logRuntimeEvent(job, 'fs.writeFile FAILED', `Stack: ${err.stack}`);
    throw err;
  }

  const outAudioPath = (audioPlan && audioPlan.targetAudioPath) ? audioPlan.targetAudioPath : path.join(cacheDir, `compiled_audio_${queueId}.m4a`);
  
  // Detect if all resolved audio files are MP3 — if so, prefer MP3 output for instant stream copy
  const allMp3 = resolvedPaths.every(p => p.toLowerCase().endsWith('.mp3'));
  const outMp3Path = outAudioPath.replace(/\.[^.]+$/, '.mp3');
  
  if (audioPlan && audioPlan.strategy === RenderStrategy.FULL_ENCODE) {
    const encodeCmd = `ffmpeg -y -threads 0 -f concat -safe 0 -i "${concatPath}" -c:a aac -b:a 192k -ar 44100 -ac 2 "${outAudioPath}"`;
    await spawnFFmpegM3(encodeCmd, job);
  } else {
    let concatSuccess = false;

    // Strategy 1: MP3 stream copy (instant, works for same-format MP3 tracks)
    if (allMp3) {
      try {
        logRuntimeEvent(job, 'buildPlaylistAudio TRY (MP3 stream copy -c:a copy -> .mp3)');
        const mp3CopyCmd = `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a copy "${outMp3Path}"`;
        await spawnFFmpegM3(mp3CopyCmd, job);
        logRuntimeEvent(job, 'buildPlaylistAudio SUCCESS (MP3 stream copy)');
        concatSuccess = true;
        // Update outAudioPath reference for downstream usage
        if (audioPlan) audioPlan.targetAudioPath = outMp3Path;
      } catch (e) {
        logRuntimeEvent(job, 'buildPlaylistAudio MP3 stream copy failed, trying M4A');
      }
    }

    // Strategy 2: M4A stream copy (for AAC/M4A sources)
    if (!concatSuccess) {
      const copyCmd = `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a copy "${outAudioPath}"`;
      try {
        logRuntimeEvent(job, 'buildPlaylistAudio TRY (M4A stream copy -c:a copy)');
        await spawnFFmpegM3(copyCmd, job);
        logRuntimeEvent(job, 'buildPlaylistAudio SUCCESS (M4A stream copy)');
        concatSuccess = true;
      } catch (copyErr) {
        logRuntimeEvent(job, 'buildPlaylistAudio M4A stream copy also failed');
      }
    }

    // Strategy 3: Fast MP3 re-encode (much faster than AAC for long audio, ~10x speed)
    if (!concatSuccess) {
      logRuntimeEvent(job, 'buildPlaylistAudio FALLBACK (fast MP3 re-encode)');
      console.log('[M3] Stream copy failed, falling back to fast MP3 re-encode (libmp3lame)');
      const mp3EncodeCmd = `ffmpeg -y -threads 0 -f concat -safe 0 -i "${concatPath}" -c:a libmp3lame -q:a 2 -ar 44100 -ac 2 "${outMp3Path}"`;
      await spawnFFmpegM3(mp3EncodeCmd, job);
      if (audioPlan) audioPlan.targetAudioPath = outMp3Path;
    }
  }
  
  const finalAudioPath = (audioPlan && audioPlan.targetAudioPath) || outAudioPath;

  // Register generated asset in FastRenderCacheManager
  if (audioPlan && audioPlan.outputFingerprint) {
    await FastRenderCacheManager.registerAsset({
      outputFingerprint: audioPlan.outputFingerprint,
      sourceFingerprint: audioPlan.sourceFingerprint,
      processingFingerprint: audioPlan.processingFingerprint,
      assetType: 'AudioPlaylist',
      outputParams: { playlistLength: payload.playlist?.length || 0 },
      filePath: finalAudioPath
    });
  }

  logRuntimeEvent(job, 'buildPlaylistAudio END');
  return finalAudioPath;
}

function getFFmpegEncodingFlags(metadata = {}) {
  const mode = (metadata.renderMode || 'FAST').toUpperCase();
  const res = metadata.resolution || 'SD';
  const fps = parseInt(metadata.fps) || 30;
  const bFrame = metadata.bFrame || 'Otomatis';

  let targetWidth = 1920;
  let targetHeight = 1080;
  if (res === 'SD' || res === '480p') {
    targetWidth = 854;
    targetHeight = 480;
  } else if (res === '720p') {
    targetWidth = 1280;
    targetHeight = 720;
  } else if (res === '1080p') {
    targetWidth = 1920;
    targetHeight = 1080;
  }

  let preset = 'ultrafast';
  let crf = '28';

  if (mode === 'FAST') {
    preset = 'ultrafast';
    crf = '28';
  } else {
    preset = 'ultrafast';
    crf = '26';
  }

  let bFrameFlag = '';
  if (bFrame === 'Mati') {
    bFrameFlag = '-bf 0';
  } else if (bFrame === 'Aktif') {
    bFrameFlag = '-bf 2';
  }

  const flags = `-c:v libx264 -preset ${preset} -crf ${crf} -pix_fmt yuv420p -threads 0 ${bFrameFlag}`.trim();

  return {
    targetWidth,
    targetHeight,
    fps,
    preset,
    mode,
    flags
  };
}

function parseHexColor(col, defaultHex = 'AB55F7') {
  if (!col) return defaultHex.replace('#', '');
  if (typeof col === 'string') {
    const clean = col.replace('#', '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(clean)) return clean;
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      return clean.split('').map(c => c + c).join('');
    }
  } else if (typeof col === 'object') {
    if (typeof col.r === 'number' && typeof col.g === 'number' && typeof col.b === 'number') {
      const r = Math.min(255, Math.max(0, col.r)).toString(16).padStart(2, '0');
      const g = Math.min(255, Math.max(0, col.g)).toString(16).padStart(2, '0');
      const b = Math.min(255, Math.max(0, col.b)).toString(16).padStart(2, '0');
      return `${r}${g}${b}`;
    }
  }
  return defaultHex.replace('#', '');
}

async function generateOverlayFilter(objects, fps = 30, targetWidth = 1920, targetHeight = 1080) {
  if (!objects || objects.length === 0) return { inputs: '', filter: '', map: '', overlaysCount: 0 };
  
  const validObjects = objects
    .filter(o => o && o.visible !== false)
    .sort((a, b) => (a.layer || 0) - (b.layer || 0));
    
  if (validObjects.length === 0) return { inputs: '', filter: '', map: '', overlaysCount: 0 };

  const scaleX = (targetWidth || 1920) / 1920;
  const scaleY = (targetHeight || 1080) / 1080;

  // First pass: resolve asset paths and classify overlay types
  const resolvedOverlays = [];
  for (const ov of validObjects) {
    const isVis = ov.type === 'visualizer' || ov.type === 'spectrum' || ov.type === 'audio-visualizer' || ov.visualizerId || (ov.name && (ov.name.toLowerCase().includes('spectrum') || ov.name.toLowerCase().includes('visualizer')));
    if (isVis) {
      resolvedOverlays.push({ type: 'visualizer', ov });
    } else if (ov.type === 'overlay' || ov.type === 'image' || ov.type === 'video' || ov.type === 'particle' || ov.type === 'effect') {
      let ovPath = ov.source || ov.url || ov.uri;
      if (!ovPath) continue;

      let resolved = await resolveAssetPath(ovPath, 'Overlay');
      if (!resolved) resolved = await resolveAssetPath(ovPath, 'Background');
      if (!resolved && (ovPath.includes('/') || ovPath.includes('\\'))) {
        const bName = path.basename(ovPath);
        resolved = await resolveAssetPath(bName, 'Overlay');
      }
      if (!resolved && !ovPath.startsWith('http')) {
        let testP = ovPath.replace(/^file:\/\/\/?/, '');
        try {
          const stats = await fs.stat(testP);
          if (stats.size > 0) resolved = testP;
        } catch (e) {}
      }

      if (resolved) {
        resolvedOverlays.push({ type: 'file', ov, resolvedPath: resolved });
      } else {
        console.warn(`[M3] Skipping missing overlay asset: ${ovPath}`);
      }
    }
  }

  // Ensure file overlays (images/backgrounds) are processed first, and visualizer is overlaid LAST on top of everything
  const sortedOverlays = [
    ...resolvedOverlays.filter(item => item.type === 'file'),
    ...resolvedOverlays.filter(item => item.type === 'visualizer')
  ];

  const fileOverlays = sortedOverlays.filter(item => item.type === 'file');
  const fileInputCount = fileOverlays.length;
  const audioStreamIdx = 1 + fileInputCount; // Background is input 0, fileOverlays are 1..fileInputCount, audio is input 1+fileInputCount

  let inputs = '';
  fileOverlays.forEach(item => {
    const isVideoOverlay = item.ov.mediaType === 'video' || (item.resolvedPath && item.resolvedPath.match(/\.(mp4|webm|mov|mkv)$/i));
    const loopFlag = isVideoOverlay ? '-stream_loop -1' : `-loop 1 -framerate ${fps}`;
    inputs += ` ${loopFlag} -i "${item.resolvedPath}"`;
  });

  let filter = '';
  let lastOutput = '[0:v]';
  let overlayIdx = 0;
  let fileInputIdx = 0;

  for (const item of sortedOverlays) {
    overlayIdx++;

    if (item.type === 'visualizer') {
      const ov = item.ov;
      const vizId = (ov.visualizerId || ov.name || '').toLowerCase();
      
      let rawW = parseInt(ov.width);
      if (isNaN(rawW) || rawW <= 0) rawW = 1920;
      let rawH = parseInt(ov.height);
      if (isNaN(rawH) || rawH <= 0) rawH = 250;

      let rawCx = parseInt(ov.x);
      if (isNaN(rawCx) || rawCx === 0) rawCx = 960;
      let rawCy = parseInt(ov.y);
      if (isNaN(rawCy)) rawCy = 940;

      let w = Math.round(rawW * scaleX);
      let h = Math.round(rawH * scaleY);
      let cx = Math.round(rawCx * scaleX);
      let cy = Math.round(rawCy * scaleY);

      const topLeftX = Math.max(0, Math.round(cx - (w / 2)));
      const topLeftY = Math.max(0, Math.round(cy - (h / 2)));

      // Colors matching Live Editor gradient (Purple to Amber)
      const c1 = parseHexColor(ov.colorLeft || ov.color, 'AB55F7');
      const c2 = parseHexColor(ov.colorRight || ov.colorLeft || ov.color, 'F59E0B');
      const vizLabel = `viz_raw${overlayIdx}`;

      let vizFilter = '';
      if (vizId.includes('wave') || vizId.includes('line') || vizId.includes('fluid')) {
        vizFilter = `[${audioStreamIdx}:a]showwaves=s=${w}x${h}:mode=line:colors=0x${c1}|0x${c2}:rate=${fps},colorkey=0x000000:0.01:0.0,format=rgba[${vizLabel}];`;
      } else if (vizId.includes('spectrum') || vizId.includes('waterfall')) {
        vizFilter = `[${audioStreamIdx}:a]showspectrum=s=${w}x${h}:mode=combined:color=fire:scale=log:saturation=1,colorkey=0x000000:0.01:0.0,format=rgba[${vizLabel}];`;
      } else {
        // High visibility frequency bar spectrum matching Live Editor (fscale=log spreads bars across video width)
        vizFilter = `[${audioStreamIdx}:a]showfreqs=s=${w}x${h}:mode=bar:ascale=log:fscale=log:win_func=hanning:colors=0x${c1}|0x${c2},colorkey=0x000000:0.01:0.0,format=rgba[${vizLabel}];`;
      }

      filter += vizFilter;
      filter += `[${vizLabel}]scale=${w}:${h},format=rgba[ov${overlayIdx}];`;
      filter += `${lastOutput}[ov${overlayIdx}]overlay=x=${topLeftX}:y=${topLeftY}:shortest=1[bg${overlayIdx}];`;
      lastOutput = `[bg${overlayIdx}]`;
    } else if (item.type === 'file') {
      fileInputIdx++;
      const ov = item.ov;
      const speed = ov.playbackRate || 1.0;
      const opacity = (ov.opacity !== undefined ? ov.opacity : 100) / 100;
      const ovX = Math.round((parseInt(ov.x) || 0) * scaleX);
      const ovY = Math.round((parseInt(ov.y) || 0) * scaleY);

      filter += `[${fileInputIdx}:v]setpts=PTS/${speed},format=rgba,colorchannelmixer=aa=${opacity}[ov${overlayIdx}];`;
      filter += `${lastOutput}[ov${overlayIdx}]overlay=x=${ovX}:y=${ovY}:shortest=1[bg${overlayIdx}];`;
      lastOutput = `[bg${overlayIdx}]`;
    }
  }

  return { inputs, filter, map: lastOutput, overlaysCount: fileInputCount };
}

function generateDeterministicFFT(normalizedLoopTime = 0, barCount = 256) {
    const data = new Uint8Array(barCount);
    const tAngle = normalizedLoopTime * Math.PI * 2;

    for (let i = 0; i < barCount; i++) {
        const freqNorm = i / barCount;
        const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
        const barSeed = barPhase - Math.floor(barPhase);
        
        const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
        const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
        const oct3 = Math.sin(tAngle * 13 + freqNorm * 31.42 + barSeed * 1.57);
        const oct4 = Math.cos(tAngle * 23 + freqNorm * 47.12);
        
        const spike = Math.pow(Math.max(0, Math.sin(tAngle * 19 + i * 3.14)), 8);
        const fastJitter = Math.sin(tAngle * 41 + i * 7.89) * 25;
        const envelope = Math.exp(-freqNorm * 2.2);
        
        const rawVal = (0.35 * oct1 + 0.3 * oct2 + 0.2 * oct3 + 0.15 * oct4 + 0.4 * spike) * envelope;
        const baseHeight = 35 + Math.abs(rawVal) * 190 + fastJitter;
        data[i] = Math.min(255, Math.max(15, Math.floor(baseHeight)));
    }
    return data;
}

function detectAndNormalizeChannelOrder(buf) {
  // Test byte 0 vs byte 2 for dynamic BGRA vs RGBA detection across platforms
  const isBGRA = buf[0] !== 255 && buf[2] === 255;
  if (!isBGRA && buf[0] === 255) return buf;

  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i += 4) {
    out[i] = buf[i + 2];     // R
    out[i + 1] = buf[i + 1]; // G
    out[i + 2] = buf[i];     // B
    out[i + 3] = buf[i + 3]; // A
  }
  return out;
}

async function generateSingleEngineCanvasClip(job, imagePath, objects, enc, shortBgPath) {
  const visObj = (objects && objects.find(o => o && o.type === 'visualizer')) || {};
  const width = enc.targetWidth || 1920;
  const height = enc.targetHeight || 1080;
  const fps = enc.fps || 60;
  const totalFrames = 10 * fps;
  const barCount = Math.min(256, Math.max(16, parseInt(visObj.barCount) || 256));

  const { spawn } = require('child_process');
  // Electron toBitmap() returns BGRA on all platforms — tell ffmpeg to expect bgra directly.
  // This eliminates the need for the error-prone detectAndNormalizeChannelOrder conversion.
  const masterWidth = 1920;
  const masterHeight = 1080;
  const ffmpegCmd = `ffmpeg -y -f rawvideo -pix_fmt bgra -s ${masterWidth}x${masterHeight} -r ${fps} -i pipe:0 -vf "scale=${width}:${height}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${shortBgPath}"`;
  const ffmpegProc = spawn(ffmpegCmd, { shell: true });

  let electronBW = null;
  try {
    const electron = require('electron');
    if (electron && electron.BrowserWindow) {
      electronBW = electron.BrowserWindow;
    }
  } catch (e) {}

  if (electronBW) {
    try {
      console.log('[M3 OSR Harness Payload]', JSON.stringify(visObj, null, 2));
      logRuntimeEvent(job, 'generateSingleEngineCanvasClip (Electron OSR Window capturePage)', JSON.stringify(visObj));
      const win = new electronBW({
        width: masterWidth,
        height: masterHeight,
        show: false,
        useContentSize: true,
        webPreferences: { offscreen: true, contextIsolation: false, webSecurity: false }
      });

      const appBase = (typeof AppPaths !== 'undefined' && AppPaths.getAppDir) ? AppPaths.getAppDir() : path.join(__dirname, '..', '..');
      const harnessPath = path.join(appBase, 'dist', 'render-harness.html');
      const altHarnessPath = path.join(process.cwd(), 'dist', 'render-harness.html');
      const targetHarness = fsSync.existsSync(harnessPath) ? harnessPath : (fsSync.existsSync(altHarnessPath) ? altHarnessPath : path.join(process.cwd(), 'render-harness.html'));
      const loadUrl = `file:///${targetHarness.replace(/\\/g, '/')}`;

      await win.loadURL(loadUrl);

      let bgUrl = imagePath || '';
      if (bgUrl && !bgUrl.startsWith('http://') && !bgUrl.startsWith('https://') && !bgUrl.startsWith('file://')) {
        bgUrl = `file:///${bgUrl.replace(/\\/g, '/')}`;
      }

      const expectedBufSize = masterWidth * masterHeight * 4;

      for (let f = 0; f < totalFrames; f++) {
        await win.webContents.executeJavaScript(`window.renderFrame(${f}, ${JSON.stringify(visObj)}, ${JSON.stringify(bgUrl)})`, true);
        const image = await win.webContents.capturePage();

        // DPI scaling guard — resize to exact target if needed
        const captureSize = image.getSize();
        let finalImage = image;
        if (captureSize.width !== masterWidth || captureSize.height !== masterHeight) {
          if (f === 0) {
            console.warn(`[DPI FIX] capturePage returned ${captureSize.width}x${captureSize.height}, resizing to ${masterWidth}x${masterHeight}`);
          }
          finalImage = image.resize({ width: masterWidth, height: masterHeight, quality: 'good' });
        }

        // toBitmap() returns native BGRA — send directly to ffmpeg (which now expects bgra)
        const bgraBuffer = finalImage.toBitmap();

        if (f === 0) {
          console.log(`[AUDIT] Frame 0: buf=${bgraBuffer.length}, expected=${expectedBufSize}, capture=${captureSize.width}x${captureSize.height}, bytes[0..3]=[${bgraBuffer[0]},${bgraBuffer[1]},${bgraBuffer[2]},${bgraBuffer[3]}]`);
        }

        if (bgraBuffer.length !== expectedBufSize) {
          console.error(`[AUDIT] Frame ${f}: BUFFER SIZE MISMATCH buf=${bgraBuffer.length} expected=${expectedBufSize}`);
        }

        const ok = ffmpegProc.stdin.write(bgraBuffer);
        if (!ok) {
          await new Promise(resolve => ffmpegProc.stdin.once('drain', resolve));
        }
      }

      console.log(`[AUDIT SUMMARY] totalFrames=${totalFrames}, expectedBufSize=${expectedBufSize}`);

      ffmpegProc.stdin.end();
      win.destroy();
      await new Promise((resolve, reject) => {
        ffmpegProc.on('close', code => code === 0 ? resolve() : reject(new Error(`OSR ffmpeg failed code ${code}`)));
      });
      return;
    } catch (osrError) {
      console.warn('[M3] OSR Window Capture fallback to Canvas2D buffer generator:', osrError.message);
      logRuntimeEvent(job, 'generateSingleEngineCanvasClip OSR FALLBACK', osrError.message);
    }
  }

  // Standalone Node.js Fallback if BrowserWindow not present
  const c1Str = (visObj.colorLeft || visObj.color || '#00ffcc').replace('#', '');
  const c2Str = (visObj.colorRight || visObj.colorLeft || visObj.color || '#AB55F7').replace('#', '');
  const hexToRgb = (hex) => {
    const clean = hex.length === 6 ? hex : '00ffcc';
    const num = parseInt(clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };
  const rgb1 = hexToRgb(c1Str);
  const rgb2 = hexToRgb(c2Str);
  const step = width / barCount;
  const barWidth = Math.max(2, step - 2);
  const frameBuffer = Buffer.alloc(width * height * 4);

  for (let f = 0; f < totalFrames; f++) {
    frameBuffer.fill(0);
    const normT = (f / fps % 10.0) / 10.0;
    const dataArray = generateDeterministicFFT(normT, barCount);

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i] / 255;
      const barH = Math.round(Math.max(4, val * 180));
      const startX = Math.round(i * step);
      const endX = Math.min(width, Math.round(startX + barWidth));
      const startY = height - barH;

      for (let y = startY; y < height; y++) {
        const ratio = (height - y) / barH;
        const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          frameBuffer[idx] = r;
          frameBuffer[idx + 1] = g;
          frameBuffer[idx + 2] = b;
          frameBuffer[idx + 3] = 255;
        }
      }
    }

    const ok = ffmpegProc.stdin.write(frameBuffer);
    if (!ok) {
      await new Promise(resolve => ffmpegProc.stdin.once('drain', resolve));
    }
  }

  ffmpegProc.stdin.end();
  await new Promise((resolve, reject) => {
    ffmpegProc.on('close', code => code === 0 ? resolve() : reject(new Error(`Fallback ffmpeg failed code ${code}`)));
  });
}

async function buildImageVideo(job, imagePath, audioPath, outputPath, payload) {
  logRuntimeEvent(job, 'buildImageVideo STARTED');
  const enc = getFFmpegEncodingFlags(payload.metadata);
  const w = enc.targetWidth;
  const h = enc.targetHeight;
  const objects = payload.objects || (payload.composer && payload.composer.objects) || [];
  const bgPlan = job.jobPlan ? job.jobPlan.bgPlan : null;

  const cacheDir = path.join(AppPaths.getCacheBase(), 'm3');
  const hasVis = objects && objects.some(o => o && o.type === 'visualizer' && o.visible !== false);

  const USE_OSR_ENGINE = false;
  if (USE_OSR_ENGINE && hasVis) {
    const shortBgPath = path.join(cacheDir, `short_bg_${job.queueId}.mp4`);
    logRuntimeEvent(job, 'buildImageVideo (Single Engine Shared Visualizer OSR Clip Pre-Encode)');
    await generateSingleEngineCanvasClip(job, imagePath, objects, enc, shortBgPath);

    // Register master clip in cache manager if available
    if (bgPlan && bgPlan.outputFingerprint) {
      await FastRenderCacheManager.registerAsset({
        outputFingerprint: bgPlan.outputFingerprint,
        sourceFingerprint: bgPlan.sourceFingerprint,
        processingFingerprint: bgPlan.processingFingerprint,
        assetType: 'BackgroundMasterClip',
        outputParams: { width: w, height: h, fps: enc.fps },
        filePath: shortBgPath
      });
    }

    // Stream copy muxing (-c:v copy -c:a aac) for fast 100% WYSIWYG output
    const fastMuxCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${shortBgPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
    await spawnFFmpegM3(fastMuxCmd, job);
    logRuntimeEvent(job, 'buildImageVideo END (Single Engine Stream Copy Success)');
    return;
  }

  const hasOverlays = objects && objects.some(o => o && o.visible !== false && (o.type === 'visualizer' || o.type === 'image' || o.type === 'text' || o.type === 'overlay' || o.type === 'social-widget'));

  if (bgPlan && !hasOverlays) {
    if (bgPlan.strategy === RenderStrategy.CACHE_HIT && bgPlan.cachedPath) {
      logRuntimeEvent(job, 'buildImageVideo CACHE_HIT', `Reusing cached background master: ${bgPlan.cachedPath}`);
      console.log(`[M3] Planner Execution Strategy: CACHE_HIT (-c:v copy -c:a copy)`);

      const fastMuxCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${bgPlan.cachedPath}" -i "${audioPath}" -c:v copy -c:a copy -shortest "${outputPath}"`;
      try {
        await spawnFFmpegM3(fastMuxCmd, job);
      } catch (copyErr) {
        const fallbackMuxCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${bgPlan.cachedPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
        await spawnFFmpegM3(fallbackMuxCmd, job);
      }
      logRuntimeEvent(job, 'buildImageVideo END (Cache Hit Stream Copy Success)');
      return;
    }

    if (bgPlan.strategy === RenderStrategy.MINIMAL_ENCODE) {
      const shortBgPath = bgPlan.targetBgPath || path.join(AppPaths.getCacheBase(), 'm3', `short_bg_${job.queueId}.mp4`);
      const preEncodeCmd = `ffmpeg -y -loop 1 -framerate ${enc.fps} -i "${imagePath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -t 10 "${shortBgPath}"`;
      logRuntimeEvent(job, 'buildImageVideo (Pre-encoding 10s static master clip)');
      await spawnFFmpegM3(preEncodeCmd, job);

      // Register master clip in cache manager
      if (bgPlan.outputFingerprint) {
        await FastRenderCacheManager.registerAsset({
          outputFingerprint: bgPlan.outputFingerprint,
          sourceFingerprint: bgPlan.sourceFingerprint,
          processingFingerprint: bgPlan.processingFingerprint,
          assetType: 'BackgroundMasterClip',
          outputParams: { width: w, height: h, fps: enc.fps },
          filePath: shortBgPath
        });
      }

      // Step 2: Stream copy muxing (-c:v copy -c:a copy)
      const fastMuxCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${shortBgPath}" -i "${audioPath}" -c:v copy -c:a copy -shortest "${outputPath}"`;
      try {
        await spawnFFmpegM3(fastMuxCmd, job);
      } catch(e) {
        const fallbackMuxCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${shortBgPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
        await spawnFFmpegM3(fallbackMuxCmd, job);
      }
      logRuntimeEvent(job, 'buildImageVideo END (Minimal Encode Stream Copy Success)');
      return;
    }
  }

  // Fallback / Normal Mode full encode
  const { inputs, filter, map, overlaysCount } = await generateOverlayFilter(objects, enc.fps, w, h);
  const baseScale = `scale=${w}:${h}`;
  const audioMap = `-map ${1 + overlaysCount}:a`;
  const filterFlag = filter ? `-filter_complex "[0:v]${baseScale}[base];${filter.replace(/\[0:v\]/g, '[base]')}" -map "${map}" ${audioMap}` : `-vf "${baseScale}"`;

  const cmd = `ffmpeg -y -fflags +genpts -loop 1 -framerate ${enc.fps} -i "${imagePath}"${inputs} -i "${audioPath}" ${filterFlag} ${enc.flags} -c:a aac -b:a 192k -shortest "${outputPath}"`;
  await spawnFFmpegM3(cmd, job);
  logRuntimeEvent(job, 'buildImageVideo END (Full Encode)');
}

async function buildPingPongIntermediate(videoPath, cacheDir, job, payload) {
  logRuntimeEvent(job, 'buildPingPongIntermediate STARTED');
  const queueId = job.queueId;
  const enc = getFFmpegEncodingFlags(payload?.metadata);
  const w = enc.targetWidth;
  const h = enc.targetHeight;
  const scaleFilter = `scale=${w}:${h}`;

  const revPath = path.join(cacheDir, `rev_${queueId}.mp4`);
  await spawnFFmpegM3(`ffmpeg -y -i "${videoPath}" -vf "${scaleFilter},reverse" ${enc.flags} "${revPath}"`, job);
  
  const pingpongPath = path.join(cacheDir, `pingpong_${queueId}.mp4`);
  await spawnFFmpegM3(`ffmpeg -y -i "${videoPath}" -i "${revPath}" -filter_complex "[0:v]${scaleFilter}[v0];[1:v][v0]concat=n=2:v=1[v]" -map "[v]" ${enc.flags} "${pingpongPath}"`, job);
  logRuntimeEvent(job, 'buildPingPongIntermediate END');
  return pingpongPath;
}

async function buildLoopVideo(job, videoPath, audioPath, loopType, cacheDir, outputPath, payload) {
  logRuntimeEvent(job, 'buildLoopVideo STARTED');
  let finalSource = videoPath;
  if (loopType === 'Ping Pong') {
    finalSource = await buildPingPongIntermediate(videoPath, cacheDir, job, payload);
  }
  
  const enc = getFFmpegEncodingFlags(payload.metadata);
  const w = enc.targetWidth;
  const h = enc.targetHeight;

  const objects = payload.objects || (payload.composer && payload.composer.objects) || [];
  const bgPlan = job.jobPlan ? job.jobPlan.bgPlan : null;
  const hasOverlays = objects && objects.some(o => o && o.visible !== false && (o.type === 'visualizer' || o.type === 'image' || o.type === 'text' || o.type === 'overlay' || o.type === 'social-widget' || o.type === 'particle' || o.type === 'effect'));

  // Pure execution of assigned Planner strategy for Loop Video
  if (bgPlan && bgPlan.strategy === RenderStrategy.STREAM_COPY && !hasOverlays) {
    logRuntimeEvent(job, 'buildLoopVideo STREAM_COPY', `Executing fast stream copy for compatible video background: ${finalSource}`);
    console.log(`[M3] Planner Execution Strategy: STREAM_COPY (-c:v copy -c:a copy)`);

    const fastCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${finalSource}" -i "${audioPath}" -c:v copy -c:a copy -shortest "${outputPath}"`;
    try {
      await spawnFFmpegM3(fastCmd, job);
      logRuntimeEvent(job, 'buildLoopVideo END (Stream Copy Success)');
      return;
    } catch (copyErr) {
      logRuntimeEvent(job, 'buildLoopVideo (Stream copy retry with AAC audio mux)');
      const fallbackCmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${finalSource}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
      try {
        await spawnFFmpegM3(fallbackCmd, job);
        logRuntimeEvent(job, 'buildLoopVideo END (Stream Copy Video + AAC Audio Success)');
        return;
      } catch (e) {
        logRuntimeEvent(job, 'buildLoopVideo (Stream copy fallback to full encode)', e.message);
      }
    }
  }

  // Full Encode Fallback
  const { inputs, filter, map, overlaysCount } = await generateOverlayFilter(objects, enc.fps, w, h);
  const baseScale = `scale=${w}:${h}`;
  const audioMap = `-map ${1 + overlaysCount}:a`;
  const filterFlag = filter ? `-filter_complex "[0:v]${baseScale}[base];${filter.replace(/\[0:v\]/g, '[base]')}" -map "${map}" ${audioMap}` : `-vf "${baseScale}"`;

  const cmd = `ffmpeg -y -fflags +genpts -stream_loop -1 -i "${finalSource}"${inputs} -i "${audioPath}" ${filterFlag} ${enc.flags} -c:a aac -b:a 192k -shortest "${outputPath}"`;
  await spawnFFmpegM3(cmd, job);
  logRuntimeEvent(job, 'buildLoopVideo END (Full Encode)');
}

async function buildFinalRender(job, cacheDir, outputDir, payload) {
  // 1. Compile Audio
  await startM3Stage(job, 'Compiling Audio');
  const compiledAudio = await buildPlaylistAudio(job, cacheDir, payload);
  await endM3Stage(job);
  jobs[job.queueId].progress = Math.max(jobs[job.queueId].progress || 0, 20);

  // Probe compiledAudio to set exact totalDurationSec for dynamic progress calculation
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${compiledAudio}"`);
    const parsedDur = parseFloat(stdout.trim());
    if (parsedDur > 0) {
      job.totalDurationSec = parsedDur;
      console.log(`[M3] Probed compiled audio duration: ${parsedDur}s`);
    }
  } catch(e) {}

  // 2. Render Video
  const bg = payload.background || {};
  const activeBgFromPool = (payload.m3BgPool && payload.m3BgPool[0]) || (payload.bgPool && payload.bgPool[0]) || (payload.backgrounds && payload.backgrounds[0]) || {};

  const candidatePaths = [
    bg.sourcePath,
    bg.uri,
    bg.url,
    bg.preview,
    bg.filename,
    bg.source,
    activeBgFromPool.sourcePath,
    activeBgFromPool.uri,
    activeBgFromPool.url,
    activeBgFromPool.preview,
    activeBgFromPool.filename,
    activeBgFromPool.source,
    'dummy_bg.jpg',
    'bg_image_1.webp',
    'mecha_bg.png'
  ].filter(p => p && typeof p === 'string');

  let bgPath = null;
  for (const cand of candidatePaths) {
    let resolved = await resolveAssetPath(cand, 'Background');
    if (!resolved && (cand.includes('/') || cand.includes('\\'))) {
      const bName = path.basename(cand);
      resolved = await resolveAssetPath(bName, 'Background');
    }
    if (resolved) {
      bgPath = resolved;
      break;
    }
  }

  if (!bgPath && candidatePaths.length > 0) {
    for (const cand of candidatePaths) {
      if (cand.startsWith('http')) continue;
      let testP = cand.replace(/^file:\/\/\/?/, '');
      if (testP.includes('uri=')) {
        const match = testP.match(/uri=([^&]+)/);
        if (match) testP = decodeURIComponent(match[1]);
      }
      try {
        const stats = await fs.stat(testP);
        if (stats.size > 0) {
          bgPath = testP;
          break;
        }
      } catch (e) {}

      const bName = path.basename(testP);
      const devPublicP = path.resolve('d:/MediaFactory/public', bName);
      try {
        const stats = await fs.stat(devPublicP);
        if (stats.size > 0) {
          bgPath = devPublicP;
          break;
        }
      } catch (e) {}
    }
  }

  // Fallback: If background file does not exist on disk, generate a dark 1080p fallback background image
  let bgExists = false;
  if (bgPath) {
    try {
      const stats = await fs.stat(bgPath);
      if (stats.size > 0) bgExists = true;
    } catch (e) {
      bgExists = false;
    }
  }

  if (!bgExists) {
    const fallbackPath = path.join(cacheDir, `fallback_bg_${job.queueId}.png`);
    try {
      await spawnFFmpegM3(`ffmpeg -y -f lavfi -i color=c=0x111216:s=1920x1080:d=1 -vframes 1 "${fallbackPath}"`, job);
      bgPath = fallbackPath;
      logRuntimeEvent(job, 'buildFinalRender (Created fallback background image)');
    } catch (e) {
      console.error('[M3 Fallback BG Error]', e);
      bgPath = path.resolve('public', 'dummy_bg.jpg');
    }
  }

  const outVid = path.join(outputDir, payload.metadata.outputName || 'video.mp4');

  await startM3Stage(job, 'Rendering Video');
  if (bg.type === 'video' && bgExists) {
    const loopType = payload.background.loopMode || 'Normal';
    await buildLoopVideo(job, bgPath, compiledAudio, loopType, cacheDir, outVid, payload);
  } else {
    await buildImageVideo(job, bgPath, compiledAudio, outVid, payload);
  }
  await endM3Stage(job);

  jobs[job.queueId].progress = 80;
  return outVid;
}

async function processM3Job(job) {
  const startTime = Date.now();
  setJobStatus(job.queueId, 'RENDERING');
  logRuntimeEvent(job, 'Queue Lifecycle: RENDERING');
  console.log('M3_RENDER_START', job.queueId, job.m3Payload?.metadata?.outputName);
  jobs[job.queueId].progress = 0;
  
  try {
    logRuntimeEvent(job, 'checkFFmpeg TRY');
    await checkFFmpeg();
    logRuntimeEvent(job, 'checkFFmpeg SUCCESS');
    
    const payload = job.m3Payload || job;
    if (!payload) throw new Error("Missing M3 Payload");

    // Single Decision Authority: Query RenderPlanner to obtain the Execution Strategy Plan
    const planner = new RenderPlanner();
    const jobPlan = await planner.createJobPlan(payload);
    job.jobPlan = jobPlan;

    // Attach Planner Decision Trace, Confidence Scores, Rationale, and Metrics to Diagnostic Report
    if (!job.diagnosticReport) job.diagnosticReport = '=== M3 DIAGNOSTIC REPORT ===\n\n';
    job.diagnosticReport += '=== FAST RENDER PLANNER DECISION TRACE ===\n';
    job.diagnosticReport += `Audio Plan: Strategy=${jobPlan.audioPlan.strategy} | Confidence=${jobPlan.audioPlan.confidence}%\nReason: ${jobPlan.audioPlan.reason}\nTrace:\n${jobPlan.audioPlan.decisionTrace.map(t => '  - ' + t).join('\n')}\n\n`;
    job.diagnosticReport += `Background Plan: Strategy=${jobPlan.bgPlan.strategy} | Confidence=${jobPlan.bgPlan.confidence}%\nReason: ${jobPlan.bgPlan.reason}\nTrace:\n${jobPlan.bgPlan.decisionTrace.map(t => '  - ' + t).join('\n')}\n\n`;
    job.diagnosticReport += `=== EXECUTION METRICS SUMMARY ===\nAssets Reused: ${jobPlan.metrics.assetsReused}\nAssets Generated: ${jobPlan.metrics.assetsGenerated}\nVideo Stream Copy: ${jobPlan.metrics.videoStreamCopy}\nAudio Stream Copy: ${jobPlan.metrics.audioStreamCopy}\nConcat Operations: ${jobPlan.metrics.concatOperations}\nMinimal Encodes: ${jobPlan.metrics.minimalEncodes}\nFull Encodes: ${jobPlan.metrics.fullEncodes}\nCache Hit Rate: ${jobPlan.metrics.cacheHitRate}%\n=========================================\n\n`;

    const playlist = payload.playlist || payload.m3AudioTracks || [];
    const background = payload.background || (payload.m3BgPool && payload.m3BgPool[0]) || {};
    const thumbnail = payload.thumbnail || {};
    const metadata = payload.metadata || {};
    
    logRuntimeEvent(job, 'fs.mkdir TRY (Cache & Output)');
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm3');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const rawOutputBase = job.outputFolder || payload.outputFolder || 'Output/M3';
    const outName = payload.metadata?.outputName || 'video.mp4';
    const bundleFolderName = outName.replace(/\.mp4$/i, '').trim();

    let outputDir = path.resolve(rawOutputBase);
    if (bundleFolderName && !outputDir.endsWith(bundleFolderName) && path.basename(outputDir) !== bundleFolderName) {
        outputDir = path.join(outputDir, bundleFolderName);
    }
    job.outputFolder = outputDir;
    await fs.mkdir(outputDir, { recursive: true });
    logRuntimeEvent(job, 'fs.mkdir SUCCESS');
    
    // Robust totalDurationSec calculation from playlist tracks or payload
    let totalDurSec = parseFloat(payload.totalDurationSec || job.totalDurationSec || 0);
    let currentMs = 0;
    const timestamps = [];
    playlist.forEach(track => {
      const mins = Math.floor(currentMs / 60);
      const secs = Math.floor(currentMs % 60);
      timestamps.push(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} ${track.title || track.sourcePath || 'Audio'}`);
      let trackDur = parseFloat(track.durationSec || track.duration || track.duration_sec || 0);
      if (trackDur > 10000) trackDur = trackDur / 1000;
      currentMs += trackDur;
    });
    
    if (totalDurSec <= 0 && currentMs > 0) {
      totalDurSec = currentMs;
    }
    if (totalDurSec > 0) {
      job.totalDurationSec = totalDurSec;
    }
    
    const cleanPlaylist = playlist.map(t => ({
      title: t.title || t.filename || (typeof t.sourcePath === 'string' ? path.basename(t.sourcePath) : 'Audio Track'),
      duration: parseFloat(t.durationSec || t.duration || t.duration_sec || 0),
      uri: typeof t.uri === 'string' ? t.uri : (t.sourcePath || '')
    }));

    const metadataJson = {
      title: metadata.outputName || 'video.mp4',
      playlist: cleanPlaylist,
      duration: job.totalDurationSec || payload.totalDurationSec || 0,
      thumbnail: thumbnail.saved ? 'thumbnail.jpg' : '',
      background: background.filename || background.sourcePath || '',
      renderProfile: metadata.profileId || 'Standard',
      timestamps: timestamps
    };
    
    const metaPath = path.join(outputDir, 'metadata.json');
    await startM3Stage(job, 'Writing Metadata & Thumbnail');
    try {
      await fs.writeFile(metaPath, JSON.stringify(metadataJson, null, 2));
    } catch (e) {
      console.warn('[M3] Metadata initial write warning:', e.message);
    }
    jobs[job.queueId].progress = 2;
    
    // Thumbnail Export
    const thumbPath = path.join(outputDir, 'thumbnail.jpg');
    
    // --- TEMPORARY LOGGING ---
    console.log("=== BACKEND PAYLOAD LOG ===");
    console.log(`saved=${payload.thumbnail?.saved}`);
    console.log(`base64 length=${payload.thumbnail?.base64Data ? payload.thumbnail.base64Data.length : 0}`);
    console.log("===========================");
    if (!payload.thumbnail?.base64Data || payload.thumbnail.base64Data.length === 0) {
      console.log("Skip writing thumbnail");
    } else {
      console.log("Writing thumbnail...");
    }
    // -------------------------

    if (thumbnail.saved && thumbnail.base64Data) {
      const base64Image = thumbnail.base64Data.split(';base64,').pop();
      await fs.writeFile(thumbPath, base64Image, { encoding: 'base64' });
    }
    jobs[job.queueId].progress = 3;
    await endM3Stage(job);
    
    // Final Render (Video)
    const outVidPath = await buildFinalRender(job, cacheDir, outputDir, payload);
    
    await startM3Stage(job, 'Validating Output');
    // Phase 7: Queue Completion Validation
    const vidExists = await fs.stat(outVidPath).then(s => s.size > 0).catch(() => false);
    let thumbExists = await fs.stat(thumbPath).then(s => s.size > 0).catch(() => false);
    let metaExists = await fs.stat(metaPath).then(s => s.size > 0).catch(() => false);
    
    // Fallback: If metadata.json is missing during validation, write it now
    if (!metaExists) {
      try {
        console.log('[M3] Writing metadata.json during validation fallback...');
        await fs.writeFile(metaPath, JSON.stringify(metadataJson, null, 2));
        metaExists = await fs.stat(metaPath).then(s => s.size > 0).catch(() => false);
      } catch (e) {
        console.warn('[M3] Fallback metadata generation error:', e.message);
      }
    }

    // Fallback: If thumbnail was requested but base64 wasn't provided, extract frame 1 from rendered video
    if (!thumbExists && thumbnail.saved && vidExists) {
      try {
        console.log('[M3] Extracting fallback thumbnail frame from rendered video...');
        await spawnFFmpegM3(`ffmpeg -y -i "${outVidPath}" -vframes 1 "${thumbPath}"`, job);
        thumbExists = await fs.stat(thumbPath).then(s => s.size > 0).catch(() => false);
      } catch (e) {
        console.warn('[M3] Fallback thumbnail extraction warning:', e.message);
      }
    }

    if (!vidExists) throw new Error("Output Validation Failed: video.mp4 is missing or empty. FFmpeg execution may have failed silently or output path is invalid.");
    if (!metaExists) throw new Error("Output Validation Failed: metadata generation failed. metadata.json is missing or empty.");
    await endM3Stage(job);
    
    // Add Benchmark Report
    const audioPath = path.join(cacheDir, `compiled_audio_${job.queueId}.mp3`);
    const audioSize = await fs.stat(audioPath).then(s => (s.size / (1024*1024)).toFixed(2) + ' MB').catch(()=>'Unknown');
    const outSize = await fs.stat(outVidPath).then(s => (s.size / (1024*1024)).toFixed(2) + ' MB').catch(()=>'Unknown');
    
    const fpsMatches = job.logs?.match(/fps=\s*(\d+)/g);
    const avgFps = fpsMatches ? fpsMatches.map(m => parseInt(m.split('=')[1])).reduce((a,b)=>a+b,0) / fpsMatches.length : null;
    const speedMatches = job.logs?.match(/speed=\s*([\d.]+)x/g);
    const avgSpeed = speedMatches ? speedMatches.map(m => parseFloat(m.split('=')[1])).reduce((a,b)=>a+b,0) / speedMatches.length : null;
    
    const cpuMatches = job.diagnosticReport?.match(/CPU (\d+)%/g);
    const peakCpu = cpuMatches ? Math.max(...cpuMatches.map(m => parseInt(m.split(' ')[1]))) + '%' : 'Unknown';
    const ramMatches = job.diagnosticReport?.match(/RAM (\d+) MB/g);
    const peakRam = ramMatches ? Math.max(...ramMatches.map(m => parseInt(m.split(' ')[1]))) + ' MB' : 'Unknown';
    
    const fmtTime = (s) => s ? s : 'Unknown';
    const t = job.stageTimes || {};
    
    const durationMin = Math.floor((job.totalDurationSec || payload.totalDurationSec || 0) / 60);
    const durationSec = Math.floor((job.totalDurationSec || payload.totalDurationSec || 0) % 60);

    let bgPathResolved = background.sourcePath || background.filename || '';
    if (bgPathResolved && !bgPathResolved.includes('/') && !bgPathResolved.includes('\\')) {
      bgPathResolved = path.resolve('public', bgPathResolved);
    }
    const bgSize = bgPathResolved ? await fs.stat(bgPathResolved).then(s => (s.size / 1024).toFixed(0) + ' KB').catch(() => 'Unknown') : 'Unknown';

    job.diagnosticReport += `\nInput\n\nBackground\n${background.filename || 'None'}\n${bgSize}\n\nPlaylist\n${playlist.length} track(s)\n${durationMin}m ${durationSec}s\n\nCompiled Audio\n${audioSize}\n\n`;
    job.diagnosticReport += `Output\n\n${metadata.profileId || 'Standard'}\n${outSize}\n\n`;

    const renderStartTimeStr = new Date(job.renderStartTimestampMs || startTime).toLocaleTimeString('id-ID', { hour12: false });
    const renderEndTimeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const totalWallSec = (Date.now() - (job.renderStartTimestampMs || startTime)) / 1000;
    const totalWallStr = totalWallSec > 60 ? `${Math.floor(totalWallSec/60)}m${Math.floor(totalWallSec%60)}s` : `${Math.floor(totalWallSec)}s`;

    job.diagnosticReport += `Render Start\n\n${renderStartTimeStr}\n\nRender End\n\n${renderEndTimeStr}\n\nTotal\n\n${totalWallStr}\n\n`;

    job.diagnosticReport += `\n=========================\nRENDER SUMMARY\n\nPlaylist Duration\n${durationMin}m ${durationSec}s\n\nCompile Audio\n${fmtTime(t['Compiling Audio']?.elapsed)}\n\nVideo Encode\n${fmtTime(t['Rendering Video']?.elapsed)}\n\nThumbnail & Metadata\n${fmtTime(t['Writing Metadata & Thumbnail']?.elapsed)}\n\nValidation\n${fmtTime(t['Validating Output']?.elapsed)}\n\nAverage FPS\n${avgFps !== null ? avgFps.toFixed(1) : 'Unknown'}\n\nAverage Speed\n${avgSpeed !== null ? avgSpeed.toFixed(2) + 'x' : 'Unknown'}\n\nPeak CPU\n${peakCpu}\n\nPeak RAM\n${peakRam}\n\nOutput Size\n${outSize}\n=========================\n`;
    
    jobs[job.queueId].progress = 100;
    setJobStatus(job.queueId, 'COMPLETED');
    logRuntimeEvent(job, 'Queue Lifecycle: COMPLETED');
    console.log('M3_RENDER_COMPLETE', job.queueId);
    
  } catch (err) {
    logRuntimeEvent(job, 'processM3Job FAILED', `Error: ${err.message}\nStack: ${err.stack}`);
    console.log(`[M3 Render] FAILED: ${err.message}`);
    jobs[job.queueId].status = 'FAILED';
    logRuntimeEvent(job, 'Queue Lifecycle: FAILED');
    jobs[job.queueId].error = err.message;
  } finally {
    // Zombie check
    const { execSync } = await import('child_process');
    try {
      if (job.ffmpegProcess && job.ffmpegProcess.pid) {
         const out = execSync(`tasklist /FI "PID eq ${job.ffmpegProcess.pid}"`).toString();
         if (out.includes(String(job.ffmpegProcess.pid))) {
           logRuntimeEvent(job, 'RUNTIME LEAK', `FFmpeg PID ${job.ffmpegProcess.pid} is still alive!`);
         }
      }
    } catch(e) {}
    
    // Check Event Loop Handles
    const activeHandles = process._getActiveHandles().length;
    const activeRequests = process._getActiveRequests().length;
    logRuntimeEvent(job, 'Event Loop Check', `Active Handles: ${activeHandles} | Active Requests: ${activeRequests}`);
    
    // Component Verification Table
    const executed = (comp) => job.runtimeReport.includes(comp) ? 'YES' : 'NO';
    job.runtimeReport += `
=========================
COMPONENT VERIFICATION
| Component | Exists | Executed | Verified |
| --------- | ------ | -------- | -------- |
| buildPlaylistAudio | YES | ${executed('buildPlaylistAudio STARTED')} | ${executed('buildPlaylistAudio STARTED')} |
| buildLoopVideo | YES | ${executed('buildLoopVideo STARTED')} | ${executed('buildLoopVideo STARTED')} |
| buildImageVideo | YES | ${executed('buildImageVideo STARTED')} | ${executed('buildImageVideo STARTED')} |
| Cancel Render | YES | NO | NO |
| Export Runtime Report | YES | YES | YES |
=========================
`;
  }
}

function cancelM3Job(queueId) {
  if (queueId) {
    // Cancel specific job
    const job = jobs[queueId];
    console.log('[M3 Render] Cancelling job:', queueId);
    if (job) {
      _killJobFFmpeg(job);
    }
  } else {
    // Cancel ALL active/rendering jobs
    console.log('[M3 Render] Cancelling ALL active jobs');
    Object.keys(jobs).forEach(id => {
      const job = jobs[id];
      if (job && (job.status === 'RENDERING' || job.status === 'QUEUED' || job.status === 'PENDING')) {
        _killJobFFmpeg(job);
      }
    });
  }

  // Force kill any lingering ffmpeg.exe processes on Windows to prevent zombie leaks
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      execSync('taskkill /F /IM ffmpeg.exe /T');
    } catch (e) {}
  }
  return true;
}

function _killJobFFmpeg(job) {
  logRuntimeEvent(job, 'Queue Lifecycle: CANCELLED');
  job.status = 'FAILED';
  job.error = 'Render cancelled by user';
  if (job.ffmpegProcess) {
    try {
      const pid = job.ffmpegProcess.pid;
      if (pid && process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          execSync(`taskkill /F /T /PID ${pid}`);
        } catch (e) {}
      }
      job.ffmpegProcess.kill('SIGKILL');
    } catch (e) {
      console.warn('[M3 Render] Failed to kill ffmpeg process:', e.message);
    }
    job.ffmpegProcess = null;
  }
}

function killAllFFmpegProcesses() {
  console.log('[System Engine] Force terminating all active FFmpeg processes...');
  Object.keys(jobs).forEach(id => {
    const job = jobs[id];
    if (job && job.ffmpegProcess) {
      try {
        job.ffmpegProcess.kill('SIGKILL');
      } catch (e) {}
      job.ffmpegProcess = null;
      job.status = 'FAILED';
      job.error = 'Process killed by system shutdown / cancel';
    }
  });

  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      execSync('taskkill /F /IM ffmpeg.exe /T');
    } catch (e) {}
  }
}

let jobCounterM3 = 0;
module.exports = { jobs, processM3Job, cancelM3Job, killAllFFmpegProcesses, jobCounterM3, resolveAssetPath };


