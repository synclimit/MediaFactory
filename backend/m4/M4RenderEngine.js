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

            const outputFilename = job.outputFiles[0] || `M4_Ambient_${Date.now()}.mp4`;
            const outDir = AppPaths.getAmbientOutputDir();
            
            const outPath = path.join(outDir, outputFilename);
            let finalBgVideoPath = bgVideo.path;

            // STEP 1: Generate Seamless Intermediate File (If requested)
            if (loopMode === 'Crossfade Blend' || loopMode === 'Ping-Pong Boomerang') {
                onProgress(0, "Generating intermediate seamless loop...");
                const dur = await this.getDuration(bgVideo.path);
                const tempPath = path.join(outDir, `temp_loopable_${Date.now()}.mp4`);
                
                await new Promise((resolve, reject) => {
                    let filter = '';
                    if (loopMode === 'Crossfade Blend') {
                        const x = Math.min(2, dur / 3); // max crossfade is 1/3 of video, usually 2s
                        const offset = dur - 2 * x;
                        filter = `[0:v]trim=start=0:end=${x},setpts=PTS-STARTPTS[v1];[0:v]trim=start=${x}:end=${dur},setpts=PTS-STARTPTS[v2];[v2][v1]xfade=transition=fade:duration=${x}:offset=${offset}[vout]`;
                    } else if (loopMode === 'Ping-Pong Boomerang') {
                        filter = `[0:v]reverse[r];[0:v][r]concat=n=2:v=1[vout]`;
                    }
                    
                    const pArgs = [
                        '-y', '-i', bgVideo.path, 
                        '-filter_complex', filter, 
                        '-map', '[vout]', 
                        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-an', 
                        tempPath
                    ];
                    
                    const p = spawn(AppPaths.getFFmpegPath(), pArgs);
                    this.activeProcesses.set(job.id + '_temp', p);
                    
                    p.on('close', (code) => {
                        this.activeProcesses.delete(job.id + '_temp');
                        if (code === 0) resolve();
                        else reject(new Error('Failed to generate seamless intermediate file'));
                    });
                });
                
                finalBgVideoPath = tempPath;
                onProgress(0, "Starting final ambient compilation...");
            }

            // STEP 2: Final Ambient Compilation
            let args = [
                '-y',
                '-stream_loop', '-1', // Loop the video infinitely
                '-i', finalBgVideoPath
            ];

            let filterComplex = '';
            let audioCount = 0;
            let audioInputs = [];

            const fs = require('fs');
            const resolveAudioPath = (p) => {
                if (!p) return null;
                if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
                    const files = fs.readdirSync(p).filter(f => f.match(/\.(mp3|wav|flac|m4a)$/i));
                    if (files.length > 0) return path.join(p, files[0]);
                }
                return p;
            };

            let jobTempFiles = [];

            const processAudioSource = async (audioSource) => {
                const arr = Array.isArray(audioSource) ? audioSource : (audioSource && audioSource.path ? [audioSource] : []);
                for (let a of arr) {
                    const resolvedPath = resolveAudioPath(a?.path);
                    if (resolvedPath) {
                        try {
                            // Verify audio file integrity. If it fails, skip it to prevent FFmpeg crashes.
                            await this.getDuration(resolvedPath);
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
            
            this.tempFiles.set(job.id, jobTempFiles);


            let videoFilterStr = '';
            let vMap = '0:v';
            
            if (bgVideo.cropWatermark) {
                videoFilterStr = '[0:v]crop=trunc(iw/1.15/2)*2:trunc(ih/1.15/2)*2:iw/2:ih/2,scale=trunc(iw*1.15/2)*2:trunc(ih*1.15/2)*2[vout]';
                vMap = '[vout]';
            }

            if (audioCount > 0) {
                let audioFilterStr = '';
                if (audioCount === 1) {
                    const a = audioInputs[0];
                    audioFilterStr = `[${a.index}:a]volume=${a.volume.toFixed(2)}[aout]`;
                } else {
                    let mixInputs = '';
                    audioInputs.forEach((a, i) => {
                        audioFilterStr += `[${a.index}:a]volume=${a.volume.toFixed(2)}[a${i}];`;
                        mixInputs += `[a${i}]`;
                    });
                    audioFilterStr += `${mixInputs}amix=inputs=${audioCount}:duration=first:dropout_transition=2[aout]`;
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
                
                if (bgVideo.isMuted !== false || finalBgVideoPath !== bgVideo.path) {
                    args.push('-an'); // No audio (temp videos are generated with -an)
                } else {
                    args.push('-map', '0:a'); // Include original audio
                }
            }

            // Target Duration and Output Format
            args.push(
                '-t', totalDurationSec.toString(),
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '256k',
                '-pix_fmt', 'yuv420p',
                outPath
            );

            console.log('[M4RenderEngine] Spawning FFmpeg with args:', args.join(' '));

            const ffmpeg = spawn(AppPaths.getFFmpegPath(), args);
            this.activeProcesses.set(job.id, ffmpeg);

            let ffmpegLog = '';
            ffmpeg.stderr.on('data', (data) => {
                const text = data.toString();
                ffmpegLog += text;
                console.log('[FFMPEG]', text);
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
                // Cleanup temp file if we created one
                if (finalBgVideoPath !== bgVideo.path) {
                    try { fs.unlinkSync(finalBgVideoPath); } catch (e) {}
                }
                const jobTemps = this.tempFiles.get(job.id) || [];
                jobTemps.forEach(t => {
                    try { fs.unlinkSync(t); } catch (e) {}
                });
                this.tempFiles.delete(job.id);

                if (code === 0) {
                    onComplete(outPath);
                } else {
                    const crashMsg = `FFmpeg exited with code ${code}.\nLog: ${ffmpegLog.split('\n').slice(-5).join('\n')}`;
                    try { require('fs').writeFileSync('D:/MediaFactory/ffmpeg_crash_log.txt', ffmpegLog); } catch(e){}
                    onError(new Error(crashMsg));
                }
            });

        } catch (e) {
            onError(e);
        }
    }

    cancel(jobId) {
        let killed = false;
        const process1 = this.activeProcesses.get(jobId);
        if (process1) {
            process1.kill('SIGKILL');
            this.activeProcesses.delete(jobId);
            killed = true;
        }
        const processTemp = this.activeProcesses.get(jobId + '_temp');
        if (processTemp) {
            processTemp.kill('SIGKILL');
            this.activeProcesses.delete(jobId + '_temp');
            killed = true;
        }
        
        // Find any audio generation processes for this job
        for (const [key, p] of this.activeProcesses.entries()) {
            if (key.startsWith(jobId + '_audio_')) {
                p.kill('SIGKILL');
                this.activeProcesses.delete(key);
                killed = true;
            }
        }

        const jobTemps = this.tempFiles.get(jobId) || [];
        jobTemps.forEach(t => {
            try { require('fs').unlinkSync(t); } catch (e) {}
        });
        this.tempFiles.delete(jobId);

        return killed;
    }
}

module.exports = new M4RenderEngine();
