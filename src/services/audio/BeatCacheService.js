import {
    FFTAnalyzer,
    BandExtractor,
    EnvelopeBank,
    BeatDetector,
    BeatClassifier,
    AudioFeatureExtractor,
    HypothesisTempoEstimator
} from './AudioDSP';

class BeatCacheService {
    /**
     * Analyze an AudioBuffer offline and return an AnalysisCache.
     * @param {AudioBuffer} audioBuffer
     * @param {string} hash
     * @returns {Promise<object>} AnalysisCache
     */
    async analyze(audioBuffer, hash) {
        const sr = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;
        const oac = new OfflineAudioContext(1, audioBuffer.length, sr);

        const source = oac.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = oac.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8; // standard default

        // We use a ScriptProcessorNode to tap into the render loop block-by-block.
        // It's the most reliable way to pull AnalyserNode data synchronously in an OfflineAudioContext.
        const bufferSize = 512;
        const processor = oac.createScriptProcessor(bufferSize, 1, 1);

        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(oac.destination);

        // Isolated instances
        const fft = new FFTAnalyzer();
        fft.setSource(analyser);
        const extractor = new BandExtractor();
        const envBank = new EnvelopeBank();
        const features = new AudioFeatureExtractor();
        const detector = new BeatDetector();
        const classifier = new BeatClassifier();
        const tempo = new HypothesisTempoEstimator();

        // Outputs
        const events = [];
        const featuresLog = [];

        // State
        let sampleCount = 0;
        let lastFeatureTime = -1;

        processor.onaudioprocess = (e) => {
            const time = sampleCount / sr;
            const dt = bufferSize / sr;
            sampleCount += bufferSize;

            // Step 1: FFT
            fft.update(true, 1.0);

            // Step 2: Band Extraction
            extractor.extract(fft.dataArray, fft.getBinWidth());
            const raw = extractor.result;

            // Step 3: Envelopes
            envBank.apply('master',  raw.master,  dt, 10,  100, 1.0);
            envBank.apply('peak',    raw.peak,    dt, 10,  100, 1.0);
            envBank.apply('kick',    raw.kick,    dt, 5,   50,  1.0);
            envBank.apply('bass',    raw.bass,    dt, 20,  180, 1.0);
            envBank.apply('lowMid',  raw.lowMid,  dt, 20,  180, 1.0);
            envBank.apply('mid',     raw.mid,     dt, 20,  180, 1.0);
            envBank.apply('highMid', raw.highMid, dt, 20,  180, 1.0);
            envBank.apply('treble',  raw.treble,  dt, 10,  150, 1.0);
            envBank.apply('vocal',   raw.vocal,   dt, 30,  250, 1.0);
            envBank.apply('energy',  raw.energy,  dt, 50,  500, 1.0);

            // Step 4: Audio Features
            features.extract(fft.dataArray, fft.getTimeDomainRms(), raw, fft.getBinWidth());
            const feat = features.result;

            // Step 5: Beat Detection
            const nowMs = time * 1000;
            detector.detect(feat.rms, nowMs, 1.0);
            const dr = detector.result;

            // Step 6: Classifier
            if (dr.beat) {
                classifier.classify(raw);
            }
            const cr = classifier.result;

            // Step 7: Tempo Estimator
            if (dr.beat) tempo.addInterval(dr.interval, nowMs);
            tempo.estimate();
            tempo.updatePhase(nowMs);
            const tr = tempo.result;

            // Capture Event
            if (dr.beat) {
                events.push({
                    time: time,
                    type: cr.type,
                    strength: dr.strength,
                    bpm: tr.bpm,
                    beatPhase: 0,
                    kickScore: cr.kickScore,
                    snareScore: cr.snareScore,
                    hatScore: cr.hatScore
                });
            }

            // Capture Features every 1 second
            if (Math.floor(time) > lastFeatureTime) {
                lastFeatureTime = Math.floor(time);
                featuresLog.push({
                    time: lastFeatureTime,
                    energy: feat.energy,
                    peak: feat.peak,
                    rms: feat.rms,
                    dynamicRange: feat.dynamicRange,
                    spectralCentroid: feat.spectralCentroid,
                    crestFactor: feat.crestFactor,
                    brightness: feat.brightness,
                    isSilence: feat.isSilence,
                    density: feat.density
                });
            }
        };

        source.start(0);
        await oac.startRendering();

        // Disconnect
        source.disconnect();
        analyser.disconnect();
        processor.disconnect();

        // Build Cache Object
        return {
            version: 2,
            audioHash: hash,
            createdAt: Date.now(),
            duration: duration,
            sampleRate: sr,
            bpm: tempo.result.bpm,
            bpmConfidence: tempo.result.confidence,
            timeSignature: 4,
            events: events,
            features: featuresLog,
            spectrum: null,
            reactiveChannels: null,
            subtitleTiming: null,
            whisperRef: null
        };
    }
}

export const beatCacheService = new BeatCacheService();
