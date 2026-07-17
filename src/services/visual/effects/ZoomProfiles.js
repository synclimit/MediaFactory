/**
 * ZoomProfiles
 * 
 * Defines artistic intent and styling biases. These are NOT strict envelopes.
 * They are multipliers and base factors that get dynamically scaled by the MusicalFeelEngine.
 */
export const ZoomProfiles = {
    Default: {
        baseScale: 1.0,
        maxScale: 1.10,
        baseAttack: 0.05,
        baseHold: 0.02,
        baseDecay: 0.25,
        baseRelease: 0.15,
        momentumBoost: 0.0,
        curve: 'EaseOut'
    },
    EDM: {
        baseScale: 1.0,
        maxScale: 1.15,
        baseAttack: 0.02,
        baseHold: 0.00,
        baseDecay: 0.15,
        baseRelease: 0.10,
        momentumBoost: 0.5, // High agility bias
        curve: 'EaseOut'
    },
    Rock: {
        baseScale: 1.0,
        maxScale: 1.08,
        baseAttack: 0.04,
        baseHold: 0.05,
        baseDecay: 0.30,
        baseRelease: 0.20,
        momentumBoost: 0.0,
        curve: 'EaseOut'
    },
    Pop: {
        baseScale: 1.0,
        maxScale: 1.06,
        baseAttack: 0.06,
        baseHold: 0.02,
        baseDecay: 0.20,
        baseRelease: 0.20,
        momentumBoost: 0.0,
        curve: 'EaseInOut'
    },
    LoFi: {
        baseScale: 1.0,
        maxScale: 1.04,
        baseAttack: 0.10,
        baseHold: 0.05,
        baseDecay: 0.40,
        baseRelease: 0.30,
        momentumBoost: -0.2, // Sluggish dreamy movement
        curve: 'Linear'
    },
    Cinematic: {
        baseScale: 1.0,
        maxScale: 1.12,
        baseAttack: 0.08,
        baseHold: 0.10,
        baseDecay: 0.50,
        baseRelease: 0.40,
        momentumBoost: 0.0,
        curve: 'Expo'
    },
    Classical: {
        baseScale: 1.0,
        maxScale: 1.03,
        baseAttack: 0.15,
        baseHold: 0.10,
        baseDecay: 0.60,
        baseRelease: 0.50,
        momentumBoost: -0.3,
        curve: 'Linear'
    },
    Jazz: {
        baseScale: 1.0,
        maxScale: 1.05,
        baseAttack: 0.05,
        baseHold: 0.02,
        baseDecay: 0.25,
        baseRelease: 0.20,
        momentumBoost: -0.1,
        curve: 'EaseInOut'
    },
    Metal: {
        baseScale: 1.0,
        maxScale: 1.20,
        baseAttack: 0.01,
        baseHold: 0.00,
        baseDecay: 0.10,
        baseRelease: 0.05,
        momentumBoost: 0.8,
        curve: 'EaseOut'
    },
    Acoustic: {
        baseScale: 1.0,
        maxScale: 1.02,
        baseAttack: 0.08,
        baseHold: 0.05,
        baseDecay: 0.35,
        baseRelease: 0.25,
        momentumBoost: -0.2,
        curve: 'EaseInOut'
    },
    Podcast: {
        baseScale: 1.0,
        maxScale: 1.01,
        baseAttack: 0.20,
        baseHold: 0.10,
        baseDecay: 0.50,
        baseRelease: 0.30,
        momentumBoost: -0.5,
        curve: 'Linear'
    }
};

export function getZoomProfile(name) {
    return ZoomProfiles[name] || ZoomProfiles.Default;
}
