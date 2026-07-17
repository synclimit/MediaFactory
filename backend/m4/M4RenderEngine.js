const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const AppPaths = require('../system/AppPaths');

class M4RenderEngine {
    constructor() {
        this.activeProcesses = new Map();
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
            const { bgVideo, ambientAudio, relaxMusic, totalDurationSec, loopMode } = job.m4Payload;
            
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

            if (ambientAudio && ambientAudio.path) {
                args.push('-stream_loop', '-1', '-i', ambientAudio.path);
                audioInputs.push({ index: 1, volume: (ambientAudio.volume || 100) / 100 });
                audioCount++;
            }

            if (relaxMusic && relaxMusic.path) {
                args.push('-stream_loop', '-1', '-i', relaxMusic.path);
                audioInputs.push({ index: audioCount === 1 ? 2 : 1, volume: (relaxMusic.volume || 100) / 100 });
                audioCount++;
            }

            if (audioCount > 0) {
                let filterStr = '';
                let mixInputs = '';
                
                audioInputs.forEach((a, i) => {
                    filterStr += `[${a.index}:a]volume=${a.volume.toFixed(2)}[a${i}];`;
                    mixInputs += `[a${i}]`;
                });
                
                filterStr += `${mixInputs}amix=inputs=${audioCount}:duration=first:dropout_transition=2[aout]`;
                filterComplex = filterStr;
                
                args.push('-filter_complex', filterComplex);
                args.push('-map', '0:v');
                args.push('-map', '[aout]');
            } else {
                args.push('-map', '0:v');
                args.push('-an'); // No audio
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

            ffmpeg.stderr.on('data', (data) => {
                const text = data.toString();
                // Parse time=HH:MM:SS.ms
                const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d{2}/);
                if (timeMatch) {
                    const h = parseInt(timeMatch[1], 10);
                    const m = parseInt(timeMatch[2], 10);
                    const s = parseInt(timeMatch[3], 10);
                    const currentSec = (h * 3600) + (m * 60) + s;
                    
                    let progress = (currentSec / totalDurationSec) * 100;
                    if (progress > 99.9) progress = 99.9;
                    if (progress < 0) progress = 0;
                    
                    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    onProgress(progress.toFixed(2), timeString);
                }
            });

            ffmpeg.on('close', (code) => {
                this.activeProcesses.delete(job.id);
                // Cleanup temp file if we created one
                if (finalBgVideoPath !== bgVideo.path) {
                    try { fs.unlinkSync(finalBgVideoPath); } catch (e) {}
                }

                if (code === 0) {
                    onComplete(outPath);
                } else {
                    onError(new Error(`FFmpeg exited with code ${code}`));
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
        return killed;
    }
}

module.exports = new M4RenderEngine();
