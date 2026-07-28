const express = require('express');
const router = express.Router();
const ServiceRegistry = require('../system/ServiceRegistry');

// Helper to resolve the correct M3 Panel Service
const getPanelService = (panelName) => {
    // Map URL param to service name, e.g. 'background' -> 'BackgroundService'
    const name = panelName.charAt(0).toUpperCase() + panelName.slice(1).toLowerCase() + 'Service';
    return ServiceRegistry.resolve(name);
};

// Middleware to catch panel service resolution errors
router.use('/api/v1/m3/:panel', (req, res, next) => {
    try {
        req.panelService = getPanelService(req.params.panel);
        next();
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_SERVICE_NOT_FOUND',
            message: `Service for panel '${req.params.panel}' not found`,
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Initialize
router.get('/api/v1/m3/:panel/initialize', async (req, res) => {
    try {
        const data = await req.panelService.initialize();
        res.standardResponse(data);
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_INITIALIZE_ERROR',
            message: 'Failed to initialize panel',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Capabilities
router.get('/api/v1/m3/:panel/capabilities', async (req, res) => {
    try {
        res.standardResponse({ capabilities: req.panelService.capabilities });
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_CAPABILITIES_ERROR',
            message: 'Failed to retrieve capabilities',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Get Settings
router.get('/api/v1/m3/:panel/settings', async (req, res) => {
    try {
        const settings = await req.panelService.loadSettings();
        const settingsHash = req.panelService._generateHash(settings);
        res.standardResponse({ settings, settingsHash });
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_SETTINGS_GET_ERROR',
            message: 'Failed to retrieve settings',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Put Settings
router.put('/api/v1/m3/:panel/settings', async (req, res) => {
    try {
        const { settings, settingsHash } = req.body;
        const result = await req.panelService.saveSettings(settings, settingsHash);
        res.standardResponse(result);
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_SETTINGS_PUT_ERROR',
            message: 'Failed to save settings',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Validate
router.post('/api/v1/m3/:panel/validate', async (req, res) => {
    try {
        const validation = await req.panelService.validate(req.body.settings);
        res.standardResponse({ validation });
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_VALIDATE_ERROR',
            message: 'Validation failed',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Runtime
router.get('/api/v1/m3/:panel/runtime', async (req, res) => {
    try {
        const runtime = await req.panelService.runtime();
        res.standardResponse({ runtime });
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_RUNTIME_ERROR',
            message: 'Failed to retrieve runtime status',
            details: { error: e.message }
        });
    }
});

// Standard Panel Endpoint: Refresh
router.post('/api/v1/m3/:panel/refresh', async (req, res) => {
    try {
        const data = await req.panelService.refresh();
        res.standardResponse(data);
    } catch (e) {
        res.standardResponse(null, null, false, {
            code: 'M3_REFRESH_ERROR',
            message: 'Failed to refresh panel',
            details: { error: e.message }
        });
    }
});

const { jobs, processM3Job } = require('./m3-render');
let { jobCounterM3 } = require('./m3-render');
const fs = require('fs/promises');
const path = require('path');

router.post('/api/m3/render', async (req, res) => {
    try {
        const payload = req.body;
        jobCounterM3++;
        const queueId = `M3_${Date.now()}_${jobCounterM3}`;
        
        jobs[queueId] = {
            queueId,
            status: 'WAITING',
            progress: 0,
            m3Payload: payload
        };
        
        processM3Job(jobs[queueId]);
        res.json({ queueId, jobId: queueId, id: queueId, status: 'QUEUED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/m3/render/:id', (req, res) => {
    const id = req.params.id;
    if (!jobs[id]) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(jobs[id]);
});

router.post('/api/m3/font/upload', async (req, res) => {
    try {
        const fileName = req.query.name || 'font.ttf';
        const fontsDir = path.resolve('public/assets/Fonts');
        
        await fs.mkdir(fontsDir, { recursive: true });
        const destPath = path.join(fontsDir, fileName);
        const writeStream = require('fs').createWriteStream(destPath);
        req.pipe(writeStream);
        req.on('end', () => {
            res.json({ path: destPath, message: 'Font uploaded' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/m3/font/list', async (req, res) => {
    const fontsDir = path.resolve('public/assets/Fonts');
    try {
        await fs.mkdir(fontsDir, { recursive: true });
        const files = await fs.readdir(fontsDir);
        const fonts = files.filter(f => f.endsWith('.ttf') || f.endsWith('.otf'));
        res.json({ fonts });
    } catch (e) {
        res.status(500).json({ error: 'Failed to list fonts' });
    }
});

module.exports = router;
