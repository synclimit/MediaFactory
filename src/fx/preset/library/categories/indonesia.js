export const indonesiaPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dangdut_koplo',
        name: 'Koplo Party', genre: 'Dangdut Koplo', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe dangdut koplo yang meriah',
        metadata: {
            genre: 'Dangdut Koplo',
            mood: 'Festive',
            energy: 4,
            recommendedFor: ['Dangdut', 'Koplo', 'Party'],
            colorPalette: ['#ff00ff', '#ffff00', '#00ff00'],
            visualIdentity: 'Colorful, flashy, energetic beat reaction',
            visualTags: ['Festive', 'Colorful', 'Flashy']
        },
        visualProfile: {
            background: { style: 'Bright' },
            lighting: { style: 'Disco' },
            camera: { style: 'Fast Pan', shake: true },
            visualizer: { style: 'Bouncy' },
            particles: { style: 'Confetti' },
            overlay: { style: 'Flash' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 20 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff00ff', colorRight: '#ffff00', barCount: 48 }
        }
    },
    // Placeholders for remaining Indonesia genres
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dangdut_modern',
        name: 'Modern Dangdut', genre: 'Dangdut Modern', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe dangdut modern yang elegan',
        metadata: {
            genre: 'Dangdut Modern',
            mood: 'Elegant',
            energy: 3,
            recommendedFor: ['Dangdut Modern', 'Live', 'Elegant'],
            colorPalette: ['#ff1493', '#00ced1', '#ffffff'],
            visualIdentity: 'Smooth transitions, elegant lighting, modern stage',
            visualTags: ['Modern', 'Elegant', 'Clean']
        },
        visualProfile: {
            background: { style: 'Clean' },
            lighting: { style: 'Stage Spotlight' },
            camera: { style: 'Slow Pan', shake: false },
            visualizer: { style: 'Smooth' },
            particles: { style: 'Sparkles' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 10, overlayDarkness: 40 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff1493', colorRight: '#00ced1', barCount: 64 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dangdut_jadul',
        name: 'Classic Dangdut', genre: 'Dangdut Jadul', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Nostalgia dangdut klasik',
        metadata: {
            genre: 'Dangdut Jadul',
            mood: 'Nostalgic',
            energy: 3,
            recommendedFor: ['Dangdut Klasik', 'Nostalgia', 'Retro'],
            colorPalette: ['#8b4513', '#cd853f', '#d2b48c'],
            visualIdentity: 'Warm vintage tones, film grain, classic stage',
            visualTags: ['Classic', 'Vintage', 'Nostalgic']
        },
        visualProfile: {
            background: { style: 'Warm' },
            lighting: { style: 'Vintage Lamp' },
            camera: { style: 'Static', shake: false },
            visualizer: { style: 'Rounded' },
            particles: { style: 'Dust' },
            overlay: { style: 'Film Grain' },
            beatReaction: { strength: 'Low' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 8, overlayDarkness: 60, sepia: 50 },
            Visualizer: { visualizerId: 'viz-1', color: '#cd853f', barCount: 32 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_campursari',
        name: 'Campursari Vibes', genre: 'Campursari', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe tradisional dan kultural',
        metadata: {
            genre: 'Campursari',
            mood: 'Cultural',
            energy: 3,
            recommendedFor: ['Campursari', 'Jawa', 'Traditional'],
            colorPalette: ['#556b2f', '#8b0000', '#daa520'],
            visualIdentity: 'Earth tones, subtle movements, rich traditional colors',
            visualTags: ['Cultural', 'Traditional', 'Earth']
        },
        visualProfile: {
            background: { style: 'Earthy' },
            lighting: { style: 'Soft Directional' },
            camera: { style: 'Slow Drift', shake: false },
            visualizer: { style: 'Subtle' },
            particles: { style: 'None' },
            overlay: { style: 'Warm Glow' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 12, overlayDarkness: 50 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#556b2f', colorRight: '#daa520', barCount: 48 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_keroncong',
        name: 'Keroncong Night', genre: 'Keroncong', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Santai dan mengalun tenang',
        metadata: {
            genre: 'Keroncong',
            mood: 'Relaxed',
            energy: 2,
            recommendedFor: ['Keroncong', 'Acoustic', 'Night'],
            colorPalette: ['#d2b48c', '#a0522d', '#8b4513'],
            visualIdentity: 'Very calm, soft brown tones, gentle visualizer',
            visualTags: ['Relaxed', 'Acoustic', 'Calm']
        },
        visualProfile: {
            background: { style: 'Soft Brown' },
            lighting: { style: 'Dim' },
            camera: { style: 'Static', shake: false },
            visualizer: { style: 'Low Bar' },
            particles: { style: 'Dust' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Very Low' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 15, overlayDarkness: 70 },
            Visualizer: { visualizerId: 'viz-1', color: '#d2b48c', barCount: 32 }
        }
    }
];
