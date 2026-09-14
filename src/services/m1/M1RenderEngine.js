import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';


function resolveYtDlpPath() {
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'yt-dlp.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'yt-dlp.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'yt-dlp.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'yt-dlp.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'yt-dlp.exe') : '',
    path.join(process.cwd(), 'backend', 'bin', 'yt-dlp.exe'),
    path.join(process.cwd(), 'bin', 'yt-dlp.exe')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return 'yt-dlp';
}

function resolveFFmpegPath() {
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'ffmpeg.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'ffmpeg.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'ffmpeg.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'ffmpeg.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'ffmpeg.exe') : '',
    path.join(process.cwd(), 'backend', 'bin', 'ffmpeg.exe'),
    path.join(process.cwd(), 'backend', 'ffmpeg', 'ffmpeg.exe'),
    path.join(process.cwd(), 'bin', 'ffmpeg.exe')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return 'ffmpeg';
}

function resolveFFprobePath() {
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'ffprobe.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'backend', 'bin', 'ffprobe.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'ffprobe.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'ffprobe.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app', 'bin', 'ffprobe.exe') : '',
    path.join(process.cwd(), 'backend', 'bin', 'ffprobe.exe'),
    path.join(process.cwd(), 'backend', 'ffmpeg', 'ffprobe.exe'),
    path.join(process.cwd(), 'bin', 'ffprobe.exe')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return 'ffprobe';
}

function resolveFFmpegDir() {
  const ffmpegPath = resolveFFmpegPath();
  if (ffmpegPath && ffmpegPath !== 'ffmpeg' && existsSync(ffmpegPath)) {
    return path.dirname(ffmpegPath);
  }
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'bin') : '',
    path.join(process.cwd(), 'backend', 'bin'),
    path.join(process.cwd(), 'backend', 'ffmpeg'),
    path.join(process.cwd(), 'bin')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return process.cwd();
}

function resolveNodeJsPath() {
  const candidateNodes = [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'node', 'node.exe')
  ];
  for (const n of candidateNodes) {
    if (n && existsSync(n)) return n;
  }
  if (process.execPath && !process.execPath.toLowerCase().includes('electron') && existsSync(process.execPath)) {
    return process.execPath;
  }
  return 'node';
}

export async function processM1Job(job, updateProgress, onComplete, onError) {
  const cacheDir = path.resolve('Workspace/Cache/M1');
  const jobIdClean = (job.id || 'temp').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
  const tempSegmentPath = path.join(cacheDir, `temp_segment_${jobIdClean}.mp4`).replace(/\\/g, '/');
  const concatTxtPath = path.join(cacheDir, `concat_${jobIdClean}.txt`).replace(/\\/g, '/');
  const outLogPath = path.join(cacheDir, `render_${jobIdClean}.log`);
  const outReportPath = path.join(cacheDir, `render_report_${jobIdClean}.json`);

  const logEntries = [];
  const log = (step, details = '') => {
    logEntries.push({ step, time: new Date().toISOString(), details });
  };

  try {
    updateProgress(0, 'Initializing job');
    log('Init', 'Job started');
    
    await fs.mkdir(cacheDir, { recursive: true });

    // --- Phase 1: Payload Proof ---
    console.log('\n--- RENDER JOB RECEIVED (PHASE 1) ---');
    console.log(`Segment Index: ${job.segmentIndex}`);
    console.log(`Segment Start: ${job.segmentStartSec}`);
    console.log(`Segment End: ${job.segmentEndSec}`);
    console.log(`Output Name: ${job.outputName}`);
    console.log(`Quality: ${job.quality}`);
    console.log('-------------------------------------\n');

    // --- Phase 1.5: Render Job Validation Layer ---
    const validateJob = (j) => {
      if (typeof j.segmentIndex !== 'number' || j.segmentIndex < 0) return 'Invalid segmentIndex (must be >= 0)';
      if (typeof j.segmentStartSec !== 'number' || j.segmentStartSec < 0) return 'Invalid segmentStartSec (must be >= 0)';
      if (typeof j.segmentEndSec !== 'number' || j.segmentEndSec <= j.segmentStartSec) return 'Invalid segmentEndSec (must be > segmentStartSec)';
      if (typeof j.playbackSpeed !== 'number' || j.playbackSpeed <= 0) return 'Invalid playbackSpeed (must be > 0)';
      if (!['240p', '360p', '480p', '720p', '1080p'].includes(j.quality)) return 'Invalid quality';
      if (typeof j.bufferSec !== 'number' || j.bufferSec < 0) return 'Invalid bufferSec (must be >= 0)';
      if (!j.outputName || typeof j.outputName !== 'string' || j.outputName.trim() === '') return 'outputName cannot be empty';
      if (!j.effects || typeof j.effects !== 'object') return 'effects payload missing';
      
      const vIn = typeof j.inputVideo === 'object' ? j.inputVideo?.fullPath : j.inputVideo;
      if (!vIn || typeof vIn !== 'string' || vIn.trim() === '') return 'inputVideo must exist';
      
      const aIn = j.audioPath || (j.tracks && j.tracks[0]);
      if (!aIn || typeof aIn !== 'string' || aIn.trim() === '') return 'audioPath must exist';
      return null;
    };

    const validationError = validateJob(job);
    if (validationError) {
      throw new Error(`Render Job Validation Failed: ${validationError}`);
    }
    
    // Paths
    const videoIn = typeof job.inputVideo === 'object' ? job.inputVideo.fullPath : job.inputVideo;
    let audioIn = job.audioPath || job.tracks[0];
    

    // YouTube Audio Check
    if (audioIn && (audioIn.includes('youtube.com') || audioIn.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(audioIn))) {
      updateProgress(2, 'Downloading YouTube Audio');
      const crypto = await import('crypto');
      const hashUri = (uri) => crypto.createHash('md5').update(uri).digest('hex').substring(0, 8);
      const ytOut = path.join(cacheDir, `${hashUri(audioIn)}.mp3`);
      
      try {
        const stats = await fs.stat(ytOut);
        if (stats.size > 0) audioIn = ytOut;
        else throw new Error('Cache file empty');
      } catch (e) {
        await new Promise((resolve, reject) => {
          const ytBin = resolveYtDlpPath();
          const ffmpegDir = resolveFFmpegDir();
          const nodePath = resolveNodeJsPath();

          let targetUrl = String(audioIn).trim();
          const idMatch = targetUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/|^)([a-zA-Z0-9_-]{11})(?:\b|&|$)/);
          if (idMatch && idMatch[1] && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://www.youtube.com/watch?v=${idMatch[1]}`;
          } else if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
              targetUrl = `https://${targetUrl.replace(/^https?:\/\//, '')}`;
            }
            if (idMatch && idMatch[1]) {
              targetUrl = `https://www.youtube.com/watch?v=${idMatch[1]}`;
            }
          } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://www.youtube.com/watch?v=${targetUrl}`;
          }

          const ytArgs = [
            '--no-check-certificates',
            '--force-ipv4',
            '--js-runtimes', 'node:' + nodePath,
            '--extractor-args', 'youtube:player_client=android,web',
            '--no-warnings',
            '--no-playlist',
            '-f', 'bestaudio/best',
            '-x',
            '--audio-format', 'mp3',
            '--ffmpeg-location', ffmpegDir,
            '-o', ytOut,
            '--',
            targetUrl
          ];

          const ytProc = spawn(ytBin, ytArgs);
          let stderrLog = '';
          if (ytProc.stderr) {
            ytProc.stderr.on('data', d => stderrLog += d.toString());
          }
          ytProc.on('close', (code) => { 
            if (code === 0) resolve(); 
            else reject(new Error(`yt-dlp failed to download audio (code ${code}): ${stderrLog.slice(-300)}`)); 
          });
          ytProc.on('error', (err) => reject(new Error(`yt-dlp process error: ${err.message}`)));
        });
        audioIn = ytOut;
      }
    }

    const outDir = path.resolve(job.outputFolder);
    await fs.mkdir(outDir, { recursive: true });
    
    const outName = job.outputFiles ? job.outputFiles[0] : job.outputName;
    const outVideoPath = path.join(outDir, outName);
    const outThumbPath = path.join(outDir, 'thumbnail.jpg');
    
    // Playback Engine Calculation
    // Probe video duration to prevent trimming out-of-bounds (0 frames / stream map errors)
    let videoDurationSec = typeof job.inputVideo === 'object' ? job.inputVideo?.metadata?.durationSec : job.videoDurationSec;
    if (!videoDurationSec) {
      try {
        const ffprobeBin = resolveFFprobePath();
        const probeRes = await new Promise((res) => {
          exec(`"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoIn}"`, (err, stdout) => {
            res(parseFloat(stdout.trim()) || 0);
          });
        });
        if (probeRes > 0) videoDurationSec = probeRes;
      } catch (e) {}
    }

    let segmentDuration = job.segmentEndSec - job.segmentStartSec;
    if (segmentDuration <= 0) segmentDuration = 10;

    if (videoDurationSec && videoDurationSec > 0) {
      if (job.segmentStartSec >= videoDurationSec) {
        job.segmentStartSec = job.segmentStartSec % videoDurationSec;
      }
      job.segmentEndSec = job.segmentStartSec + segmentDuration;
      if (job.segmentEndSec > videoDurationSec) {
        job.segmentEndSec = videoDurationSec;
      }
      if (job.segmentEndSec <= job.segmentStartSec) {
        job.segmentStartSec = 0;
        job.segmentEndSec = videoDurationSec;
      }
    }

    segmentDuration = job.segmentEndSec - job.segmentStartSec;
    const playbackSpeed = job.playbackSpeed || 1.0;
    const targetDuration = segmentDuration / playbackSpeed;
    job.tempSegmentDuration = targetDuration;
    
    // Probe exact audio duration if available on disk
    let exactAudioDuration = job.audioDurationSec || job.audioDuration;
    if ((!exactAudioDuration || exactAudioDuration <= 0) && audioIn && existsSync(audioIn)) {
      try {
        const ffprobeBin = resolveFFprobePath();
        const probeAudio = await new Promise((res) => {
          exec(`"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioIn}"`, (err, stdout) => {
            res(parseFloat(stdout.trim()) || 0);
          });
        });
        if (probeAudio > 0) exactAudioDuration = probeAudio;
      } catch (e) {}
    }

    const baseAudioDuration = exactAudioDuration || job.targetDuration || 10;
    // User requirement: Extend render output by 5 minutes (300 seconds) beyond the audio duration.
    // Video loops/continues with silent audio during the extra 5 minutes.
    const bufferSec = typeof job.bufferSec === 'number' ? job.bufferSec : 300;
    const finalTargetDuration = Math.round((baseAudioDuration + bufferSec) * 100) / 100;
    job.audioDurationSec = exactAudioDuration || baseAudioDuration;
    job.computedTargetDuration = finalTargetDuration;

    // Helper to run FFmpeg with Deadlock & Memory Overflow Protection
    const runFFmpeg = (args, onProgress) => {
      return new Promise((resolve, reject) => {
        const ffmpegBin = resolveFFmpegPath();
        const proc = spawn(ffmpegBin, args);
        let stderrLog = '';
        proc.stdout.on('data', (data) => {
          const output = data.toString();
          const match = output.match(/out_time_ms=(\d+)/);
          if (match && onProgress) {
            onProgress(parseInt(match[1], 10) / 1000000);
          }
        });
        proc.stderr.on('data', (data) => { 
          stderrLog += data.toString();
          if (stderrLog.length > 50000) {
            stderrLog = stderrLog.slice(-20000);
          }
        });
        proc.on('error', reject);
        proc.on('close', (code) => {
          if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}\nLog: ${stderrLog.slice(-1500)}`));
          else resolve();
        });
      });
    };

    // Detect Hardware Acceleration & Multi-threading Engine
    let stage1EncoderArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '22', '-threads', '0'];
    let stage2EncoderArgs = ['-c:v', 'libx264', '-preset', 'superfast', '-crf', '22', '-threads', '0'];
    let isHwAccelerated = false;

    try {
      const { execSync } = await import('child_process');
      const encStdout = execSync('ffmpeg -encoders', { encoding: 'utf8' });
      if (encStdout.includes('h264_nvenc')) {
        stage2EncoderArgs = ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '20'];
        isHwAccelerated = true;
        log('Hardware Acceleration', 'NVIDIA NVENC HW Encoder Enabled');
      } else if (encStdout.includes('h264_qsv')) {
        stage2EncoderArgs = ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20'];
        isHwAccelerated = true;
        log('Hardware Acceleration', 'Intel QSV HW Encoder Enabled');
      } else if (encStdout.includes('h264_amf')) {
        stage2EncoderArgs = ['-c:v', 'h264_amf', '-usage', 'transcoding', '-quality', 'speed'];
        isHwAccelerated = true;
        log('Hardware Acceleration', 'AMD AMF HW Encoder Enabled');
      }
    } catch(e) {
      log('Hardware Acceleration Check', 'Fallback to Multi-threaded CPU libx264 (-threads 0)');
    }

    // ==========================================
    // STAGE 1: TEMPORARY ENCODE (0 - 35%)
    // ==========================================
    updateProgress(5, 'Preparing Stage 1');
    log('Stage 1', 'Start Temp Encode');
    
    const { FilterGraphBuilder } = await import(`./builders/FilterGraphBuilder.js?v=${Date.now()}`);
    const stage1Graph = await FilterGraphBuilder.buildStage1(job);
    const stage1Args = ['-y', ...stage1Graph.globalInputArgs, '-i', videoIn];
    
    if (stage1Graph.filterComplex) {
      stage1Args.push('-filter_complex', stage1Graph.filterComplex);
    }
    
    stage1Args.push(
      '-map', '[v]',
      '-an', // Discard master audio absolutely
      ...stage1EncoderArgs,
      '-pix_fmt', 'yuv420p',
      ...stage1Graph.outputArgs,
      '-progress', 'pipe:1',
      tempSegmentPath
    );

    await runFFmpeg(stage1Args, (outTimeSec) => {
      // Progress mapping: 5 to 35%
      let p = 5 + Math.floor((outTimeSec / targetDuration) * 30);
      if (p > 35) p = 35;
      updateProgress(p, 'Encoding Temporary Segment');
    });

    // ==========================================
    // STAGE 2: FINAL ENCODE (35 - 95%) WITH GPU-TO-CPU FALLBACK
    // ==========================================
    updateProgress(35, 'Preparing Stage 2');
    log('Stage 2', 'Start Concat & Overlay');

    const buildStage2Args = (encArgs) => {
      const stage2Args = ['-y'];
      for (const argPair of stage2Graph.globalInputArgs) {
        stage2Args.push(...argPair);
      }
      
      if (stage2Graph.inputs.length > 0) {
        const concatInput = stage2Graph.inputs[0];
        if (concatInput.args) stage2Args.push(...concatInput.args);
        stage2Args.push('-i', concatInput.path);
      }
      
      stage2Args.push('-i', audioIn);
      
      for (let i = 1; i < stage2Graph.inputs.length; i++) {
        const inputObj = stage2Graph.inputs[i];
        if (inputObj.args) {
          for (const argPair of inputObj.args) {
            stage2Args.push(...argPair);
          }
        }
        stage2Args.push('-i', inputObj.path);
      }

      if (stage2Graph.filterComplex) {
        stage2Args.push('-filter_complex', stage2Graph.filterComplex);
        stage2Args.push('-map', '[v]');
      } else {
        stage2Args.push('-map', '0:v');
      }

      stage2Args.push(
        '-map', '1:a', // Map Module Audio
        ...encArgs,
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-af', 'apad', // Pad audio stream with silence to match the extended video duration
        '-t', `${finalTargetDuration}`,
        '-max_muxing_queue_size', '2048'
      );

      for (const argPair of stage2Graph.outputArgs) {
        stage2Args.push(...argPair);
      }
      
      stage2Args.push(
        '-progress', 'pipe:1',
        outVideoPath
      );
      return stage2Args;
    };

    const stage2Graph = await FilterGraphBuilder.buildStage2(job);
    
    try {
      await runFFmpeg(buildStage2Args(stage2EncoderArgs), (outTimeSec) => {
        let p = 35 + Math.floor((outTimeSec / finalTargetDuration) * 60);
        if (p > 95) p = 95;
        updateProgress(p, 'Concat & Overlay Final Encode');
      });
    } catch (stage2Err) {
      if (isHwAccelerated) {
        log('Hardware Failover', `GPU Encoder failed (${stage2Err.message}). Retrying with safe Multi-threaded CPU libx264...`);
        const fallbackCpuArgs = ['-c:v', 'libx264', '-preset', 'superfast', '-crf', '22', '-threads', '0'];
        await runFFmpeg(buildStage2Args(fallbackCpuArgs), (outTimeSec) => {
          let p = 35 + Math.floor((outTimeSec / finalTargetDuration) * 60);
          if (p > 95) p = 95;
          updateProgress(p, 'Concat & Overlay CPU Fallback Encode');
        });
      } else {
        throw stage2Err;
      }
    }

    // ==========================================
    // FINALIZATION (95 - 100%)
    // ==========================================
    updateProgress(95, 'Cleanup & Finalization');
    log('Finalization', 'Extracting Thumbnail & Cleanup');

    // Generate Thumbnail (GUARANTEED YOUTUBE THUMBNAIL PRIORITY)
    log('Finalization', 'Writing High-Resolution Thumbnail');
    let thumbSaved = false;
    const ffmpegBin = resolveFFmpegPath();

    // 1. If job has a local file path on disk (e.g. pre-downloaded YouTube thumbnail or manual thumbnail)
    const localCandidate = job.thumbnailPath || job.thumbnail;
    if (localCandidate && typeof localCandidate === 'string' && !localCandidate.startsWith('http') && !localCandidate.startsWith('data:')) {
      try {
        if (existsSync(localCandidate)) {
          if (localCandidate.toLowerCase().endsWith('.webp') || localCandidate.toLowerCase().endsWith('.png')) {
            await new Promise((resolve, reject) => {
              exec(`"${ffmpegBin}" -y -i "${localCandidate}" -q:v 2 "${outThumbPath}"`, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } else {
            await fs.copyFile(localCandidate, outThumbPath);
          }
          thumbSaved = true;
          log('Thumbnail', `Copied local thumbnail from ${localCandidate}`);
        }
      } catch (e) {
        log('Warning', `Failed to copy local thumbnail: ${e.message}`);
      }
    }

    // 2. If job has Base64 Data URL
    if (!thumbSaved && job.thumbnail && typeof job.thumbnail === 'string' && job.thumbnail.startsWith('data:image/')) {
      try {
        const base64Data = job.thumbnail.split(';base64,').pop();
        await fs.writeFile(outThumbPath, base64Data, { encoding: 'base64' });
        thumbSaved = true;
        log('Thumbnail', 'Saved base64 manual thumbnail');
      } catch (e) {
        log('Warning', `Failed to write base64 thumbnail: ${e.message}`);
      }
    }

    // 3. Check cache directory for pre-downloaded thumbnail if videoId is known
    const vId = job.videoId || (job.thumbnail && typeof job.thumbnail === 'string' ? job.thumbnail.match(/(?:v=|\/vi\/|youtu\.be\/|\/embed\/|\/shorts\/|^)([a-zA-Z0-9_-]{11})/)?.[1] : null);
    if (!thumbSaved && vId) {
      try {
        const cacheBase = process.env.APPDATA ? path.join(process.env.APPDATA, 'MediaFactory', 'Cache', 'm1') : '';
        const candidateFiles = [
          path.join(cacheBase, `${vId}_thumbnail.jpg`),
          path.join(cacheBase, `${vId}.jpg`),
          path.join(cacheBase, `${vId}.webp`),
          path.join(cacheBase, `${vId}.png`),
          `D:/MediaFactory/.mediafactory_data/Cache/m1/${vId}_thumbnail.jpg`,
          `D:/MediaFactory/.mediafactory_data/Cache/m1/${vId}.jpg`,
          `D:/MediaFactory/.mediafactory_data/Cache/m1/${vId}.webp`
        ];
        for (const cf of candidateFiles) {
          if (cf && existsSync(cf)) {
            const stat = await fs.stat(cf);
            if (stat.size > 1000) {
              if (cf.toLowerCase().endsWith('.webp') || cf.toLowerCase().endsWith('.png')) {
                await new Promise((resolve) => {
                  exec(`"${ffmpegBin}" -y -i "${cf}" -q:v 2 "${outThumbPath}"`, () => resolve());
                });
              } else {
                await fs.copyFile(cf, outThumbPath);
              }
              thumbSaved = true;
              log('Thumbnail', `Used cached YouTube thumbnail: ${cf}`);
              break;
            }
          }
        }
      } catch (e) {}
    }

    // 4. If HTTP URL or YouTube videoId, download with complete quality waterfall
    if (!thumbSaved && (vId || (job.thumbnail && typeof job.thumbnail === 'string' && job.thumbnail.startsWith('http')))) {
      const candidateUrls = [];
      if (vId) {
        candidateUrls.push(`https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`);
        candidateUrls.push(`https://i.ytimg.com/vi/${vId}/sddefault.jpg`);
        candidateUrls.push(`https://i.ytimg.com/vi/${vId}/hqdefault.jpg`);
        candidateUrls.push(`https://i.ytimg.com/vi/${vId}/default.jpg`);
      }
      if (job.thumbnail && typeof job.thumbnail === 'string' && job.thumbnail.startsWith('http') && !candidateUrls.includes(job.thumbnail)) {
        candidateUrls.unshift(job.thumbnail);
      }

      for (const tUrl of candidateUrls) {
        try {
          const res = await fetch(tUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0' }
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length > 1200) {
              await fs.writeFile(outThumbPath, buf);
              thumbSaved = true;
              log('Thumbnail', `Downloaded official YouTube thumbnail from ${tUrl}`);
              break;
            }
          }
        } catch (err) {}
      }

      // Fallback: accept smaller buffer (> 200 bytes) if none exceeded 1200
      if (!thumbSaved && candidateUrls.length > 0) {
        for (const tUrl of candidateUrls) {
          try {
            const res = await fetch(tUrl);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              if (buf.length > 200) {
                await fs.writeFile(outThumbPath, buf);
                thumbSaved = true;
                log('Thumbnail', `Downloaded fallback YouTube thumbnail (${buf.length} bytes) from ${tUrl}`);
                break;
              }
            }
          } catch (e) {}
        }
      }
    }

    // 5. Absolute Last Resort ONLY: Video frame extraction if ALL YouTube thumbnail attempts failed
    if (!thumbSaved) {
      log('Warning', 'Could not obtain official YouTube thumbnail. Falling back to video frame extraction.');
      const thumbTime = Math.floor(finalTargetDuration / 2);
      await new Promise((resolve) => {
        exec(`"${ffmpegBin}" -y -ss ${thumbTime} -i "${outVideoPath}" -vframes 1 -q:v 2 "${outThumbPath}"`, resolve);
      });
    }

    // Write Metadata JSON in Output Folder
    const outMetaPath = path.join(outDir, 'metadata.json');
    const metadataContent = job.metadataPayload || {
      title: job.outputName?.replace('.mp4', '') || 'Video',
      cleaned_title: job.outputName?.replace('.mp4', '') || 'Video',
      description: 'Generated by MediaFactory M1 Batch',
      renderedAt: new Date().toISOString(),
      resolution: job.quality || '1080p',
      durationSec: finalTargetDuration
    };
    await fs.writeFile(outMetaPath, JSON.stringify(metadataContent, null, 2), 'utf-8');

    // Write Internal Report
    const report = {
      Status: 'SUCCESS',
      Input: videoIn,
      Output: outName,
      Effects: job.effects,
      Resolution: job.quality || '480p',
      AudioDuration: job.audioDurationSec,
      TargetDuration: finalTargetDuration,
    };
    await fs.writeFile(outReportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Cleanup Temp Files (Success Policy)
    await fs.unlink(tempSegmentPath).catch(() => {});
    await fs.unlink(concatTxtPath).catch(() => {});

    await fs.writeFile(outLogPath, JSON.stringify(logEntries, null, 2), 'utf-8');

    updateProgress(100, 'Completed');
    const stat = await fs.stat(outVideoPath);
    onComplete({
      OUTPUT_PATH: outVideoPath,
      FILE_SIZE: stat.size,
      RENDER_DURATION: finalTargetDuration, // Or actual elapsed time
      FFMPEG_COMMAND: `(Two-Stage Execution Logged in Workspace Cache)`
    });

  } catch (error) {
    log('Error', error.message);
    await fs.writeFile(outLogPath, JSON.stringify(logEntries, null, 2), 'utf-8').catch(()=>{});
    // On failure: Keep temp_segment.mp4 and concat.txt for debugging
    onError(error);
  }
}
