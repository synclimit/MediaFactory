/**
 * SpectrumProfiles
 * 
 * Defines artistic intent and styling parameters for the Spectrum Effect.
 */
export const SpectrumProfiles = {
    Classic: {
        smoothingTimeConstant: 0.8,
        heightMultiplier: 1.0,
        colorWeightBias: 0.0,
        reactive: false
    },
    Punchy: {
        smoothingTimeConstant: 0.4,
        heightMultiplier: 1.5,
        colorWeightBias: 0.2,
        reactive: true
    },
    Smooth: {
        smoothingTimeConstant: 0.95,
        heightMultiplier: 0.8,
        colorWeightBias: -0.2,
        reactive: false
    },
    Reactive: {
        smoothingTimeConstant: 0.6,
        heightMultiplier: 2.0,
        colorWeightBias: 0.5,
        reactive: true
    },
    Classical: {
        smoothingTimeConstant: 0.95,
        heightMultiplier: 0.5,
        colorWeightBias: -0.5,
        reactive: false
    },
    Jazz: {
        smoothingTimeConstant: 0.85,
        heightMultiplier: 0.8,
        colorWeightBias: -0.1,
        reactive: true
    },
    Metal: {
        smoothingTimeConstant: 0.2,
        heightMultiplier: 2.5,
        colorWeightBias: 0.8,
        reactive: true
    },
    Acoustic: {
        smoothingTimeConstant: 0.9,
        heightMultiplier: 0.6,
        colorWeightBias: -0.3,
        reactive: true
    },
    Podcast: {
        smoothingTimeConstant: 0.98,
        heightMultiplier: 0.3,
        colorWeightBias: 0.0,
        reactive: false
    }
};

export function getSpectrumProfile(name) {
    return SpectrumProfiles[name] || SpectrumProfiles.Classic;
}
