/**
 * BlurProfiles
 * 
 * Defines artistic intent and styling parameters for the Blur Effect.
 */
export const BlurProfiles = {
    Gaussian: {
        radiusMultiplier: 1.0,
        strengthMultiplier: 1.0,
        direction: 0.0,
        recoverySpeed: 1.0,
        reactive: true
    },
    Motion: {
        radiusMultiplier: 2.0,
        strengthMultiplier: 1.5,
        direction: 1.0, // 1.0 represents horizontal motion blur
        recoverySpeed: 2.0,
        reactive: true
    },
    Radial: {
        radiusMultiplier: 1.5,
        strengthMultiplier: 2.0,
        direction: 2.0, // 2.0 represents radial blur center outwards
        recoverySpeed: 1.5,
        reactive: true
    },
    Box: {
        radiusMultiplier: 0.5,
        strengthMultiplier: 1.0,
        direction: 0.0,
        recoverySpeed: 0.5,
        reactive: true
    },
    Reactive: {
        radiusMultiplier: 3.0,
        strengthMultiplier: 3.0,
        direction: 1.5,
        recoverySpeed: 3.0,
        reactive: true
    },
    Classical: {
        radiusMultiplier: 0.2,
        strengthMultiplier: 0.2,
        direction: 0.0,
        recoverySpeed: 0.5,
        reactive: false // No blur
    },
    Jazz: {
        radiusMultiplier: 0.8,
        strengthMultiplier: 0.8,
        direction: 0.5,
        recoverySpeed: 1.0,
        reactive: true
    },
    Metal: {
        radiusMultiplier: 2.5,
        strengthMultiplier: 2.5,
        direction: 2.0, // Radial
        recoverySpeed: 4.0, // Extremely fast snap
        reactive: true
    },
    Acoustic: {
        radiusMultiplier: 0.5,
        strengthMultiplier: 0.5,
        direction: 0.0,
        recoverySpeed: 0.8,
        reactive: true
    },
    Podcast: {
        radiusMultiplier: 0.0,
        strengthMultiplier: 0.0,
        direction: 0.0,
        recoverySpeed: 1.0,
        reactive: false // No blur
    }
};

export function getBlurProfile(name) {
    return BlurProfiles[name] || BlurProfiles.Gaussian;
}
