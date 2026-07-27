const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const AppPaths = require('../system/AppPaths');

class SmartAudioLooper {
    getDuration(filePath) {
        return new Promise((resolve, reject) => {
            exec(`"${AppPaths.getFFprobePath()}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout) => {
                if (error) return reject(error);
                resolve(parseFloat(stdout));
            });
        });
    }

    async makeSeamless(audioPath, activeProcesses, jobId) {
        try {
            const duration = await this.getDuration(audioPath);
            if (!duration || isNaN(duration) || duration < 3.0) {
                // Too short to reliably crossfade or invalid duration, just return original
                return audioPath;
            }

            const mid = (duration / 2).toFixed(2);
            // Default crossfade is 2 seconds, but max 1/3 of the half-duration
            const xfadeDur = Math.min(2.0, duration / 6).toFixed(2);
            
            const outDir = AppPaths.getAmbientOutputDir();
            const ext = path.extname(audioPath) || '.mp3';
            const outputFilename = `temp_audio_loop_${Date.now()}_${Math.floor(Math.random()*1000)}${ext}`;
            const outPath = path.join(outDir, outputFilename);

            await new Promise((resolve, reject) => {
                const filter = `[0:a]atrim=start=0:end=${mid},asetpts=PTS-STARTPTS[a1];[0:a]atrim=start=${mid}:end=${duration},asetpts=PTS-STARTPTS[a2];[a2][a1]acrossfade=d=${xfadeDur}[aout]`;
                
                // Audio encoder based on extension
                let audioCodec = 'aac';
                if (ext.toLowerCase() === '.mp3') audioCodec = 'libmp3lame';
                else if (ext.toLowerCase() === '.wav') audioCodec = 'pcm_s16le';
                
                const pArgs = [
                    '-y', '-i', audioPath,
                    '-filter_complex', filter,
                    '-map', '[aout]',
                    '-c:a', audioCodec,
                    '-b:a', '192k',
                    outPath
                ];

                const p = spawn(AppPaths.getFFmpegPath(), pArgs);
                const procId = jobId + '_audio_' + Date.now() + Math.random().toString().substring(2,6);
                if (activeProcesses) {
                    activeProcesses.set(procId, p);
                }

                p.on('close', (code) => {
                    if (activeProcesses) {
                        activeProcesses.delete(procId);
                    }
                    if (code === 0) resolve();
                    else reject(new Error('Failed to generate seamless audio loop'));
                });
            });

            return outPath;
        } catch (err) {
            console.error('[SmartAudioLooper] Error making seamless audio:', err);
            return audioPath; // Fallback to original if failed
        }
    }
}

module.exports = new SmartAudioLooper();
