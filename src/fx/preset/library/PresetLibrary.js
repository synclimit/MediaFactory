export class PresetLibrary {
    static getGenres() {
        return [
            'DJ Remix',
            'DJ Slow Remix',
            'DJ Jedag Jedug',
            'Lofi',
            'Retro',
            'Phonk'
        ];
    }

    static getAllPresets() {
        return BUILT_IN_PRESETS;
    }

    static getPresetById(id) {
        return BUILT_IN_PRESETS.find(p => p.id === id);
    }
}

const BUILT_IN_PRESETS = [
    {
        schemaVersion: '2.0.0',
        presetVersion: '1.0.0',
        id: 'yt_jedag_jedug',
        name: 'Jedag Jedug Brutal',
        genre: 'DJ Jedag Jedug',
        author: 'Media Factory',
        createdBy: 'Media Factory',
        builtIn: true,
        description: 'Hard flashing, bass pumping, extreme zoom',
        applyScope: {
            ColorGrading: true,
            LightPulse: true,
            Laser: true
        },
        parameters: {
            ColorGrading: {
                enabled: true,
                brightness: 110,
                contrast: 130,
                saturation: 150
            },
            LightPulse: {
                enabled: true,
                style: 'Flash',
                color: '#ffffff',
                intensity: 80
            },
            Laser: {
                enabled: true,
                count: 6,
                color: '#ff0055',
                speed: 2
            }
        }
    },
    {
        schemaVersion: '2.0.0',
        presetVersion: '1.0.0',
        id: 'yt_retro',
        name: 'Retro 80s VHS',
        genre: 'Retro',
        author: 'Media Factory',
        createdBy: 'Media Factory',
        builtIn: true,
        description: 'Noise, Scanlines, and neon lights',
        applyScope: {
            ColorGrading: true,
            FilmFX: true,
            StageLight: true
        },
        parameters: {
            ColorGrading: {
                enabled: true,
                brightness: 90,
                contrast: 150,
                saturation: 120,
                sepia: 20
            },
            FilmFX: {
                enabled: true,
                style: 'VHS',
                intensity: 60
            },
            StageLight: {
                enabled: true,
                count: 3,
                colors: ['#ff00ff', '#00ffff'],
                speed: 1,
                intensity: 60
            }
        }
    },
    {
        schemaVersion: '2.0.0',
        presetVersion: '1.0.0',
        id: 'yt_lofi',
        name: 'Lofi Chill',
        genre: 'Lofi',
        author: 'Media Factory',
        createdBy: 'Media Factory',
        builtIn: true,
        description: 'Warm colors, slight haze, and gentle grain',
        applyScope: {
            ColorGrading: true,
            Atmosphere: true,
            FilmFX: true
        },
        parameters: {
            ColorGrading: {
                enabled: true,
                brightness: 85,
                contrast: 90,
                saturation: 80,
                sepia: 40 // Warm temperature
            },
            Atmosphere: {
                enabled: true,
                style: 'Haze',
                color: '#ffddaa',
                intensity: 40
            },
            FilmFX: {
                enabled: true,
                style: 'Grain',
                intensity: 30
            }
        }
    },
    {
        schemaVersion: '2.0.0',
        presetVersion: '1.0.0',
        id: 'yt_phonk',
        name: 'Drift Phonk',
        genre: 'Phonk',
        author: 'Media Factory',
        createdBy: 'Media Factory',
        builtIn: true,
        description: 'Dark, red tint, high contrast, aggressive lasers',
        applyScope: {
            ColorGrading: true,
            Atmosphere: true,
            Laser: true
        },
        parameters: {
            ColorGrading: {
                enabled: true,
                brightness: 80,
                contrast: 140,
                saturation: 110,
                hueRotate: 320 // Shift towards red/magenta
            },
            Atmosphere: {
                enabled: true,
                style: 'Fog',
                color: '#ff0000',
                intensity: 30
            },
            Laser: {
                enabled: true,
                count: 4,
                color: '#ff0000',
                speed: 3
            }
        }
    }
];
