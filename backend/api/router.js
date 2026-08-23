const express = require('express');
const router = express.Router();
const ServiceRegistry = require('../system/ServiceRegistry');
const AppPaths = require('../system/AppPaths');

// Middleware to inject standardized response formatter
router.use((req, res, next) => {
    res.standardResponse = (data = null, validation = null, success = true, error = null) => {
        res.json({ success, data, validation, error });
    };
    next();
});

// --- System Endpoints ---
router.get('/api/v1/system/file-view', (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).send('Path required');
        const fs = require('fs');
        const path = require('path');
        const resolved = path.resolve(filePath);
        if (!fs.existsSync(resolved)) {
            return res.status(404).send('File not found');
        }
        res.sendFile(resolved);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/api/v1/system/health', (req, res) => res.standardResponse({ status: 'ok' }));
router.get('/api/v1/system/version', (req, res) => res.standardResponse({ version: '1.0.0' }));
router.get('/api/v1/system/runtime', (req, res) => res.standardResponse({ uptime: process.uptime() }));
router.post('/api/v1/system/runtime/event', (req, res) => {
    try {
        const runtimeService = ServiceRegistry.resolve('RuntimeService');
        runtimeService.emit(req.body.event, req.body.payload);
        res.standardResponse({ emitted: true });
    } catch (e) {
        res.standardResponse(null, { status: "error", message: e.message }, false);
    }
});
router.post('/api/v1/system/kill-ffmpeg', (req, res) => {
    try {
        const { killAllFFmpegProcesses } = require('./m3-render');
        killAllFFmpegProcesses();
    } catch (e) {}
    if (process.platform === 'win32') {
        try {
            const { execSync } = require('child_process');
            execSync('taskkill /F /IM ffmpeg.exe /T');
        } catch (e) {}
    }
    res.standardResponse({ killed: true, message: 'All FFmpeg processes forcefully terminated' });
});
router.get('/api/v1/system/workers', (req, res) => res.standardResponse({ activeWorkers: 0 }));
router.get('/api/v1/system/telemetry', (req, res) => {
    const hwService = ServiceRegistry.resolve('HardwareService');
    if (hwService) {
        res.standardResponse(hwService.getTelemetry());
    } else {
        res.standardResponse({ cpu: 0, ram: 0, gpu: 0 });
    }
});

router.get('/api/v1/system/cache-path', (req, res) => {
    res.standardResponse({ 
        cacheDir: AppPaths.getCacheBase(),
        cacheCleanupMode: AppPaths.getCacheCleanupMode()
    });
});
router.post('/api/v1/system/cache-path', (req, res) => {
    const { cacheDir, cacheCleanupMode } = req.body;
    if (!cacheDir) {
        return res.standardResponse(null, { status: "error", message: "cacheDir is required" }, false);
    }
    const success = AppPaths.setCacheBase(cacheDir, cacheCleanupMode || 'never');
    if (success) {
        // Trigger a fresh schedule check if the user just updated the mode
        const ServiceRegistry = require('../system/ServiceRegistry');
        const cacheCleaner = ServiceRegistry.get('CacheCleanerService');
        if (cacheCleaner) cacheCleaner.runScheduledCleanup();
        
        res.standardResponse({ 
            cacheDir: AppPaths.getCacheBase(),
            cacheCleanupMode: AppPaths.getCacheCleanupMode()
        });
    } else {
        res.standardResponse(null, { status: "error", message: "Failed to save cache directory" }, false);
    }
});

router.get('/api/v1/system/cache-list', async (req, res) => {
    const ServiceRegistry = require('../system/ServiceRegistry');
    const storage = ServiceRegistry.get('StorageService');
    const path = require('path');
    const cacheDir = AppPaths.getCacheBase();
    
    try {
        const entries = await storage.readDir(cacheDir);
        const items = await Promise.all(entries.map(async entry => {
            const fullPath = path.join(cacheDir, entry.name);
            const stat = await storage.stat(fullPath);
            return {
                name: entry.name,
                isDir: stat.isDirectory(),
                sizeBytes: stat.size,
                mtime: stat.mtimeMs
            };
        }));
        res.standardResponse({ items });
    } catch (e) {
        res.standardResponse({ items: [] });
    }
});

router.post('/api/v1/system/cache-delete', async (req, res) => {
    const { paths } = req.body;
    if (!Array.isArray(paths)) return res.standardResponse(null, { status: "error", message: "paths array required" }, false);
    
    const ServiceRegistry = require('../system/ServiceRegistry');
    const storage = ServiceRegistry.get('StorageService');
    const path = require('path');
    const cacheDir = AppPaths.getCacheBase();
    
    let deletedCount = 0;
    for (const p of paths) {
        // Prevent path traversal
        const safePath = path.resolve(cacheDir, p);
        if (safePath.startsWith(path.resolve(cacheDir))) {
            try {
                await storage.delete(safePath);
                deletedCount++;
            } catch (e) { console.error('Failed to delete cache item:', p, e); }
        }
    }
    res.standardResponse({ deletedCount });
});

router.post('/api/v1/system/clean-cache/immediate', (req, res) => {
    const mode = AppPaths.getCacheCleanupMode();
    if (mode === 'immediate') {
        const ServiceRegistry = require('../system/ServiceRegistry');
        const cacheCleaner = ServiceRegistry.get('CacheCleanerService');
        if (cacheCleaner) {
            cacheCleaner.runImmediateCleanup();
        }
    }
    res.standardResponse({ status: "ok" });
});

// --- Workspace Endpoints ---
router.post('/api/v1/system/workspace/active', (req, res) => {
    const wsService = ServiceRegistry.resolve('WorkspaceService');
    wsService.setCurrentWorkspace(req.body.workspaceName);
    res.standardResponse({ activeWorkspace: req.body.workspaceName });
});

router.get('/api/v1/system/workspace/active', (req, res) => {
    const wsService = ServiceRegistry.resolve('WorkspaceService');
    res.standardResponse({ activeWorkspace: wsService.getCurrentWorkspace() });
});

router.get('/api/v1/system/workspace/list', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        res.standardResponse(await wsService.listWorkspaces());
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.post('/api/v1/system/workspace/create', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        const workspace = await wsService.createWorkspace(req.body.name);
        
        // Save the configured output folder & branding assets
        const initialSettings = {};
        if (req.body.outputFolder) {
            initialSettings.output = { main: req.body.outputFolder };
        }
        if (req.body.assets) {
            initialSettings.branding = {
                logo: req.body.assets.logo || null,
                watermark: req.body.assets.watermark || null,
                overlay: req.body.assets.overlay || null,
                subscribeAnim: req.body.assets.subscribe_anim || null
            };
        }
        if (Object.keys(initialSettings).length > 0) {
            await wsService.saveSettings(req.body.name, initialSettings);
        }
        
        res.json(workspace);
    } catch (e) { 
        res.json({ success: false, data: null, validation: { status: "error", message: e.message } });
    }
});

router.post('/api/v1/system/open-folder', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const os = require('os');
        const fs = require('fs');
        const path = require('path');
        let folderPath = req.body.path;
        if (!folderPath) return res.json({ success: false, error: 'No path provided' });

        folderPath = String(folderPath).trim();

        if (os.platform() === 'win32') {
            let winPath = path.normalize(folderPath).replace(/\//g, '\\');
            let cleanWinPath = winPath.replace(/[\/\\]+$/, '');

            let command;
            try {
                const stat = fs.statSync(cleanWinPath);
                if (stat.isFile()) {
                    command = `explorer /select,"${cleanWinPath}"`;
                } else {
                    command = `explorer "${cleanWinPath}"`;
                }
            } catch (e) {
                let dirToCreate = cleanWinPath;
                if (path.extname(cleanWinPath)) {
                    dirToCreate = path.dirname(cleanWinPath);
                }
                try { fs.mkdirSync(dirToCreate, { recursive: true }); } catch (err) {}
                let cleanDir = dirToCreate.replace(/[\/\\]+$/, '');
                command = `explorer "${cleanDir}"`;
            }
            exec(command);
            return res.json({ success: true, commandExecuted: command });
        } else if (os.platform() === 'darwin') {
            const command = `open "${folderPath}"`;
            exec(command);
            return res.json({ success: true, commandExecuted: command });
        } else {
            const command = `xdg-open "${folderPath}"`;
            exec(command);
            return res.json({ success: true, commandExecuted: command });
        }
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});

// --- Visualizer Endpoints ---
router.get('/api/v1/visualizers/library', async (req, res) => {
    try {
        const presetManager = ServiceRegistry.resolve('PresetManagerService');
        const library = await presetManager.getLibrary();
        res.standardResponse(library);
    } catch (e) {
        res.standardResponse(null, { status: "error", message: e.message }, false);
    }
});

router.delete('/api/v1/system/workspace/:name', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        await wsService.deleteWorkspace(req.params.name);
        res.standardResponse({ deleted: req.params.name });
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.post('/api/v1/system/workspace/:name/duplicate', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        await wsService.duplicateWorkspace(req.params.name, req.body.targetName);
        res.standardResponse({ duplicated: req.params.name, to: req.body.targetName });
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.patch('/api/v1/system/workspace/:name/rename', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        await wsService.renameWorkspace(req.params.name, req.body.newName);
        res.standardResponse({ renamed: req.params.name, to: req.body.newName });
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.post('/api/v1/system/workspace/:name/backup', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        const backupName = await wsService.backupWorkspace(req.params.name);
        res.standardResponse({ backup: backupName });
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.get('/api/v1/system/workspace/:name/settings', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        res.standardResponse(await wsService.getSettings(req.params.name));
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

router.put('/api/v1/system/workspace/:name/settings', async (req, res) => {
    try {
        const wsService = ServiceRegistry.resolve('WorkspaceService');
        res.standardResponse(await wsService.saveSettings(req.params.name, req.body));
    } catch (e) { res.standardResponse(null, { status: "error", message: e.message }, false); }
});

// --- Hardware Endpoints ---
router.get('/api/v1/system/hardware', async (req, res) => {
    const hwService = ServiceRegistry.resolve('HardwareService');
    res.standardResponse(await hwService.getCache());
});
router.post('/api/v1/system/hardware/refresh', async (req, res) => {
    const hwService = ServiceRegistry.resolve('HardwareService');
    res.standardResponse(await hwService.refresh());
});

// --- Assets Endpoints ---
const os = require('os');
const path = require('path');
const fs = require('fs');

router.post('/api/v1/assets/upload', express.raw({ type: '*/*', limit: '100mb' }), async (req, res) => {
    try {
        const rawFilename = req.headers['x-file-name'] || 'uploaded_file';
        const filename = decodeURIComponent(rawFilename);
        const category = req.headers['x-category'] || 'unknown';
        const tempPath = path.join(os.tmpdir(), filename);
        fs.writeFileSync(tempPath, req.body);
        
        const assetService = ServiceRegistry.resolve('AssetService');
        const asset = await assetService.import(tempPath, category);
        res.standardResponse(asset);
    } catch (e) {
        res.standardResponse(null, { status: "error", message: e.message }, false);
    }
});

router.post('/api/v1/assets/import', async (req, res) => {
    try {
        const assetService = ServiceRegistry.resolve('AssetService');
        const asset = await assetService.import(req.body.filePath, req.body.category);
        res.standardResponse(asset);
    } catch (e) {
        res.standardResponse(null, { status: "error", message: e.message }, false);
    }
});
router.delete('/api/v1/assets/:id', async (req, res) => {
    try {
        const assetService = ServiceRegistry.resolve('AssetService');
        await assetService.delete(req.params.id);
        res.standardResponse({ deleted: req.params.id });
    } catch (e) {
        res.standardResponse(null, { status: "error", message: e.message }, false);
    }
});

// --- Jobs Endpoints (Render Queue) ---
router.post('/api/v1/jobs/create', async (req, res) => {
    const jobService = ServiceRegistry.resolve('JobService');
    const job = await jobService.create(req.body.projectId, req.body.details);
    res.standardResponse(job);
});
router.post('/api/v1/jobs/:id/enqueue', async (req, res) => {
    const jobService = ServiceRegistry.resolve('JobService');
    await jobService.enqueue(req.params.id);
    res.standardResponse({ enqueued: req.params.id });
});

// --- QA Endpoints ---
router.use('/api/v1/qa', require('./qa'));

// --- Diagnostics Endpoints ---
router.use('/', require('./diagnostics'));

// --- M3 Panel Endpoints ---
router.use('/', require('./m3'));

// --- M4 Panel Endpoints ---
const m4Module = require('./m4');
router.use('/', m4Module.router);

// --- M5 Panel Endpoints ---
const m5Module = require('./m5');
router.use('/', m5Module.router);

module.exports = router;
