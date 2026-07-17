const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

const jobs = {};
let jobCounter = 0;

function setJobStatus(queueId, newStatus) {
    if (!jobs[queueId]) return;
    const oldStatus = jobs[queueId].status || 'WAITING';
    console.log('STATUS_CHANGE', oldStatus, '->', newStatus);
    jobs[queueId].status = newStatus;
}

function hashUri(uri) {
    return crypto.createHash('md5').update(uri).digest('hex').substring(0, 8);
}

const execAsync = (cmd) => new Promise((resolve, reject) => {
    console.log(`[FFMPEG] Executing command: ${cmd}`);
    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
        if (err) {
            console.log(`[FFMPEG] Command Failed with exit code: ${err.code || 1}`);
            console.log(`[FFMPEG] STDERR: ${stderr || err.message}`);
            reject(new Error(`Command failed: ${err.message}`));
        } else {
            resolve(stdout);
        }
    });
});

async function processJob(job) {
    const startTime = Date.now();
    setJobStatus(job.queueId, 'RENDERING');
    console.log('RENDER_START', job.queueId, job.renderName);
    jobs[job.queueId].progress = 0;

    try {
        const cacheDir = path.resolve('.mediafactory/cache/m2');
        await fs.mkdir(cacheDir, { recursive: true });

        const outputDir = path.resolve('Output/AudioMix');
        await fs.mkdir(outputDir, { recursive: true });

        const resolvedPaths = [];
        for (let i = 0; i < job.tracks.length; i++) {
            const track = job.tracks[i];
            let uri = '';
            if (typeof track === 'string') uri = track;
            else if (track.uri) uri = track.uri;
            else if (track.title) uri = track.title;
            else uri = 'unknown';

            const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be');
            const ext = '.mp3';
            const cachePath = path.join(cacheDir, `${hashUri(uri)}${ext}`);
            
            try {
                const stats = await fs.stat(cachePath);
                if (stats.size === 0) throw new Error('Cache empty');
            } catch (err) {
                if (isYouTube) {
                    const ytOut = path.join(cacheDir, hashUri(uri) + '.%(ext)s');
                    const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '-o', ytOut, '--', uri];
                    await new Promise((resolve, reject) => {
                        const ytProc = spawn('yt-dlp', ytArgs);
                        ytProc.on('close', (code) => {
                            if (code === 0) resolve();
                            else reject(new Error(`yt-dlp failed code ${code}`));
                        });
                        ytProc.on('error', reject);
                    });
                } else {
                    const localPath = path.resolve(uri);
                    const lStats = await fs.stat(localPath);
                    if (lStats.size === 0) throw new Error('Source file 0 bytes');
                    
                    if (localPath.toLowerCase().endsWith('.mp3')) {
                        await fs.copyFile(localPath, cachePath);
                    } else {
                        await execAsync(`ffmpeg -y -i "${localPath}" -c:a libmp3lame -q:a 2 "${cachePath}"`);
                    }
                }
            }
            resolvedPaths.push(cachePath);
            jobs[job.queueId].progress = Math.floor(((i + 1) / job.tracks.length) * 40);
        }

        const concatPath = path.join(cacheDir, `concat_${job.queueId}.txt`);
        const concatContent = resolvedPaths.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n');
        await fs.writeFile(concatPath, concatContent, 'utf8');
        jobs[job.queueId].progress = 50;

        const sanitizedName = job.renderName.replace(/[<>:"/\\|?*]+/g, '_') || 'Output';
        const outputPath = path.join(outputDir, `${sanitizedName}.mp3`);

        let ffmpegCmd = `ffmpeg -progress pipe:1 -y -f concat -safe 0 -i "${concatPath}"`;
        let afStr = '';
        if (job.masteringSettings) {
            const m = job.masteringSettings;
            const filters = [];
            filters.push(`loudnorm=I=${m.targetLufs}:TP=-1.0:LRA=11`);
            if (m.compressor) filters.push('acompressor');
            if (m.outputGain !== '0') filters.push(`volume=${m.outputGain}dB`);
            if (m.limiter) filters.push('alimiter=limit=-0.5dB');
            
            if (filters.length > 0) {
                afStr = filters.join(',');
                ffmpegCmd += ` -af "${afStr}" -c:a libmp3lame -b:a 320k`;
            } else {
                ffmpegCmd += ` -c copy`;
            }
        } else {
            ffmpegCmd += ` -c copy`;
        }
        ffmpegCmd += ` "${outputPath}"`;
        jobs[job.queueId].FFMPEG_COMMAND = ffmpegCmd;

        await new Promise((resolve, reject) => {
            const ffProc = spawn(ffmpegCmd, { shell: true });
            let outBuffer = '';
            ffProc.stdout.on('data', (data) => {
                outBuffer += data.toString();
                const lines = outBuffer.split('\n');
                outBuffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('out_time_ms=')) {
                        const out_time_ms = parseInt(line.split('=')[1], 10);
                        if (!isNaN(out_time_ms) && job.totalDurationSec) {
                            const progressPct = ((out_time_ms / 1000000) / job.totalDurationSec) * 100;
                            const normalizedProgress = 50 + Math.min(progressPct * 0.45, 45);
                            jobs[job.queueId].progress = normalizedProgress;
                        }
                    }
                }
            });
            ffProc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
            ffProc.on('error', reject);
        });

        jobs[job.queueId].progress = 95;
        const outStats = await fs.stat(outputPath);
        if (outStats.size === 0) throw new Error('Output is 0 bytes');

        const metadataPath = path.join(outputDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify({
            renderPlan: job.renderPlan || job.profileName || 'Unknown',
            outputName: sanitizedName,
            tracks: job.tracks,
            createdAt: new Date().toISOString()
        }, null, 2), 'utf8');

        jobs[job.queueId].progress = 100;
        jobs[job.queueId].OUTPUT_PATH = outputPath;
        jobs[job.queueId].FILE_SIZE = (outStats.size / (1024 * 1024)).toFixed(2) + ' MB';
        jobs[job.queueId].RENDER_DURATION = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
        jobs[job.queueId].completedAt = new Date().toISOString();
        setJobStatus(job.queueId, 'COMPLETED');

    } catch (error) {
        jobs[job.queueId].failureReason = error.message;
        setJobStatus(job.queueId, 'FAILED');
    }
}

module.exports = { jobs, processJob, hashUri, jobCounter };