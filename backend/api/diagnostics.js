const express = require('express');
const router = express.Router();
const DiagnosticsManager = require('../system/DiagnosticsManager');

// Intercept all requests for diagnostics if mounted at root, or we can mount it globally in server.js
// But this router is just for the API endpoints.

router.get('/api/v1/diagnostics/state', async (req, res) => {
    try {
        const sysInfo = await DiagnosticsManager.getSystemInfo();
        res.json({
            success: true,
            data: {
                sessionId: DiagnosticsManager.currentSessionId,
                system: sysInfo,
                healthScore: DiagnosticsManager.healthScore,
                logs: DiagnosticsManager.sessionData.logs,
                events: DiagnosticsManager.sessionData.events,
                pipelineTree: DiagnosticsManager.sessionData.pipelineTree,
                requests: DiagnosticsManager.sessionData.requests,
                sql: DiagnosticsManager.sessionData.sql,
                ffmpeg: DiagnosticsManager.sessionData.ffmpeg,
                snapshots: DiagnosticsManager.sessionData.snapshots,
                performance: DiagnosticsManager.sessionData.performance
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/api/v1/diagnostics/health', async (req, res) => {
    try {
        const health = await DiagnosticsManager.runHealthCheck();
        res.json({ success: true, data: health });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/api/v1/diagnostics/report', async (req, res) => {
    try {
        const report = await DiagnosticsManager.buildAIReport();
        res.json({ success: true, data: report });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/api/v1/diagnostics/export', async (req, res) => {
    try {
        await DiagnosticsManager._saveSession(); // ensure latest is saved
        const zip = await DiagnosticsManager.buildZipPackage();
        const buffer = zip.toBuffer();
        
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=CrashPackage_${DiagnosticsManager.currentSessionId}_${Date.now()}.zip`);
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/api/v1/diagnostics/sessions', async (req, res) => {
    try {
        const sessions = await DiagnosticsManager.listSessions();
        res.json({ success: true, data: sessions });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/api/v1/diagnostics/test-action', async (req, res) => {
    const { action } = req.body;
    
    if (action === 'test-crash') {
        await DiagnosticsManager.generateCrashPackage('TestCrash', new Error('User requested a test crash via Developer Diagnostics V5'));
        res.json({ success: true, message: 'Test crash package generated and saved.' });
    } else if (action === 'test-warning') {
        const Logger = require('../m5/core/Logger');
        Logger.warn('Diagnostics', 'This is a simulated test warning.');
        res.json({ success: true, message: 'Warning emitted.' });
    } else if (action === 'test-exception') {
        const Logger = require('../m5/core/Logger');
        Logger.error('Diagnostics', 'This is a simulated test exception.', new Error('Simulated exception stack trace'));
        res.json({ success: true, message: 'Exception emitted.' });
    } else if (action === 'clear-logs') {
        DiagnosticsManager.sessionData.logs = [];
        DiagnosticsManager.sessionData.events = [];
        res.json({ success: true, message: 'Logs and events cleared for current session.' });
    } else {
        res.status(400).json({ success: false, error: 'Unknown action' });
    }
});

router.get('/api/system/disk-info', (req, res) => {
    const { exec } = require('child_process');
    const psCommand = `Get-CimInstance Win32_LogicalDisk | Where-Object DeviceID -eq 'D:' | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json`;
    exec(`powershell -sta -command "${psCommand}"`, (err, stdout) => {
        if (err || !stdout) {
            res.status(500).json({ error: 'Failed to get disk info' });
            return;
        }
        try {
            const diskInfo = JSON.parse(stdout);
            const totalGb = diskInfo.Size ? (diskInfo.Size / (1024 ** 3)).toFixed(1) : 0;
            const freeGb = diskInfo.FreeSpace ? (diskInfo.FreeSpace / (1024 ** 3)).toFixed(1) : 0;
            const usedGb = (totalGb - freeGb).toFixed(1);
            res.json({
                drive: diskInfo.DeviceID,
                totalCapacity: parseFloat(totalGb),
                usedCapacity: parseFloat(usedGb),
                freeCapacity: parseFloat(freeGb)
            });
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse disk info' });
        }
    });
});

module.exports = router;
