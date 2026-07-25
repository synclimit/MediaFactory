export const modernPresets = [
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_pop_bright',
        name: 'Bright Pop', genre: 'Pop', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Cerah, ceria, dan bersih',
        metadata: {
            genre: 'Pop',
            mood: 'Happy',
            energy: 4,
            recommendedFor: ['Pop', 'Dance', 'Summer'],
            colorPalette: ['#ffff00', '#00ffff', '#ff1493'],
            visualIdentity: 'Bright, colorful, dynamic visualizer, confetti',
            visualTags: ['Bright', 'Colorful', 'Clean']
        },
        visualProfile: {
            background: { style: 'Clean' },
            lighting: { style: 'Bright' },
            camera: { style: 'Smooth Pan', shake: false },
            visualizer: { style: 'Dynamic' },
            particles: { style: 'Confetti' },
            overlay: { style: 'Glow' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 10, bgZoom: 0 },
            Visualizer: { visualizerId: 'viz-1', color: '#ff1493', barCount: 48, opacity: 90 }
        }
    },
    // Placeholders for remaining Modern genres
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_pop_ballad',
        name: 'Pop Ballad', genre: 'Pop Ballad', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Lembut, romantis, dan emosional',
        metadata: {
            genre: 'Pop Ballad',
            mood: 'Romantic',
            energy: 2,
            recommendedFor: ['Pop Ballad', 'Cover', 'Love Song'],
            colorPalette: ['#ffb6c1', '#ffffff', '#ff69b4'],
            visualIdentity: 'Soft pink tones, floating petals or dust, slow camera',
            visualTags: ['Romantic', 'Soft', 'Sweet']
        },
        visualProfile: {
            background: { style: 'Soft' },
            lighting: { style: 'Diffused' },
            camera: { style: 'Slow Pan', shake: false },
            visualizer: { style: 'Smooth Curve' },
            particles: { style: 'Dust' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'Low' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 12, overlayDarkness: 30 },
            Visualizer: { visualizerId: 'viz-1', color: '#ffb6c1', barCount: 64, opacity: 80 },
            Particle: { presetId: 'dust', count: 100, wind: 1, gravity: 0 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_hiphop',
        name: 'Urban Street', genre: 'Hip Hop', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe jalanan dengan warna emas dan hitam',
        metadata: {
            genre: 'Hip Hop',
            mood: 'Cool',
            energy: 4,
            recommendedFor: ['Hip Hop', 'Rap', 'Urban'],
            colorPalette: ['#ffd700', '#000000', '#c0c0c0'],
            visualIdentity: 'High contrast gold/black, heavy bass bounce, street vibe',
            visualTags: ['Urban', 'Cool', 'Gold']
        },
        visualProfile: {
            background: { style: 'High Contrast' },
            lighting: { style: 'Spotlight' },
            camera: { style: 'Bass Bounce', shake: true },
            visualizer: { style: 'Blocky' },
            particles: { style: 'Smoke' },
            overlay: { style: 'Vignette' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 60, bgZoom: 10 },
            Visualizer: { visualizerId: 'viz-1', color: '#ffd700', barCount: 32 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_trap',
        name: 'Dark Trap', genre: 'Trap', author: 'Media Factory', difficulty: 'Intermediate',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Agresif dengan bass berat dan warna gelap',
        metadata: {
            genre: 'Trap',
            mood: 'Aggressive',
            energy: 4,
            recommendedFor: ['Trap', 'Beat', 'Hard'],
            colorPalette: ['#ff0000', '#1a1a1a', '#4b0082'],
            visualIdentity: 'Dark, red accents, heavy camera shake on beats',
            visualTags: ['Dark', 'Aggressive', 'Heavy']
        },
        visualProfile: {
            background: { style: 'Very Dark' },
            lighting: { style: 'Red Strobe' },
            camera: { style: 'Heavy Shake', shake: true },
            visualizer: { style: 'Low End Heavy' },
            particles: { style: 'Sparks' },
            overlay: { style: 'Grit' },
            beatReaction: { strength: 'Extreme' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 0, overlayDarkness: 80, bgZoom: 15 },
            Visualizer: { visualizerId: 'viz-1', color: '#ff0000', barCount: 48 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_rnb',
        name: 'Smooth R&B', genre: 'R&B', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Visual elegan dengan sentuhan ungu dan biru tua',
        metadata: {
            genre: 'R&B',
            mood: 'Smooth',
            energy: 3,
            recommendedFor: ['R&B', 'Soul', 'Late Night'],
            colorPalette: ['#8a2be2', '#4b0082', '#000080'],
            visualIdentity: 'Smooth transitions, deep purple, elegant lighting',
            visualTags: ['Smooth', 'Elegant', 'Deep']
        },
        visualProfile: {
            background: { style: 'Clean' },
            lighting: { style: 'Soft Neon' },
            camera: { style: 'Slow Dolly', shake: false },
            visualizer: { style: 'Smooth Curve' },
            particles: { style: 'None' },
            overlay: { style: 'Soft Glow' },
            beatReaction: { strength: 'Medium' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 15, overlayDarkness: 60 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#8a2be2', colorRight: '#000080', barCount: 64 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_phonk',
        name: 'Drift Phonk', genre: 'Phonk', author: 'Media Factory', difficulty: 'Advanced',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Vibe balapan malam dengan efek VHS/Grit',
        metadata: {
            genre: 'Phonk',
            mood: 'Dark',
            energy: 5,
            recommendedFor: ['Phonk', 'Drift', 'Sigma'],
            colorPalette: ['#800000', '#000000', '#ff00ff'],
            visualIdentity: 'VHS glitch, dark red, intense camera shake',
            visualTags: ['Dark', 'VHS', 'Intense']
        },
        visualProfile: {
            background: { style: 'High Contrast' },
            lighting: { style: 'Laser' },
            camera: { style: 'Shake', shake: true },
            visualizer: { style: 'Sharp Peaks' },
            particles: { style: 'Smoke' },
            overlay: { style: 'VHS Noise' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true, Particle: true },
        parameters: {
            Background: { blurAmount: 0, overlayDarkness: 70 },
            Visualizer: { visualizerId: 'viz-1', color: '#800000', barCount: 128 },
            Particle: { presetId: 'smoke', count: 100, wind: 2, gravity: 0 }
        }
    },
    {
        schemaVersion: '2.0.0', presetVersion: '1.0.0', id: 'preset_tiktok',
        name: 'Viral Trend', genre: 'Viral TikTok', author: 'Media Factory', difficulty: 'Beginner',
        createdBy: 'Media Factory', builtIn: true,
        description: 'Visual kekinian yang cocok untuk FYP',
        metadata: {
            genre: 'Viral TikTok',
            mood: 'Trendy',
            energy: 4,
            recommendedFor: ['TikTok', 'Shorts', 'Viral'],
            colorPalette: ['#00f2fe', '#4facfe', '#ff0844'],
            visualIdentity: 'Cyan and magenta, fast transitions, clean graphics',
            visualTags: ['Trendy', 'Viral', 'Clean']
        },
        visualProfile: {
            background: { style: 'Bright' },
            lighting: { style: 'Neon Ring' },
            camera: { style: 'Snap Zoom', shake: false },
            visualizer: { style: 'Bouncy' },
            particles: { style: 'Sparkles' },
            overlay: { style: 'None' },
            beatReaction: { strength: 'High' }
        },
        applyScope: { Background: true, Visualizer: true },
        parameters: {
            Background: { blurAmount: 5, overlayDarkness: 20 },
            Visualizer: { visualizerId: 'viz-1', colorMode: 'Gradient', colorLeft: '#00f2fe', colorRight: '#ff0844', barCount: 48 }
        }
    }
];
