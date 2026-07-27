const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const AppPaths = require('../system/AppPaths');

const jobs = {};
let jobCounter = 0;

function setJobStatus(job, newStatus) {
    if (!job) return;
    const oldStatus = job.status || 'WAITING';
    console.log('STATUS_CHANGE', oldStatus, '->', newStatus);
    job.status = newStatus;
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
    setJobStatus(job, 'RENDERING');
    console.log('RENDER_START', job.queueId, job.renderName);
    job.progress = 0;

    try {
        const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
        await fs.mkdir(cacheDir, { recursive: true });

        const outputDir = path.resolve(job.outputFolder || 'Output/AudioMix');
        await fs.mkdir(outputDir, { recursive: true });

        const resolvedPaths = [];
        for (let i = 0; i < job.tracks.length; i++) {
            const track = job.tracks[i];
            let uri = '';
            if (typeof track === 'string') uri = track;
            else if (track.uri) uri = track.uri;
            else if (track.title) uri = track.title;
            else uri = 'unknown';

            const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be') || uri.startsWith('ytsearch:') || (!path.isAbsolute(uri) && !uri.startsWith('http') && !uri.startsWith('Assets/') && !uri.startsWith('Assets\\') && !require('fs').existsSync(path.resolve(uri)));
            const ext = '.mp3';
            const cachePath = path.join(cacheDir, `${hashUri(uri)}${ext}`);
            
            try {
                const stats = await fs.stat(cachePath);
                if (stats.size === 0) throw new Error('Cache empty');
            } catch (err) {
                if (isYouTube) {
                    let searchUri = uri;
                    if (!path.isAbsolute(uri) && !uri.startsWith('http') && !uri.startsWith('ytsearch:')) {
                        searchUri = `ytsearch:${uri}`;
                    }
                    const ytOut = path.join(cacheDir, hashUri(uri) + '.%(ext)s');
                    const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '--js-runtimes', 'node', '-o', ytOut, '--', searchUri];
                    await new Promise((resolve, reject) => {
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
                            else reject(new Error(`yt-dlp failed code ${code}`));
                        });
                        ytProc.on('error', (err) => {
                            clearTimeout(timeoutId);
                            reject(err);
                        });
                    });
                } else {
                    const localPath = path.resolve(uri);
                    const lStats = await fs.stat(localPath);
                    if (lStats.size === 0) throw new Error('Source file 0 bytes');
                    
                    if (localPath.toLowerCase().endsWith('.mp3')) {
                        await fs.copyFile(localPath, cachePath);
                    } else {
                        await execAsync(`ffmpeg -nostdin -y -i "${localPath}" -c:a libmp3lame -q:a 2 "${cachePath}"`);
                    }
                }
            }
            resolvedPaths.push(cachePath);
            job.progress = Math.floor(((i + 1) / job.tracks.length) * 40);
        }

        const concatPath = path.join(cacheDir, `concat_${job.queueId}.txt`);
        const concatContent = resolvedPaths.map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n');
        await fs.writeFile(concatPath, concatContent, 'utf8');
        job.progress = 50;

        const sanitizedName = job.renderName.replace(/[<>:"/\\|?*]+/g, '_') || 'Output';
        const outputPath = path.join(outputDir, `${sanitizedName}.mp3`);

        let ffmpegCmd = `ffmpeg -nostdin -progress pipe:1 -y -f concat -safe 0 -i "${concatPath}"`;
        let afStr = '';
        if (job.masteringSettings) {
            const m = job.masteringSettings;
            const filters = [];
            filters.push(`loudnorm=I=${m.targetLufs}:TP=-1.0:LRA=11`);
            if (m.compressor) filters.push('acompressor');

            // Reverb (aecho) — maps 0-100% to delay 40-120ms, decay 0.1-0.5
            if (m.reverb && m.reverb > 0) {
                const delay = Math.round(40 + (m.reverb / 100) * 80);
                const decay = (0.1 + (m.reverb / 100) * 0.4).toFixed(2);
                filters.push(`aecho=0.8:0.88:${delay}:${decay}`);
            }

            // Tape Flutter (vibrato) — maps 0-100% to freq 3-8Hz, depth 0.002-0.015
            if (m.tapeFlutter && m.tapeFlutter > 0) {
                const freq = (3 + (m.tapeFlutter / 100) * 5).toFixed(1);
                const depth = (0.002 + (m.tapeFlutter / 100) * 0.013).toFixed(4);
                filters.push(`vibrato=f=${freq}:d=${depth}`);
            }

            // Bitcrusher (acrusher) — maps 0-100% to bits 16→4, samples 1→32
            if (m.bitcrush && m.bitcrush > 0) {
                const bits = Math.round(16 - (m.bitcrush / 100) * 12);
                const samples = Math.round(1 + (m.bitcrush / 100) * 31);
                filters.push(`acrusher=bits=${bits}:samples=${samples}:mode=log`);
            }

            if (m.outputGain !== '0') filters.push(`volume=${m.outputGain}dB`);
            if (m.limiter) filters.push('alimiter=limit=-0.5dB');

            const useLofiNoise = m.lofiNoise && m.lofiNoise > 0;

            if (useLofiNoise) {
                // Lofi Noise: use filter_complex with pink noise source
                const noiseVol = (m.lofiNoise / 100 * 0.15).toFixed(4);
                const totalDur = job.totalDurationSec || 600;
                const mainChain = filters.length > 0 ? filters.join(',') : 'anull';
                // [0:a] = concat input, [1:a] = generated pink noise
                const fc = `[0:a]${mainChain}[main];[1:a]lowpass=f=3500,volume=${noiseVol}[noise];[main][noise]amix=inputs=2:duration=first:dropout_transition=2[out]`;
                ffmpegCmd += ` -f lavfi -t ${totalDur} -i "anoisesrc=c=pink:r=44100"`;
                ffmpegCmd += ` -filter_complex "${fc}" -map "[out]" -c:a libmp3lame -b:a 320k`;
            } else if (filters.length > 0) {
                afStr = filters.join(',');
                ffmpegCmd += ` -af "${afStr}" -c:a libmp3lame -b:a 320k`;
            } else {
                ffmpegCmd += ` -c copy`;
            }
        } else {
            ffmpegCmd += ` -c copy`;
        }
        ffmpegCmd += ` "${outputPath}"`;
        job.FFMPEG_COMMAND = ffmpegCmd;

        await new Promise((resolve, reject) => {
            const ffProc = spawn(ffmpegCmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
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
                            job.progress = normalizedProgress;
                        }
                    }
                }
            });
            ffProc.stderr.on('data', () => {}); // Consume stderr to prevent pipe buffer overflow
            ffProc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
            ffProc.on('error', reject);
        });

        job.progress = 95;
        const outStats = await fs.stat(outputPath);
        if (outStats.size === 0) throw new Error('Output is 0 bytes');

        const metadataPath = path.join(outputDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify({
            renderPlan: job.renderPlan || job.profileName || 'Unknown',
            outputName: sanitizedName,
            tracks: job.tracks,
            createdAt: new Date().toISOString()
        }, null, 2), 'utf8');

        job.progress = 100;
        job.OUTPUT_PATH = outputPath;
        job.FILE_SIZE = (outStats.size / (1024 * 1024)).toFixed(2) + ' MB';
        job.RENDER_DURATION = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
        job.completedAt = new Date().toISOString();
        setJobStatus(job, 'COMPLETED');

    } catch (error) {
        job.failureReason = error.message;
        setJobStatus(job, 'FAILED');
    }
}

module.exports = { jobs, processJob, hashUri, jobCounter };


