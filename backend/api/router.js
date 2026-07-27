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
router.get('/api/v1/system/services', (req, res) => res.standardResponse({ services: Array.from(ServiceRegistry.services.keys()) }));
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
    res.standardResponse({ cacheDir: AppPaths.getCacheBase() });
});
router.post('/api/v1/system/cache-path', (req, res) => {
    const { cacheDir } = req.body;
    if (!cacheDir) {
        return res.standardResponse(null, { status: "error", message: "cacheDir is required" }, false);
    }
    const success = AppPaths.setCacheBase(cacheDir);
    if (success) {
        res.standardResponse({ cacheDir: AppPaths.getCacheBase() });
    } else {
        res.standardResponse(null, { status: "error", message: "Failed to save cache directory" }, false);
    }
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
        
        // Save the configured output folder
        if (req.body.outputFolder) {
            await wsService.saveSettings(req.body.name, { output: { main: req.body.outputFolder } });
        }
        
        res.json(workspace);
    } catch (e) { 
        res.json({ success: false, data: null, validation: { status: "error", message: e.message } });
    }
});

router.post('/api/v1/system/open-folder', (req, res) => {
    try {
        const { exec } = require('child_process');
        const os = require('os');
        const folderPath = req.body.path;
        if (!folderPath) return res.json({ success: false });
        
        let command;
        if (os.platform() === 'win32') command = `explorer "${folderPath}"`;
        else if (os.platform() === 'darwin') command = `open "${folderPath}"`;
        else command = `xdg-open "${folderPath}"`;
        
        exec(command);
        res.json({ success: true });
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
