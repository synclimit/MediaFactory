export class PeakDetector {
    constructor() {
        this.config = {
            fluxWeight: 0.5,
            energyWeight: 0.3,
            prominenceWeight: 0.2
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
    }

    process(input) {
        const fluxFrames = Array.isArray(input) ? input : 
                           (input.fluxFrames ? input.fluxFrames : [input]);

        if (!fluxFrames || fluxFrames.length === 0) {
            return { peakFrames: [] };
        }

        const peakFrames = [];

        for (let i = 0; i < fluxFrames.length; i++) {
            const frame = fluxFrames[i];
            const { timestamp, normalizedFlux, adaptiveThreshold, deltaEnergy } = frame;

            let isPeak = false;
            let localMaximum = false;
            let prominence = 0;
            let peakStrength = 0;

            const currentFlux = typeof normalizedFlux === 'number' ? normalizedFlux : 0;
            const prevFlux = i > 0 && typeof fluxFrames[i - 1].normalizedFlux === 'number' ? fluxFrames[i - 1].normalizedFlux : 0;
            const nextFlux = i < fluxFrames.length - 1 && typeof fluxFrames[i + 1].normalizedFlux === 'number' ? fluxFrames[i + 1].normalizedFlux : 0;

            if (currentFlux > prevFlux && currentFlux > nextFlux) {
                localMaximum = true;
            }

            if (localMaximum && currentFlux > (adaptiveThreshold || 0)) {
                isPeak = true;

                let leftMinimum = currentFlux;
                for (let j = i - 1; j >= 0; j--) {
                    const f = fluxFrames[j].normalizedFlux || 0;
                    if (f > leftMinimum) break;
                    leftMinimum = f;
                }

                let rightMinimum = currentFlux;
                for (let j = i + 1; j < fluxFrames.length; j++) {
                    const f = fluxFrames[j].normalizedFlux || 0;
                    if (f > rightMinimum) break;
                    rightMinimum = f;
                }

                prominence = currentFlux - Math.max(leftMinimum, rightMinimum);
                prominence = Math.max(0, Math.min(1, prominence));

                const rawStrength = 
                    (currentFlux * this.config.fluxWeight) + 
                    ((deltaEnergy || 0) * this.config.energyWeight) + 
                    (prominence * this.config.prominenceWeight);

                peakStrength = Math.max(0, Math.min(1, rawStrength));
            }

            peakFrames.push(Object.freeze({
                timestamp,
                isPeak,
                peakStrength,
                localMaximum,
                prominence,
                threshold: adaptiveThreshold || 0,
                normalizedFlux: currentFlux,
                adaptiveThreshold: adaptiveThreshold || 0,
                deltaEnergy: deltaEnergy || 0
            }));
        }

        return { peakFrames };
    }

    reset() {
        // Stateless over full buffer
    }
}
