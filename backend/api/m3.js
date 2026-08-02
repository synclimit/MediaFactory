const express = require('express');
const router = express.Router();
const ServiceRegistry = require('../system/ServiceRegistry');

// Helper to resolve the correct M3 Panel Service
const getPanelService = (panelName) => {
    // Map URL param to service name, e.g. 'background' -> 'BackgroundService'
    const name = panelName.charAt(0).toUpperCase() + panelName.slice(1).toLowerCase() + 'Service';
    return ServiceRegistry.resolve(name);
};

const fs = require('fs');
const path = require('path');
const saveFilePath = path.join(__dirname, '..', 'data', 'm3_autosave_state.json');

router.get('/api/v1/m3/autosave/state', (req, res) => {
    try {
        if (fs.existsSync(saveFilePath)) {
            const content = fs.readFileSync(saveFilePath, 'utf8');
            return res.json({ success: true, data: JSON.parse(content) });
        }
    } catch(e) {}
    res.json({ success: true, data: null });
});

router.post('/api/v1/m3/autosave/state', (req, res) => {
    try {
        const body = req.body || {};
        const dir = path.dirname(saveFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(saveFilePath, JSON.stringify(body, null, 2), 'utf8');
        return res.json({ success: true });
    } catch(e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

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

const { jobs, processM3Job, cancelM3Job } = require('./m3-render');
let { jobCounterM3 } = require('./m3-render');

router.post('/api/m3/render', async (req, res) => {
    try {
        const rawBody = req.body || {};
        const payload = rawBody.m3Payload || rawBody;
        jobCounterM3++;
        const queueId = rawBody.id || rawBody.queueId || `M3_${Date.now()}_${jobCounterM3}`;
        
        const jobObj = {
            queueId,
            id: queueId,
            status: 'WAITING',
            progress: 1,
            outputFolder: rawBody.outputFolder || payload.outputFolder,
            totalDurationSec: rawBody.totalDurationSec || payload.totalDurationSec,
            m3Payload: payload
        };

        jobs[queueId] = jobObj;
        if (rawBody.id) jobs[rawBody.id] = jobObj;
        
        processM3Job(jobObj);
        res.json({ queueId, jobId: queueId, id: queueId, status: 'QUEUED' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/api/m3/cancel', (req, res) => {
    const { id, queueId, jobId } = req.body || {};
    const targetId = id || queueId || jobId;
    if (targetId) {
        cancelM3Job(targetId);
    } else {
        cancelM3Job();
    }
    res.json({ success: true, message: 'M3 Render cancelled and FFmpeg process terminated' });
});

router.get('/api/m3/render/:id', (req, res) => {
    const id = req.params.id;
    const targetJob = jobs[id];
    if (!targetJob) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(targetJob);
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
