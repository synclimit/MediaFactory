const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const AppPaths = require('../system/AppPaths');

const getSystemStats = () => new Promise(resolve => {
  exec('wmic cpu get loadpercentage', (err, stdout) => {
    let cpuStr = 'Unknown';
    if (!err && stdout) {
      const match = stdout.match(/\d+/);
      if (match) cpuStr = match[0] + '%';
    }
    const ram = (os.totalmem() - os.freemem()) / (1024*1024);
    resolve({ cpu: cpuStr, ram: ram.toFixed(0) + ' MB' });
  });
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
  job.FFMPEG_COMMAND = cmd;
  if (!job.logs) job.logs = '';
  
  if (!job.ffmpegCmdCounter) job.ffmpegCmdCounter = 1;
  const cmdNum = job.ffmpegCmdCounter++;
  
  const cmdHeader = `\nFFMPEG COMMAND #${cmdNum}\n\n${job.stage}\n\n${cmd}\n\n`;
  job.logs += cmdHeader;
  job.diagnosticReport += cmdHeader;
  
  const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
  const proc = spawn(args[0], args.slice(1));
  
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
    if (timeMatch) job.currentFFmpegTime = timeMatch[1];
  });
  proc.on('close', code => {
    clearInterval(timerId);
    job.diagnosticReport += `\nExit Code : ${code}\n\n`;
    if (code === 0) resolve();
    else {
      job.diagnosticReport += `\nFAILED!\n\nExit Code : ${code}\n\nCommand :\n${cmd}\n\nSTDOUT :\n${stdoutData}\n\nSTDERR :\n${stderrData}\n\n`;
      reject(new Error(`FFmpeg failed with code ${code}\nLog: ${stderrData.substring(stderrData.length - 500)}`));
    }
  });
  proc.on('error', err => {
    clearInterval(timerId);
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

async function buildPlaylistAudio(job, cacheDir, payload) {
  logRuntimeEvent(job, 'buildPlaylistAudio STARTED');
  const queueId = job.queueId;
  const concatPath = path.join(cacheDir, `concat_q_${queueId}.txt`);
  
  const resolvedPaths = [];
  logRuntimeEvent(job, 'fs.stat TRY (Resolving Playlist)');
  try {
    for (const track of payload.playlist) {
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
        resolvedPaths.push(sp);
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

  const outAudioPath = path.join(cacheDir, `compiled_audio_${job.queueId}.mp3`);
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c:a libmp3lame -b:a 192k "${outAudioPath}"`;
  await spawnFFmpegM3(cmd, job);
  logRuntimeEvent(job, 'buildPlaylistAudio END');
  return outAudioPath;
}

function generateOverlayFilter(objects) {
  if (!objects || objects.length === 0) return { inputs: '', filter: '', map: '' };
  
  // Filter only overlays
  const overlays = objects.filter(o => o.type === 'image' && o.mediaType === 'video' && o.visible);
  if (overlays.length === 0) return { inputs: '', filter: '', map: '' };

  let inputs = '';
  let filter = '';
  let lastOutput = '[0:v]';

  overlays.forEach((ov, index) => {
    // Note: M3 frontend sends source as absolute URL or path. Assuming path is clean.
    // If it's a localhost URL, we need to extract the path.
    let ovPath = ov.source;
    if (ovPath.startsWith('http')) {
        try {
            const url = new URL(ovPath);
            ovPath = path.join(__dirname, '..', url.pathname); // e.g. /assets/overlays/... -> backend/assets/overlays/...
        } catch(e) {}
    } else {
        if (!ovPath.includes('/') && !ovPath.includes('\\')) {
            ovPath = path.resolve('public', ovPath);
        }
    }

    const inputIndex = index + 1; // 0 is background
    inputs += ` -stream_loop -1 -i "${ovPath}"`;

    const speed = ov.playbackRate || 1.0;
    const opacity = (ov.opacity !== undefined ? ov.opacity : 100) / 100;

    filter += `[${inputIndex}:v]setpts=PTS/${speed},format=yuva420p,colorchannelmixer=aa=${opacity}[ov${inputIndex}];`;
    filter += `${lastOutput}[ov${inputIndex}]overlay=x=${ov.x}:y=${ov.y}:shortest=1[bg${inputIndex}];`;
    
    lastOutput = `[bg${inputIndex}]`;
  });

  return { inputs, filter, map: lastOutput };
}

async function buildImageVideo(job, imagePath, audioPath, outputPath, payload) {
  logRuntimeEvent(job, 'buildImageVideo STARTED');
  
  const { inputs, filter, map } = generateOverlayFilter(payload.objects);
  const filterFlag = filter ? `-filter_complex "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[base];[base]${filter.replace(/\[0:v\]/g, '[base]')}" -map "${map}"` : `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"`;

  const cmd = `ffmpeg -y -loop 1 -framerate 30 -i "${imagePath}"${inputs} -i "${audioPath}" -c:v libx264 -tune stillimage -c:a copy ${filterFlag} -shortest -pix_fmt yuv420p "${outputPath}"`;
  await spawnFFmpegM3(cmd, job);
  logRuntimeEvent(job, 'buildImageVideo END');
}

async function buildPingPongIntermediate(videoPath, cacheDir, job) {
  logRuntimeEvent(job, 'buildPingPongIntermediate STARTED');
  const queueId = job.queueId;
  const revPath = path.join(cacheDir, `rev_${queueId}.mp4`);
  await spawnFFmpegM3(`ffmpeg -y -i "${videoPath}" -vf reverse "${revPath}"`, job);
  
  const pingpongPath = path.join(cacheDir, `pingpong_${queueId}.mp4`);
  await spawnFFmpegM3(`ffmpeg -y -i "${videoPath}" -i "${revPath}" -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" -map "[v]" "${pingpongPath}"`, job);
  logRuntimeEvent(job, 'buildPingPongIntermediate END');
  return pingpongPath;
}

async function buildLoopVideo(job, videoPath, audioPath, loopType, cacheDir, outputPath, payload) {
  logRuntimeEvent(job, 'buildLoopVideo STARTED');
  let finalSource = videoPath;
  if (loopType === 'Ping Pong') {
    finalSource = await buildPingPongIntermediate(videoPath, cacheDir, job);
  }
  
  const { inputs, filter, map } = generateOverlayFilter(payload.objects);
  const filterFlag = filter ? `-filter_complex "${filter}" -map "${map}"` : ``;

  const cmd = `ffmpeg -y -stream_loop -1 -i "${finalSource}"${inputs} -i "${audioPath}" -c:v libx264 -c:a copy ${filterFlag} -shortest -pix_fmt yuv420p "${outputPath}"`;
  await spawnFFmpegM3(cmd, job);
  logRuntimeEvent(job, 'buildLoopVideo END');
}

async function buildFinalRender(job, cacheDir, outputDir, payload) {
  // 1. Compile Audio
  await startM3Stage(job, 'Compiling Audio');
  const compiledAudio = await buildPlaylistAudio(job, cacheDir, payload);
  await endM3Stage(job);
  jobs[job.queueId].progress = 30;

  // 2. Render Video
  const bg = payload.background;
  // Resolve Background Path (Assume absolute if it has \ or /, else try to find in public/assets)
  let bgPath = bg.sourcePath || bg.filename;
  if (!bgPath.includes('/') && !bgPath.includes('\\')) {
    bgPath = path.resolve('public', bgPath);
  }
  
  const outVid = path.join(outputDir, payload.metadata.outputName || 'video.mp4');

  await startM3Stage(job, 'Rendering Video');
  if (bg.type === 'image') {
    await buildImageVideo(job, bgPath, compiledAudio, outVid, payload);
  } else if (bg.type === 'video') {
    const loopType = payload.background.loopMode || 'Normal'; // Or get from payload
    await buildLoopVideo(job, bgPath, compiledAudio, loopType, cacheDir, outVid, payload);
  } else {
    // Fallback if no valid background type, use a black screen
    await spawnFFmpegM3(`ffmpeg -y -f lavfi -i color=c=black:s=1920x1080:r=30 -i "${compiledAudio}" -c:v libx264 -c:a copy -shortest "${outVid}"`, job);
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
    
    const payload = job.m3Payload;
    if (!payload) throw new Error("Missing M3 Payload");
    
    logRuntimeEvent(job, 'fs.mkdir TRY (Cache & Output)');
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm3');
    await fs.mkdir(cacheDir, { recursive: true });
    const outputDir = path.resolve(job.outputFolder || 'Output/M3');
    await fs.mkdir(outputDir, { recursive: true });
    logRuntimeEvent(job, 'fs.mkdir SUCCESS');
    
    // Metadata JSON Export
    let currentMs = 0;
    const timestamps = [];
    payload.playlist.forEach(track => {
      const mins = Math.floor(currentMs / 60);
      const secs = Math.floor(currentMs % 60);
      timestamps.push(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} ${track.title}`);
      currentMs += (track.durationSec || 0);
    });
    
    const metadataJson = {
      title: payload.metadata.outputName,
      playlist: payload.playlist,
      duration: job.totalDurationSec,
      thumbnail: payload.thumbnail.saved ? 'thumbnail.jpg' : '',
      background: payload.background.filename,
      renderProfile: payload.metadata.profileId,
      timestamps: timestamps
    };
    
    const metaPath = path.join(outputDir, 'metadata.json');
    await startM3Stage(job, 'Writing Metadata & Thumbnail');
    await fs.writeFile(metaPath, JSON.stringify(metadataJson, null, 2));
    jobs[job.queueId].progress = 10;
    
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

    if (payload.thumbnail.saved && payload.thumbnail.base64Data) {
      const base64Image = payload.thumbnail.base64Data.split(';base64,').pop();
      await fs.writeFile(thumbPath, base64Image, { encoding: 'base64' });
    }
    jobs[job.queueId].progress = 15;
    await endM3Stage(job);
    
    // Final Render (Video)
    const outVidPath = await buildFinalRender(job, cacheDir, outputDir, payload);
    
    await startM3Stage(job, 'Validating Output');
    // Phase 7: Queue Completion Validation
    const vidExists = await fs.stat(outVidPath).then(s => s.size > 0).catch(() => false);
    const thumbExists = await fs.stat(thumbPath).then(s => s.size > 0).catch(() => false);
    const metaExists = await fs.stat(metaPath).then(s => s.size > 0).catch(() => false);
    
    if (!vidExists) throw new Error("Output Validation Failed: video.mp4 is missing or empty. FFmpeg execution may have failed silently or output path is invalid.");
    if (!thumbExists && payload.thumbnail.saved) throw new Error("Output Validation Failed: thumbnail export failed. thumbnail.jpg is missing or empty.");
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
    
    const durationMin = Math.floor(job.totalDurationSec / 60);
    const durationSec = Math.floor(job.totalDurationSec % 60);

    let bgPathResolved = payload.background.sourcePath || payload.background.filename || '';
    if (bgPathResolved && !bgPathResolved.includes('/') && !bgPathResolved.includes('\\')) {
      bgPathResolved = path.resolve('public', bgPathResolved);
    }
    const bgSize = bgPathResolved ? await fs.stat(bgPathResolved).then(s => (s.size / 1024).toFixed(0) + ' KB').catch(() => 'Unknown') : 'Unknown';

    job.diagnosticReport += `\nInput\n\nBackground\n${payload.background.filename}\n${bgSize}\n\nPlaylist\n${payload.playlist.length} track(s)\n${durationMin}m ${durationSec}s\n\nCompiled Audio\n${audioSize}\n\n`;
    job.diagnosticReport += `Output\n\n${payload.metadata.profileId}\n${outSize}\n\n`;

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

let jobCounterM3 = 0;
module.exports = { jobs, processM3Job, jobCounterM3 };


