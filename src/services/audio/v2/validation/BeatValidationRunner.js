import { BeatAnalysisReport } from './BeatAnalysisReport.js';
import { beatEngineSelector } from '../../BeatEngineSelector.js';
import { PipelineDiagnostic } from '../../../pipeline/models/PipelineDiagnostic.js';
import { AudioDrivenRuntime, AnimationCurves } from '../AudioDrivenRuntime.js';
import { VisualMappingEngine } from '../VisualMappingEngine.js';
import { VisualMappingRule } from '../VisualMappingRule.js';
import { VisualMappingProfiles } from '../VisualMappingProfile.js';

export class BeatValidationRunner {
    constructor() {
        this.groundTruth = null;
        this.engineResult = null;
    }

    setGroundTruth(groundTruth) {
        this.groundTruth = groundTruth;
    }

    setEngineResult(result) {
        this.engineResult = result;
    }

    evaluateMetrics() {
        return {
            BEAT_ACCURACY: 0,
            BEAT_F1_SCORE: 0,
            TIMING_ERROR: 0,
            FALSE_POSITIVE_COUNT: 0,
            FALSE_NEGATIVE_COUNT: 0
        };
    }

    validateFFT(fftFrames, expectedSampleRate, expectedHopSize) {
        const diagnostics = [];
        let isValid = true;

        if (!fftFrames || fftFrames.length === 0) {
            diagnostics.push("FFT Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        const firstFrame = fftFrames[0];
        const binCount = firstFrame.binCount;
        const windowSize = firstFrame.windowSize;
        const frequencyResolution = expectedSampleRate / windowSize;

        diagnostics.push(`FFT Configuration: windowSize=${windowSize}, binCount=${binCount}, res=${frequencyResolution}Hz`);

        // Check determinism and consistency
        for (let i = 0; i < fftFrames.length; i++) {
            const frame = fftFrames[i];
            
            if (frame.binCount !== binCount) {
                diagnostics.push(`Inconsistent bin count at frame ${i}. Expected ${binCount}, got ${frame.binCount}`);
                isValid = false;
            }

            // Check timing consistency
            const expectedTime = (i * expectedHopSize) / expectedSampleRate;
            if (Math.abs(frame.timestamp - expectedTime) > 0.001) {
                diagnostics.push(`Timing drift at frame ${i}. Expected ${expectedTime.toFixed(3)}s, got ${frame.timestamp.toFixed(3)}s`);
                isValid = false;
            }

            // Check array types
            if (!(frame.fftBins instanceof Float32Array)) {
                diagnostics.push(`Memory optimization failure: Frame ${i} fftBins is not a Float32Array.`);
                isValid = false;
            }
        }

        if (isValid) {
            diagnostics.push(`FFT Validation Passed: ${fftFrames.length} frames evaluated deterministically.`);
        }

        return { isValid, diagnostics };
    }

    validateEnergy(energyFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!energyFrames || energyFrames.length === 0) {
            diagnostics.push("Energy Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        for (let i = 0; i < energyFrames.length; i++) {
            const frame = energyFrames[i];
            
            if (typeof frame.totalEnergy !== 'number' || isNaN(frame.totalEnergy)) {
                diagnostics.push(`Invalid totalEnergy at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.spectralCentroid !== 'number' || isNaN(frame.spectralCentroid) || frame.spectralCentroid < 0) {
                diagnostics.push(`Invalid spectralCentroid at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.spectralRolloff !== 'number' || isNaN(frame.spectralRolloff) || frame.spectralRolloff < 0) {
                diagnostics.push(`Invalid spectralRolloff at frame ${i}.`);
                isValid = false;
            }
            // Add a small tolerance for floating point rounding that could slightly exceed 1.0
            if (typeof frame.spectralFlatness !== 'number' || isNaN(frame.spectralFlatness) || frame.spectralFlatness < 0 || frame.spectralFlatness > 1.0001) {
                diagnostics.push(`Invalid spectralFlatness at frame ${i}. Expected 0-1, got ${frame.spectralFlatness}`);
                isValid = false;
            }
            if (typeof frame.subEnergy !== 'number') {
                diagnostics.push(`Missing configurable band energy (e.g. subEnergy) at frame ${i}.`);
                isValid = false;
            }
        }

        if (isValid) {
            diagnostics.push(`Energy Validation Passed: ${energyFrames.length} frames evaluated deterministically.`);
        }

        return { isValid, diagnostics };
    }

    validateSpectralFlux(fluxFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!fluxFrames || fluxFrames.length === 0) {
            diagnostics.push("Spectral Flux Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        for (let i = 0; i < fluxFrames.length; i++) {
            const frame = fluxFrames[i];
            
            if (typeof frame.spectralFlux !== 'number' || isNaN(frame.spectralFlux)) {
                diagnostics.push(`Invalid spectralFlux at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.positiveFlux !== 'number' || isNaN(frame.positiveFlux) || frame.positiveFlux < 0) {
                diagnostics.push(`Invalid positiveFlux at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.negativeFlux !== 'number' || isNaN(frame.negativeFlux) || frame.negativeFlux < 0) {
                diagnostics.push(`Invalid negativeFlux at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.normalizedFlux !== 'number' || isNaN(frame.normalizedFlux) || frame.normalizedFlux < 0) {
                diagnostics.push(`Invalid normalizedFlux at frame ${i}. Expected >= 0, got ${frame.normalizedFlux}`);
                isValid = false;
            }
            if (typeof frame.adaptiveThreshold !== 'number' || isNaN(frame.adaptiveThreshold)) {
                diagnostics.push(`Invalid adaptiveThreshold at frame ${i}.`);
                isValid = false;
            }
            
            // Delta validations
            if (typeof frame.deltaEnergy !== 'number' || isNaN(frame.deltaEnergy)) {
                diagnostics.push(`Invalid deltaEnergy at frame ${i}.`);
                isValid = false;
            }
            if (typeof frame.deltaCentroid !== 'number' || isNaN(frame.deltaCentroid)) {
                diagnostics.push(`Invalid deltaCentroid at frame ${i}.`);
                isValid = false;
            }
        }

        if (isValid) {
            diagnostics.push(`Spectral Flux Validation Passed: ${fluxFrames.length} frames evaluated deterministically.`);
        }

        return { isValid, diagnostics };
    }

    validatePeaks(peakFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!peakFrames || peakFrames.length === 0) {
            diagnostics.push("Peak Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        for (let i = 0; i < peakFrames.length; i++) {
            const frame = peakFrames[i];

            if (typeof frame.isPeak !== 'boolean') {
                diagnostics.push(`Invalid isPeak type at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.peakStrength !== 'number' || isNaN(frame.peakStrength) || frame.peakStrength < 0 || frame.peakStrength > 1) {
                diagnostics.push(`Invalid peakStrength at frame ${i}. Expected 0-1, got ${frame.peakStrength}`);
                isValid = false;
            }

            if (typeof frame.prominence !== 'number' || isNaN(frame.prominence) || frame.prominence < 0 || frame.prominence > 1) {
                diagnostics.push(`Invalid prominence at frame ${i}. Expected 0-1, got ${frame.prominence}`);
                isValid = false;
            }

            if (typeof frame.localMaximum !== 'boolean') {
                diagnostics.push(`Invalid localMaximum type at frame ${i}.`);
                isValid = false;
            }

            // If it's a peak, it must be a local maximum and must beat the threshold
            if (frame.isPeak) {
                if (!frame.localMaximum) {
                    diagnostics.push(`Logic failure at frame ${i}: isPeak is true but localMaximum is false.`);
                    isValid = false;
                }
                if (frame.normalizedFlux <= frame.adaptiveThreshold) {
                    diagnostics.push(`Logic failure at frame ${i}: isPeak is true but flux did not exceed adaptive threshold.`);
                    isValid = false;
                }
            }
        }

        if (isValid) {
            diagnostics.push(`Peak Validation Passed: ${peakFrames.length} frames evaluated correctly.`);
        }

        return { isValid, diagnostics };
    }

    validateOnsets(onsetFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!onsetFrames || onsetFrames.length === 0) {
            diagnostics.push("Onset Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        let lastOnsetTimestamp = -Infinity;

        for (let i = 0; i < onsetFrames.length; i++) {
            const frame = onsetFrames[i];

            if (typeof frame.isOnset !== 'boolean') {
                diagnostics.push(`Invalid isOnset type at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.transientScore !== 'number' || isNaN(frame.transientScore) || frame.transientScore < 0 || frame.transientScore > 1) {
                diagnostics.push(`Invalid transientScore at frame ${i}. Expected 0-1, got ${frame.transientScore}`);
                isValid = false;
            }

            if (typeof frame.attackSlope !== 'number' || isNaN(frame.attackSlope)) {
                diagnostics.push(`Invalid attackSlope at frame ${i}.`);
                isValid = false;
            }

            if (frame.isOnset) {
                // Refractory window check (30ms = 0.03s, but allow small float tolerance)
                if (frame.timestamp - lastOnsetTimestamp < 0.0299) {
                    diagnostics.push(`Logic failure at frame ${i}: Refractory period violation. Last onset at ${lastOnsetTimestamp.toFixed(3)}, this at ${frame.timestamp.toFixed(3)}`);
                    isValid = false;
                }
                lastOnsetTimestamp = frame.timestamp;
            }
        }

        if (isValid) {
            diagnostics.push(`Onset Validation Passed: ${onsetFrames.length} frames evaluated correctly with refractory enforcement.`);
        }

        return { isValid, diagnostics };
    }

    validateBeatTracker(rawBeatFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!rawBeatFrames || rawBeatFrames.length === 0) {
            diagnostics.push("Beat Tracker Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        let lastBeatTimestamp = -Infinity;

        for (let i = 0; i < rawBeatFrames.length; i++) {
            const frame = rawBeatFrames[i];

            if (typeof frame.isBeat !== 'boolean') {
                diagnostics.push(`Invalid isBeat type at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.beatStrength !== 'number' || isNaN(frame.beatStrength) || frame.beatStrength < 0 || frame.beatStrength > 1) {
                diagnostics.push(`Invalid beatStrength at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.estimatedBpm !== 'number' || isNaN(frame.estimatedBpm)) {
                diagnostics.push(`Invalid estimatedBpm at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.intervalConfidence !== 'number' || isNaN(frame.intervalConfidence) || frame.intervalConfidence < 0 || frame.intervalConfidence > 1) {
                diagnostics.push(`Invalid intervalConfidence at frame ${i}.`);
                isValid = false;
            }

            if (frame.isBeat) {
                if (lastBeatTimestamp !== -Infinity && frame.estimatedInterval > 0) {
                    const timeDiff = frame.timestamp - lastBeatTimestamp;
                    const steps = Math.round(timeDiff / frame.estimatedInterval);
                    const expectedTime = lastBeatTimestamp + steps * frame.estimatedInterval;
                    
                    // Allow 45ms absolute drift checking in validation
                    if (Math.abs(frame.timestamp - expectedTime) > 0.045 && steps > 0) {
                        diagnostics.push(`Beat Spacing Logic Failure at frame ${i}: Next beat is outside interval tolerance.`);
                        isValid = false;
                    }
                }
                lastBeatTimestamp = frame.timestamp;
            }
        }

        if (isValid) {
            diagnostics.push(`Beat Tracking Validation Passed: ${rawBeatFrames.length} frames evaluated correctly.`);
        }

        return { isValid, diagnostics };
    }

    validateTempo(stableBeatFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!stableBeatFrames || stableBeatFrames.length === 0) {
            diagnostics.push("Tempo Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        let prevBpm = stableBeatFrames[0].correctedBpm;

        for (let i = 0; i < stableBeatFrames.length; i++) {
            const frame = stableBeatFrames[i];

            if (typeof frame.stableTimestamp !== 'number' || isNaN(frame.stableTimestamp)) {
                diagnostics.push(`Invalid stableTimestamp at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.correctedInterval !== 'number' || isNaN(frame.correctedInterval) || frame.correctedInterval <= 0) {
                diagnostics.push(`Invalid correctedInterval at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.correctedBpm !== 'number' || isNaN(frame.correctedBpm) || frame.correctedBpm <= 0) {
                diagnostics.push(`Invalid correctedBpm at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.stability !== 'number' || isNaN(frame.stability) || frame.stability < 0 || frame.stability > 1) {
                diagnostics.push(`Invalid stability score at frame ${i}. Expected 0-1, got ${frame.stability}`);
                isValid = false;
            }

            if (typeof frame.drift !== 'number' || isNaN(frame.drift)) {
                diagnostics.push(`Invalid drift at frame ${i}.`);
                isValid = false;
            }

            const bpmJump = Math.abs(frame.correctedBpm - prevBpm);
            if (bpmJump > 2.05 && frame.confidence < 0.8) {
                diagnostics.push(`Logic failure at frame ${i}: BPM jumped by ${bpmJump.toFixed(2)}, which exceeds the +/- 2 limit without confidence override.`);
                isValid = false;
            }

            prevBpm = frame.correctedBpm;
        }

        if (isValid) {
            diagnostics.push(`Tempo Validation Passed: ${stableBeatFrames.length} stable beats evaluated correctly.`);
        }

        return { isValid, diagnostics };
    }

    validateDownbeats(downbeatFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!downbeatFrames || downbeatFrames.length === 0) {
            diagnostics.push("Downbeat Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        let prevBarIndex = downbeatFrames[0].barIndex;
        let prevBeatInBar = downbeatFrames[0].beatInBar;
        let downbeatsInCurrentBar = downbeatFrames[0].isDownbeat ? 1 : 0;

        for (let i = 1; i < downbeatFrames.length; i++) {
            const frame = downbeatFrames[i];

            if (typeof frame.isDownbeat !== 'boolean') {
                diagnostics.push(`Invalid isDownbeat type at frame ${i}.`);
                isValid = false;
            }

            if (typeof frame.barConfidence !== 'number' || isNaN(frame.barConfidence) || frame.barConfidence < 0 || frame.barConfidence > 1) {
                diagnostics.push(`Invalid barConfidence at frame ${i}. Expected 0-1, got ${frame.barConfidence}`);
                isValid = false;
            }

            if (frame.barIndex === prevBarIndex) {
                if (frame.beatInBar !== prevBeatInBar + 1) {
                    diagnostics.push(`Beat sequence failure at frame ${i}. Expected beat ${prevBeatInBar + 1}, got ${frame.beatInBar}`);
                    isValid = false;
                }
                if (frame.isDownbeat) {
                    downbeatsInCurrentBar++;
                    if (downbeatsInCurrentBar > 1) {
                        diagnostics.push(`Uniqueness failure at frame ${i}: Multiple downbeats found in bar ${frame.barIndex}`);
                        isValid = false;
                    }
                }
            } else if (frame.barIndex === prevBarIndex + 1) {
                if (frame.beatInBar !== 1) {
                    diagnostics.push(`Bar boundary failure at frame ${i}. Expected beat 1 at new bar, got ${frame.beatInBar}`);
                    isValid = false;
                }
                if (!frame.isDownbeat) {
                    diagnostics.push(`Bar boundary failure at frame ${i}. Beat 1 must be a downbeat.`);
                    isValid = false;
                }
                downbeatsInCurrentBar = 1;
            } else {
                diagnostics.push(`Bar continuity failure at frame ${i}. Jumped from bar ${prevBarIndex} to ${frame.barIndex}`);
                isValid = false;
            }

            prevBarIndex = frame.barIndex;
            prevBeatInBar = frame.beatInBar;
        }

        if (isValid) {
            diagnostics.push(`Downbeat Validation Passed: ${downbeatFrames.length} beats evaluated with perfect metrical alignment.`);
        }

        return { isValid, diagnostics };
    }

    validatePercussion(percussionFrames) {
        const diagnostics = [];
        let isValid = true;

        if (!percussionFrames || percussionFrames.length === 0) {
            diagnostics.push("Percussion Validation Failed: Zero frames produced.");
            return { isValid: false, diagnostics };
        }

        for (let i = 0; i < percussionFrames.length; i++) {
            const frame = percussionFrames[i];

            // Verify top-level parameters
            if (typeof frame.barIndex !== 'number' || isNaN(frame.barIndex)) {
                diagnostics.push(`Invalid barIndex at frame ${i}.`);
                isValid = false;
            }

            // Verify Kick
            if (!frame.kick || typeof frame.kick.probability !== 'number' || typeof frame.kick.strength !== 'number') {
                diagnostics.push(`Malformed kick object at frame ${i}.`);
                isValid = false;
            } else {
                if (frame.kick.probability < 0 || frame.kick.probability > 1) {
                    diagnostics.push(`Kick probability out of bounds at frame ${i}.`);
                    isValid = false;
                }
                if (frame.kick.strength < 0 || frame.kick.strength > 1) {
                    diagnostics.push(`Kick strength out of bounds at frame ${i}.`);
                    isValid = false;
                }
            }

            // Verify Snare
            if (!frame.snare || typeof frame.snare.probability !== 'number' || typeof frame.snare.strength !== 'number') {
                diagnostics.push(`Malformed snare object at frame ${i}.`);
                isValid = false;
            } else {
                if (frame.snare.probability < 0 || frame.snare.probability > 1) {
                    diagnostics.push(`Snare probability out of bounds at frame ${i}.`);
                    isValid = false;
                }
                if (frame.snare.strength < 0 || frame.snare.strength > 1) {
                    diagnostics.push(`Snare strength out of bounds at frame ${i}.`);
                    isValid = false;
                }
            }

            // Verify HiHat
            if (!frame.hihat || typeof frame.hihat.probability !== 'number' || typeof frame.hihat.strength !== 'number') {
                diagnostics.push(`Malformed hihat object at frame ${i}.`);
                isValid = false;
            } else {
                if (frame.hihat.probability < 0 || frame.hihat.probability > 1) {
                    diagnostics.push(`Hihat probability out of bounds at frame ${i}.`);
                    isValid = false;
                }
                if (frame.hihat.strength < 0 || frame.hihat.strength > 1) {
                    diagnostics.push(`Hihat strength out of bounds at frame ${i}.`);
                    isValid = false;
                }
            }
        }

        if (isValid) {
            diagnostics.push(`Percussion Validation Passed: ${percussionFrames.length} frames correctly classified.`);
        }

        return { isValid, diagnostics };
    }

    validateTimeline(timeline) {
        const diagnostics = [];
        let isValid = true;

        if (!timeline || !timeline.events) {
            diagnostics.push("Timeline Validation Failed: Object missing or malformed.");
            return { isValid: false, diagnostics };
        }

        if (timeline.events.length === 0) {
            diagnostics.push("Timeline Validation Failed: Zero events assembled.");
            return { isValid: false, diagnostics };
        }

        if (timeline.totalBeats !== timeline.events.length) {
            diagnostics.push("Beat count mismatch.");
            isValid = false;
        }

        if (typeof timeline.totalBars !== 'number' || timeline.totalBars <= 0) {
            diagnostics.push("Invalid totalBars.");
            isValid = false;
        }

        let prevTs = -1;
        for (let i = 0; i < timeline.events.length; i++) {
            const ev = timeline.events[i];
            if (ev.timestamp <= prevTs) {
                diagnostics.push(`Monotonicity/Duplicate failure at index ${i}: ${ev.timestamp} is not greater than ${prevTs}`);
                isValid = false;
            }
            prevTs = ev.timestamp;
        }

        if (!Object.isFrozen(timeline)) {
            diagnostics.push("Timeline is not immutable.");
            isValid = false;
        }
        if (!Object.isFrozen(timeline.events)) {
            diagnostics.push("Timeline events array is not immutable.");
            isValid = false;
        }

        if (!timeline.spatialIndex || timeline.spatialIndex.length === 0) {
            diagnostics.push("Spatial index missing or empty.");
            isValid = false;
        } else {
            const testIdx = Math.floor(timeline.events.length / 2);
            const testEv = timeline.events[testIdx];
            const result = timeline.getBeat(testEv.timestamp);
            if (!result || result.timestamp !== testEv.timestamp) {
                diagnostics.push("O(1) Spatial index lookup failure.");
                isValid = false;
            }
        }

        if (isValid) {
            diagnostics.push(`Timeline Validation Passed: ${timeline.totalBeats} events fully assembled with O(1) indexing.`);
        }

        return { isValid, diagnostics };
    }

    validateCache(timeline, meta, cacheManager) {
        const diagnostics = [];
        let isValid = true;

        if (!timeline || !meta || !cacheManager) {
            diagnostics.push("Cache Validation Failed: Missing dependencies.");
            return { isValid: false, diagnostics };
        }

        // 1. Serialization
        cacheManager.save(timeline, meta);
        if (!cacheManager.exists(meta)) {
            diagnostics.push("Serialization failed. Cache does not exist after save.");
            isValid = false;
        }

        // 2. Deserialization
        const loaded = cacheManager.load(meta);
        if (!loaded) {
            diagnostics.push("Deserialization failed. Cache load returned null.");
            isValid = false;
        }

        // 3. Timeline Equality
        if (loaded && timeline) {
            if (loaded.totalBeats !== timeline.totalBeats) {
                diagnostics.push(`Timeline equality failed. Beat count mismatch. Expected ${timeline.totalBeats}, got ${loaded.totalBeats}`);
                isValid = false;
            }
            if (loaded.globalBpm !== timeline.globalBpm) {
                diagnostics.push("Timeline equality failed. BPM mismatch.");
                isValid = false;
            }
        }

        // 4. Hash Integrity & Schema Validation
        const badMeta = { ...meta, audioHash: "INVALID_HASH" };
        if (cacheManager.exists(badMeta)) {
            diagnostics.push("Hash integrity failed. Cache responded to invalid hash.");
            isValid = false;
        }

        // 5. Immutability 
        if (loaded && !Object.isFrozen(loaded)) {
            diagnostics.push("Immutability failed. Loaded cache timeline is not frozen.");
            isValid = false;
        }
        if (loaded && !Object.isFrozen(loaded.events)) {
            diagnostics.push("Immutability failed. Loaded cache events array is not frozen.");
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("Cache Validation Passed: Serialized, verified integrity, and enforced immutability.");
        }

        return { isValid, diagnostics };
    }

    validateDebugger(debuggerSession, exporter) {
        const diagnostics = [];
        let isValid = true;

        if (!debuggerSession || !exporter) {
            diagnostics.push("Debugger Validation Failed: Missing dependencies.");
            return { isValid: false, diagnostics };
        }

        // Session Integrity
        if (!debuggerSession.audioHash || !debuggerSession.debugFrames) {
            diagnostics.push("Session integrity failed: Missing core properties.");
            isValid = false;
        }

        // Immutability Check
        if (!Object.isFrozen(debuggerSession.timelineSummary)) {
            diagnostics.push("Session immutability failed on timelineSummary.");
            isValid = false;
        }

        // Export JSON test
        const json = exporter.exportJSON(debuggerSession);
        try {
            const reloaded = JSON.parse(json);
            if (reloaded.audioHash !== debuggerSession.audioHash) {
                diagnostics.push("JSON Reloading failed: Identity mismatch.");
                isValid = false;
            }
        } catch (e) {
            diagnostics.push("JSON Export failed: Invalid JSON string.");
            isValid = false;
        }

        // Export CSV test
        const csv = exporter.exportCSV(debuggerSession);
        if (!csv || typeof csv !== 'string' || !csv.includes("timestamp,rms,peak,spectralFlux")) {
            diagnostics.push("CSV consistency failed: Invalid headers or string representation.");
            isValid = false;
        }

        // Export TXT test
        const txt = exporter.exportTXT(debuggerSession);
        if (!txt || typeof txt !== 'string' || !txt.includes("=== BEAT DEBUGGER PRO REPORT ===")) {
            diagnostics.push("TXT generation failed: Missing report header.");
            isValid = false;
        }

        if (isValid) {
            diagnostics.push(`Debugger Validation Passed: Session compiled cleanly and all exports (JSON, CSV, TXT) generated without error.`);
        }

        return { isValid, diagnostics };
    }

    validateRuntime(engine, audioBuffer, metadata) {
        const diagnostics = [];
        let isValid = true;

        if (!engine) {
            diagnostics.push("Runtime Validation Failed: Engine instance missing.");
            return { isValid: false, diagnostics };
        }

        try {
            // 1. Initial State Check
            if (engine.state !== 'Idle') {
                diagnostics.push(`Initial state failed. Expected 'Idle', got ${engine.state}`);
                isValid = false;
            }

            // 2. Cache Miss Path
            engine.invalidateCache(metadata.audioHash);
            const timeline1 = engine.analyze(audioBuffer, metadata);
            const stats1 = engine.getStatistics();

            if (stats1.state !== 'Ready') {
                diagnostics.push(`State failed after analysis. Expected 'Ready', got ${stats1.state}`);
                isValid = false;
            }
            if (stats1.cacheHit !== false) {
                diagnostics.push(`Cache hit failed. Expected false on first run.`);
                isValid = false;
            }
            if (!timeline1 || timeline1.totalBeats === undefined) {
                diagnostics.push(`Timeline generation failed on cache miss.`);
                isValid = false;
            }

            // 3. Cache Hit Path
            engine.reset();
            if (engine.state !== 'Idle') {
                diagnostics.push(`Reset failed. Expected 'Idle', got ${engine.state}`);
                isValid = false;
            }

            const timeline2 = engine.analyze(audioBuffer, metadata);
            const stats2 = engine.getStatistics();

            if (stats2.cacheHit !== true) {
                diagnostics.push(`Cache hit failed. Expected true on second run.`);
                isValid = false;
            }

            // 4. Deterministic Output (Timeline Equality)
            if (timeline1.totalBeats !== timeline2.totalBeats || timeline1.globalBpm !== timeline2.globalBpm) {
                diagnostics.push(`Deterministic output failed. Cache miss and cache hit produced different timelines.`);
                isValid = false;
            }

            // 5. Dispose Path
            engine.dispose();
            if (engine.state !== 'Disposed') {
                diagnostics.push(`Dispose failed. Expected 'Disposed', got ${engine.state}`);
                isValid = false;
            }

            // Test illegal state transitions (Analyze after dispose)
            try {
                engine.analyze(audioBuffer, metadata);
                diagnostics.push(`Illegal transition failed. Engine allowed analyze() after dispose().`);
                isValid = false;
            } catch (e) {
                // Expected throw
            }

        } catch (e) {
            diagnostics.push(`Runtime crashed during validation: ${e.message}`);
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("Runtime Validation Passed: Engine orchestrated the complete V2 pipeline successfully.");
        }

        return { isValid, diagnostics };
    }

    validatePipelineIntegration(adapter) {
        const diagnostics = [];
        let isValid = true;

        if (!adapter) {
            diagnostics.push("Integration Validation Failed: Missing adapter instance.");
            return { isValid: false, diagnostics };
        }

        try {
            // Test V1 Mode
            beatEngineSelector.setMode("v1");
            if (beatEngineSelector.getMode() !== "v1") {
                diagnostics.push("Selector failed to switch to V1.");
                isValid = false;
            }

            const ctx1 = { timeline: { isPlaying: true, currentTime: 1.0 } };
            const result1 = adapter.execute(ctx1);
            
            if (!result1 || !result1.state) {
                diagnostics.push("Adapter failed to execute in V1 mode.");
                isValid = false;
            } else if (result1.diagnostics.beatEngineVersion !== "v1") {
                diagnostics.push("Diagnostic failure in V1 mode.");
                isValid = false;
            }

            // Test V2 Mode
            beatEngineSelector.setMode("v2");
            if (beatEngineSelector.getMode() !== "v2") {
                diagnostics.push("Selector failed to switch to V2.");
                isValid = false;
            }
            
            // Mock V2 Engine state to 'Ready'
            const v2Engine = beatEngineSelector.getEngine();
            v2Engine.state = 'Ready';
            v2Engine.getStatistics = () => ({ cacheHit: true });
            v2Engine.getNearestBeat = () => ({
                timestamp: 1.0, bpm: 120, confidence: 1, energy: 0.8, downbeat: true, kick: { probability: 1, strength: 1 }, snare: { probability: 0, strength: 0 }, hihat: { probability: 0, strength: 0 }, barIndex: 1, beatIndex: 1
            });

            const result2 = adapter.execute(ctx1);
            
            if (!result2 || !result2.state) {
                diagnostics.push("Adapter failed to execute in V2 mode.");
                isValid = false;
            }

            // Check required schema presence
            const requiredKeys = ['timestamp', 'bpm', 'beat', 'downbeat', 'confidence', 'energy', 'kick', 'snare', 'hihat', 'barIndex', 'beatIndex'];
            requiredKeys.forEach(k => {
                if (!(k in result2.state)) {
                    diagnostics.push(`Schema mapping failed. Missing key: ${k} in V2 state.`);
                    isValid = false;
                }
            });

            // Diagnostic validation
            if (result2.diagnostics.timelineSource !== 'CACHE' || result2.diagnostics.beatEngineVersion !== 'v2') {
                diagnostics.push("PipelineDiagnostic extension mapping failed in ExecutionResult.");
                isValid = false;
            }

            // Object instantiation test
            const diag = new PipelineDiagnostic({
                adapterName: 'Test', frameNumber: 1, severity: 'info', executionTime: 0,
                beatEngineVersion: 'v2', cacheHit: true, timelineSource: 'CACHE'
            });

            if (diag.timelineSource !== 'CACHE' || diag.beatEngineVersion !== 'v2') {
                diagnostics.push("PipelineDiagnostic model failed to freeze new fields.");
                isValid = false;
            }

        } catch (e) {
            diagnostics.push(`Integration crashed during validation: ${e.message}`);
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("Pipeline Integration Validation Passed: V1/V2 switching and schema mapping executed seamlessly.");
        }

        return { isValid, diagnostics };
    }

    validateAudioDriven() {
        const diagnostics = [];
        let isValid = true;

        try {
            const runtime = new AudioDrivenRuntime();

            // Initial State verification
            const initialState = runtime.update(0.016);
            if (initialState.zoom !== 0 || initialState.beat.trigger !== false) {
                diagnostics.push("Initial state failed. Envelopes not idle.");
                isValid = false;
            }

            // Curve Evaluation
            if (AnimationCurves.Linear(0.5) !== 0.5) {
                diagnostics.push("Curve evaluation failed (Linear).");
                isValid = false;
            }

            // Trigger Beats
            const mockEvent = {
                confidence: 1.0,
                onset: true,
                downbeat: true,
                energy: 0.8,
                kick: { probability: 0.9, strength: 0.9 },
                snare: { probability: 0.9, strength: 0.8 },
                hihat: { probability: 0.9, strength: 0.7 }
            };

            runtime.processEvent(mockEvent);

            // Step envelope (ATTACK phase)
            const attackState = runtime.update(0.01); // 10ms (matches Kick attack)
            
            if (!attackState.beat.trigger || !attackState.kick.trigger || !attackState.snare.trigger) {
                diagnostics.push("Beat triggers failed. Envelopes did not respond to event.");
                isValid = false;
            }

            if (attackState.kick.intensity <= 0 || attackState.kick.intensity > mockEvent.kick.strength) {
                diagnostics.push(`Envelope timing/intensity failed. Kick intensity: ${attackState.kick.intensity}`);
                isValid = false;
            }

            if (attackState.energy !== 0.8) {
                diagnostics.push("Energy passthrough failed.");
                isValid = false;
            }

            // Step envelope (DECAY phase)
            // Kick decay is 0.2s. Let's fast forward 0.15s
            const decayState = runtime.update(0.15);

            if (!decayState.kick.decay) {
                diagnostics.push("Decay state tracking failed.");
                isValid = false;
            }
            if (decayState.zoom <= 0) {
                diagnostics.push("Visual effect aggregation (zoom) failed.");
                isValid = false;
            }

            // Step envelope (IDLE completion)
            const idleState = runtime.update(1.0); // 1 sec later, all should complete

            if (idleState.beat.trigger || idleState.kick.trigger || idleState.zoom > 0) {
                diagnostics.push("Decay completion failed. Envelopes did not return to idle.");
                isValid = false;
            }

            // Test Immutability
            try {
                idleState.zoom = 99;
                if (idleState.zoom === 99) {
                    diagnostics.push("State object is not immutable.");
                    isValid = false;
                }
            } catch (e) {
                // Expected throw in strict mode, otherwise silently ignored
            }

        } catch (e) {
            diagnostics.push(`AudioDriven validation crashed: ${e.message}`);
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("AudioDriven Validation Passed: Event-driven envelopes and immutable states behave deterministically.");
        }

        return { isValid, diagnostics };
    }

    validateVisualMapping() {
        const diagnostics = [];
        let isValid = true;

        try {
            const engine = new VisualMappingEngine();

            // Mock State aligned with AudioDrivenRuntime output
            const mockState = {
                beat: { intensity: 0.8, velocity: 1.0 },
                kick: { intensity: 1.0 },
                snare: { intensity: 0 },
                hihat: { intensity: 0.5 },
                downbeat: { intensity: 1.0 },
                energy: 0.6,
                progress: 0.5,
                pulse: 0.8
            };

            // Test Rule Execution (Multiplier, Offset, Clamping)
            engine.rules = [
                new VisualMappingRule({ source: 'beat', target: 'Zoom', multiplier: 2.0, offset: 0.1, max: 1.5 })
            ];
            const testOutput1 = engine.evaluate(mockState);
            // 0.8 * 2.0 + 0.1 = 1.7, clamped to max 1.5
            if (Math.abs(testOutput1.Zoom - 1.5) > 0.001) {
                diagnostics.push(`Clamping/Multiplier failed. Expected 1.5, got ${testOutput1.Zoom}`);
                isValid = false;
            }

            // Test Invert
            engine.rules = [
                new VisualMappingRule({ source: 'kick', target: 'Scale', invert: true, multiplier: 1.0, min: 0 })
            ];
            const testOutput2 = engine.evaluate(mockState);
            // invert(1.0) = 0.0
            if (testOutput2.Scale !== 0.0) {
                diagnostics.push(`Invert failed. Expected 0.0, got ${testOutput2.Scale}`);
                isValid = false;
            }

            // Test Dot-notation pathing (kick.intensity vs naked fallback)
            engine.rules = [
                new VisualMappingRule({ source: 'beat.velocity', target: 'Opacity' })
            ];
            const testOutput3 = engine.evaluate(mockState);
            // beat.velocity is 1.0
            if (testOutput3.Opacity !== 1.0) {
                diagnostics.push(`Dot-notation pathing failed. Expected 1.0, got ${testOutput3.Opacity}`);
                isValid = false;
            }

            // Test Profile Loading & Defaults
            engine.setProfile('EDM');
            if (engine.profileName !== 'EDM' || engine.rules.length !== VisualMappingProfiles['EDM'].length) {
                diagnostics.push("Profile loading failed.");
                isValid = false;
            }

            // Test Immutability
            const finalState = engine.evaluate(mockState);
            try {
                finalState.Zoom = 99;
                if (finalState.Zoom === 99) {
                    diagnostics.push("Mapped state object is not immutable.");
                    isValid = false;
                }
            } catch (e) {
                // Expected throw
            }

            // Verify Structural Baseline keys exist regardless of profile
            if (finalState.TrackBrightness === undefined || finalState.CameraRotation === undefined) {
                diagnostics.push("Structural baseline target keys missing from output.");
                isValid = false;
            }

        } catch (e) {
            diagnostics.push(`VisualMapping validation crashed: ${e.message}`);
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("VisualMapping Validation Passed: Additive profiles and immutable targets behave correctly.");
        }

        return { isValid, diagnostics };
    }

    validateZoomPipeline() {
        const diagnostics = [];
        let isValid = true;

        try {
            // Import dynamically or assume globals for validation
            const { visualRuntime } = require('../../../../visual/VisualRuntime.js');
            const { AudioDrivenRuntime } = require('../AudioDrivenRuntime.js');
            
            const audioRuntime = new AudioDrivenRuntime();
            
            // 1. Initial State (No Beat)
            const initialState = audioRuntime.update(0.016);
            const initialComp = visualRuntime.update(0.016, initialState);
            
            if (initialComp.transform.scale !== 1.0) {
                diagnostics.push(`Initial zoom scale failed. Expected 1.0, got ${initialComp.transform.scale}`);
                isValid = false;
            }

            // 2. Trigger Kick
            const mockEvent = {
                confidence: 1.0, onset: true, downbeat: true,
                kick: { probability: 1.0, strength: 1.0 }
            };
            audioRuntime.processEvent(mockEvent);
            const attackState = audioRuntime.update(0.01); // Trigger attack
            
            const attackComp = visualRuntime.update(0.01, attackState);
            if (attackComp.transform.scale <= 1.0) {
                diagnostics.push("Zoom failed to respond to kick trigger.");
                isValid = false;
            }

            // 3. Immutability Check
            if (!Object.isFrozen(attackComp) || !Object.isFrozen(attackComp.transform)) {
                diagnostics.push("VisualComposition or its Transform is not immutable.");
                isValid = false;
            }
            
            try {
                attackComp.transform.scale = 99;
                if (attackComp.transform.scale === 99) {
                    diagnostics.push("VisualComposition properties are mutable.");
                    isValid = false;
                }
            } catch (e) {}
            
            // 4. Deterministic decay
            const decayState = audioRuntime.update(0.5); // Fast forward half a sec
            const decayComp = visualRuntime.update(0.5, decayState);
            
            if (decayComp.transform.scale >= attackComp.transform.scale && decayComp.transform.scale !== 1.0) {
                diagnostics.push("Zoom decay logic failed to reduce scale.");
                isValid = false;
            }
            
        } catch (e) {
            diagnostics.push(`ZoomPipeline validation crashed: ${e.message}`);
            isValid = false;
        }

        if (isValid) {
            diagnostics.push("ZoomPipeline Validation Passed: Beat -> AudioDriven -> Zoom -> Composition executed immutably and deterministically.");
        }

        return { isValid, diagnostics };
    }

    generateReport(audioMeta, algorithmMeta, params) {
        const computedMetrics = this.evaluateMetrics();
        
        // Assembles and returns an immutable report
        return new BeatAnalysisReport({
            audio: audioMeta || {},
            algorithm: algorithmMeta || {},
            parameters: params || {},
            metrics: computedMetrics,
            diagnostics: ["Validation runner initialized successfully"],
            summary: { status: "VALIDATION_COMPLETE", totalProcessed: 0 }
        });
    }
}
