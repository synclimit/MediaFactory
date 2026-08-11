const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const os = require('os');
const AppPaths = require('../system/AppPaths');

const router = express.Router();

function hashUri(uri) {
  return crypto.createHash('md5').update(uri).digest('hex').substring(0, 8);
}
const { jobs, processJob, hashUri: hashUriM2 } = require('./m2-render');
let { jobCounter } = require('./m2-render');

const ytDownloads = {};

router.get('/api/m2/yt-downloads', (req, res) => {
    res.json(ytDownloads);
});

router.post('/api/m2/dialog/file', (req, res) => {
    try {
        const { dialog } = require('electron');
        const result = dialog.showOpenDialogSync({
            properties: ['openFile'],
            filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        if (result && result.length > 0) return res.json({ path: result[0] });
        res.json({ path: null });
    } catch (e) {
        // Fallback for non-Electron environment
        const encoded = "aW1wb3J0IHRraW50ZXIgYXMgdGsKZnJvbSB0a2ludGVyIGltcG9ydCBmaWxlZGlhbG9nCnJvb3QgPSB0ay5UaygpCnJvb3QuYXR0cmlidXRlcygnLXRvcG1vc3QnLCBUcnVlKQpyb290LndpdGhkcmF3KCkKZmlsZV9wYXRoID0gZmlsZWRpYWxvZy5hc2tvcGVuZmlsZW5hbWUocGFyZW50PXJvb3QsIHRpdGxlPSdTZWxlY3QgYSBGaWxlJywgZmlsZXR5cGVzPShbKCdBdWRpbyBGaWxlcycsICcqLm1wMzsqLndhdjsqLmZsYWM7Ki5tNGEnKSwgKCdBbGwgRmlsZXMnLCAnKicpXSkpCmlmIGZpbGVfcGF0aDoKICAgIHByaW50KGZpbGVfcGF0aCk=";
        exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
            const pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
            res.json({ path: pathStr || null });
        });
    }
});

router.post('/api/m2/dialog/folder', (req, res) => {
    try {
        const { dialog } = require('electron');
        const result = dialog.showOpenDialogSync({
            properties: ['openDirectory']
        });
        if (result && result.length > 0) return res.json({ path: result[0] });
        res.json({ path: null });
    } catch (e) {
        // Fallback for non-Electron environment
        const encoded = "aW1wb3J0IHRraW50ZXIgYXMgdGsKZnJvbSB0a2ludGVyIGltcG9ydCBmaWxlZGlhbG9nCnJvb3QgPSB0ay5UaygpCnJvb3QuYXR0cmlidXRlcygnLXRvcG1vc3QnLCBUcnVlKQpyb290LndpdGhkcmF3KCkKZm9sZGVyX3BhdGggPSBmaWxlZGlhbG9nLmFza2RpcmVjdG9yeShwYXJlbnQ9cm9vdCwgdGl0bGU9J1NlbGVjdCBGb2xkZXInKQppZiBmb2xkZXJfcGF0aDoKICAgIHByaW50KGZvbGRlcl9wYXRoKQ==";
        exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
            const pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
            res.json({ path: pathStr || null });
        });
    }
});

// REAL FOLDER SCAN
async function scanFolderRecursive(dirPath, audioExtensions) {
    let results = [];
    try {
        const list = await fs.readdir(dirPath, { withFileTypes: true });
        for (const dirent of list) {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                results = results.concat(await scanFolderRecursive(fullPath, audioExtensions));
            } else {
                const ext = path.extname(dirent.name).toLowerCase().slice(1);
                if (audioExtensions.includes(ext)) {
                    results.push(fullPath);
                }
            }
        }
    } catch(err) {
        // Ignore permission errors for subdirectories
    }
    return results;
}

router.post('/api/m2/folder/scan', async (req, res) => {
    const folderPath = req.body.folderPath;
    if (!folderPath) return res.status(400).json({ error: 'folderPath required' });
    
    try {
        const AUDIO_EXTENSIONS = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma', 'opus', 'aiff', 'aif'];
        const files = await scanFolderRecursive(folderPath, AUDIO_EXTENSIONS);
        res.json({ files: files.map(f => f.replace(/\\/g, '/')) });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

function cleanYoutubeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    try {
        const parsed = new URL(trimmed);
        if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
            parsed.searchParams.delete('list');
            parsed.searchParams.delete('start_radio');
            parsed.searchParams.delete('index');
            parsed.searchParams.delete('pp');
            return parsed.toString();
        }
    } catch(e) {}
    return trimmed;
}

function getCanonicalCacheKey(uri) {
    if (!uri) return '';
    let cleaned = String(uri).trim();
    if (cleaned.startsWith('ytsearch:')) {
        cleaned = cleaned.replace('ytsearch:', '').trim();
    }
    cleaned = cleanYoutubeUrl(cleaned);
    return cleaned;
}

function hashUri(uri) {
    const canonical = getCanonicalCacheKey(uri);
    return crypto.createHash('md5').update(canonical).digest('hex').substring(0, 8);
}

const activeDownloads = new Map();

async function ensureYoutubeAudioDownloaded(uri, onProgress) {
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const hash = hashUri(uri);
    const cachePath = path.join(cacheDir, `${hash}.mp3`);
    
    try {
        const stats = await fs.stat(cachePath);
        if (stats.size > 1000 && !activeDownloads.has(hash)) {
            if (onProgress) onProgress({ status: 'ready_cached', progress: 100 });
            return cachePath;
        }
    } catch (e) {}

    if (activeDownloads.has(hash)) {
        const active = activeDownloads.get(hash);
        if (onProgress) {
            onProgress({ status: active.status, progress: active.progress });
            active.listeners.add(onProgress);
        }
        try {
            await active.promise;
            return cachePath;
        } finally {
            if (onProgress) active.listeners.delete(onProgress);
        }
    }

    let searchUrl = uri;
    if (!uri.startsWith('http') && !uri.startsWith('ytsearch:')) {
        searchUrl = `ytsearch:${uri}`;
    }

    const listeners = new Set();
    if (onProgress) listeners.add(onProgress);

    const activeState = {
        status: 'downloading',
        progress: 0,
        listeners
    };

    const notify = (data) => {
        activeState.status = data.status;
        if (typeof data.progress === 'number') activeState.progress = data.progress;
        
        const canonical = getCanonicalCacheKey(uri);
        ytDownloads[canonical] = { status: data.status, progress: activeState.progress };
        ytDownloads[uri] = { status: data.status, progress: activeState.progress };

        for (const cb of activeState.listeners) {
            try { cb(data); } catch(e) {}
        }
    };

    const downloadPromise = new Promise((resolve, reject) => {
        const ytOut = path.join(cacheDir, hash + '.%(ext)s');
        const ffmpegDir = AppPaths.getFFmpegDir();
        const dlArgs = [
            '--no-check-certificates',
            '--force-ipv4',
            '--extractor-args', 'youtube:player_client=android,web',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0',
            '--ffmpeg-location', ffmpegDir,
            '--newline',
            '--no-playlist',
            '-f', 'bestaudio',
            '-x',
            '--audio-format', 'mp3',
            '-o', ytOut,
            '--',
            searchUrl
        ];
        const dlProc = spawn(AppPaths.getYtDlpPath(), dlArgs);

        dlProc.stdout.on('data', chunk => {
            const out = chunk.toString();
            const match = out.match(/\[download\]\s+([\d\.]+)\%/);
            if (match) {
                const pct = parseFloat(match[1]);
                notify({ status: 'downloading', progress: pct });
            } else if (out.includes('Extracting Audio') || out.includes('Destination:')) {
                notify({ status: 'extracting', progress: 100 });
            }
        });

        const timeoutId = setTimeout(() => {
            dlProc.kill();
            notify({ status: 'error', progress: 0 });
            reject(new Error('Download timeout'));
        }, 300000);

        dlProc.on('close', code => {
            clearTimeout(timeoutId);
            if (code === 0) {
                notify({ status: 'ready', progress: 100 });
                resolve(cachePath);
            } else {
                notify({ status: 'error', progress: 0 });
                reject(new Error(`yt-dlp failed with exit code ${code}`));
            }
        });

        dlProc.on('error', (err) => {
            clearTimeout(timeoutId);
            notify({ status: 'error', progress: 0 });
            reject(err);
        });
    });

    activeState.promise = downloadPromise;
    activeDownloads.set(hash, activeState);

    try {
        await downloadPromise;
        return cachePath;
    } finally {
        activeDownloads.delete(hash);
    }
}

router.post('/api/m2/yt-metadata', async (req, res) => {
    let url = req.body.url;
    if (!url) return res.status(400).json({ error: 'URL required' });

    url = cleanYoutubeUrl(url);

    let searchUrl = url;
    if (!url.startsWith('http') && !url.startsWith('ytsearch:')) {
        searchUrl = `ytsearch:${url}`;
    }

    try {
        const ytData = await new Promise((resolve, reject) => {
            const ytArgs = [
                '--no-check-certificates',
                '--force-ipv4',
                '--extractor-args', 'youtube:player_client=android,web',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/144.0.0.0',
                '--dump-json',
                '--no-playlist',
                '--',
                searchUrl
            ];
            const ytProc = spawn(AppPaths.getYtDlpPath(), ytArgs);
            
            let stdoutData = '';
            let stderrData = '';
            
            ytProc.stdout.on('data', d => stdoutData += d.toString());
            ytProc.stderr.on('data', d => stderrData += d.toString());
            
            const timeoutId = setTimeout(() => {
                ytProc.kill();
                reject(new Error('Metadata request timeout'));
            }, 15000);
            
            ytProc.on('close', code => {
                clearTimeout(timeoutId);
                if (code === 0) {
                    try { resolve(JSON.parse(stdoutData)); } catch(e) { reject(new Error('Failed to parse yt-dlp output')); }
                } else {
                    reject(new Error(`yt-dlp failed with code ${code}: ${stderrData}`));
                }
            });
            ytProc.on('error', err => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });
        
        // Background audio download immediately so track is ready for instant playback
        ensureYoutubeAudioDownloaded(url).catch(bgErr => {
            console.error('[yt-metadata] Background download failed to start:', bgErr);
        });

        const payload = {
            videoTitle: ytData.title,
            channelName: ytData.uploader || ytData.channel,
            videoDuration: ytData.duration,
            thumbnailUrl: ytData.thumbnail,
            videoId: ytData.id,
            provider: 'yt-dlp'
        };

        res.json(payload);
    } catch(ytError) {
        res.status(500).json({ error: ytError.message });
    }
});

router.post('/api/m2/render', async (req, res) => {
    const payload = req.body;
    jobCounter++;
    const queueId = `M2_${Date.now()}_${jobCounter}`;
    
    jobs[queueId] = {
        queueId,
        status: 'WAITING',
        progress: 0,
        ...payload
    };
    
    processJob(jobs[queueId]);
    res.json({ queueId, status: 'QUEUED' });
});

router.get('/api/m2/render/:id', (req, res) => {
    const id = req.params.id;
    if (!jobs[id]) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(jobs[id]);
});

router.post('/api/m2/cache/stats', async (req, res) => {
    let referencedUris = req.body.referencedUris || [];
    let queueIds = req.body.queueIds || [];
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
    
    let fileCount = 0;
    let sizeMb = 0;
    let orphanCount = 0;
    let invalidCount = 0;
    let health = 'GOOD';
    
    const referencedFiles = new Set();
    referencedUris.forEach(uri => referencedFiles.add(`${hashUri(uri)}.mp3`));
    queueIds.forEach(id => referencedFiles.add(`concat_${id}.txt`));
    
    for (const key in jobs) {
        const j = jobs[key];
        referencedFiles.add(`concat_${key}.txt`);
        if (j.tracks && Array.isArray(j.tracks)) {
            j.tracks.forEach(track => {
                let uri = typeof track === 'string' ? track : (track.uri || track.title || 'unknown');
                referencedFiles.add(`${hashUri(uri)}.mp3`);
            });
        }
    }

    try {
        await fs.access(cacheDir);
        const files = await fs.readdir(cacheDir);
        for (const file of files) {
            try {
                const stats = await fs.stat(path.join(cacheDir, file));
                if (stats.isFile()) {
                    fileCount++;
                    sizeMb += stats.size / (1024 * 1024);
                    if (!referencedFiles.has(file)) orphanCount++;
                    if (file.endsWith('.mp3') && stats.size === 0) invalidCount++;
                }
            } catch (e) {}
        }
        if (invalidCount > 0 || orphanCount > 0) health = 'WARNING';
    } catch(e) {
        health = 'CRITICAL';
    }
    
    res.json({ fileCount, sizeMb: parseFloat(sizeMb.toFixed(2)), orphanCount, health });
});

router.post('/api/m2/cache/validate', async (req, res) => {
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
    let valid = 0, invalid = 0;
    try {
        const files = await fs.readdir(cacheDir);
        for (const file of files) {
            if (file.endsWith('.mp3')) {
                const stats = await fs.stat(path.join(cacheDir, file));
                if (stats.size > 0) valid++;
                else invalid++;
            }
        }
    } catch (e) {}
    res.json({ valid, invalid });
});

router.post('/api/m2/cache/clear', async (req, res) => {
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
    let deleted = 0;
    try {
        const files = await fs.readdir(cacheDir);
        for (const file of files) {
            await fs.unlink(path.join(cacheDir, file));
            deleted++;
        }
    } catch (e) {}
    res.json({ deleted });
});

router.post('/api/m2/cache/remove-orphans', async (req, res) => {
    let referencedUris = req.body.referencedUris || [];
    let queueIds = req.body.queueIds || [];
    const cacheDir = path.join(AppPaths.getCacheBase(), 'm2');
    let deleted = 0;
    
    const referencedFiles = new Set();
    referencedUris.forEach(uri => referencedFiles.add(`${hashUri(uri)}.mp3`));
    queueIds.forEach(id => referencedFiles.add(`concat_${id}.txt`));
    
    for (const key in jobs) {
        const j = jobs[key];
        referencedFiles.add(`concat_${key}.txt`);
        if (j.tracks && Array.isArray(j.tracks)) {
            j.tracks.forEach(track => {
                let uri = typeof track === 'string' ? track : (track.uri || track.title || 'unknown');
                referencedFiles.add(`${hashUri(uri)}.mp3`);
            });
        }
    }

    try {
        const files = await fs.readdir(cacheDir);
        for (const file of files) {
            if (!referencedFiles.has(file)) {
                await fs.unlink(path.join(cacheDir, file));
                deleted++;
            }
        }
    } catch (e) {}
    res.json({ deleted });
});

router.get('/api/m2/prepare-stream', async (req, res) => {
    const uri = req.query.uri;
    if (!uri) return res.status(400).send('Missing uri');

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    let localPath = uri;
    let isAsset = uri.startsWith('Assets/') || uri.startsWith('Assets\\');
    if (isAsset || (!require('path').isAbsolute(uri) && !uri.startsWith('http') && !uri.startsWith('ytsearch:'))) {
        try {
            const ServiceRegistry = require('../system/ServiceRegistry');
            const wsService = ServiceRegistry.resolve('WorkspaceService');
            if (wsService && wsService.getCurrentWorkspace()) {
                localPath = require('path').join(wsService._getActivePath(), uri);
            } else {
                localPath = require('path').resolve(uri);
            }
        } catch (e) {
            localPath = require('path').resolve(uri);
        }
    }

    const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be') || uri.startsWith('ytsearch:') || (!isAsset && !require('path').isAbsolute(uri) && !require('fs').existsSync(localPath) && !uri.startsWith('http'));
    if (!isYouTube) {
        if (!require('fs').existsSync(localPath)) {
            res.write(`data: {"status": "error", "message": "File not found"}\n\n`);
            return res.end();
        }
        res.write(`data: {"status": "ready"}\n\n`);
        return res.end();
    }

    res.write(`data: {"status": "loading"}\n\n`);

    let isEnded = false;
    const onProgress = (data) => {
        if (isEnded) return;
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            if (data.status === 'ready' || data.status === 'ready_cached' || data.status === 'error') {
                isEnded = true;
                res.end();
            }
        } catch(e) {}
    };

    req.on('close', () => {
        isEnded = true;
    });

    try {
        await ensureYoutubeAudioDownloaded(uri, onProgress);
    } catch(err) {
        if (!isEnded) {
            res.write(`data: {"status": "error"}\n\n`);
            res.end();
        }
    }
});

router.get('/api/m2/stream', async (req, res) => {
    const uri = req.query.uri;
    if (!uri) return res.status(400).send('Missing uri');

    const streamFile = async (filePath) => {
        try {
            const stats = await fs.stat(filePath);
            let contentType = 'audio/mpeg';
            const ext = require('path').extname(filePath).toLowerCase();
            if (ext === '.mp4') contentType = 'video/mp4';
            else if (ext === '.m4a') contentType = 'audio/mp4';
            else if (ext === '.wav') contentType = 'audio/wav';
            else if (ext === '.ogg') contentType = 'audio/ogg';
            else if (ext === '.flac') contentType = 'audio/flac';
            else if (ext === '.webm') contentType = 'video/webm';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.webp') contentType = 'image/webp';
            else if (ext === '.gif') contentType = 'image/gif';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            else if (ext === '.bmp') contentType = 'image/bmp';
            
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const partialstart = parts[0];
                const partialend = parts[1];
                const start = parseInt(partialstart, 10);
                const end = partialend ? parseInt(partialend, 10) : stats.size - 1;
                const chunksize = (end - start) + 1;
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType
                });
                require('fs').createReadStream(filePath, { start, end }).pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': stats.size,
                    'Accept-Ranges': 'bytes'
                });
                require('fs').createReadStream(filePath).pipe(res);
            }
        } catch (err) {
            res.status(404).send('File not found');
        }
    };

    let localPath = uri;
    const fsSync = require('fs');
    const pathModule = require('path');
    let isAsset = uri.startsWith('Assets/') || uri.startsWith('Assets\\');
    if (isAsset || (!pathModule.isAbsolute(uri) && !uri.startsWith('http') && !uri.startsWith('ytsearch:'))) {
        try {
            const ServiceRegistry = require('../system/ServiceRegistry');
            const wsService = ServiceRegistry.resolve('WorkspaceService');
            if (wsService && wsService.getCurrentWorkspace()) {
                localPath = pathModule.join(wsService._getActivePath(), uri);
            } else {
                localPath = pathModule.resolve(uri);
            }
        } catch (e) {
            localPath = pathModule.resolve(uri);
        }

        // Safety Fallback Search for uploaded assets by filename
        if (!fsSync.existsSync(localPath)) {
            const fileName = pathModule.basename(uri);
            const appBase = AppPaths.getAppBase ? AppPaths.getAppBase() : process.cwd();
            const candidates = [
                pathModule.join(appBase, 'backend', 'uploads', 'background', fileName),
                pathModule.join(appBase, 'backend', 'uploads', fileName),
                pathModule.join(process.cwd(), 'backend', 'uploads', 'background', fileName),
                pathModule.join(process.cwd(), 'backend', 'uploads', fileName),
                pathModule.join(os.tmpdir(), fileName)
            ];
            for (const cand of candidates) {
                if (fsSync.existsSync(cand)) {
                    localPath = cand;
                    break;
                }
            }
        }
    }

    const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be') || uri.startsWith('ytsearch:') || (!isAsset && !require('path').isAbsolute(uri) && !require('fs').existsSync(localPath) && !uri.startsWith('http'));
    if (isYouTube) {
        try {
            const cachePath = await ensureYoutubeAudioDownloaded(uri);
            streamFile(cachePath);
        } catch (err) {
            res.status(500).send('Failed to download audio');
        }
    } else {
        streamFile(localPath);
    }
});

module.exports = { router };



