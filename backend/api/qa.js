const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const QA_SESSIONS_DIR = path.resolve('.mediafactory/qa/sessions');

// Initialize base directory
async function initDirs() {
    try {
        await fs.mkdir(QA_SESSIONS_DIR, { recursive: true });
    } catch (e) {}
}
initDirs();

router.get('/sessions', async (req, res) => {
    try {
        const dirs = await fs.readdir(QA_SESSIONS_DIR, { withFileTypes: true });
        const sessions = [];
        for (const dirent of dirs) {
            if (dirent.isDirectory()) {
                try {
                    const sessionPath = path.join(QA_SESSIONS_DIR, dirent.name, 'session.json');
                    const content = await fs.readFile(sessionPath, 'utf8');
                    sessions.push(JSON.parse(content));
                } catch (e) {
                    // Ignore corrupted or missing sessions
                }
            }
        }
        res.json({ success: true, data: sessions });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

router.post('/sessions', async (req, res) => {
    try {
        const sessionData = req.body;
        const sessionId = sessionData.id;
        const sessionDir = path.join(QA_SESSIONS_DIR, sessionId);
        
        await fs.mkdir(sessionDir, { recursive: true });
        await fs.mkdir(path.join(sessionDir, 'evidence'), { recursive: true });
        await fs.mkdir(path.join(sessionDir, 'benchmark'), { recursive: true });
        await fs.mkdir(path.join(sessionDir, 'reports'), { recursive: true });
        
        await fs.writeFile(path.join(sessionDir, 'session.json'), JSON.stringify(sessionData, null, 2), 'utf8');
        if (sessionData.logs) {
            await fs.writeFile(path.join(sessionDir, 'execution.log'), sessionData.logs.map(l => l.raw).join('\n'), 'utf8');
        } else {
            await fs.writeFile(path.join(sessionDir, 'execution.log'), 'No logs\n', 'utf8');
        }
        
        await fs.writeFile(path.join(sessionDir, 'summary.json'), JSON.stringify({ mode: sessionData.mode, status: sessionData.status, duration: sessionData.durationMs }, null, 2), 'utf8');
        await fs.writeFile(path.join(sessionDir, 'health.json'), JSON.stringify({ healthScore: sessionData.healthScore }, null, 2), 'utf8');
        await fs.writeFile(path.join(sessionDir, 'metrics.json'), JSON.stringify({ failures: sessionData.failures, warnings: sessionData.warnings }, null, 2), 'utf8');
        
        res.json({ success: true, data: sessionData });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

router.delete('/sessions/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const sessionDir = path.join(QA_SESSIONS_DIR, sessionId);
        await fs.rm(sessionDir, { recursive: true, force: true });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

router.get('/sessions/:id/verify', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const sessionDir = path.join(QA_SESSIONS_DIR, sessionId);
        
        const files = await fs.readdir(sessionDir);
        const evidenceFiles = await fs.readdir(path.join(sessionDir, 'evidence')).catch(() => []);
        
        const hasSession = files.includes('session.json');
        const hasLog = files.includes('execution.log');
        
        res.json({ 
            success: true, 
            files, 
            evidenceFiles,
            valid: hasSession && hasLog
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

router.get('/sessions/:id/evidence/:file', async (req, res) => {
    try {
        const filePath = path.join(QA_SESSIONS_DIR, req.params.id, 'evidence', req.params.file);
        res.sendFile(filePath);
    } catch (e) {
        res.status(404).send('Evidence not found');
    }
});

router.post('/sessions/:id/evidence', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { filename, content, isBase64 } = req.body;
        const filePath = path.join(QA_SESSIONS_DIR, sessionId, 'evidence', filename);
        
        if (isBase64) {
            const buffer = Buffer.from(content, 'base64');
            await fs.writeFile(filePath, buffer);
        } else {
            await fs.writeFile(filePath, content, 'utf8');
        }
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

module.exports = router;
