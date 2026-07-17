import { VisualMappingRule } from './VisualMappingRule.js';

export const VisualMappingProfiles = {
    Default: [
        new VisualMappingRule({ source: 'pulse', target: 'Zoom', multiplier: 0.2, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'energy', target: 'Glow', multiplier: 1.0, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'snare', target: 'Blur', multiplier: 0.5, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'downbeat', target: 'Shake', multiplier: 0.1, min: 0, max: 1 }),
    ],
    EDM: [
        new VisualMappingRule({ source: 'kick', target: 'Zoom', multiplier: 0.5, min: 0, max: 1.5 }),
        new VisualMappingRule({ source: 'energy', target: 'Glow', multiplier: 1.5, min: 0.2, max: 1.5 }),
        new VisualMappingRule({ source: 'beat', target: 'Scale', multiplier: 0.2, offset: 1.0 }),
        new VisualMappingRule({ source: 'hihat', target: 'ParticleRate', multiplier: 10, min: 0, max: 100 }),
    ],
    Lofi: [
        new VisualMappingRule({ source: 'energy', target: 'Glow', multiplier: 0.3, min: 0, max: 0.5 }),
        new VisualMappingRule({ source: 'beat', target: 'Zoom', multiplier: 0.05, min: 0, max: 1 }),
    ],
    Rock: [
        new VisualMappingRule({ source: 'snare', target: 'Shake', multiplier: 0.2, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'kick', target: 'Zoom', multiplier: 0.3, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'energy', target: 'Glow', multiplier: 0.8, min: 0, max: 1 }),
    ],
    Podcast: [
        new VisualMappingRule({ source: 'energy', target: 'SubtitleHighlight', multiplier: 1.0, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'beat', target: 'Zoom', multiplier: 0.02, min: 0, max: 1 }),
    ],
    Cinematic: [
        new VisualMappingRule({ source: 'downbeat', target: 'CameraZoom', multiplier: 0.1, curve: 'EaseInOut', min: 0, max: 2 }),
        new VisualMappingRule({ source: 'energy', target: 'Glow', multiplier: 0.6, min: 0, max: 1 }),
        new VisualMappingRule({ source: 'progress', target: 'TrackBrightness', multiplier: 1.0, min: 0, max: 1 }),
    ]
};
