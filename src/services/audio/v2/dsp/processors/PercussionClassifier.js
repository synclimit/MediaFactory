export class PercussionClassifier {
    constructor() {
        this.config = {};
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
    }

    process(input) {
        const downbeatFrames = input.downbeatFrames || [];
        const energyFrames = input.energyFrames || [];
        const onsetFrames = input.onsetFrames || [];

        if (downbeatFrames.length === 0) {
            return { percussionFrames: [] };
        }

        let energyIdx = 0;
        let onsetIdx = 0;

        let maxKick = 0.0001;
        let maxSnare = 0.0001;
        let maxHihat = 0.0001;

        const rawData = [];

        // Pass 1: Extract features and find global maximums for normalization
        for (const db of downbeatFrames) {
            const ts = db.timestamp;

            // Align to closest energy frame computationally
            while (energyIdx < energyFrames.length - 1 && Math.abs(energyFrames[energyIdx + 1].timestamp - ts) < Math.abs(energyFrames[energyIdx].timestamp - ts)) {
                energyIdx++;
            }
            const energy = energyFrames[energyIdx] || {};

            // Align to closest onset frame
            while (onsetIdx < onsetFrames.length - 1 && Math.abs(onsetFrames[onsetIdx + 1].timestamp - ts) < Math.abs(onsetFrames[onsetIdx].timestamp - ts)) {
                onsetIdx++;
            }
            const onset = onsetFrames[onsetIdx] || {};

            const sub = energy.subEnergy || 0;
            const bass = energy.bassEnergy || 0;
            const mid = energy.midEnergy || 0;
            const upperMid = energy.upperMidEnergy || 0;
            const presence = energy.presenceEnergy || 0;
            const high = energy.highEnergy || 0;
            const flatness = energy.spectralFlatness || 0;
            
            const transient = onset.transientScore !== undefined ? onset.transientScore : (db.beatStrength || 0);

            // Stage 1, 2, 3: Frequency Band Analysis
            const kickRaw = (sub * 0.6) + (bass * 0.4);
            const snareRaw = (mid * 0.5) + (upperMid * 0.5);
            // Flatness heavily correlates with noise/cymbals, scaled roughly to match energy magnitudes natively
            const hihatRaw = (presence * 0.4) + (high * 0.6) + (flatness * (high > 0 ? high : 10.0));

            if (kickRaw > maxKick) maxKick = kickRaw;
            if (snareRaw > maxSnare) maxSnare = snareRaw;
            if (hihatRaw > maxHihat) maxHihat = hihatRaw;

            rawData.push({ ts, kickRaw, snareRaw, hihatRaw, transient, db });
        }

        const percussionFrames = [];

        // Pass 2: Normalize and isolate Probability from physical Strength
        for (const data of rawData) {
            // Stage 4: Probability normalization (0 to 1 scaling based on local track variance)
            const kickProb = Math.max(0, Math.min(1, data.kickRaw / maxKick));
            const snareProb = Math.max(0, Math.min(1, data.snareRaw / maxSnare));
            const hihatProb = Math.max(0, Math.min(1, data.hihatRaw / maxHihat));

            // Stage 5: Independent Strength Estimation
            // An isolated sound can be 100% probably a kick, but very weak physically.
            const kickStrength = Math.max(0, Math.min(1, kickProb * data.transient));
            const snareStrength = Math.max(0, Math.min(1, snareProb * data.transient));
            const hihatStrength = Math.max(0, Math.min(1, hihatProb * data.transient));

            percussionFrames.push(Object.freeze({
                timestamp: data.ts,
                kick: Object.freeze({ probability: kickProb, strength: kickStrength }),
                snare: Object.freeze({ probability: snareProb, strength: snareStrength }),
                hihat: Object.freeze({ probability: hihatProb, strength: hihatStrength }),
                beatStrength: data.db.beatStrength,
                barIndex: data.db.barIndex,
                beatInBar: data.db.beatInBar
            }));
        }

        return { percussionFrames };
    }

    reset() {}
}
