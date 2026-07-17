import { Preprocessor } from './processors/Preprocessor.js';
import { FFTProcessor } from './processors/FFTProcessor.js';
import { EnergyProcessor } from './processors/EnergyProcessor.js';
import { SpectralFluxProcessor } from './processors/SpectralFluxProcessor.js';
import { PeakDetector } from './processors/PeakDetector.js';
import { OnsetDetector } from './processors/OnsetDetector.js';
import { BeatTracker } from './processors/BeatTracker.js';
import { TempoStabilizer } from './processors/TempoStabilizer.js';
import { DownbeatDetector } from './processors/DownbeatDetector.js';
import { PercussionClassifier } from './processors/PercussionClassifier.js';

export class DSPPipeline {
    constructor() {
        this.preprocessor = new Preprocessor();
        this.fftProcessor = new FFTProcessor();
        this.energyProcessor = new EnergyProcessor();
        this.spectralFluxProcessor = new SpectralFluxProcessor();
        this.peakDetector = new PeakDetector();
        this.onsetDetector = new OnsetDetector();
        this.beatTracker = new BeatTracker();
        this.tempoStabilizer = new TempoStabilizer();
        this.downbeatDetector = new DownbeatDetector();
        this.percussionClassifier = new PercussionClassifier();
    }

    initialize(config = {}) {
        this.preprocessor.initialize(config);
        this.fftProcessor.initialize(config);
        this.energyProcessor.initialize(config);
        this.spectralFluxProcessor.initialize(config);
        this.peakDetector.initialize(config);
        this.onsetDetector.initialize(config);
        this.beatTracker.initialize(config);
        this.tempoStabilizer.initialize(config);
        this.downbeatDetector.initialize(config);
        this.percussionClassifier.initialize(config);
    }

    process(audioBuffer) {
        // Locked execution order ensuring deterministic sequential processing
        const pcmData = this.preprocessor.process(audioBuffer);
        const fftFrames = this.fftProcessor.process(pcmData);
        const energyFrames = this.energyProcessor.process(fftFrames);
        const spectralFluxFrames = this.spectralFluxProcessor.process(energyFrames);
        const peakFrames = this.peakDetector.process(spectralFluxFrames);
        const onsetFrames = this.onsetDetector.process(peakFrames);
        const rawBeatFrames = this.beatTracker.process(onsetFrames);
        const stableBeatFrames = this.tempoStabilizer.process(rawBeatFrames);
        const downbeatFrames = this.downbeatDetector.process(stableBeatFrames);
        const percussionFrames = this.percussionClassifier.process(downbeatFrames, energyFrames);

        return {
            fftFrames,
            energyFrames,
            spectralFluxFrames,
            peakFrames,
            onsetFrames,
            rawBeatFrames,
            stableBeatFrames,
            downbeatFrames,
            percussionFrames
        };
    }

    reset() {
        this.preprocessor.reset();
        this.fftProcessor.reset();
        this.energyProcessor.reset();
        this.spectralFluxProcessor.reset();
        this.peakDetector.reset();
        this.onsetDetector.reset();
        this.beatTracker.reset();
        this.tempoStabilizer.reset();
        this.downbeatDetector.reset();
        this.percussionClassifier.reset();
    }
}
