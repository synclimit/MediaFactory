const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const os = require('os');

const router = express.Router();

function hashUri(uri) {
  return crypto.createHash('md5').update(uri).digest('hex').substring(0, 8);
}
const { jobs, processJob, hashUri: hashUriM2 } = require('./m2-render');
let { jobCounter } = require('./m2-render');

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

router.post('/api/m2/yt-metadata', async (req, res) => {
    let url = req.body.url;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const ytData = await new Promise((resolve, reject) => {
            const ytArgs = ['--dump-json', '--no-playlist', '--', url];
            const ytProc = spawn('yt-dlp', ytArgs);
            
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
        // Fallback simplified since this is just an extraction
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
    const cacheDir = path.resolve('.mediafactory/cache/m2');
    
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
    const cacheDir = path.resolve('.mediafactory/cache/m2');
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
    const cacheDir = path.resolve('.mediafactory/cache/m2');
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
    const cacheDir = path.resolve('.mediafactory/cache/m2');
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

    const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be');
    if (!isYouTube) {
        res.write(`data: {"status": "ready"}\n\n`);
        return res.end();
    }

    const cacheDir = path.resolve('.mediafactory/cache/m2');
    const cachePath = path.join(cacheDir, `${hashUri(uri)}.mp3`);

    try {
        await fs.stat(cachePath);
        res.write(`data: {"status": "ready_cached"}\n\n`);
        res.end();
    } catch (e) {
        res.write(`data: {"status": "downloading", "progress": 0}\n\n`);
        try {
            await fs.mkdir(cacheDir, { recursive: true });
            const ytOut = path.join(cacheDir, hashUri(uri) + '.%(ext)s');
            const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '-o', ytOut, '--', uri];
            const ytProc = spawn('yt-dlp', ytArgs);
            
            ytProc.stdout.on('data', chunk => {
                const out = chunk.toString();
                const match = out.match(/\[download\]\s+([\d\.]+)\%/);
                if (match) res.write(`data: {"status": "downloading", "progress": ${match[1]}}\n\n`);
                else if (out.includes('Extracting Audio') || (out.includes('Destination:') && out.includes('.mp3'))) {
                    res.write(`data: {"status": "extracting"}\n\n`);
                }
            });
            ytProc.stderr.on('data', () => {}); // Consume stderr
            
            const timeoutId = setTimeout(() => {
                ytProc.kill();
                res.write(`data: {"status": "error"}\n\n`);
                res.end();
            }, 300000); // 5 minutes timeout for long videos
            
            ytProc.on('close', code => {
                clearTimeout(timeoutId);
                if (code === 0) res.write(`data: {"status": "ready"}\n\n`);
                else res.write(`data: {"status": "error"}\n\n`);
                res.end();
            });
            ytProc.on('error', () => {
                clearTimeout(timeoutId);
                res.write(`data: {"status": "error"}\n\n`);
                res.end();
            });
        } catch (err) {
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

    const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be');
    if (isYouTube) {
        const cacheDir = path.resolve('.mediafactory/cache/m2');
        const cachePath = path.join(cacheDir, `${hashUri(uri)}.mp3`);
        
        try {
            await fs.stat(cachePath);
            streamFile(cachePath);
        } catch (e) {
            try {
                await fs.mkdir(cacheDir, { recursive: true });
                const ytOut = path.join(cacheDir, hashUri(uri) + '.%(ext)s');
                const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '-o', ytOut, '--', uri];
                await new Promise((resolve, reject) => {
                    const ytProc = spawn('yt-dlp', ytArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
                    ytProc.stdout.on('data', () => {});
                    ytProc.stderr.on('data', () => {});
                    
                    const timeoutId = setTimeout(() => {
                        ytProc.kill();
                        reject(new Error('Timeout'));
                    }, 300000);
                    
                    ytProc.on('close', code => {
                        clearTimeout(timeoutId);
                        code === 0 ? resolve() : reject(new Error('Failed'))
                    });
                    ytProc.on('error', (err) => {
                        clearTimeout(timeoutId);
                        reject(err);
                    });
                });
                streamFile(cachePath);
            } catch (err) {
                res.status(500).send('Failed to download');
            }
        }
    } else {
        let localPath = uri;
        if (!require('path').isAbsolute(uri)) {
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
        streamFile(localPath);
    }
});

module.exports = { router };
