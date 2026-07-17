export class DownbeatDetector {
    constructor() {
        this.config = {
            supportedMeters: [4, 3, 2, 6],
            defaultMeter: 4,
            fourFourBias: 1.05 // Mild bias for 4/4 modern music
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
    }

    process(input) {
        const stableFrames = Array.isArray(input) ? input : 
                             (input.stableBeatFrames ? input.stableBeatFrames : [input]);

        if (!stableFrames || stableFrames.length === 0) {
            return { downbeatFrames: [] };
        }

        // Stage 1 & 2: Meter Candidate Detection and Pattern Consistency
        // Offline architectural evaluation using a global phase alignment scan
        let globalBestMeter = this.config.defaultMeter;
        let globalBestPhase = 0;
        let globalMaxAvg = 0;

        for (const N of this.config.supportedMeters) {
            for (let phase = 0; phase < N; phase++) {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < stableFrames.length; i++) {
                    // Test assumption: this index is the downbeat (phase 0 relative to N)
                    if (i % N === phase) {
                        sum += stableFrames[i].beatStrength || 0;
                        count++;
                    }
                }
                
                // Stage 3: Downbeat Scoring
                let avg = count > 0 ? sum / count : 0;
                if (N === 4) {
                    avg *= this.config.fourFourBias;
                }

                if (avg > globalMaxAvg) {
                    globalMaxAvg = avg;
                    globalBestMeter = N;
                    globalBestPhase = phase;
                }
            }
        }

        // Stage 4: Bar Lock
        // By relying on the global maximum hypothesis, we mathematically prevent
        // isolated weak beats in the middle of a track from shifting the bar index.
        const downbeatFrames = [];
        
        // Align starting beat phase
        let beatInBar = 1;
        let barIndex = 1;
        
        if (globalBestPhase !== 0) {
            // Shift the start so that when i == globalBestPhase, beatInBar will equal 1
            beatInBar = (globalBestMeter - globalBestPhase) + 1;
        }

        // Stage 5: Time Signature Confidence
        // Naive scaling of the maximum average beat strength to [0, 1]
        const barConfidence = Math.max(0, Math.min(1, globalMaxAvg * 1.5));

        for (let i = 0; i < stableFrames.length; i++) {
            const frame = stableFrames[i];

            if (beatInBar > globalBestMeter) {
                beatInBar = 1;
                barIndex++;
            }

            const isDownbeat = (beatInBar === 1);

            downbeatFrames.push(Object.freeze({
                timestamp: frame.stableTimestamp || frame.timestamp,
                isBeat: true,
                isDownbeat,
                beatInBar,
                estimatedTimeSignature: globalBestMeter,
                barIndex,
                barConfidence,
                beatStrength: frame.beatStrength,
                correctedBpm: frame.correctedBpm
            }));

            beatInBar++;
        }

        return { downbeatFrames };
    }

    reset() {}
}
