export class BeatTracker {
    constructor() {
        this.config = {
            minBpm: 60,
            maxBpm: 220,
            clusterWindowSec: 0.02, // 20ms clustering window
            beatToleranceSec: 0.04, // 40ms tolerance for beat matching
            weights: {
                transientScore: 0.4,
                intervalConfidence: 0.4,
                onsetStrength: 0.2
            }
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
        if (config.weights) {
            this.config.weights = { ...this.config.weights, ...config.weights };
        }
    }

    process(input) {
        const onsetFrames = Array.isArray(input) ? input : 
                            (input.onsetFrames ? input.onsetFrames : [input]);

        if (!onsetFrames || onsetFrames.length === 0) {
            return { rawBeatFrames: [] };
        }

        // Stage 1 & 2: Collect valid onsets and compute IOIs
        const validOnsets = onsetFrames.filter(f => f.isOnset);
        const iois = [];
        for (let i = 1; i < validOnsets.length; i++) {
            iois.push(validOnsets[i].timestamp - validOnsets[i - 1].timestamp);
        }

        // Stage 3 & 4: Interval Histogram & Dominant Interval
        let dominantInterval = 0;
        let intervalConfidence = 0;
        let estimatedBpm = 0;

        if (iois.length > 0) {
            const clusters = [];
            for (const ioi of iois) {
                let found = false;
                for (const cluster of clusters) {
                    if (Math.abs(cluster.center - ioi) <= this.config.clusterWindowSec) {
                        cluster.count++;
                        // Moving average to refine center
                        cluster.center = cluster.center + (ioi - cluster.center) / cluster.count;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    clusters.push({ center: ioi, count: 1 });
                }
            }

            clusters.sort((a, b) => b.count - a.count);

            // Stage 5: Estimated BPM (Clamp between minBpm and maxBpm)
            const minInterval = 60 / this.config.maxBpm;
            const maxInterval = 60 / this.config.minBpm;

            for (const cluster of clusters) {
                let candidateInterval = cluster.center;
                
                // Align harmonics (double-time/half-time adjustment)
                while (candidateInterval > maxInterval && candidateInterval / 2 >= minInterval) {
                    candidateInterval /= 2;
                }
                while (candidateInterval < minInterval && candidateInterval * 2 <= maxInterval) {
                    candidateInterval *= 2;
                }

                if (candidateInterval >= minInterval && candidateInterval <= maxInterval) {
                    dominantInterval = candidateInterval;
                    estimatedBpm = 60 / dominantInterval;
                    intervalConfidence = cluster.count / iois.length;
                    break;
                }
            }
        }

        // Stage 6 & 7: Beat Candidate & Beat Strength
        const rawBeatFrames = [];
        let lastBeatTimestamp = -Infinity;

        for (let i = 0; i < onsetFrames.length; i++) {
            const frame = onsetFrames[i];
            let isBeat = false;
            let beatStrength = 0;

            if (frame.isOnset && dominantInterval > 0) {
                if (lastBeatTimestamp === -Infinity) {
                    isBeat = true; // First valid onset anchors the phase
                    lastBeatTimestamp = frame.timestamp;
                } else {
                    const timeSinceLastBeat = frame.timestamp - lastBeatTimestamp;
                    const steps = Math.round(timeSinceLastBeat / dominantInterval);
                    
                    if (steps >= 1) {
                        const expectedTime = lastBeatTimestamp + steps * dominantInterval;
                        if (Math.abs(frame.timestamp - expectedTime) <= this.config.beatToleranceSec) {
                            isBeat = true;
                            lastBeatTimestamp = frame.timestamp; // Re-align phase to reality
                        }
                    }
                }

                if (isBeat) {
                    const clampedTransient = Math.max(0, Math.min(1, frame.transientScore || 0));
                    const clampedConfidence = Math.max(0, Math.min(1, intervalConfidence));
                    const clampedOnsetStrength = Math.max(0, Math.min(1, frame.onsetStrength || 0));

                    const rawStrength = 
                        (clampedTransient * this.config.weights.transientScore) +
                        (clampedConfidence * this.config.weights.intervalConfidence) +
                        (clampedOnsetStrength * this.config.weights.onsetStrength);

                    beatStrength = Math.max(0, Math.min(1, rawStrength));
                }
            }

            rawBeatFrames.push(Object.freeze({
                timestamp: frame.timestamp,
                isBeat,
                beatStrength,
                estimatedInterval: dominantInterval,
                estimatedBpm,
                intervalConfidence,
                onsetStrength: frame.onsetStrength || 0
            }));
        }

        return { rawBeatFrames };
    }

    reset() {}
}
