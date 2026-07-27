const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OVERLAYS_DB_PATH = path.join(__dirname, '..', 'db', 'overlays.json');

let overlaysCache = [];

function loadAndValidateOverlays() {
    try {
        if (!fs.existsSync(OVERLAYS_DB_PATH)) {
            console.warn('[Overlay API] overlays.json not found, using empty array.');
            return [];
        }
        
        const data = fs.readFileSync(OVERLAYS_DB_PATH, 'utf8');
        const overlays = JSON.parse(data);
        
        // Validation: Every category must have at least 2 variants
        overlays.forEach(overlay => {
            if (!overlay.variants || overlay.variants.length < 2) {
                console.error(`[Overlay API] CRITICAL VALIDATION ERROR: Overlay '${overlay.name}' (${overlay.id}) has less than 2 variants! It has ${overlay.variants ? overlay.variants.length : 0}.`);
            }
        });
        
        return overlays;
    } catch (e) {
        console.error('[Overlay API] Error loading overlays.json:', e);
        return [];
    }
}

// Initialize cache on boot
overlaysCache = loadAndValidateOverlays();

// GET /api/overlays
router.get('/', (req, res) => {
    const { genre } = req.query;
    
    // In dev, reload cache for easier testing without restarting server
    if (process.env.NODE_ENV !== 'production') {
        overlaysCache = loadAndValidateOverlays();
    }
    
    if (genre) {
        const filtered = overlaysCache.filter(o => o.genres && o.genres.includes(genre.toLowerCase()));
        return res.json(filtered);
    }
    
    res.json(overlaysCache);
});

// GET /api/overlays/:id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    if (process.env.NODE_ENV !== 'production') {
        overlaysCache = loadAndValidateOverlays();
    }
    
    const overlay = overlaysCache.find(o => o.id === id);
    if (!overlay) {
        return res.status(404).json({ error: 'Overlay not found' });
    }
    
    res.json(overlay);
});

module.exports = router;
