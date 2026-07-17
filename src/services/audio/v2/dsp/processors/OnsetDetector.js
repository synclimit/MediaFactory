export class OnsetDetector {
    constructor() {
        this.config = {
            energyThreshold: 0.05,
            slopeThreshold: 5.0,
            refractoryPeriodSec: 0.03, // 30ms window
            weights: {
                peakStrength: 0.4,
                attackSlope: 0.3,
                energyRise: 0.3
            }
        };
        this.lastOnsetTimestamp = -Infinity;
        this.previousFrame = null;
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
        if (config.weights) {
            this.config.weights = { ...this.config.weights, ...config.weights };
        }
        this.lastOnsetTimestamp = -Infinity;
        this.previousFrame = null;
    }

    process(input) {
        const peakFrames = Array.isArray(input) ? input : 
                           (input.peakFrames ? input.peakFrames : [input]);

        if (!peakFrames || peakFrames.length === 0) {
            return { onsetFrames: [] };
        }

        const onsetFrames = [];

        for (let i = 0; i < peakFrames.length; i++) {
            const frame = peakFrames[i];
            const { timestamp, isPeak, peakStrength, deltaEnergy } = frame;

            let isOnset = false;
            let onsetStrength = 0;
            let attackSlope = 0;
            let attackDuration = 0;
            let energyRise = deltaEnergy || 0;
            let transientScore = 0;

            const prevTime = this.previousFrame ? this.previousFrame.timestamp : Math.max(0, timestamp - 0.01);
            const deltaTime = Math.max(0.0001, timestamp - prevTime);
            attackDuration = deltaTime;
            
            if (energyRise > 0) {
                attackSlope = energyRise / deltaTime;
            }

            // Rule 1, 2 & 3: Valid peak, rising energy, and steep slope
            if (isPeak && energyRise > this.config.energyThreshold && attackSlope > this.config.slopeThreshold) {
                
                // Rule 4: Refractory period / Plateau suppression
                if (timestamp - this.lastOnsetTimestamp >= this.config.refractoryPeriodSec) {
                    isOnset = true;
                    this.lastOnsetTimestamp = timestamp;

                    // Naive normalization for scoring
                    const clampedPeak = Math.max(0, Math.min(1, peakStrength || 0));
                    const clampedSlope = Math.max(0, Math.min(1, attackSlope / 100.0)); // scale arbitrary slope down
                    const clampedEnergy = Math.max(0, Math.min(1, energyRise));

                    // Rule 5: Transient score
                    const rawScore = 
                        (clampedPeak * this.config.weights.peakStrength) +
                        (clampedSlope * this.config.weights.attackSlope) +
                        (clampedEnergy * this.config.weights.energyRise);

                    transientScore = Math.max(0, Math.min(1, rawScore));
                    onsetStrength = transientScore;
                }
            }

            onsetFrames.push(Object.freeze({
                timestamp,
                isOnset,
                onsetStrength,
                attackSlope,
                attackDuration,
                energyRise,
                transientScore,
                peakStrength: peakStrength || 0
            }));

            this.previousFrame = frame;
        }

        return { onsetFrames };
    }

    reset() {
        this.lastOnsetTimestamp = -Infinity;
        this.previousFrame = null;
    }
}
