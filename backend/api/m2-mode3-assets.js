const express = require('express');
const router = express.Router();
const { AssetGeneratorEngine } = require('./services/AssetGeneratorEngine');

// 1. Scan folder
router.post('/api/m2/assets/scan', async (req, res) => {
    try {
        const { folderPath } = req.body;
        if (!folderPath) {
            return res.status(400).json({ success: false, error: 'folderPath is required' });
        }
        
        const result = await AssetGeneratorEngine.scanFolder(folderPath);
        if (result.success) {
            res.json({ success: true, files: result.files });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 2. Start queue
router.post('/api/m2/assets/process', (req, res) => {
    try {
        const { queue, options } = req.body;
        if (!queue || !Array.isArray(queue)) {
            return res.status(400).json({ success: false, error: 'Queue is required' });
        }
        
        AssetGeneratorEngine.startQueue(queue, options || {});
        res.json({ success: true, message: 'Queue started' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 3. Status polling
router.get('/api/m2/assets/status', (req, res) => {
    try {
        const queueStatus = AssetGeneratorEngine.getQueueStatus();
        res.json({ success: true, ...queueStatus });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4. Cancel queue
router.post('/api/m2/assets/cancel', (req, res) => {
    try {
        AssetGeneratorEngine.cancelQueue();
        res.json({ success: true, message: 'Queue cancelled' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
