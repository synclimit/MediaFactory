export const chillPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_lofi_warm',
        name: 'Warm Coffee', genre: 'Lofi', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe lofi santai dengan nuansa hangat',
        metadata: {
            genre: 'Lofi',
            mood: 'Cozy',
            energy: 1,
            recommendedFor: ['Study', 'Relax', 'Coffee'],
            colorPalette: ['#d2b48c', '#a0522d', '#fff8dc'],
            visualIdentity: 'Warm, slightly blurry, gentle particles, soft visualizer',
            visualTags: ['Warm', 'Vintage', 'Smooth']
        },
        visualProfile: {
            background: { style: 'Warm Tint' },
            lighting: { style: 'Soft Lamp' },
            camera: { style: 'Slow Drift', shake: false },
            visualizer: { style: 'Rounded Smooth' },
            particles: { style: 'Dust' },
            overlay: { style: 'Film Grain' },
            beatReaction: { strength: 'Gentle' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 10, overlayDarkness: 40, bgZoom: 5 },
            Visualizer: { visualizerId: 'viz-1', color: '#ffb347', opacity: 80, barCount: 32 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_lofi_rain',
        name: 'Rain Window', genre: 'Lofi', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe hujan dengan warna redup',
        metadata: {
            genre: 'Lofi',
            mood: 'Rain',
            energy: 1,
            recommendedFor: ['Sleep', 'Rain', 'Study'],
            colorPalette: ['#4682b4', '#708090', '#2f4f4f'],
            visualIdentity: 'Cool blue tint, rain particles, slightly darker',
            visualTags: ['Rain', 'Cool', 'Dark']
        },
        visualProfile: {
            background: { style: 'Cool Tint' },
            lighting: { style: 'Overcast' },
            camera: { style: 'Static', shake: false },
            visualizer: { style: 'Low Bar' },
            particles: { style: 'Rain' },
            overlay: { style: 'Water Drops' },
            beatReaction: { strength: 'Very Gentle' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 15, overlayDarkness: 60 },
            Visualizer: { visualizerId: 'viz-1', color: '#8892b0', opacity: 70 },
            Particle: { presetId: 'rain', count: 150, wind: 2, gravity: 5 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_ambient_space',
        name: 'Deep Space', genre: 'Ambient', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Gelap, tenang, dan lambat',
        metadata: {
            genre: 'Ambient',
            mood: 'Space',
            energy: 1,
            recommendedFor: ['Meditation', 'Space', 'Ambient'],
            colorPalette: ['#00008b', '#4b0082', '#000000'],
            visualIdentity: 'Very dark, floating stars, slow movement',
            visualTags: ['Space', 'Dark', 'Floating']
        },
        visualProfile: {
            background: { style: 'Very Dark' },
            lighting: { style: 'Low Light' },
            camera: { style: 'Slow Pan', shake: false },
            visualizer: { style: 'Slow Wave' },
            particles: { style: 'Stars' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'None' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 10, overlayDarkness: 70 },
            Visualizer: { visualizerId: 'viz-1', color: '#4b0082', barCount: 16, opacity: 50 },
            Particle: { presetId: 'stars', count: 300, wind: 0, gravity: 0 }
        }
    },
    // Placeholders for remaining Chill genres
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_chillout',
        name: 'Sunset Chill', genre: 'Chillout', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe senja yang tenang dan santai',
        metadata: {
            genre: 'Chillout',
            mood: 'Sunset',
            energy: 2,
            recommendedFor: ['Cafe', 'Relax', 'Evening'],
            colorPalette: ['#ff4500', '#ff8c00', '#ffd700'],
            visualIdentity: 'Warm orange tones, slow floating particles, soft lighting',
            visualTags: ['Warm', 'Sunset', 'Smooth']
        },
        visualProfile: {
            background: { style: 'Warm Tint' },
            lighting: { style: 'Golden Hour' },
            camera: { style: 'Slow Pan', shake: false },
            visualizer: { style: 'Smooth Flow' },
            particles: { style: 'Floating Embers' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'Low' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 8, overlayDarkness: 40 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff4500', colorRight: '#ffd700', barCount: 48 },
            Particle: { presetId: 'dust', count: 100, wind: -1, gravity: -1 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_piano',
        name: 'Grand Piano', genre: 'Piano', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Klasik, elegan, dan emosional',
        metadata: {
            genre: 'Piano',
            mood: 'Emotional',
            energy: 1,
            recommendedFor: ['Piano', 'Cover', 'Instrumental'],
            colorPalette: ['#ffffff', '#f0f8ff', '#000000'],
            visualIdentity: 'Minimalist, black and white, subtle visualizer',
            visualTags: ['Elegant', 'Minimalist', 'Classic']
        },
        visualProfile: {
            background: { style: 'Monochrome' },
            lighting: { style: 'Spotlight' },
            camera: { style: 'Static', shake: false },
            visualizer: { style: 'Thin Lines' },
            particles: { style: 'None' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Very Low' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 60, grayscale: 100 },
            Visualizer: { visualizerId: 'viz-1', color: '#ffffff', barCount: 64, opacity: 70 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_acoustic',
        name: 'Acoustic Guitar', genre: 'Acoustic', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe akustik natural yang hangat',
        metadata: {
            genre: 'Acoustic',
            mood: 'Relax',
            energy: 2,
            recommendedFor: ['Acoustic', 'Cover', 'Live'],
            colorPalette: ['#deb887', '#d2691e', '#8b4513'],
            visualIdentity: 'Natural wood colors, warm lighting, slow zoom',
            visualTags: ['Natural', 'Warm', 'Acoustic']
        },
        visualProfile: {
            background: { style: 'Warm' },
            lighting: { style: 'Soft' },
            camera: { style: 'Slow Zoom', shake: false },
            visualizer: { style: 'Rounded' },
            particles: { style: 'Dust' },
            overlay: { style: 'Film Grain' },
            beatReaction: { strength: 'Low' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 30 },
            Visualizer: { visualizerId: 'viz-1', color: '#deb887', barCount: 32 }
        }
    }
];
