export class SpectralFluxProcessor {
    constructor() {
        this.config = {
            windowSize: 16,
            multiplier: 1.5 // multiplier for standard deviation
        };
        this.previousFrame = null;
        this.fluxHistory = [];
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
        this.previousFrame = null;
        this.fluxHistory = [];
    }

    process(input) {
        // Handle array of frames or single frame depending on orchestrator input structure
        const frames = Array.isArray(input) ? input : 
                       (input.energyFrames ? input.energyFrames : [input]);
                       
        if (!frames || frames.length === 0 || frames[0].timestamp === undefined) {
            return { fluxFrames: [] };
        }

        const fluxFrames = frames.map(frame => {
            const { timestamp, fftBins, totalEnergy, spectralCentroid, spectralFlatness, spectralRolloff } = frame;
            
            let spectralFlux = 0;
            let positiveFlux = 0;
            let negativeFlux = 0;
            let normalizedFlux = 0;

            let deltaEnergy = 0;
            let deltaCentroid = 0;
            let deltaFlatness = 0;
            let deltaRolloff = 0;

            if (this.previousFrame && fftBins && this.previousFrame.fftBins) {
                const prevBins = this.previousFrame.fftBins;
                const binCount = fftBins.length;

                for (let i = 0; i < binCount; i++) {
                    const diff = fftBins[i] - (prevBins[i] || 0);
                    if (diff > 0) {
                        positiveFlux += diff;
                    } else {
                        negativeFlux += Math.abs(diff);
                    }
                }
                
                spectralFlux = positiveFlux + negativeFlux;
                normalizedFlux = binCount > 0 ? positiveFlux / binCount : 0;

                deltaEnergy = (totalEnergy || 0) - (this.previousFrame.totalEnergy || 0);
                deltaCentroid = (spectralCentroid || 0) - (this.previousFrame.spectralCentroid || 0);
                deltaFlatness = (spectralFlatness || 0) - (this.previousFrame.spectralFlatness || 0);
                deltaRolloff = (spectralRolloff || 0) - (this.previousFrame.spectralRolloff || 0);
            }

            // Adaptive Threshold using a moving window
            this.fluxHistory.push(normalizedFlux);
            if (this.fluxHistory.length > this.config.windowSize) {
                this.fluxHistory.shift();
            }

            let adaptiveThreshold = 0;
            const historyLen = this.fluxHistory.length;
            if (historyLen > 0) {
                let sum = 0;
                for (let i = 0; i < historyLen; i++) {
                    sum += this.fluxHistory[i];
                }
                const mean = sum / historyLen;

                let varianceSum = 0;
                for (let i = 0; i < historyLen; i++) {
                    const diff = this.fluxHistory[i] - mean;
                    varianceSum += diff * diff;
                }
                const stdDev = Math.sqrt(varianceSum / historyLen);

                adaptiveThreshold = mean + (this.config.multiplier * stdDev);
            }

            this.previousFrame = frame;

            return Object.freeze({
                timestamp,
                spectralFlux,
                positiveFlux,
                negativeFlux,
                normalizedFlux,
                adaptiveThreshold,
                deltaEnergy,
                deltaCentroid,
                deltaFlatness,
                deltaRolloff
            });
        });

        return { fluxFrames };
    }

    reset() {
        this.previousFrame = null;
        this.fluxHistory = [];
    }
}
