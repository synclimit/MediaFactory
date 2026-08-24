import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';


function resolveYtDlpPath() {
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin', 'yt-dlp.exe') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'yt-dlp.exe') : '',
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
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'ffmpeg.exe') : '',
    path.join(process.cwd(), 'backend', 'bin', 'ffmpeg.exe'),
    path.join(process.cwd(), 'bin', 'ffmpeg.exe')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return 'ffmpeg';
}

function resolveFFmpegDir() {
  const candidatePaths = [
    process.resourcesPath ? path.join(process.resourcesPath, 'backend', 'bin') : '',
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'bin') : '',
    path.join(process.cwd(), 'backend', 'bin')
  ];
  for (const p of candidatePaths) {
    if (p && existsSync(p)) return p;
  }
  return process.cwd();
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
          const targetUrl = (audioIn.includes('http://') || audioIn.includes('https://')) 
            ? audioIn 
            : `https://www.youtube.com/watch?v=${audioIn}`;

          const ytArgs = [
            '--no-check-certificates',
            '--force-ipv4',
            '--extractor-args', 'youtube:player_client=android,web',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0',
            '--no-warnings',
            '--no-playlist',
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
        const probeRes = await new Promise((res) => {
          exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoIn}"`, (err, stdout) => {
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
    
    // Final render duration strictly follows audio duration
    const finalTargetDuration = job.audioDurationSec || job.audioDuration || job.targetDuration || 10;
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

    // Generate Thumbnail
    if (job.thumbnail && typeof job.thumbnail === 'string') {
      if (job.thumbnail.startsWith('data:image/')) {
        // Base64 Manual Replace
        const base64Data = job.thumbnail.split(';base64,').pop();
        await fs.writeFile(outThumbPath, base64Data, { encoding: 'base64' });
      } else if (job.thumbnail.startsWith('http')) {
        // YouTube Auto Fetch
        try {
          const res = await fetch(job.thumbnail);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buffer = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(outThumbPath, buffer);
        } catch (err) {
          log('Warning', `Failed to download URL thumbnail: ${err.message}. Falling back to extraction.`);
          const thumbTime = Math.floor(finalTargetDuration / 2);
          const ffmpegBin = resolveFFmpegPath();
          await new Promise((resolve) => {
            exec(`"${ffmpegBin}" -y -ss ${thumbTime} -i "${outVideoPath}" -vframes 1 -q:v 2 "${outThumbPath}"`, resolve);
          });
        }
      } else {
        const thumbTime = Math.floor(finalTargetDuration / 2);
        const ffmpegBin = resolveFFmpegPath();
        await new Promise((resolve) => {
          exec(`"${ffmpegBin}" -y -ss ${thumbTime} -i "${outVideoPath}" -vframes 1 -q:v 2 "${outThumbPath}"`, resolve);
        });
      }
    } else {
      // Master Video Extract Fallback
      const thumbTime = Math.floor(finalTargetDuration / 2);
      const ffmpegBin = resolveFFmpegPath();
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
