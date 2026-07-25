export const classicPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_jazz_lounge',
        name: 'Late Night Jazz', genre: 'Jazz', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Suasana jazz lounge malam hari',
        metadata: {
            genre: 'Jazz',
            mood: 'Classy',
            energy: 2,
            recommendedFor: ['Jazz', 'Lounge', 'Cafe'],
            colorPalette: ['#483d8b', '#b8860b', '#000000'],
            visualIdentity: 'Dark, gold accents, smooth movement, smoky',
            visualTags: ['Classy', 'Dark', 'Gold']
        },
        visualProfile: {
            background: { style: 'Dark' },
            lighting: { style: 'Dim' },
            camera: { style: 'Slow Pan', shake: false },
            visualizer: { style: 'Smooth Flow' },
            particles: { style: 'Smoke' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Low' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 12, overlayDarkness: 75 },
            Visualizer: { visualizerId: 'viz-1', color: '#b8860b', barCount: 32 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_reggae',
        name: 'Island Vibes', genre: 'Reggae', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe santai ala pantai',
        metadata: {
            genre: 'Reggae',
            mood: 'Chill',
            energy: 3,
            recommendedFor: ['Reggae', 'Ska', 'Beach'],
            colorPalette: ['#008000', '#ffff00', '#ff0000'],
            visualIdentity: 'Rasta colors, smooth bounce, sunny lighting',
            visualTags: ['Island', 'Chill', 'Rasta']
        },
        visualProfile: {
            background: { style: 'Warm' },
            lighting: { style: 'Sunlight' },
            camera: { style: 'Gentle Bounce', shake: false },
            visualizer: { style: 'Smooth Rounded' },
            particles: { style: 'Dust' },
            overlay: { style: 'Warm Glow' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 20 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#008000', colorRight: '#ffff00', barCount: 48 }
        }
    }
];
