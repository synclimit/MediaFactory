export const rockPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_rock_heavy',
        name: 'Heavy Rock', genre: 'Rock', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Visual kuat dengan kontras tajam',
        metadata: {
            genre: 'Rock',
            mood: 'Strong',
            energy: 5,
            recommendedFor: ['Rock', 'Live Band', 'Metal'],
            colorPalette: ['#8b0000', '#000000', '#ff4500'],
            visualIdentity: 'High contrast, sharp peaks, camera shake, smoke',
            visualTags: ['Dark', 'Aggressive', 'Gritty']
        },
        visualProfile: {
            background: { style: 'High Contrast' },
            lighting: { style: 'Spotlight' },
            camera: { style: 'Handheld', shake: true },
            visualizer: { style: 'Sharp Peaks' },
            particles: { style: 'Smoke' },
            overlay: { style: 'Grit' },
            beatReaction: { strength: 'Aggressive' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 2, overlayDarkness: 70 },
            Visualizer: { visualizerId: 'viz-1', color: '#ff0000', barCount: 64, opacity: 100 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_cinematic_epic',
        name: 'Epic Trailer', genre: 'Cinematic', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Tampilan dramatis dengan kontras tinggi',
        metadata: {
            genre: 'Cinematic',
            mood: 'Epic',
            energy: 3,
            recommendedFor: ['Trailer', 'Orchestra', 'Emotional'],
            colorPalette: ['#191970', '#daa520', '#000000'],
            visualIdentity: 'Dramatic, slow dolly, vignette, fog',
            visualTags: ['Epic', 'Dramatic', 'Movie']
        },
        visualProfile: {
            background: { style: 'Cinematic' },
            lighting: { style: 'Directional' },
            camera: { style: 'Slow Dolly', shake: false },
            visualizer: { style: 'Subtle' },
            particles: { style: 'Fog' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true, Subtitle: true },
        parameters: {
            Background: { blurAmount: 0, overlayDarkness: 50, bgZoom: 15 },
            Visualizer: { visualizerId: 'viz-1', color: '#ff4500', barCount: 128 },
            Subtitle: { font: 'Montserrat', fontSize: 48, color: '#ffffff' }
        }
    },
    // Placeholders for remaining Rock genres
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_synthwave',
        name: 'Retro Wave', genre: 'Synthwave', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe retro 80an dengan grid neon',
        metadata: {
            genre: 'Synthwave',
            mood: 'Retro',
            energy: 4,
            recommendedFor: ['Synthwave', 'Retro', 'Gaming'],
            colorPalette: ['#ff00ff', '#00ffff', '#8a2be2'],
            visualIdentity: 'Neon pink and cyan, grid lines, retro VHS feel',
            visualTags: ['Retro', 'Neon', '80s']
        },
        visualProfile: {
            background: { style: 'Dark Neon' },
            lighting: { style: 'Scanline' },
            camera: { style: 'Static Dolly', shake: false },
            visualizer: { style: 'Blocky Grid' },
            particles: { style: 'Stars' },
            overlay: { style: 'VHS Noise' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 60, bgZoom: 0 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff00ff', colorRight: '#00ffff', barCount: 64 }
        }
    }
];
