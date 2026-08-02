const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const AppPaths = require('../system/AppPaths');
const SmartAudioLooper = require('./SmartAudioLooper');

class M4RenderEngine {
    constructor() {
        this.activeProcesses = new Map();
        this.tempFiles = new Map();
    }

    getDuration(filePath) {
        return new Promise((resolve, reject) => {
            exec(`"${AppPaths.getFFprobePath()}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
                if (error) return reject(error);
                resolve(parseFloat(stdout));
            });
        });
    }

    async render(job, onProgress, onComplete, onError) {
        try {
            let { totalDurationSec } = job;
            if (!totalDurationSec && job.m4Payload) totalDurationSec = job.m4Payload.totalDurationSec;
            if (!totalDurationSec) totalDurationSec = 60; // Ultimate fallback
            
            const { bgVideo, ambientAudio, relaxMusic, loopMode } = job.m4Payload;
            
            if (!bgVideo || !bgVideo.path) {
                return onError(new Error("Background video is missing."));
            }

            const outputFilename = job.outputFiles?.[0] || `M4_Ambient_${Date.now()}.mp4`;
            let outDir = AppPaths.getAmbientOutputDir();
            if (job.outputFolder) {
                outDir = path.isAbsolute(job.outputFolder) ? job.outputFolder : path.join(process.cwd(), job.outputFolder);
            }
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            
            const outPath = path.join(outDir, outputFilename);
            let finalBgVideoPath = bgVideo.path;

            // STEP 1: Generate Seamless Intermediate File (If requested)
            if (loopMode === 'Crossfade Blend' || loopMode === 'Ping-Pong Boomerang') {
                onProgress(0, "Generating intermediate seamless loop...");
                const dur = await this.getDuration(bgVideo.path);
                let tempPath = path.join(outDir, `temp_loopable_${Date.now()}.mp4`);
                
                let filter = '';
                if (loopMode === 'Crossfade Blend') {
                    const x = Math.min(2, dur / 3); // max crossfade is 1/3 of video, usually 2s
                    const offset = Math.max(0, dur - 2 * x);
                    filter = `[0:v]trim=start=0:end=${x.toFixed(2)},setpts=PTS-STARTPTS[v1];[0:v]trim=start=${x.toFixed(2)}:end=${dur.toFixed(2)},setpts=PTS-STARTPTS[v2];[v2][v1]xfade=transition=fade:duration=${x.toFixed(2)}:offset=${offset.toFixed(2)}[vout]`;
                } else if (loopMode === 'Ping-Pong Boomerang') {
                    filter = `[0:v]split=2[v1][v2];[v2]reverse[r];[v1][r]concat=n=2:v=1[vout]`;
                }

                const runStep1FFmpeg = (encArgs) => {
                    return new Promise((resolve, reject) => {
                        const pArgs = [
                            '-y', '-i', bgVideo.path,
                            '-filter_complex', filter,
                            '-map', '[vout]',
                            ...encArgs, '-an',
                            '-pix_fmt', 'yuv420p',
                            tempPath
                        ];
                        
                        const p = spawn(AppPaths.getFFmpegPath(), pArgs);
                        let stderrLog = '';
                        p.stderr.on('data', (d) => { stderrLog += d.toString(); });
                        p.tempPathToClean = tempPath;
                        this.activeProcesses.set(job.id + '_temp', p);
                        
                        p.on('close', (code) => {
                            this.activeProcesses.delete(job.id + '_temp');
                            if (code === 0 && fs.existsSync(tempPath) && fs.statSync(tempPath).size > 0) {
                                resolve();
                            } else {
                                if (p.isCancelled) {
                                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
                                    reject(new Error('Job cancelled'));
                                } else {
                                    reject(new Error(`Step 1 FFmpeg failed (code ${code}): ${stderrLog.slice(-500)}`));
                                }
                            }
                        });
                        p.on('error', reject);
                    });
                };

                let step1Encoder = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '22', '-threads', '0'];
                let isStep1Hw = false;
                try {
                  const { execSync } = require('child_process');
                  const encStdout = execSync(`"${AppPaths.getFFmpegPath()}" -encoders`, { encoding: 'utf8' });
                  if (encStdout.includes('h264_nvenc')) {
                    step1Encoder = ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '20'];
                    isStep1Hw = true;
                  } else if (encStdout.includes('h264_qsv')) {
                    step1Encoder = ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20'];
                    isStep1Hw = true;
                  }
                } catch(e) {}

                try {
                    await runStep1FFmpeg(step1Encoder);
                    finalBgVideoPath = tempPath;
                } catch (step1Err) {
                    if (isStep1Hw) {
                        console.warn(`[M4RenderEngine Step 1] HW Encoder failed: ${step1Err.message}. Retrying with CPU libx264...`);
                        const cpuFallback = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '22', '-threads', '0'];
                        try {
                            await runStep1FFmpeg(cpuFallback);
                            finalBgVideoPath = tempPath;
                        } catch (fallbackErr) {
                            console.warn(`[M4RenderEngine Step 1] CPU Fallback failed: ${fallbackErr.message}. Using direct video input.`);
                            finalBgVideoPath = bgVideo.path;
                        }
                    } else {
                        console.warn(`[M4RenderEngine Step 1] Step 1 failed: ${step1Err.message}. Using direct video input.`);
                        finalBgVideoPath = bgVideo.path;
                    }
                }
                
                onProgress(0, "Starting final ambient compilation...");
            }

            // STEP 2: Final Ambient Compilation with HW Acceleration
            let args = [
                '-y',
                '-stream_loop', '-1', // Loop the video infinitely
                '-i', finalBgVideoPath
            ];

            let audioCount = 0;
            let audioInputs = [];

            const resolveAudioPath = (p) => {
                if (!p) return null;
                if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
                    const files = fs.readdirSync(p).filter(f => f.match(/\.(mp3|wav|flac|m4a)$/i));
                    if (files.length > 0) return path.join(p, files[0]);
                }
                return p;
            };

            let jobTempFiles = [];
            let maxAudioDuration = 0;

            const processAudioSource = async (audioSource) => {
                const arr = Array.isArray(audioSource) ? audioSource : (audioSource && audioSource.path ? [audioSource] : []);
                for (let a of arr) {
                    const resolvedPath = resolveAudioPath(a?.path);
                    if (resolvedPath) {
                        try {
                            const dur = await this.getDuration(resolvedPath);
                            if (dur > maxAudioDuration) maxAudioDuration = dur;
                        } catch (err) {
                            console.error('[M4RenderEngine] Skipping invalid/corrupt audio:', resolvedPath);
                            continue;
                        }
                        
                        onProgress(0, `Smart Looping: ${path.basename(resolvedPath)}...`);
                        const seamlessPath = await SmartAudioLooper.makeSeamless(resolvedPath, this.activeProcesses, job.id);
                        if (seamlessPath !== resolvedPath) {
                            jobTempFiles.push(seamlessPath);
                        }
                        args.push('-stream_loop', '-1', '-i', seamlessPath);
                        audioCount++;
                        audioInputs.push({ index: audioCount, volume: (a.volume !== undefined ? a.volume : 100) / 100 });
                    }
                }
            };

            await processAudioSource(ambientAudio);
            await processAudioSource(relaxMusic);

            // Lock totalDurationSec to actual audio track duration when audio exists
            if (maxAudioDuration > 0 && (job.m4Payload?.durationMode === 'Match Audio' || job.m4Payload?.durationMode === '2x Loop' || job.m4Payload?.durationMode === '1x Loop' || totalDurationSec < maxAudioDuration)) {
                totalDurationSec = Math.round(maxAudioDuration);
                console.log(`[M4RenderEngine] Locked totalDurationSec to Audio Track Duration: ${totalDurationSec}s`);
            }
            
            this.tempFiles.set(job.id, jobTempFiles);

            // Extract Intro Sequence from m4Objects or m4Payload
            const m4Objs = job.m4Payload?.m4Objects || job.m4Payload?.objects || [];
            console.log('[M4RenderEngine] m4Objects payload count:', m4Objs.length);
            const introObj = m4Objs.find(o => (o.name === 'Intro Sequence' || o.type === 'intro' || o.id?.includes('intro')) && o.visible !== false);
            
            let videoFilterChain = [];
            if (bgVideo.cropWatermark) {
                videoFilterChain.push('crop=trunc(iw/1.15/2)*2:trunc(ih/1.15/2)*2:(in_w-out_w)/2:(in_h-out_h)/2,scale=trunc(iw*1.15/2)*2:trunc(ih*1.15/2)*2');
            }

            if (introObj) {
                console.log('[M4RenderEngine] Intro Sequence Enabled:', JSON.stringify(introObj));
                const style = introObj.introStyle || 'Paragraph (Text)';
                const darkIntensity = introObj.darkIntensity !== undefined ? introObj.darkIntensity : 70;
                const fontSize = introObj.introFontSize || 48;
                const rawColor = (introObj.introTextColor || '#ffffff').replace('#', '');
                const textColor = `0x${rawColor}`;
                
                let fontOpt = "font='Arial':";
                if (fs.existsSync('C:/Windows/Fonts/arial.ttf')) {
                    fontOpt = "fontfile='C\\:/Windows/Fonts/arial.ttf':";
                }

                if (style === 'Paragraph (Text)') {
                    const pCount = introObj.paragraphCount ? parseInt(introObj.paragraphCount) : 1;
                    const pDur = introObj.paragraphDuration ? parseInt(introObj.paragraphDuration) : 5;
                    const totalIntroSec = pCount * pDur;
                    
                    // Dark Overlay Background
                    if (darkIntensity > 0) {
                        const alpha = (darkIntensity / 100).toFixed(2);
                        videoFilterChain.push(`drawbox=t=fill:color=black@${alpha}:enable='between(t,0,${totalIntroSec})'`);
                    }

                    // Draw text paragraphs
                    for (let i = 0; i < pCount; i++) {
                        const rawText = introObj[`introText${i+1}`] || (i === 0 ? (introObj.introText1 || 'WELCOME TO MY CHANNEL') : '');
                        if (!rawText.trim()) continue;
                        
                        const safeText = rawText.replace(/\\/g, '\\\\').replace(/'/g, "'\\\\''").replace(/:/g, '\\:').replace(/%/g, '\\%');
                        const startTime = i * pDur;
                        const endTime = (i + 1) * pDur;
                        const fadeInEnd = (startTime + 0.5).toFixed(2);
                        const fadeOutStart = (endTime - 0.5).toFixed(2);
                        
                        const alphaExpr = `if(lt(t,${fadeInEnd}),(t-${startTime})/0.5,if(gt(t,${fadeOutStart}),(${endTime}-t)/0.5,1))`;
                        videoFilterChain.push(`drawtext=${fontOpt}text='${safeText}':fontsize=${fontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=(h-text_h)/2:alpha='${alphaExpr}':enable='between(t,${startTime},${endTime})'`);
                    }
                } else if (style === 'Fade from Black') {
                    videoFilterChain.push('fade=t=in:st=0:d=3');
                } else if (style === 'Fade from White') {
                    videoFilterChain.push("drawbox=t=fill:color=white:enable='between(t,0,3)',fade=t=in:st=0:d=3");
                }
            }

            let videoFilterStr = '';
            let vMap = '0:v';
            if (videoFilterChain.length > 0) {
                videoFilterStr = `[0:v]${videoFilterChain.join(',')}[vout]`;
                vMap = '[vout]';
            }

            const includeOriginalAudio = bgVideo.isMuted === false && finalBgVideoPath === bgVideo.path;
            const totalAudioInputs = audioCount + (includeOriginalAudio ? 1 : 0);

            if (totalAudioInputs > 0) {
                let audioFilterStr = '';
                let allAudioInputs = [...audioInputs];
                if (includeOriginalAudio) {
                    allAudioInputs.unshift({ index: '0', isZeroStream: true, volume: 1.0 });
                }

                if (totalAudioInputs === 1) {
                    const a = allAudioInputs[0];
                    const streamTag = a.isZeroStream ? '0:a?' : `${a.index}:0`;
                    audioFilterStr = `[${streamTag}]volume=${a.volume.toFixed(2)}[aout]`;
                } else {
                    let mixInputs = '';
                    allAudioInputs.forEach((a, i) => {
                        const streamTag = a.isZeroStream ? '0:a?' : `${a.index}:0`;
                        audioFilterStr += `[${streamTag}]volume=${a.volume.toFixed(2)}[a${i}];`;
                        mixInputs += `[a${i}]`;
                    });
                    audioFilterStr += `${mixInputs}amix=inputs=${totalAudioInputs}:duration=first:dropout_transition=2:normalize=0[aout]`;
                }
                
                if (videoFilterStr) {
                    args.push('-filter_complex', videoFilterStr + ';' + audioFilterStr);
                } else {
                    args.push('-filter_complex', audioFilterStr);
                }
                args.push('-map', vMap);
                args.push('-map', '[aout]');
            } else {
                if (videoFilterStr) {
                    args.push('-filter_complex', videoFilterStr);
                }
                args.push('-map', vMap);
                args.push('-an');
            }

            // Detect Hardware Acceleration Encoders (NVENC / QSV / AMF)
            let vEncoderArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '22', '-threads', '0'];
            let isHwAccelerated = false;
            try {
              const { execSync } = require('child_process');
              const encStdout = execSync(`"${AppPaths.getFFmpegPath()}" -encoders`, { encoding: 'utf8' });
              if (encStdout.includes('h264_nvenc')) {
                vEncoderArgs = ['-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '20'];
                isHwAccelerated = true;
                console.log('[M4RenderEngine] NVIDIA NVENC Hardware Acceleration Enabled');
              } else if (encStdout.includes('h264_qsv')) {
                vEncoderArgs = ['-c:v', 'h264_qsv', '-preset', 'veryfast', '-global_quality', '20'];
                isHwAccelerated = true;
                console.log('[M4RenderEngine] Intel QSV Hardware Acceleration Enabled');
              } else if (encStdout.includes('h264_amf')) {
                vEncoderArgs = ['-c:v', 'h264_amf', '-usage', 'transcoding', '-quality', 'speed'];
                isHwAccelerated = true;
                console.log('[M4RenderEngine] AMD AMF Hardware Acceleration Enabled');
              }
            } catch(e) {}

            const runFinalFFmpeg = (encArgs) => {
              return new Promise((resolve, reject) => {
                const finalArgs = [...args];
                finalArgs.push(
                    '-t', totalDurationSec.toString(),
                    ...encArgs,
                    '-pix_fmt', 'yuv420p'
                );
                if (totalAudioInputs > 0) {
                    finalArgs.push('-c:a', 'aac', '-b:a', '256k');
                }
                finalArgs.push('-max_muxing_queue_size', '2048');
                finalArgs.push(outPath);

                console.log('[M4RenderEngine] Spawning FFmpeg with args:', finalArgs.join(' '));

                const ffmpeg = spawn(AppPaths.getFFmpegPath(), finalArgs);
                this.activeProcesses.set(job.id, ffmpeg);

                let ffmpegLog = '';
                ffmpeg.stderr.on('data', (data) => {
                    const text = data.toString();
                    ffmpegLog += text;
                    if (ffmpegLog.length > 50000) ffmpegLog = ffmpegLog.slice(-20000);
                    const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})/);
                    if (timeMatch) {
                        const h = parseInt(timeMatch[1], 10);
                        const m = parseInt(timeMatch[2], 10);
                        const s = parseInt(timeMatch[3], 10);
                        const currentSec = (h * 3600) + (m * 60) + s;
                        
                        let progress = (currentSec / totalDurationSec) * 100;
                        if (progress > 99.9) progress = 99.9;
                        if (progress < 0) progress = 0;
                        
                        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                        onProgress(Number(progress.toFixed(2)), timeString);
                    }
                });

                ffmpeg.on('close', (code) => {
                    this.activeProcesses.delete(job.id);
                    if (ffmpeg.isCancelled) return reject(new Error('Job cancelled'));
                    if (code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
                        resolve();
                    } else {
                        reject(new Error(`FFmpeg exited with code ${code}.\nLog: ${ffmpegLog.slice(-1000)}`));
                    }
                });
                ffmpeg.on('error', reject);
              });
            };

            try {
              await runFinalFFmpeg(vEncoderArgs);
            } catch (finalErr) {
              if (isHwAccelerated) {
                console.warn(`[M4RenderEngine] GPU Encoder failed (${finalErr.message}). Retrying with safe Multi-threaded CPU libx264...`);
                const cpuFallback = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '22', '-threads', '0'];
                await runFinalFFmpeg(cpuFallback);
              } else {
                throw finalErr;
              }
            }

            // Cleanup temp file if we created one
            if (finalBgVideoPath !== bgVideo.path) {
                try { fs.unlinkSync(finalBgVideoPath); } catch (e) {}
            }
            const jobTemps = this.tempFiles.get(job.id) || [];
            jobTemps.forEach(t => {
                try { fs.unlinkSync(t); } catch (e) {}
            });
            this.tempFiles.delete(job.id);

            onComplete(outPath);

        } catch (e) {
            onError(e);
        }
    }

    cancel(jobId) {
        let killed = false;
        const process1 = this.activeProcesses.get(jobId);
        if (process1) {
            process1.isCancelled = true;
            process1.kill('SIGKILL');
            this.activeProcesses.delete(jobId);
            killed = true;
        }
        const processTemp = this.activeProcesses.get(jobId + '_temp');
        if (processTemp) {
            processTemp.isCancelled = true;
            processTemp.kill('SIGKILL');
            if (processTemp.tempPathToClean) {
                try { if (fs.existsSync(processTemp.tempPathToClean)) fs.unlinkSync(processTemp.tempPathToClean); } catch(e){}
            }
            this.activeProcesses.delete(jobId + '_temp');
            killed = true;
        }
        
        // Find any audio generation processes for this job
        for (const [key, p] of this.activeProcesses.entries()) {
            if (key.startsWith(jobId + '_audio_')) {
                p.isCancelled = true;
                p.kill('SIGKILL');
                this.activeProcesses.delete(key);
                killed = true;
            }
        }

        const jobTemps = this.tempFiles.get(jobId) || [];
        jobTemps.forEach(t => {
            try { fs.unlinkSync(t); } catch (e) {}
        });
        this.tempFiles.delete(jobId);

        return killed;
    }
}

module.exports = new M4RenderEngine();
