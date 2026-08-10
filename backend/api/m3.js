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

router.get('/api/m3/font/list', (req, res) => {
    const fontsDir = path.resolve('public/assets/Fonts');
    try {
        if (!fs.existsSync(fontsDir)) {
            fs.mkdirSync(fontsDir, { recursive: true });
        }
        const files = fs.readdirSync(fontsDir);
        const fonts = files.filter(f => f.endsWith('.ttf') || f.endsWith('.otf'));
        res.json({ fonts });
    } catch (e) {
        res.json({ fonts: [] });
    }
});

router.post('/api/m3/verify-stage-parity', async (req, res) => {
    try {
        const payload = req.body.m3Payload || req.body || {};
        const objects = payload.m3Objects || payload.objects || [];
        const bg = payload.background || {};
        const timestamp = req.body.timestamp || 1.0;
        const targetWidth = 1920;
        const targetHeight = 1080;

        const { createCanvas, loadImage } = require('canvas');
        const { getVisualizerPipelineV3, resolveAssetPath } = require('./m3-render');
        const PipelineEngine = await getVisualizerPipelineV3();

        const stageCanvas = createCanvas(targetWidth, targetHeight);
        const stageCtx = stageCanvas.getContext('2d');

        // 1. Fill Stage Background
        stageCtx.fillStyle = bg.color || '#000000';
        stageCtx.fillRect(0, 0, targetWidth, targetHeight);

        if (bg.url || bg.source || bg.uri) {
            let bgPath = await resolveAssetPath(bg.url || bg.source || bg.uri, 'Background');
            if (bgPath) {
                try {
                    const bgImg = await loadImage(bgPath);
                    stageCtx.drawImage(bgImg, 0, 0, targetWidth, targetHeight);
                } catch (bgErr) {
                    console.warn('[Verify Stage Parity] Failed to load background image:', bgErr.message);
                }
            }
        }

        // 2. Helper for stage coordinate parsing
        const parseStageCoord = (val, stageDim, defaultVal) => {
            if (val === undefined || val === null || val === '') return defaultVal;
            const str = String(val).trim();
            if (str.endsWith('%')) {
                const pct = parseFloat(str);
                return isNaN(pct) ? defaultVal : (pct / 100) * stageDim;
            }
            const num = parseFloat(str);
            return isNaN(num) ? defaultVal : num;
        };

        // 3. Render Objects
        const validObjects = objects
            .filter(o => o && o.visible !== false)
            .sort((a, b) => (a.layer || 0) - (b.layer || 0));

        const numBins = 64;
        const frequencies = new Float32Array(numBins);
        const frameIndex = Math.floor(timestamp * 60);
        const frameCount = 300;
        const normalizedLoopTime = (frameIndex % frameCount) / frameCount;
        const tAngle = normalizedLoopTime * Math.PI * 2;

        for (let i = 0; i < numBins; i++) {
            const freqNorm = i / numBins;
            const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            const barSeed = barPhase - Math.floor(barPhase);
            const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
            const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
            const envelope = Math.exp(-freqNorm * 2.2);
            const rawVal = (0.5 * oct1 + 0.5 * oct2) * envelope;
            frequencies[i] = Math.min(1.0, Math.max(0.05, Math.abs(rawVal)));
        }

        const waveform = new Float32Array(numBins);
        for (let i = 0; i < numBins; i++) {
            waveform[i] = Math.sin(timestamp * 20 + (i / numBins) * Math.PI * 4) * 0.5;
        }

        let energySum = 0;
        for (let i = 0; i < numBins; i++) energySum += frequencies[i];
        const energy = energySum / numBins;

        const audioState = {
            time: timestamp,
            subBass: frequencies[0],
            bass: frequencies[Math.min(2, numBins - 1)],
            lowMid: frequencies[Math.min(12, numBins - 1)],
            mid: frequencies[Math.min(25, numBins - 1)],
            highMid: frequencies[Math.min(40, numBins - 1)],
            treble: frequencies[Math.min(55, numBins - 1)],
            energy,
            RMS: energy,
            kick: false,
            snare: false,
            beatStrength: energy,
            spectralFlux: energy,
            frequencies,
            waveform
        };

        for (const ov of validObjects) {
            const isVis = ov.type === 'visualizer' || ov.type === 'visualizer2' || ov.type === 'visualizer3' || ov.type === 'spectrum' || ov.visualizerId || (ov.name && (ov.name.toLowerCase().includes('spectrum') || ov.name.toLowerCase().includes('visualizer')));

            let rawW = parseStageCoord(ov.width, targetWidth, 600);
            let rawH = parseStageCoord(ov.height, targetHeight, 300);
            let rawCx = parseStageCoord(ov.x, targetWidth, 960);
            let rawCy = parseStageCoord(ov.y, targetHeight, 540);

            const w = Math.round(rawW);
            const h = Math.round(rawH);
            const cx = Math.round(rawCx);
            const cy = Math.round(rawCy);
            const topLeftX = Math.round(cx - (w / 2));
            const topLeftY = Math.round(cy - (h / 2));

            if (isVis) {
                let pluginIdMode = 'spectrum-bars';
                const modeStr = (ov.mode || ov.pluginId || ov.visualizerId || ov.name || '').toLowerCase();
                if (modeStr.includes('wave') || modeStr.includes('cyberpunk')) pluginIdMode = 'cyberpunk-waveform';
                else if (modeStr.includes('bar') || modeStr.includes('spectrum')) pluginIdMode = 'spectrum-bars';
                else if (modeStr.includes('particle') || modeStr.includes('orbit')) pluginIdMode = 'particle-orbit';
                else if (modeStr.includes('circular') || modeStr.includes('circle') || modeStr.includes('pulse')) pluginIdMode = 'circular-pulse';

                const v3Config = {
                    colorLeft: ov.colorLeft || ov.primaryColor || '#AB55F7',
                    colorRight: ov.colorRight || ov.secondaryColor || '#F59E0B',
                    colorMid: ov.colorMid || '#06B6D4',
                    colorMode: ov.colorMode || '2 Gradient',
                    frequencyOrder: ov.frequencyOrder || 'Bass -> Treble',
                    barCount: parseInt(ov.barCount) || 64,
                    thickness: parseInt(ov.thickness) || parseInt(ov.barThickness) || 4,
                    ...ov
                };

                const objCanvas = createCanvas(w, h);
                PipelineEngine.renderPipelineFrame(objCanvas, timestamp, audioState, pluginIdMode, v3Config);
                stageCtx.drawImage(objCanvas, topLeftX, topLeftY);
            } else if (ov.type === 'image' || ov.type === 'overlay' || ov.type === 'particle') {
                let ovPath = ov.source || ov.url || ov.uri;
                if (ovPath) {
                    let resolved = await resolveAssetPath(ovPath, 'Overlay');
                    if (resolved) {
                        try {
                            const ovImg = await loadImage(resolved);
                            stageCtx.drawImage(ovImg, topLeftX, topLeftY, w, h);
                        } catch (err) {}
                    }
                }
            }
        }

        const buf = stageCanvas.toBuffer('image/png');
        const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
        res.json({ success: true, dataUrl });
    } catch (err) {
        console.error('[Verify Stage Parity Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
