const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const AppPaths = require('../system/AppPaths');

const router = express.Router();
const jobs = {};

router.post('/api/m1/dialog/video', (req, res) => {
    try {
        // Attempt to use Electron's native dialog since Express runs in the main process
        const { dialog } = require('electron');
        const result = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }]
        });
        if (result && result.length > 0) {
            return res.json({ path: result[0] });
        } else {
            return res.json({ path: null });
        }
    } catch (e) {
        // Fallback for non-Electron environments
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Video Files|*.mp4;*.mov;*.mkv;*.avi;*.webm'; $f.ShowHelp = $true; if($f.ShowDialog() -eq 'OK'){ $f.FileName }`;
        exec(`powershell -sta -command "${psCommand}"`, (err, stdout) => {
            res.json({ path: stdout ? stdout.trim() : null });
        });
    }
});

router.post('/api/m1/video-metadata', (req, res) => {
    const filePath = req.body.path;
    if (!filePath) {
        return res.status(400).json({ error: 'No path provided' });
    }

    const ffprobeBin = AppPaths.getFFprobePath();
    exec(`"${ffprobeBin}" -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -show_entries format=duration,size -of json "${filePath}"`, (err, stdout) => {
        if (err) {
            return res.status(500).json({ error: 'ffprobe failed or file not found' });
        }
        try {
            const data = JSON.parse(stdout);
            const format = data.format || {};
            const stream = (data.streams && data.streams[0]) || {};

            const durationSec = parseFloat(format.duration || 0);
            const fpsMatch = (stream.r_frame_rate || '0/1').split('/');
            const fps = fpsMatch.length === 2 ? parseInt(fpsMatch[0]) / parseInt(fpsMatch[1]) : 0;

            const totalSec = Math.floor(durationSec);
            const mins = Math.floor(totalSec / 60);
            const secs = totalSec % 60;
            const durationDisplay = `${mins}m ${String(secs).padStart(2, '0')}s`;

            const fileSizeBytes = parseInt(format.size || 0);
            let fileSizeDisplay = '0 B';
            if (fileSizeBytes >= 1024 ** 3) fileSizeDisplay = (fileSizeBytes / 1024 ** 3).toFixed(2) + ' GB';
            else if (fileSizeBytes >= 1024 ** 2) fileSizeDisplay = (fileSizeBytes / 1024 ** 2).toFixed(2) + ' MB';
            else fileSizeDisplay = (fileSizeBytes / 1024).toFixed(1) + ' KB';

            const resolution = (stream.width && stream.height) ? `${stream.width} × ${stream.height}` : 'Unknown';
            const codec = (stream.codec_name || 'Unknown').toUpperCase();

            res.json({
                durationSec,
                durationDisplay,
                resolution,
                width: stream.width || 0,
                height: stream.height || 0,
                fps,
                codec,
                fileSizeBytes,
                fileSizeDisplay
            });
        } catch (parseErr) {
            res.status(500).json({ error: 'Failed to parse ffprobe output' });
        }
    });
});

router.post('/api/m1/render', async (req, res) => {
    try {
        const job = req.body;
        const jobId = job.id || job.queueId;
        
        jobs[jobId] = { status: 'RENDERING', progress: 0, failureReason: null, outputFiles: job.outputFiles };
        console.log('[M1 Render] Job created', jobId);
        
        const M1RenderEngine = await import('../../src/services/m1/M1RenderEngine.js');
        M1RenderEngine.processM1Job(
            job,
            (progress, msg) => {
                if (jobs[jobId]) jobs[jobId].progress = progress;
            },
            (result) => {
                if (jobs[jobId]) {
                    Object.assign(jobs[jobId], result);
                    jobs[jobId].status = 'COMPLETED';
                }
            },
            (err) => {
                if (jobs[jobId]) {
                    jobs[jobId].failureReason = err.message;
                    jobs[jobId].status = 'FAILED';
                }
            }
        );

        res.status(202).json({ success: true, jobId: jobId });
    } catch (err) {
        console.log(`[M1 Render] ERROR: ${err.message}`);
        res.status(400).json({ error: 'Invalid JSON' });
    }
});

router.get('/api/m1/render/:id', (req, res) => {
    const jobState = jobs[req.params.id];
    if (jobState) {
        res.json(jobState);
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
});

router.post('/api/m1/dialog/audio', (req, res) => {
    try {
        const { dialog } = require('electron');
        const result = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] }]
        });
        if (result && result.length > 0) return res.json({ path: result[0] });
        res.json({ path: null });
    } catch (e) {
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Audio Files|*.mp3;*.wav;*.flac;*.m4a;*.aac;*.ogg'; $f.ShowHelp = $true; if($f.ShowDialog() -eq 'OK'){ $f.FileName }`;
        exec(`powershell -sta -command "${psCommand}"`, (err, stdout) => {
            res.json({ path: stdout ? stdout.trim() : null });
        });
    }
});

router.post('/api/m1/audio/probe', (req, res) => {
    const audioPath = req.body.path;
    if (!audioPath) return res.status(400).json({ error: 'No path provided' });
    
    const ffprobeBin = AppPaths.getFFprobePath();
    const cmd = `"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    exec(cmd, (error, stdout) => {
        if (error) return res.status(500).json({ error: error.message });
        const durationSec = parseFloat(stdout.trim()) || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        res.json({ durationSec, durationDisplay: `${mins}m ${String(secs).padStart(2, '0')}s` });
    });
});

router.post('/api/m1/youtube/fetch', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const sendSSE = (data) => {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            if (typeof res.flush === 'function') res.flush();
        } catch (e) {}
    };

    const url = req.body?.url;
    if (!url) {
        sendSSE({ error: "Missing URL" });
        return res.end();
    }

    sendSSE({ stage: "FETCHING_INFO", statusText: "FETCHING METADATA...", progress: 0 });

    try {
        const cacheDir = path.join(AppPaths.getCacheBase(), 'm1');
        await fs.mkdir(cacheDir, { recursive: true });

        // Step 1: Fetch video metadata via --dump-json using spawn without shell:true
        const info = await new Promise((resolve, reject) => {
            const dumpArgs = ['--dump-json', '--no-playlist', '--js-runtimes', 'node', '--', url];
            const dumpProc = spawn('yt-dlp', dumpArgs);
            let stdoutData = '';
            let stderrData = '';
            dumpProc.stdout.on('data', d => stdoutData += d.toString());
            dumpProc.stderr.on('data', d => stderrData += d.toString());
            dumpProc.on('close', code => {
                if (code === 0) {
                    try { resolve(JSON.parse(stdoutData.trim())); }
                    catch (e) { reject(new Error('Failed to parse metadata JSON')); }
                } else {
                    reject(new Error(`yt-dlp failed with code ${code}: ${stderrData.substring(0, 150)}`));
                }
            });
            dumpProc.on('error', err => reject(err));
        });

        const videoId = info.id;
        if (!videoId) {
            sendSSE({ error: "Failed to get video ID" });
            return res.end();
        }

        const durationSec = info.duration || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        const durationDisplay = `${mins}m ${String(secs).padStart(2, '0')}s`;
        const description = info.description || "";
        const title = info.title || info.fulltitle || "Unknown Title";
        const channelName = info.uploader || info.channel || info.uploader_id || "YouTube Source";
        const thumbnailUrl = info.thumbnail || (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : null) || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // Instantly stream metadata to client so UI updates immediately
        sendSSE({
            stage: "DOWNLOADING_AUDIO",
            statusText: "DOWNLOADING AUDIO... 0%",
            progress: 0,
            metadata: {
                videoId,
                title,
                description,
                durationDisplay,
                channelName,
                thumbnailUrl
            }
        });

        const outTemplate = path.join(cacheDir, `${videoId}.%(ext)s`);
        const audioPath = path.join(cacheDir, `${videoId}.mp3`).replace(/\\/g, '/');

        // Step 2: Download audio using spawn with ffmpeg location
        const ffmpegBin = AppPaths.getFFmpegPath();
        const ytArgs = ['--no-warnings', '--no-playlist', '-x', '--audio-format', 'mp3', '--ffmpeg-location', ffmpegBin, '--write-thumbnail', '--js-runtimes', 'node', '-o', outTemplate, '--', url];
        const ytProc = spawn('yt-dlp', ytArgs);

        ytProc.stdout.on('data', (data) => {
            const output = data.toString();
            const match = output.match(/\[download\]\s+([\d.]+)%/);
            if (match) {
                const pct = parseFloat(match[1]);
                sendSSE({ stage: "DOWNLOADING_AUDIO", statusText: `DOWNLOADING AUDIO... ${pct}%`, progress: pct });
            }
        });

        let stderrOutput = '';
        ytProc.stderr.on('data', (data) => { stderrOutput += data.toString(); });

        ytProc.on('close', (code) => {
            if (code !== 0) {
                sendSSE({ error: `yt-dlp audio download failed (code ${code}). ${stderrOutput.substring(0, 100)}` });
                return res.end();
            }
            
            sendSSE({
                done: true,
                stage: "COMPLETED",
                statusText: "COMPLETE",
                videoId,
                title,
                description,
                durationDisplay,
                audioPath
            });
            res.end();
        });

        ytProc.on('error', (err) => {
            sendSSE({ error: `yt-dlp process error: ${err.message}` });
            res.end();
        });

    } catch (err) {
        sendSSE({ error: err.message.replace(/"/g, '\\"') });
        res.end();
    }
});

module.exports = { router, jobs };
