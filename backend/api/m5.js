const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { exec } = require('child_process');
const crypto = require('crypto');
const RenderPipeline = require('../m5/RenderPipeline');
const { PipelineEmitter, PipelineEvents } = require('../m5/core/Events');
const DownloadEngine = require('../m5/DownloadEngine');
const dbEngine = require('../m5/Database');

const PipelineManager = require('../m5/news/pipeline/PipelineManager');
const NewsReaderEngine = require('../m5/news/reader/NewsReaderEngine');
const NewsAIEngine = require('../m5/news/ai/NewsAIEngine');
const VisualIntelligenceEngine = require('../m5/news/image/VisualIntelligenceEngine');
const CardGenerationEngine = require('../m5/news/card/CardGenerationEngine');

// Instantiate engines
const readerEngine = new NewsReaderEngine();
// Use a mock API key for dev mode
const aiEngine = new NewsAIEngine('API_KEY', true); 
const visualEngine = new VisualIntelligenceEngine();
const cardEngine = new CardGenerationEngine();


// Initialize database
dbEngine.init().then(() => console.log('[M5 API] SQLite Database Initialized')).catch(console.error);

router.post('/api/v1/m5/dialog/folder', (req, res) => {
    const encoded = "aW1wb3J0IHRraW50ZXIgYXMgdGsKZnJvbSB0a2ludGVyIGltcG9ydCBmaWxlZGlhbG9nCnJvb3QgPSB0ay5UaygpCnJvb3QuYXR0cmlidXRlcygnLXRvcG1vc3QnLCBUcnVlKQpyb290LndpdGhkcmF3KCkKZm9sZGVyX3BhdGggPSBmaWxlZGlhbG9nLmFza2RpcmVjdG9yeShwYXJlbnQ9cm9vdCwgdGl0bGU9J1NlbGVjdCBGb2xkZXInKQppZiBmb2xkZXJfcGF0aDoKICAgIHByaW50KGZvbGRlcl9wYXRoKQ==";
    exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
        let pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
        if (!pathStr || err) {
            const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.ShowNewFolderButton = $true; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if ($f.ShowDialog($form) -eq 'OK') { $f.SelectedPath }`;
            exec(`powershell -sta -command "${psCommand}"`, (err2, stdout2) => {
                pathStr = stdout2 ? stdout2.replace(/^\uFEFF/, '').trim() : null;
                finishFolderDialog(pathStr, res);
            });
        } else {
            finishFolderDialog(pathStr, res);
        }
    });
});

function finishFolderDialog(pathStr, res) {
    if (!pathStr) {
        return res.json({ path: null, count: 0 });
    }
    let count = 0;
    try {
        const countMediaFilesRecursively = (dir) => {
            let c = 0;
            const files = fsSync.readdirSync(dir, { withFileTypes: true });
            for (const f of files) {
                if (f.isDirectory()) {
                    c += countMediaFilesRecursively(path.join(dir, f.name));
                } else if (f.isFile() && f.name.match(/\.(mp4|mov|avi|mkv|webm|png|jpg|jpeg|gif|mp3|wav)$/i)) {
                    c++;
                }
            }
            return c;
        };
        count = countMediaFilesRecursively(pathStr);
    } catch (e) {
        console.error('[M5 API] Error counting files in', pathStr, e);
    }
    res.json({ path: pathStr, count });
}

router.post('/api/v1/m5/dialog/file', (req, res) => {
    const pyScript = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.attributes('-topmost', True)\nroot.withdraw()\nfile_path = filedialog.askopenfilename(parent=root, title='Select Media File', filetypes=[('Media Files', '*.mp4;*.mov;*.avi;*.mkv;*.webm;*.png;*.jpg;*.jpeg;*.mp3;*.wav'), ('All Files', '*.*')])\nif file_path:\n    print(file_path)`;
    const encoded = Buffer.from(pyScript).toString('base64');
    exec(`python -c "import base64; exec(base64.b64decode('${encoded}').decode('utf-8'))"`, (err, stdout) => {
        let pathStr = stdout ? stdout.replace(/^\uFEFF/, '').trim() : null;
        if (!pathStr || err) {
            const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = "Media Files|*.mp4;*.mov;*.avi;*.mkv;*.webm;*.png;*.jpg;*.jpeg;*.mp3;*.wav|All Files|*.*"; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if ($f.ShowDialog($form) -eq 'OK') { $f.FileName }`;
            exec(`powershell -sta -command "${psCommand}"`, (err2, stdout2) => {
                pathStr = stdout2 ? stdout2.replace(/^\uFEFF/, '').trim() : null;
                res.json({ path: pathStr || null });
            });
        } else {
            res.json({ path: pathStr });
        }
    });
});

// --- SSE Client Manager ---
let sseClients = [];

function broadcastSseEvent(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try {
            client.res.write(payload);
        } catch (e) {
            console.error('[M5 SSE] Error broadcasting to client:', e);
        }
    });
}

// Global ping to keep connection alive
setInterval(() => {
    broadcastSseEvent('ping', { time: Date.now() });
}, 15000);

// Periodic sync: push latest progress for all rendering jobs every 2s
// This ensures clients that reconnect never miss progress updates
setInterval(() => {
    const renderingJobs = m5Queue.filter(j => j.status === 'Rendering');
    for (const job of renderingJobs) {
        broadcastSseEvent('queue_update', { action: 'update', job });
    }
}, 2000);

// Forward render pipeline events to SSE clients
PipelineEmitter.on(PipelineEvents.RENDER_PROGRESS, ({ jobId, progress }) => {
    const job = m5Queue.find(j => j.id === jobId);
    if (job) {
        job.progress = progress;
        broadcastSseEvent('queue_update', { action: 'update', job });
    }
});

PipelineEmitter.on(PipelineEvents.RENDER_STARTED, ({ jobId }) => {
    const job = m5Queue.find(j => j.id === jobId);
    if (job) {
        job.progress = 0;
        broadcastSseEvent('queue_update', { action: 'update', job });
    }
});

PipelineEmitter.on(PipelineEvents.RENDER_FINISHED, ({ jobId }) => {
    const job = m5Queue.find(j => j.id === jobId);
    if (job) {
        job.progress = 100;
        broadcastSseEvent('queue_update', { action: 'update', job });
    }
});

router.get('/api/v1/m5/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);
    
    console.log(`[M5 SSE] Client connected: ${clientId}`);

    // Send initial connection success event
    res.write(`event: connected\ndata: {"status": "ok"}\n\n`);

    req.on('close', () => {
        console.log(`[M5 SSE] Client disconnected: ${clientId}`);
        sseClients = sseClients.filter(client => client.id !== clientId);
    });
});

// --- M5 Queue Database Setup ---
let m5Queue = []; // In-memory queue
let m5QueueCounter = 1;

// M5 Global Queue API
router.get('/api/v1/m5/queue', (req, res) => {
    res.json({ success: true, data: m5Queue });
});

router.post('/api/v1/m5/queue/add', (req, res) => {
    const job = req.body;
    m5Queue.push(job);
    broadcastSseEvent('queue_update', { action: 'add', job });
    res.json({ success: true, job });
});

router.post('/api/v1/m5/generate-queue', async (req, res) => {
    const { workspaceName, formula, quality, duration, resolution, fps, variationLevel, outputCount, randomSpeed, libraryFolders, outputNamePrefix, ctaText, hookFile, ctaFile } = req.body;
    
    const count = outputCount ? parseInt(outputCount, 10) : 1;
    if (count <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid output count' });
    }

    const LibraryScannerClass = require('../m5/LibraryScanner');
    const LibraryScanner = new LibraryScannerClass();
    
    // Auto-scan libraries before generating the queue
    try {
        const scanPromises = [];
        if (libraryFolders) {
            for (const [cat, folders] of Object.entries(libraryFolders)) {
                if (Array.isArray(folders)) {
                    for (const folder of folders) {
                        if (folder.path) {
                            scanPromises.push(LibraryScanner.scan(folder.path, folder.name || 'Library'));
                        }
                    }
                }
            }
        }
        await Promise.all(scanPromises);
    } catch(err) {
        console.error('[M5 API] Auto-scan error:', err);
        return res.status(500).json({ success: false, error: 'Failed to scan libraries: ' + err.message });
    }

    const addedJobs = [];
    let modeFolder = 'Interrupt';
    if (formula && formula.toLowerCase() === 'overlay') modeFolder = 'Overlay';
    
    const wsService = require('../system/ServiceRegistry').resolve('WorkspaceService');
    let dynamicOutputDir = path.resolve('Output', 'M5');
    if (workspaceName) {
        try {
            const wsConfig = await wsService.getSettings(workspaceName);
            if (wsConfig && wsConfig.data && wsConfig.data.output && wsConfig.data.output.main) {
                const outMain = wsConfig.data.output.main;
                if (path.isAbsolute(outMain)) {
                    dynamicOutputDir = outMain;
                } else {
                    dynamicOutputDir = path.resolve(wsService._getWorkspacePath(workspaceName), outMain);
                }
            } else {
                dynamicOutputDir = wsService.getOutputPath();
            }
        } catch(e) {}
    }
    dynamicOutputDir = path.join(dynamicOutputDir, 'M5', modeFolder);

    // Create the directory immediately so the UI 'Open Folder' button works
    if (!fsSync.existsSync(dynamicOutputDir)) {
        fsSync.mkdirSync(dynamicOutputDir, { recursive: true });
    }

    for (let i = 0; i < count; i++) {
        const job = {
            id: crypto.randomBytes(4).toString('hex'),
            type: 'render',
            workspaceName,
            formula, 
            quality: quality || 'Best Quality',
            duration,
            resolution,
            fps,
            variationLevel,
            randomSpeed,
            libraryFolders,
            outputNamePrefix: count > 1 ? (outputNamePrefix ? `${outputNamePrefix}_#${i+1}` : null) : outputNamePrefix,
            ctaText,
            hookFile,
            ctaFile,
            status: 'Ready',
            progress: 0,
            createdAt: Date.now()
        };
        m5Queue.push(job);
        addedJobs.push(job);
        
        const configOverrides = {
            output: {
                targetResolution: resolution || '1080x1920',
                fps: parseInt(fps) || 30,
                outputDir: dynamicOutputDir
            },
            duration: {
                target: parseInt(duration) || 60
            },
            formula: {
                type: formula
            },
            variation: {
                complexityLevel: variationLevel || 'Medium'
            }
        };

        const outName = job.outputNamePrefix ? `${job.outputNamePrefix.trim()}.mp4` : `output_${job.id}.mp4`;
        const outPath = path.resolve(dynamicOutputDir, outName);
        Promise.resolve({ success: true, data: { ready: true, config: configOverrides, outPath } }).then(result => {
            job.snapshot = result.data;
            broadcastSseEvent('queue_update', { action: 'update', job });
        }).catch(err => {
            job.status = 'Failed';
            job.error = err.message;
            broadcastSseEvent('queue_update', { action: 'update', job });
        });
        
        broadcastSseEvent('queue_update', { action: 'add', job });
    }
    
    res.json({ success: true, count: addedJobs.length, data: addedJobs });
});

router.post('/api/v1/m5/start-render', async (req, res) => {
    const { id } = req.body || {};
    let jobsToStart = [];
    if (!id || id === 'all') {
        jobsToStart = m5Queue.filter(j => (j.status === 'Ready' || j.status === 'Waiting' || j.status === 'Failed') && j.type === 'render');
    } else {
        const job = m5Queue.find(j => j.id === id);
        if (job) jobsToStart.push(job);
    }
    
    if (jobsToStart.length === 0) {
        return res.status(404).json({ success: false, error: 'No ready or waiting jobs found to render' });
    }

    res.json({ success: true, message: `Render started for ${jobsToStart.length} job(s)` });
    
    const wsService = require('../system/ServiceRegistry').resolve('WorkspaceService');

    let renderChain = Promise.resolve();
    
    for (const job of jobsToStart) {
        if (job.status !== 'Rendering' && job.status !== 'Completed') {
            job.status = 'Scheduled';
            job.progress = 0; 
            
            // Fix output path if it was hardcoded or missing
            if (job.workspaceName) {
                try {
                    const wsConfig = await wsService.getSettings(job.workspaceName);
                    let modeFolder = 'Interrupt';
                    const formulaType = job.snapshot?.config?.formula?.type || job.formula;
                    if (formulaType && formulaType.toLowerCase() === 'overlay') modeFolder = 'Overlay';
                    if (job.type === 'news') modeFolder = 'News';
                    
                    let finalOutDir = path.resolve('Output', 'M5');
                    if (wsConfig && wsConfig.data && wsConfig.data.output && wsConfig.data.output.main) {
                        const outMain = wsConfig.data.output.main;
                        if (path.isAbsolute(outMain)) {
                            finalOutDir = outMain;
                        } else {
                            finalOutDir = path.resolve(wsService._getWorkspacePath(job.workspaceName), outMain);
                        }
                    } else {
                        finalOutDir = wsService.getOutputPath(); // This already defaults to Output folder
                    }
                    
                    finalOutDir = path.join(finalOutDir, 'M5', modeFolder);
                    if (!job.snapshot) job.snapshot = {};
                    if (!job.snapshot.config) job.snapshot.config = {};
                    if (!job.snapshot.config.output) job.snapshot.config.output = {};
                    job.snapshot.config.output.outputDir = finalOutDir;
                    
                    if (job.snapshot.outPath) {
                        const fs = require('fs');
                        let outName = path.basename(job.snapshot.outPath);
                        let finalPath = path.resolve(finalOutDir, outName);
                        
                        // Auto-increment logic
                        let ext = path.extname(finalPath);
                        let base = path.basename(finalPath, ext);
                        let counter = 1;
                        // Ensure parent directory exists
                        if (!fs.existsSync(finalOutDir)) {
                            fs.mkdirSync(finalOutDir, { recursive: true });
                        }
                        while (fs.existsSync(finalPath)) {
                            finalPath = path.resolve(finalOutDir, `${base}_${counter}${ext}`);
                            counter++;
                        }
                        job.snapshot.outPath = finalPath;
                    }
                } catch(e) {}
            }
            
            broadcastSseEvent('queue_update', { action: 'update', job });
            
            renderChain = renderChain.then(() => {
                job.status = 'Rendering';
                broadcastSseEvent('queue_update', { action: 'update', job });
                
                Object.keys(require.cache).forEach(key => {
                    if ((key.includes('backend\\m5') || key.includes('backend/m5')) && !key.includes('Events.js') && !key.includes('Database.js')) {
                        delete require.cache[key];
                    }
                });
                const FreshRenderPipeline = require('../m5/RenderPipeline');

                return FreshRenderPipeline.execute(job, job.snapshot?.config || {}).then(result => {
                    if (result.success) {
                        job.status = 'Completed';
                    } else {
                        job.status = 'Failed';
                        job.error = result.errors?.[0]?.message || 'Render failed';
                    }
                    broadcastSseEvent('queue_update', { action: 'update', job });
                }).catch(e => {
                    console.error(e);
                    job.status = 'Failed';
                    job.error = e.message;
                    broadcastSseEvent('queue_update', { action: 'update', job });
                });
            });
        }
    }
});

router.post('/api/v1/m5/pause-render', (req, res) => {
    res.json({ success: true, message: 'Not implemented yet' });
});

router.post('/api/v1/m5/resume-render', (req, res) => {
    res.json({ success: true, message: 'Not implemented yet' });
});

router.post('/api/v1/m5/stop-render', (req, res) => {
    const { id } = req.body;
    const qJob = m5Queue.find(j => j.id === id);
    if (qJob) {
        Object.assign(qJob, { status: 'Failed', error: 'Stopped by user' });
        broadcastSseEvent('queue_update', { action: 'update', job: qJob });
    }
    res.json({ success: true, message: 'Render stopped' });
});

router.get('/api/v1/m5/render-status', (req, res) => {
    res.json({ success: true, activeJobs: [] });
});

// Individual job delete moved down

// Endpoint for adding download links (COLLECT view)
router.post('/api/v1/m5/download', async (req, res) => {
    const { links, quality, downloadFolder, autoStart = true } = req.body;
    if (!links || links.length === 0) return res.json({ success: false, error: 'No links provided' });

    const addedJobs = [];

    for (const url of links) {
        if (!url.trim()) continue;
        
        let source = 'Direct';
        if (url.includes('tiktok.com')) source = 'TikTok';
        else if (url.includes('youtube.com') || url.includes('youtu.be')) source = 'YouTube';
        else if (url.includes('facebook.com') || url.includes('fb.watch')) source = 'Facebook';
        else if (url.includes('instagram.com')) source = 'Instagram';

        const job = {
            id: m5QueueCounter++,
            type: 'download',
            url: url.trim(),
            source,
            title: `Downloading from ${source}`,
            quality,
            downloadFolder,
            status: autoStart ? 'Downloading' : 'Pending',
            progress: autoStart ? 10 : 0,
            createdAt: Date.now()
        };
        
        m5Queue.push(job);
        addedJobs.push(job);
        broadcastSseEvent('queue_update', { action: 'add', job });
        
        // Fetch realtime metadata (title, preview, duration, size)
        DownloadEngine.getMetadata(job.url).then(meta => {
            const qJob = m5Queue.find(j => j.id === job.id);
            if (qJob) {
                if (meta.title && meta.title !== 'Video Download') qJob.title = meta.title;
                qJob.preview = meta.preview;
                qJob.duration = meta.duration;
                if (qJob.size === '-' || !qJob.size) qJob.size = meta.size;
                broadcastSseEvent('queue_update', { action: 'update', job: qJob });
            }
        });

        if (autoStart) {
            // Start download async
            DownloadEngine.download(job.url, 'MAIN', downloadFolder, (progress) => {
                const qJob = m5Queue.find(j => j.id === job.id);
                if (qJob && qJob.status === 'Downloading') {
                    qJob.progress = progress;
                    broadcastSseEvent('queue_update', { action: 'update', job: qJob });
                }
            })
                .then(async result => {
                    const qJob = m5Queue.find(j => j.id === job.id);
                    if (qJob) {
                        qJob.status = 'Ready';
                        qJob.progress = 100;
                        qJob.outPath = result.path;
                        try {
                            const stat = await fsSync.promises.stat(result.path);
                            qJob.size = `${(stat.size / (1024 * 1024)).toFixed(1)} MB`;
                        } catch(e) {}
                        broadcastSseEvent('queue_update', { action: 'update', job: qJob });
                    }
                })
                .catch(err => {
                    const qJob = m5Queue.find(j => j.id === job.id);
                    if (qJob) {
                        qJob.status = 'Failed';
                        qJob.error = err.message;
                        broadcastSseEvent('queue_update', { action: 'update', job: qJob });
                    }
                });
        }
    }
    
    res.json({ success: true, addedJobs });
});

// Endpoint for M6 Extension Heartbeat
router.post('/api/m6/ping', (req, res) => {
    broadcastSseEvent('extension_heartbeat', { status: 'connected', timestamp: Date.now() });
    res.json({ success: true });
});

// Endpoint for M6 Browser Extension Collector
router.post('/api/m6/collect', async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ success: false, error: 'No valid short video URL provided' });
    }

    const cleanUrl = url.trim();
    let source = 'Direct';
    if (cleanUrl.includes('tiktok.com')) source = 'TikTok';
    else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) source = 'YouTube';
    else if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch')) source = 'Facebook';
    else if (cleanUrl.includes('instagram.com')) source = 'Instagram';

    const job = {
        id: m5QueueCounter++,
        type: 'download',
        url: cleanUrl,
        source,
        title: `Collected Short (${source})`,
        quality: 'Best Quality',
        downloadFolder: 'C:\\Users\\Public\\Downloads',
        status: 'Pending',
        progress: 0,
        createdAt: Date.now()
    };

    m5Queue.push(job);
    broadcastSseEvent('queue_update', { action: 'add', job });

    // Fetch real-time metadata asynchronously
    DownloadEngine.getMetadata(job.url).then(meta => {
        const qJob = m5Queue.find(j => j.id === job.id);
        if (qJob) {
            if (meta.title && meta.title !== 'Video Download') qJob.title = meta.title;
            qJob.preview = meta.preview;
            qJob.duration = meta.duration;
            if (qJob.size === '-' || !qJob.size) qJob.size = meta.size;
            broadcastSseEvent('queue_update', { action: 'update', job: qJob });
        }
    }).catch(() => {});

    console.log(`[M6 Collector API] Successfully added to queue: ${cleanUrl} (Job #${job.id})`);
    res.json({ success: true, queueId: job.id, job });
});


router.post('/api/v1/m5/start-downloads', (req, res) => {
    const { downloadFolder } = req.body || {};
    const pendingJobs = m5Queue.filter(j => j.type === 'download' && (j.status === 'Pending' || j.status === 'Failed'));
    
    for (const job of pendingJobs) {
        job.status = 'Downloading';
        job.progress = 10;
        broadcastSseEvent('queue_update', { action: 'update', job });
        
        const targetFolder = downloadFolder || job.downloadFolder;
        DownloadEngine.download(job.url, 'MAIN', targetFolder, (progress) => {
            const qJob = m5Queue.find(j => j.id === job.id);
            if (qJob && qJob.status === 'Downloading') {
                qJob.progress = progress;
                broadcastSseEvent('queue_update', { action: 'update', job: qJob });
            }
        })
            .then(async result => {
                const qJob = m5Queue.find(j => j.id === job.id);
                if (qJob) {
                    qJob.status = 'Ready';
                    qJob.progress = 100;
                    qJob.outPath = result.path;
                    try {
                        const stat = await fsSync.promises.stat(result.path);
                        qJob.size = `${(stat.size / (1024 * 1024)).toFixed(1)} MB`;
                    } catch(e) {}
                    broadcastSseEvent('queue_update', { action: 'update', job: qJob });
                }
            })
            .catch(err => {
                const qJob = m5Queue.find(j => j.id === job.id);
                if (qJob) {
                    qJob.status = 'Failed';
                    qJob.error = err.message;
                    broadcastSseEvent('queue_update', { action: 'update', job: qJob });
                }
            });
    }
    
    res.json({ success: true, startedCount: pendingJobs.length });
});

router.delete('/api/v1/m5/queue/:id', (req, res) => {
    const id = req.params.id;
    const index = m5Queue.findIndex(j => j.id.toString() === id);
    if (index !== -1) {
        const [removed] = m5Queue.splice(index, 1);
        broadcastSseEvent('queue_update', { action: 'delete', id });
        res.json({ success: true, removed });
    } else {
        res.json({ success: false, error: 'Not found' });
    }
});

router.delete('/api/v1/m5/queue', (req, res) => {
    const { type } = req.query;
    if (type) {
        const remaining = m5Queue.filter(j => j.type !== type);
        m5Queue.length = 0;
        m5Queue.push(...remaining);
        broadcastSseEvent('queue_update', { action: 'clear_type', type });
    } else {
        m5Queue.length = 0;
        broadcastSseEvent('queue_update', { action: 'clear' });
    }
    res.json({ success: true });
});

router.post('/api/v1/m5/news/draft', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[M5 News Pipeline] Starting pipeline for ${url}`);
    
    const pipeline = new PipelineManager();
    
    // Listen to progress updates by periodically polling the progress object, or just emitting when runner finishes
    // Actually PipelineManager updates its `progress` object synchronously inside runner.
    // We can poll it or just hook into the dependencies.
    
    const broadcastProgress = () => {
        broadcastSseEvent('news_progress', { stages: pipeline.progress.stages });
    };

    const mockDependencies = {
        reader: async (targetUrl) => {
            broadcastProgress();
            const res = await readerEngine.read(targetUrl);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'reader', data: res.article });
            return res.article;
        },
        ai: async (article) => {
            broadcastProgress();
            const res = await aiEngine.processArticle(article);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'ai', data: res.draft });
            return res.draft;
        },
        visual: async (article, aiDraft) => {
            broadcastProgress();
            const res = await visualEngine.process(article, aiDraft);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'visual', data: res.draft });
            return res.draft;
        },
        card: async (article, aiDraft, visualDraft) => {
            broadcastProgress();
            const res = await cardEngine.generate(article, aiDraft, visualDraft);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'card', data: res.state });
            return res.state;
        },
        editor: async (cardState) => {
            broadcastProgress();
            // Trivial pass-through for editor engine
            return cardState;
        }
    };

    // Run asynchronously
    pipeline.startWorkflow(url, mockDependencies).then(result => {
        broadcastProgress();
        if (!result.success) {
            broadcastSseEvent('news_pipeline_error', { error: result.error });
            // also send complete event with success: false for frontend logic
            broadcastSseEvent('news_pipeline_complete', result);
        } else {
            broadcastSseEvent('news_pipeline_complete', result);
        }
    }).catch(err => {
        broadcastProgress();
        broadcastSseEvent('news_pipeline_error', { error: err.message });
    });

    res.json({ success: true, message: 'Pipeline started' });
});

module.exports = { router, broadcastSseEvent, m5Queue };

