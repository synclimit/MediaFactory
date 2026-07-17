export class TempoStabilizer {
    constructor() {
        this.config = {
            emaAlpha: 0.2, // smoothing factor for interval
            maxBpmDelta: 2.0, // max bpm change per beat
            overrideConfidence: 0.8, // threshold to ignore maxBpmDelta
            compensationFactor: 0.1 // speed to catch up to timing drift
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
    }

    process(input) {
        const rawBeatFrames = Array.isArray(input) ? input : 
                              (input.rawBeatFrames ? input.rawBeatFrames : [input]);

        if (!rawBeatFrames || rawBeatFrames.length === 0) {
            return { stableBeatFrames: [] };
        }

        const stableBeatFrames = [];
        const beats = rawBeatFrames.filter(f => f.isBeat);

        if (beats.length === 0) {
            return { stableBeatFrames: [] };
        }

        let expectedInterval = beats[0].estimatedInterval || 0.5;
        let prevCorrectedBpm = beats[0].estimatedBpm || 120;
        let prevStableTimestamp = beats[0].timestamp;
        let prevTimestamp = beats[0].timestamp;

        // Stage 1: Initialize first beat perfectly aligned
        stableBeatFrames.push(Object.freeze({
            timestamp: beats[0].timestamp,
            stableTimestamp: beats[0].timestamp,
            correctedInterval: expectedInterval,
            correctedBpm: prevCorrectedBpm,
            beatStrength: beats[0].beatStrength,
            stability: 1.0,
            drift: 0,
            confidence: beats[0].intervalConfidence || 0
        }));

        for (let i = 1; i < beats.length; i++) {
            const frame = beats[i];
            
            // Stage 1: Interval Deviation
            let actualInterval = frame.timestamp - prevTimestamp;
            
            // Defend against huge rhythmic gaps (silence/drops) wrecking the EMA
            if (actualInterval > expectedInterval * 2.5) {
                const steps = Math.round(actualInterval / expectedInterval);
                if (steps > 0) {
                    actualInterval = actualInterval / steps;
                }
            }
            
            const drift = actualInterval - expectedInterval;

            // Stage 2: EMA Smoothing
            const smoothedInterval = (this.config.emaAlpha * actualInterval) + ((1 - this.config.emaAlpha) * expectedInterval);

            // Stage 3: Tempo Lock
            let rawBpm = smoothedInterval > 0 ? 60 / smoothedInterval : prevCorrectedBpm;
            let correctedBpm = rawBpm;
            const bpmDelta = rawBpm - prevCorrectedBpm;

            const conf = frame.intervalConfidence || 0;
            if (conf < this.config.overrideConfidence) {
                // Lock BPM change
                const clampedBpmDelta = Math.max(-this.config.maxBpmDelta, Math.min(this.config.maxBpmDelta, bpmDelta));
                correctedBpm = prevCorrectedBpm + clampedBpmDelta;
            }

            const correctedInterval = correctedBpm > 0 ? 60 / correctedBpm : expectedInterval;

            // Stage 4: Drift Compensation
            // Calculate where the grid *should* be based strictly on our smoothed BPM
            const gridTime = prevStableTimestamp + correctedInterval;
            
            // Measure how far the actual audio drifted from the theoretical grid
            const timingError = frame.timestamp - gridTime;
            
            // Gently pull the grid towards reality without hard snapping
            const compensation = timingError * this.config.compensationFactor;
            const stableTimestamp = gridTime + compensation;

            // Stage 5: Stability Score
            const variance = expectedInterval > 0 ? Math.min(1, Math.abs(drift / expectedInterval)) : 0;
            let stability = 1.0 - variance;
            
            // Weigh raw variance against global confidence
            stability = (stability * 0.7) + (conf * 0.3);
            stability = Math.max(0, Math.min(1, stability));

            stableBeatFrames.push(Object.freeze({
                timestamp: frame.timestamp,
                stableTimestamp,
                correctedInterval,
                correctedBpm,
                beatStrength: frame.beatStrength,
                stability,
                drift,
                confidence: conf
            }));

            // Roll states forward
            expectedInterval = correctedInterval;
            prevCorrectedBpm = correctedBpm;
            prevStableTimestamp = stableTimestamp;
            prevTimestamp = frame.timestamp;
        }

        return { stableBeatFrames };
    }

    reset() {}
}
