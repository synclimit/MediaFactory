/**
 * SeededNoiseAdapter.js
 * Provides deterministic pseudo-random number generation (PRNG) and periodic noise
 * functions for MediaFactory M3 Fast Render Engine.
 * 
 * Features:
 * - Mulberry32 deterministic PRNG algorithm
 * - Seeded random floats, integers, and range values
 * - Periodic loop-safe 2D/4D Simplex/Perlin noise generator for camera shake & particle drift
 */

export class SeededNoiseAdapter {
    constructor(defaultSeed = 1337) {
        this.defaultSeed = defaultSeed;
    }

    /**
     * Mulberry32 PRNG core algorithm.
     * @param {number} seed - Integer seed value
     * @returns {function(): number} Returns float in [0, 1)
     */
    createPRNG(seed) {
        let a = seed ^ 0xDEADBEEF;
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Get deterministic random float in [0, 1) for a specific seed & iteration index.
     */
    getRandomFloat(seed = this.defaultSeed, index = 0) {
        const prng = this.createPRNG(seed + index * 997);
        return prng();
    }

    /**
     * Get deterministic random number within range [min, max].
     */
    getRandomRange(seed = this.defaultSeed, index = 0, min = 0, max = 1) {
        const val = this.getRandomFloat(seed, index);
        return min + val * (max - min);
    }

    /**
     * Get deterministic integer within range [min, max].
     */
    getRandomInt(seed = this.defaultSeed, index = 0, min = 0, max = 100) {
        return Math.floor(this.getRandomRange(seed, index, min, max + 1));
    }

    /**
     * Periodic 2D Trigonometric Noise for seamless $N \to 1$ video loops.
     * Evaluates continuous noise over loop period T.
     * @param {number} timeSec - Current timecode in seconds
     * @param {number} loopDurationSec - Master loop duration T (e.g. 10.0s)
     * @param {number} frequency - Oscillation frequency multiplier
     * @param {number} seed - Random seed offset
     * @returns {number} Noise float in [-1, 1]
     */
    getPeriodicNoise(timeSec, loopDurationSec = 10.0, frequency = 1.0, seed = this.defaultSeed) {
        const theta = (2 * Math.PI * timeSec) / Math.max(0.1, loopDurationSec);
        const cosAngle = Math.cos(theta * frequency);
        const sinAngle = Math.sin(theta * frequency);

        const phaseOffset = (seed % 360) * (Math.PI / 180);
        
        // Multi-octave harmonic trigonometric noise
        const octave1 = Math.sin(cosAngle * 3.0 + phaseOffset) * Math.cos(sinAngle * 3.0 + phaseOffset);
        const octave2 = Math.sin(sinAngle * 6.0 + phaseOffset * 2) * 0.5;

        return Math.max(-1.0, Math.min(1.0, octave1 + octave2));
    }

    /**
     * Generate 2D Seeded Displacement Vector (X, Y) for Camera Shake.
     * Guarantees 100% smooth looping across loop boundaries.
     */
    getSeededCameraShake(timeSec, loopDurationSec = 10.0, strength = 20.0, seed = this.defaultSeed) {
        const noiseX = this.getPeriodicNoise(timeSec, loopDurationSec, 1.0, seed);
        const noiseY = this.getPeriodicNoise(timeSec, loopDurationSec, 2.0, seed + 100);
        const noiseRot = this.getPeriodicNoise(timeSec, loopDurationSec, 3.0, seed + 200) * 0.15;

        return {
            x: noiseX * strength,
            y: noiseY * strength,
            rotation: noiseRot * (strength / 10.0)
        };
    }
}

// Export singleton
export const seededNoiseAdapter = new SeededNoiseAdapter();
