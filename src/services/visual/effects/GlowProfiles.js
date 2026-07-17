/**
 * GlowProfiles
 * 
 * Defines artistic intent and styling biases for the Glow Effect.
 * These are multipliers and base factors that get dynamically scaled by the MusicalFeelEngine.
 */
export const GlowProfiles = {
    Default: {
        maxIntensity: 1.5,
        maxRadius: 2.0,
        maxOpacity: 0.8,
        baseAttack: 0.05,
        baseHold: 0.02,
        baseDecay: 0.30,
        baseRelease: 0.20,
        momentumBoost: 0.0,
        curve: 'EaseOut'
    },
    EDM: {
        maxIntensity: 2.5,
        maxRadius: 3.0,
        maxOpacity: 1.0,
        baseAttack: 0.02,
        baseHold: 0.00,
        baseDecay: 0.15,
        baseRelease: 0.10,
        momentumBoost: 0.5, // High agility bias
        curve: 'EaseOut'
    },
    Rock: {
        maxIntensity: 2.0,
        maxRadius: 1.5,
        maxOpacity: 0.9,
        baseAttack: 0.04,
        baseHold: 0.05,
        baseDecay: 0.25,
        baseRelease: 0.15,
        momentumBoost: 0.0,
        curve: 'EaseOut'
    },
    Pop: {
        maxIntensity: 1.8,
        maxRadius: 2.2,
        maxOpacity: 0.85,
        baseAttack: 0.06,
        baseHold: 0.02,
        baseDecay: 0.35,
        baseRelease: 0.25,
        momentumBoost: 0.0,
        curve: 'EaseInOut'
    },
    LoFi: {
        maxIntensity: 1.0,
        maxRadius: 4.0,
        maxOpacity: 0.6,
        baseAttack: 0.15,
        baseHold: 0.10,
        baseDecay: 0.60,
        baseRelease: 0.40,
        momentumBoost: -0.2, // Sluggish dreamy movement
        curve: 'Linear'
    },
    Cinematic: {
        maxIntensity: 3.0,
        maxRadius: 5.0,
        maxOpacity: 0.95,
        baseAttack: 0.10,
        baseHold: 0.15,
        baseDecay: 0.80,
        baseRelease: 0.50,
        momentumBoost: 0.0,
        curve: 'Expo'
    },
    Classical: {
        maxIntensity: 1.2,
        maxRadius: 6.0,
        maxOpacity: 0.5,
        baseAttack: 0.20,
        baseHold: 0.10,
        baseDecay: 1.00,
        baseRelease: 0.80,
        momentumBoost: -0.3,
        curve: 'Linear'
    },
    Jazz: {
        maxIntensity: 1.5,
        maxRadius: 3.0,
        maxOpacity: 0.7,
        baseAttack: 0.08,
        baseHold: 0.05,
        baseDecay: 0.40,
        baseRelease: 0.30,
        momentumBoost: -0.1,
        curve: 'EaseInOut'
    },
    Metal: {
        maxIntensity: 3.5,
        maxRadius: 2.0,
        maxOpacity: 1.0,
        baseAttack: 0.01,
        baseHold: 0.00,
        baseDecay: 0.10,
        baseRelease: 0.05,
        momentumBoost: 0.8,
        curve: 'EaseOut'
    },
    Acoustic: {
        maxIntensity: 1.3,
        maxRadius: 4.5,
        maxOpacity: 0.6,
        baseAttack: 0.12,
        baseHold: 0.08,
        baseDecay: 0.50,
        baseRelease: 0.40,
        momentumBoost: -0.2,
        curve: 'EaseInOut'
    },
    Podcast: {
        maxIntensity: 0.5,
        maxRadius: 2.0,
        maxOpacity: 0.3,
        baseAttack: 0.30,
        baseHold: 0.20,
        baseDecay: 0.80,
        baseRelease: 0.50,
        momentumBoost: -0.5,
        curve: 'Linear'
    }
};

export function getGlowProfile(name) {
    return GlowProfiles[name] || GlowProfiles.Default;
}
