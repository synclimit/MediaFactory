export const electronicPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dj_remix',
        name: 'Club Neon', genre: 'DJ Remix', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Visualizer agresif dengan warna neon terang',
        metadata: {
            genre: 'DJ Remix',
            mood: 'High Energy',
            energy: 5,
            recommendedFor: ['DJ Remix', 'Full Bass', 'Party'],
            colorPalette: ['#ff00ff', '#00ffff'],
            visualIdentity: 'Strong pulse, fast zoom, bright neon colors, laser lights',
            visualTags: ['Neon', 'Club', 'Aggressive']
        },
        visualProfile: {
            background: { style: 'Dark' },
            lighting: { style: 'Club Laser' },
            camera: { style: 'Fast Zoom', shake: true },
            visualizer: { style: 'Strong Pulse' },
            particles: { style: 'Smoke & Spark' },
            overlay: { style: 'Glow' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 0, overlayDarkness: 80, bgZoom: 10 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff00ff', colorRight: '#00ffff', barCount: 128 },
            Particle: { presetId: 'sparkles', count: 200, wind: 0, gravity: -2 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dj_festival',
        name: 'Festival Night', genre: 'EDM', author: 'Media Factory', difficulty: 'Advanced',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Ledakan warna warni festival EDM',
        metadata: {
            genre: 'EDM',
            mood: 'High Energy',
            energy: 5,
            recommendedFor: ['EDM', 'Festival', 'Hype'],
            colorPalette: ['#00ff00', '#ff0000'],
            visualIdentity: 'Massive scale, bright contrast, heavy drops',
            visualTags: ['Festival', 'Colorful', 'Epic']
        },
        visualProfile: {
            background: { style: 'Bright' },
            lighting: { style: 'Strobe' },
            camera: { style: 'Wide Pan', shake: false },
            visualizer: { style: 'Massive Waves' },
            particles: { style: 'Confetti' },
            overlay: { style: 'Flash' },
            beatReaction: { strength: 'Very High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 60 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#00ff00', colorRight: '#ff0000', barCount: 64, opacity: 100 }
        }
    },
    // Placeholders for remaining Electronic genres
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dj_slow_remix',
        name: 'Slow Night', genre: 'DJ Slow Remix', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Tempo santai dengan visual yang mengalir lambat',
        metadata: {
            genre: 'DJ Slow Remix',
            mood: 'Dreamy',
            energy: 3,
            recommendedFor: ['Slow Remix', 'Chill DJ', 'Night Drive'],
            colorPalette: ['#800080', '#0000ff', '#4b0082'],
            visualIdentity: 'Smooth pulse, slow rotation, deep purple and blue',
            visualTags: ['Dreamy', 'Smooth', 'Night']
        },
        visualProfile: {
            background: { style: 'Dark' },
            lighting: { style: 'Soft Neon' },
            camera: { style: 'Slow Push', shake: false },
            visualizer: { style: 'Smooth Pulse' },
            particles: { style: 'Dust' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 70 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#800080', colorRight: '#0000ff', barCount: 64 },
            Particle: { presetId: 'dust', count: 150, wind: 1, gravity: 0 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dj_jedag_jedug',
        name: 'Jedag Jedug Viral', genre: 'DJ Jedag Jedug', author: 'Media Factory', difficulty: 'Advanced',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Ketukan keras dan visual yang sangat reaktif',
        metadata: {
            genre: 'DJ Jedag Jedug',
            mood: 'Aggressive',
            energy: 5,
            recommendedFor: ['Jedag Jedug', 'TikTok', 'Hardbass'],
            colorPalette: ['#ff0000', '#000000', '#ff8c00'],
            visualIdentity: 'Heavy camera punch, fast strobe, intense red and black',
            visualTags: ['Aggressive', 'Punchy', 'Hard']
        },
        visualProfile: {
            background: { style: 'High Contrast' },
            lighting: { style: 'Strobe' },
            camera: { style: 'Heavy Punch', shake: true },
            visualizer: { style: 'Spike' },
            particles: { style: 'Laser Dust' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Extreme' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 0, overlayDarkness: 80, bgZoom: 20 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Solid', color: '#ff0000', barCount: 128 },
            Particle: { presetId: 'sparkles', count: 250, wind: 0, gravity: -3 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_house',
        name: 'Deep House', genre: 'House', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Alur yang asyik dengan pencahayaan neon yang halus',
        metadata: {
            genre: 'House',
            mood: 'Groovy',
            energy: 4,
            recommendedFor: ['Deep House', 'Lounge', 'Groove'],
            colorPalette: ['#ffa500', '#ff4500', '#800080'],
            visualIdentity: 'Warm neon lights, consistent bounce, clean visuals',
            visualTags: ['Groovy', 'Clean', 'Neon']
        },
        visualProfile: {
            background: { style: 'Clean' },
            lighting: { style: 'Warm Neon' },
            camera: { style: 'Gentle Bounce', shake: false },
            visualizer: { style: 'Block' },
            particles: { style: 'Floating Embers' },
            overlay: { style: 'Glow' },
            beatReaction: { strength: 'Medium High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 50 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ffa500', colorRight: '#800080', barCount: 64 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_future_bass',
        name: 'Future Bass', genre: 'Future Bass', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Warna-warna pastel cerah dan efek glitch halus',
        metadata: {
            genre: 'Future Bass',
            mood: 'Uplifting',
            energy: 4,
            recommendedFor: ['Future Bass', 'Anime', 'Kawaii'],
            colorPalette: ['#ff69b4', '#00ffff', '#dda0dd'],
            visualIdentity: 'Pastel neon, bright contrast, energetic drops',
            visualTags: ['Kawaii', 'Uplifting', 'Pastel']
        },
        visualProfile: {
            background: { style: 'Bright' },
            lighting: { style: 'Pastel Neon' },
            camera: { style: 'Fast Zoom', shake: false },
            visualizer: { style: 'Smooth Rounded' },
            particles: { style: 'Confetti' },
            overlay: { style: 'Glitch' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 10, overlayDarkness: 30 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#ff69b4', colorRight: '#00ffff', barCount: 96 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_dubstep',
        name: 'Heavy Dubstep', genre: 'Dubstep', author: 'Media Factory', difficulty: 'Advanced',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Gelap, agresif, dan penuh dengan efek goyangan',
        metadata: {
            genre: 'Dubstep',
            mood: 'Dark',
            energy: 5,
            recommendedFor: ['Dubstep', 'Hardstyle', 'Riddim'],
            colorPalette: ['#000000', '#32cd32', '#006400'],
            visualIdentity: 'Gritty, dark green lasers, aggressive camera shake',
            visualTags: ['Dark', 'Heavy', 'Gritty']
        },
        visualProfile: {
            background: { style: 'High Contrast' },
            lighting: { style: 'Laser' },
            camera: { style: 'Heavy Shake', shake: true },
            visualizer: { style: 'Sharp Peaks' },
            particles: { style: 'Smoke' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'Extreme' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 2, overlayDarkness: 85, bgZoom: 15 },
            Visualizer: { visualizerId: 'viz-1', color: '#32cd32', barCount: 128 },
            Particle: { presetId: 'smoke', count: 100, wind: 0, gravity: 0 } // Assuming smoke exists
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_drum_bass',
        name: 'Fast DnB', genre: 'Drum & Bass', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Kecepatan tinggi dengan visual yang responsif',
        metadata: {
            genre: 'Drum & Bass',
            mood: 'Fast',
            energy: 5,
            recommendedFor: ['Drum & Bass', 'Jungle', 'Liquid'],
            colorPalette: ['#ffff00', '#000000', '#ff4500'],
            visualIdentity: 'Fast paced, rapid strobe, high contrast yellow/black',
            visualTags: ['Fast', 'Dynamic', 'High Energy']
        },
        visualProfile: {
            background: { style: 'Dark' },
            lighting: { style: 'Rapid Strobe' },
            camera: { style: 'Fast Pan', shake: false },
            visualizer: { style: 'Thin Lines' },
            particles: { style: 'Sparks' },
            overlay: { style: 'None' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 75 },
            Visualizer: { visualizerId: 'viz-1', color: '#ffff00', barCount: 256, opacity: 90 }
        }
    }
];
