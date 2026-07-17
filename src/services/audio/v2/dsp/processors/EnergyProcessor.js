export class EnergyProcessor {
    constructor() {
        this.config = {
            bands: {
                sub: [20, 60],
                bass: [60, 250],
                lowMid: [250, 500],
                mid: [500, 2000],
                upperMid: [2000, 4000],
                presence: [4000, 6000],
                high: [6000, 20000]
            },
            rolloffPercentile: 0.85
        };
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
        if (config.bands) {
            this.config.bands = { ...this.config.bands, ...config.bands };
        }
    }

    _freqToBin(freq, resolution) {
        return Math.max(0, Math.round(freq / resolution));
    }

    process(inputFrame) {
        const frames = Array.isArray(inputFrame) ? inputFrame : 
                       (inputFrame.frames ? inputFrame.frames : [inputFrame]);
                       
        if (!frames || frames.length === 0 || !frames[0].fftBins) {
            return { energyFrames: [] };
        }

        const energyFrames = frames.map(frame => {
            const { timestamp, fftBins, frequencyResolution } = frame;
            const binCount = fftBins.length;
            
            let totalEnergy = 0;
            let sumOfSquares = 0;
            let geometricMeanLogSum = 0;
            let centroidNumerator = 0;
            let nonZeroBins = 0;

            for (let i = 0; i < binCount; i++) {
                const mag = fftBins[i];
                const power = mag * mag;
                
                totalEnergy += mag;
                sumOfSquares += power;
                
                const freq = i * frequencyResolution;
                centroidNumerator += freq * mag;
                
                if (power > 1e-10) { // prevent log(0)
                    geometricMeanLogSum += Math.log(power);
                    nonZeroBins++;
                }
            }

            const rms = Math.sqrt(sumOfSquares / binCount);
            const spectralCentroid = totalEnergy > 0 ? centroidNumerator / totalEnergy : 0;
            
            let spectralFlatness = 0;
            if (nonZeroBins > 0) {
                const geometricMean = Math.exp(geometricMeanLogSum / nonZeroBins);
                const arithmeticMean = sumOfSquares / binCount; 
                if (arithmeticMean > 0) {
                    spectralFlatness = geometricMean / arithmeticMean;
                }
            }

            let spectralRolloff = 0;
            const rolloffThreshold = totalEnergy * this.config.rolloffPercentile;
            let cumulativeEnergy = 0;
            for (let i = 0; i < binCount; i++) {
                cumulativeEnergy += fftBins[i];
                if (cumulativeEnergy >= rolloffThreshold) {
                    spectralRolloff = i * frequencyResolution;
                    break;
                }
            }

            const frameOutput = {
                timestamp,
                fftBins, // Pass through for SpectralFluxProcessor
                totalEnergy,
                rmsEnergy: rms,
                spectralCentroid,
                spectralRolloff,
                spectralFlatness
            };

            for (const [bandName, [lowFreq, highFreq]] of Object.entries(this.config.bands)) {
                const startBin = this._freqToBin(lowFreq, frequencyResolution);
                const endBin = Math.min(binCount - 1, this._freqToBin(highFreq, frequencyResolution));
                
                let bandEnergy = 0;
                for (let i = startBin; i <= endBin; i++) {
                    bandEnergy += fftBins[i];
                }
                
                frameOutput[`${bandName}Energy`] = bandEnergy;
            }

            return Object.freeze(frameOutput);
        });

        return { energyFrames };
    }

    reset() {}
}
