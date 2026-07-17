/**
 * CameraProfiles
 * 
 * Defines artistic intent and styling biases for the Camera Effect.
 * These act as base limits and response curve selectors.
 */
export const CameraProfiles = {
    Default: {
        positionMultiplier: 1.0,
        rotationMultiplier: 1.0,
        shakeMultiplier: 1.0,
        momentumMultiplier: 1.0,
        recoveryCurve: 'EaseOut'
    },
    EDM: {
        positionMultiplier: 1.5,
        rotationMultiplier: 1.2,
        shakeMultiplier: 1.5,
        momentumMultiplier: 0.5, // Fast recovery, low momentum
        recoveryCurve: 'EaseOut'
    },
    Rock: {
        positionMultiplier: 0.8,
        rotationMultiplier: 1.5,
        shakeMultiplier: 2.5, // Heavy shake
        momentumMultiplier: 0.8,
        recoveryCurve: 'EaseInOut'
    },
    Pop: {
        positionMultiplier: 1.2,
        rotationMultiplier: 0.8,
        shakeMultiplier: 0.5,
        momentumMultiplier: 1.2,
        recoveryCurve: 'EaseInOut'
    },
    LoFi: {
        positionMultiplier: 0.5,
        rotationMultiplier: 0.5,
        shakeMultiplier: 0.1, // Almost static
        momentumMultiplier: 2.0, // Long momentum / soft breathing
        recoveryCurve: 'Linear'
    },
    Cinematic: {
        positionMultiplier: 2.0,
        rotationMultiplier: 2.0,
        shakeMultiplier: 1.2,
        momentumMultiplier: 3.0, // Large movement, long momentum
        recoveryCurve: 'Expo'
    },
    Classical: {
        positionMultiplier: 0.2,
        rotationMultiplier: 0.1,
        shakeMultiplier: 0.0,
        momentumMultiplier: 4.0, // Extremely slow drifting
        recoveryCurve: 'Linear'
    },
    Jazz: {
        positionMultiplier: 0.6,
        rotationMultiplier: 0.4,
        shakeMultiplier: 0.2,
        momentumMultiplier: 1.5,
        recoveryCurve: 'EaseInOut'
    },
    Metal: {
        positionMultiplier: 1.8,
        rotationMultiplier: 2.5,
        shakeMultiplier: 3.0, // Extreme shake
        momentumMultiplier: 0.3, // Snappy return
        recoveryCurve: 'EaseOut'
    },
    Acoustic: {
        positionMultiplier: 0.4,
        rotationMultiplier: 0.3,
        shakeMultiplier: 0.1,
        momentumMultiplier: 2.5, // Slow, gentle swaying
        recoveryCurve: 'EaseInOut'
    },
    Podcast: {
        positionMultiplier: 0.1,
        rotationMultiplier: 0.05,
        shakeMultiplier: 0.0, // No shake
        momentumMultiplier: 5.0, // Imperceptible drifting
        recoveryCurve: 'Linear'
    }
};

export function getCameraProfile(name) {
    return CameraProfiles[name] || CameraProfiles.Default;
}
