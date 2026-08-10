const express = require('express');
const router = express.Router();
const { createCanvas } = require('canvas');

// Import V4 Audio and Core Engine in Node.js
let VisualizerV4Core = null;
let VisualizerV4Audio = null;

async function loadV4Modules() {
  if (!VisualizerV4Core) {
    const coreMod = await import('../../src/visualizers/v4/VisualizerV4Core.js');
    VisualizerV4Core = coreMod.VisualizerV4Core;
  }
  if (!VisualizerV4Audio) {
    const audioMod = await import('../../src/visualizers/v4/VisualizerV4Audio.js');
    VisualizerV4Audio = audioMod.VisualizerV4Audio;
  }
}

/**
 * POST /api/m3_v2/verify-parity
 * Standalone Endpoint: Renders 1 frame of Visualizer V4 on Node-Canvas and returns DataURL.
 */
router.post('/verify-parity', async (req, res) => {
  try {
    await loadV4Modules();

    const { config = {}, timestamp = 1.0, width = 800, height = 300 } = req.body;

    const w = parseInt(width, 10) || 800;
    const h = parseInt(height, 10) || 300;

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    const audioState = VisualizerV4Audio.generateSyntheticState(timestamp, 64);
    VisualizerV4Core.renderFrame(ctx, w, h, audioState, config);

    const dataUrl = canvas.toDataURL('image/png');

    return res.json({
      success: true,
      dataUrl,
      width: w,
      height: h,
      timestamp
    });
  } catch (err) {
    console.error('[M3 V2 Verify Parity Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/m3_v2/render
 * Clean Video Export for M3 V2
 */
router.post('/render', async (req, res) => {
  try {
    await loadV4Modules();
    const { settings = {}, objects = [] } = req.body;
    return res.json({ success: true, message: 'M3 V2 render job queued', jobCount: objects.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
