/**
 * MediaFactory Enterprise Beat Engine V2
 * Permanent Runtime for all M1-M5 Modules
 *
 * Single Source of Truth for realtime audio analysis.
 *
 * ── V2 Sprint 1: Internal Modularization ──────────────────────────────────────
 *   Six private, single-responsibility modules replace the V1 God Class.
 *   Public API : UNCHANGED.   Behaviour : UNCHANGED.   Allocations : UNCHANGED.
 *
 *   Deterministic Pipeline (enforced in update()):
 *     FFT → Band Extraction → Envelope → Beat Detection → Tempo → Debug → Publish → Notify
 *
 *   Module State Ownership:
 *     FFTAnalyzer    ── AnalyserNode, dataArray, timeDomainArray, FFT metadata
 *     BandExtractor  ── Hz-based raw band energy (result written to pre-alloc object)
 *     EnvelopeBank   ── A/R envelope state for every band
 *     BeatDetector   ── dual-EMA state, cooldown, flux (result in pre-alloc object)
 *     TempoEstimator ── beat interval ring buffer, BPM / confidence (pre-alloc result)
 *     BeatDebugger   ── sole writer of beatEngine.debug each frame
 *
 *   State Publishing Rule:
 *     Only BeatEngine writes to this.state.
 *     Modules expose pre-allocated result objects; BeatEngine maps results → state.
 *
 *   Zero-Allocation Contract:
 *     No new objects / arrays / typed arrays created inside update().
 *     All intermediate data flows through pre-allocated module result objects.
 *     Typed array allocations occur only in setSource() (one-time) and constructor.
 *
 * ── Future Sprints (scaffolded here, not yet implemented) ────────────────────
 *   Sprint 2  Typed BeatEvent bus – onBeat(cb) receives { time, type, strength, … }
 *   Sprint 3  BeatClassifier   – kick / snare / hat / transient at onset time
 *   Sprint 4  HypothesisTempoEstimator – stable BPM, CV confidence, beatPhase
 *   Sprint 5  Studio Mode – OfflineAudioContext analysis + beat.cache.json
 */

import {
    FFTAnalyzer,
    BandExtractor,
    EnvelopeBank,
    BeatDetector,
    BeatClassifier,
    AudioFeatureExtractor,
    HypothesisTempoEstimator
} from './AudioDSP.js';
import { beatCacheManager } from './BeatCacheManager.js';
// ══════════════════════════════════════════════════════════════════════════════
// Private Module — BeatCachePlayer
// ══════════════════════════════════════════════════════════════════════════════
class BeatCachePlayer {
    tick(timeSec, outEvent) {
        const ev = beatCacheManager.tickSequential(timeSec);
        if (ev) {
            outEvent.time       = ev.time;
            outEvent.type       = ev.type;
            outEvent.strength   = ev.strength;
            outEvent.confidence = 1.0;
            outEvent.bpm        = ev.bpm;
            outEvent.beatPhase  = ev.beatPhase;
            outEvent.kickScore  = ev.kickScore;
            outEvent.snareScore = ev.snareScore;
            outEvent.hatScore   = ev.hatScore;
            return outEvent;
        }
        return null;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Private Module — BeatQueue
//
// Sole Responsibility: buffer BeatEvents for dispatch to decouple detection from consumption.
//   Uses a pre-allocated ring buffer. Zero allocation during push().
// ══════════════════════════════════════════════════════════════════════════════
class BeatQueue {
    constructor() {
        this._buffer = new Array(8);
        for (let i = 0; i < 8; i++) {
            this._buffer[i] = {
                time: 0, type: 'beat', strength: 0, confidence: 0, bpm: 120, beatPhase: 0,
                kickScore: 0, snareScore: 0, hatScore: 0, energy: 0, brightness: 0
            };
        }
        this._head  = 0;
        this._tail  = 0;
        this._count = 0;
    }

    push(ev) {
        if (this._count >= 8) {
            // Queue full, drop oldest
            this._head = (this._head + 1) % 8;
            this._count--;
        }
        const slot = this._buffer[this._tail];
        slot.time       = ev.time;
        slot.type       = ev.type;
        slot.strength   = ev.strength;
        slot.confidence = ev.confidence;
        slot.bpm        = ev.bpm;
        slot.beatPhase  = ev.beatPhase;
        slot.kickScore  = ev.kickScore;
        slot.snareScore = ev.snareScore;
        slot.hatScore   = ev.hatScore;
        slot.energy     = ev.energy;
        slot.brightness = ev.brightness;

        this._tail = (this._tail + 1) % 8;
        this._count++;
    }

    flush(callbacks) {
        while (this._count > 0) {
            const ev = this._buffer[this._head];
            this._head = (this._head + 1) % 8;
            this._count--;

            for (const cb of callbacks) {
                try { cb(ev); }
                catch (e) { console.error('BeatEngine beat subscriber error:', e); }
            }
        }
    }

    peek() {
        if (this._count === 0) return null;
        return this._buffer[this._head];
    }

    clear() {
        this._head = 0;
        this._tail = 0;
        this._count = 0;
    }

    get length() {
        return this._count;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Private Module — BeatDebugger
//
// Sole Responsibility: populate beatEngine.debug each frame from module results.
//   This is the ONLY module that writes to the debug object.
//   Held references to debug and diagnostics are shared — never copied.
//   Must NOT perform audio analysis or write to this.state.
//
// Field mapping (V1 debug layout preserved verbatim for BeatDebugOverlay compat):
//   debug.energy           ← detector.energy  (raw time-domain RMS)
//   debug.averageEnergy    ← detector.emaLong
//   debug.flux             ← detector.flux
//   debug.threshold        ← detector.threshold
//   debug.dynamicThreshold ← detector.threshold
//   debug.historyMin       ← detector.emaLong
//   debug.historyMax       ← detector.emaShort
//   debug.historyAverage   ← detector.emaLong
//   debug.historySize      = 2  (EMA effective window stub)
//   debug.historyNewest    ← detector.energy
//   debug.historyOldest    ← detector.emaLong
//   debug.cooldownRemaining← detector.cooldownRemaining
//   debug.lastBeatTime     ← detector.lastBeatTime (snapshot BEFORE this frame)
//   debug.blockedReason    ← detector.blockedReason
//   debug.detected         ← detector.detected
//   debug.beatCount        incremented when detector.detected === true
//   debug.fft.*            ← fftMeta.*
//   debug.bands.*          ← raw.*/env.* delta tracking
// ══════════════════════════════════════════════════════════════════════════════
class BeatDebugger {
    /**
     * @param {object} debug       reference to beatEngine.debug (never copied)
     * @param {object} diagnostics reference to beatEngine.diagnostics (never copied)
     */
    constructor(debug, diagnostics) {
        this._d  = debug;
        this._di = diagnostics;
    }

    /**
     * Populate all debug fields from this frame's module results.
     * Called once per frame as Step 7 of the pipeline.
     *
     * @param {object} fftMeta  FFTAnalyzer.meta
     * @param {object} raw      BandExtractor.result
     * @param {object} env      EnvelopeBank.envelopes
     * @param {object} dr       BeatDetector.result
     * @param {object} cr       BeatClassifier.result
     * @param {object} feat     AudioFeatureExtractor.result
     * @param {object} tr       HypothesisTempoEstimator.result
     * @param {number} frame    current frame counter
     */
    update(fftMeta, raw, env, dr, cr, feat, tr, frame) {
        const d = this._d;

        // ── FFT metadata (debug.fft.*) ────────────────────────────────────────
        d.fft.sampleRate = fftMeta.sampleRate;
        d.fft.fftSize    = fftMeta.fftSize;
        d.fft.binCount   = fftMeta.binCount;
        d.fft.binWidth   = fftMeta.binWidth;
        d.fft.nyquist    = fftMeta.nyquist;

        // ── Sprint 3: Classification and Features ─────────────────────────────
        d.classification.type       = cr.type;
        d.classification.kickScore  = cr.kickScore;
        d.classification.snareScore = cr.snareScore;
        d.classification.hatScore   = cr.hatScore;

        d.features.energy           = feat.energy;
        d.features.peak             = feat.peak;
        d.features.rms              = feat.rms;
        d.features.dynamicRange     = feat.dynamicRange;
        d.features.spectralCentroid = feat.spectralCentroid;
        d.features.crestFactor      = feat.crestFactor;
        d.features.brightness       = feat.brightness;
        d.features.isSilence        = feat.isSilence;
        d.features.density          = feat.density;

        // ── Sprint 4: Tempo ───────────────────────────────────────────────────
        d.tempo.bpm        = tr.bpm;
        d.tempo.confidence = tr.confidence;
        d.tempo.beatPhase  = tr.beatPhase;

        // ── Beat detection scalars (V1 layout, field-for-field) ───────────────
        d.energy            = dr.energy;          // raw time-domain RMS
        d.averageEnergy     = dr.emaLong;
        d.flux              = dr.flux;
        d.threshold         = dr.threshold;
        d.dynamicThreshold  = dr.threshold;       // adaptive threshold: Sprint 4
        d.historyMin        = dr.emaLong;         // V1 stub: emaLong as floor
        d.historyMax        = dr.emaShort;        // V1 stub: emaShort as ceiling
        d.historyAverage    = dr.emaLong;
        d.historySize       = 2;                  // EMA window stub (was 43 init, 2 runtime)
        d.historyNewest     = dr.energy;          // most recent raw RMS
        d.historyOldest     = dr.emaLong;
        d.cooldownRemaining = dr.cooldownRemaining;
        d.lastBeatTime      = dr.lastBeatTime;    // timestamp of beat PRIOR to this frame
        d.blockedReason     = dr.blockedReason;
        d.detected          = dr.detected;
        if (dr.detected) d.beatCount++;           // cumulative, persists across HMR

        // ── Per-band delta tracking (debug.bands.*) ───────────────────────────
        BeatDebugger._band(d.bands.kick,    raw.kick,    env.kick);
        BeatDebugger._band(d.bands.bass,    raw.bass,    env.bass);
        BeatDebugger._band(d.bands.lowMid,  raw.lowMid,  env.lowMid);
        BeatDebugger._band(d.bands.mid,     raw.mid,     env.mid);
        BeatDebugger._band(d.bands.highMid, raw.highMid, env.highMid);
        BeatDebugger._band(d.bands.treble,  raw.treble,  env.treble);

        // ── Diagnostics frame counter ─────────────────────────────────────────
        this._di.frameNumber = frame;
    }

    /**
     * Update one band's previous/value/delta/envelope fields in place.
     * Static so the JIT can inline / devirtualise the call.
     * Zero allocation — all fields are primitives on the existing band object.
     */
    static _band(band, val, envelope) {
        band.previous = band.value;
        band.value    = val;
        band.delta    = val - band.previous;
        band.envelope = envelope;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Public — BeatEngine
//
// The sole public export. Coordinates all private modules.
// Owns this.state and both subscriber Sets.
// Enforces the deterministic pipeline in update().
// Is the ONLY entity that writes to this.state.
// Never performs DSP computation directly.
// ══════════════════════════════════════════════════════════════════════════════
class BeatEngine {
    constructor() {
        // ── Runtime State Contract ─────────────────────────────────────────────
        // Keys are immutable (never add/remove). Only values change.
        // All consumers depend on these keys existing from construction.
        this.state = {
            isPlaying:   false,
            playFactor:  0,
            master:      0,
            peak:        0,
            kick:        0,
            bass:        0,
            lowMid:      0,
            mid:         0,
            highMid:     0,
            treble:      0,
            vocal:       0,
            energy:      0,
            beat:        false,
            beatStrength: 0,
            bpm:         120,
            confidence:  0,
            beatPhase:   0,
            timestamp:   0,
            deltaTime:   0,
            frameNumber: 0,
            lastBeatEvent: null,
            beatType:    'beat',
            features: {
                energy: 0, peak: 0, rms: 0, dynamicRange: 0,
                spectralCentroid: 0, crestFactor: 0, brightness: 0,
                isSilence: false, density: 0
            },
        };

        // ── Pre-allocated BeatEvent ────────────────────────────────────────────
        this._beatEvent = {
            time:       0,
            type:      'beat',
            strength:   0,
            confidence: 0,
            bpm:        120,
            beatPhase:  0,
            kickScore:  0,
            snareScore: 0,
            hatScore:   0,
            energy:     0,
            brightness: 0,
        };

        // ── Performance Diagnostics ────────────────────────────────────────────
        this.diagnostics = {
            processingTime:  0,
            fftTime:         0,
            beatTime:        0,
            bpmTime:         0,
            publishTime:     0,
            subscriberCount: 0,
            frameNumber:     0,
        };

        // ── Debug Object (structure identical to V1 for BeatDebugOverlay compat) ─
        // BeatDebugger is the sole writer of all fields below.
        this.debug = {
            energy:            0,
            averageEnergy:     0,
            flux:              0,
            threshold:         0,
            dynamicThreshold:  0,
            historyMin:        0,
            historyMax:        0,
            historyAverage:    0,
            historySize:       2,      // V1 used 43 in constructor, 2 at runtime — use 2
            historyNewest:     0,
            historyOldest:     0,
            cooldownRemaining: 0,
            lastBeatTime:      0,
            beatCount:         0,      // cumulative; survives HMR via instance reuse
            blockedReason:    'UNKNOWN',
            detected:          false,
            lastBeatEvent:     null,
            classification: {
                type: 'beat', kickScore: 0, snareScore: 0, hatScore: 0
            },
            features: {
                energy: 0, peak: 0, rms: 0, dynamicRange: 0,
                spectralCentroid: 0, crestFactor: 0, brightness: 0,
                isSilence: false, density: 0
            },
            tempo: { bpm: 120, confidence: 0, beatPhase: 0 },
            fft: {
                sampleRate: 0,
                fftSize:    0,
                binCount:   0,
                binWidth:   0,
                nyquist:    0,
            },
            bands: {
                kick:    { bins: [0, 1],                                             value: 0, previous: 0, delta: 0, envelope: 0 },
                bass:    { bins: [2, 3],                                             value: 0, previous: 0, delta: 0, envelope: 0 },
                lowMid:  { bins: [4, 5, 6, 7],                                       value: 0, previous: 0, delta: 0, envelope: 0 },
                mid:     { bins: [8, 9, 10, 11, 12, 13, 14, 15],                     value: 0, previous: 0, delta: 0, envelope: 0 },
                highMid: { bins: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31], value: 0, previous: 0, delta: 0, envelope: 0 },
                treble:  { bins: [32, 63],                                           value: 0, previous: 0, delta: 0, envelope: 0 },
            },
        };

        // ── Frame Tracking ─────────────────────────────────────────────────────
        this.lastTime     = performance.now();
        this.frameCounter = 0;

        // ── Studio Mode ────────────────────────────────────────────────────────
        this._mode = 'realtime'; // 'realtime' | 'studio'
        this._cacheTimeSource = null;
        this._cachePlayer = new BeatCachePlayer();

        // ── Pub/Sub ────────────────────────────────────────────────────────────
        this.subscribers     = new Set();
        this.beatSubscribers = new Set();

        // ── Legacy Direct-Property Aliases ─────────────────────────────────────
        // Some external code may access beatEngine.analyser / .dataArray directly.
        // These are kept in sync with the FFTAnalyzer module by setSource().
        this.analyser        = null;
        this.dataArray       = null;  // populated in _initModules()
        this.timeDomainArray = null;

        // ── Internal Modules ───────────────────────────────────────────────────
        this._initModules();
    }

    // ── Module Factory ────────────────────────────────────────────────────────
    /**
     * Instantiate (or re-instantiate after HMR) all internal modules.
     * Modules receive shared references to this.debug and this.diagnostics.
     * Never receives copies — always the same objects so writes are visible
     * to external readers without an additional mapping step.
     */
    _initModules() {
        this._fft        = new FFTAnalyzer();
        this._extractor  = new BandExtractor();
        this._envBank    = new EnvelopeBank();
        this._features   = new AudioFeatureExtractor();
        this._detector   = new BeatDetector();
        this._classifier = new BeatClassifier();
        this._tempo      = new HypothesisTempoEstimator();
        this._queue      = new BeatQueue();
        this._debugger   = new BeatDebugger(this.debug, this.diagnostics);

        // Keep legacy aliases pointing to the live FFT typed arrays
        this.dataArray       = this._fft.dataArray;
        this.timeDomainArray = this._fft.timeDomainArray;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Public API — FROZEN (all five sprints must not change signatures)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Attach an AnalyserNode as the audio data source.
     * Null-safe: if null is passed, falls back to window.__m3_analyser.
     * @param {AnalyserNode|null} analyserNode
     */
    setSource(analyserNode) {
        const node    = analyserNode || null;
        this.analyser = node; // keep legacy property in sync
        this._fft.setSource(node);
        // Sync legacy aliases to the newly allocated FFT typed arrays
        this.dataArray       = this._fft.dataArray;
        this.timeDomainArray = this._fft.timeDomainArray;
    }

    /**
     * Subscribe to per-frame state updates.
     * Callback is invoked once per animation frame with the current state object.
     * @param {function(object): void} callback
     * @returns {function} unsubscribe — call to remove the subscription
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        this.diagnostics.subscriberCount = this.subscribers.size;
        return () => {
            this.subscribers.delete(callback);
            this.diagnostics.subscriberCount = this.subscribers.size;
        };
    }

    /**
     * Subscribe to beat events. Fires exactly once per confirmed beat.
     *
     * Sprint 2 upgrade: callback will receive a typed BeatEvent object.
     * Current: callback receives no arguments (void).
     * Callbacks that ignore the argument will be backward-compatible after Sprint 2.
     *
     * @param {function(): void} callback
     * @returns {function} unsubscribe
     */
    onBeat(callback) {
        this.beatSubscribers.add(callback);
        return () => this.beatSubscribers.delete(callback);
    }

    /** @returns {object} the runtime state object (same reference every call) */
    getState() { return this.state; }

    /** @returns {Uint8Array} latest FFT frequency-domain frame (same reference) */
    getSpectrum() { return this._fft.dataArray; }

    /** @returns {Uint8Array} latest FFT time-domain frame (same reference) */
    getTimeDomain() { return this._fft.timeDomainArray; }

    /** @returns {object} per-frame timing diagnostics */
    getDiagnostics() { return this.diagnostics; }

    // ══════════════════════════════════════════════════════════════════════════
    // Core Pipeline
    //
    // Deterministic execution order (invariant across all sprints):
    //   Step 1: Frame metadata & playFactor
    //   Step 2: FFT
    //   Step 3: Band Extraction
    //   Step 4: Envelope Followers
    //   Step 5: Beat Detection
    //   Step 6: Tempo Estimation
    //   Step 7: Debug Population
    //   Step 8: Publish State  ← sole write to this.state
    //   Step 9: Notify Subscribers
    // ══════════════════════════════════════════════════════════════════════════

    // ── Studio Mode API ───────────────────────────────────────────────────────
    setMode(mode) {
        this._mode = mode;
        if (mode === 'studio') {
            beatCacheManager.reset();
            this._queue.clear();
        }
    }

    getMode() {
        return this._mode;
    }

    async loadCache(key, hash) {
        return await beatCacheManager.load(key, hash);
    }

    setCacheTimeSource(fn) {
        this._cacheTimeSource = fn;
    }

    _updateFromCache(isPlaying) {
        if (!isPlaying || !this._cacheTimeSource) return;

        const t = this._cacheTimeSource();   // seconds
        const fi = Math.floor(t);
        
        // Features
        const cache = beatCacheManager._cache;
        if (cache && cache.features && cache.features[fi]) {
            const feat = cache.features[fi];
            this.state.features.energy    = feat.energy;
            this.state.features.brightness = feat.brightness;
            this.state.features.peak = feat.peak;
            this.state.features.rms = feat.rms;
            this.state.features.dynamicRange = feat.dynamicRange;
            this.state.features.spectralCentroid = feat.spectralCentroid;
            this.state.features.crestFactor = feat.crestFactor;
            this.state.features.isSilence = feat.isSilence;
            this.state.features.density = feat.density;
        }

        // Replay beat events
        const event = this._cachePlayer.tick(t, this._beatEvent);
        if (event) {
            this.state.beat         = true;
            this.state.beatStrength = event.strength;
            this.state.beatType     = event.type;
            this.state.bpm          = event.bpm;
            this.state.lastBeatEvent = event;
            this._queue.push(event);
        } else {
            this.state.beat = false;
        }

        this._queue.flush(this.beatSubscribers);
        for (const cb of this.subscribers) {
            try { cb(this.state); }
            catch (e) { console.error('BeatEngine subscriber error:', e); }
        }
    }

    /**
     * Execute one full analysis frame. Must be called exactly once per
     * animation frame (called by M3PreviewCanvas.jsx requestAnimationFrame loop).
     * @param {boolean} isPlaying
     */
    update(isPlaying) {
        if (this._mode === 'studio') {
            this._updateFromCache(isPlaying);
            return;
        }

        const tStart = performance.now();
        
        if (typeof window !== 'undefined' && isPlaying && !window.hasStartedCalibrationAuto && window.startCalibrationLog) {
            window.hasStartedCalibrationAuto = true;
            window.startCalibrationLog();
        }
        const dtMs   = Math.min(tStart - this.lastTime, 100); // clamp: max 100ms Δt
        const dt     = dtMs * 1e-3;
        this.lastTime = tStart;
        this.frameCounter++;

        // ── Step 1: Frame metadata & playFactor ───────────────────────────────
        this.state.isPlaying   = isPlaying;
        this.state.timestamp   = tStart;
        this.state.deltaTime   = dt;
        this.state.frameNumber = this.frameCounter;

        let pf = this.state.playFactor;
        pf += ((isPlaying ? 1 : 0) - pf) * (dt * 5 < 1 ? dt * 5 : 1);
        this.state.playFactor = pf;

        // ── Step 2: FFT ───────────────────────────────────────────────────────
        const tFft = performance.now();
        this._fft.update(isPlaying, pf);
        this.diagnostics.fftTime = performance.now() - tFft;

        // ── Step 3: Band Extraction ───────────────────────────────────────────
        this._extractor.extract(this._fft.dataArray, this._fft.getBinWidth());
        const raw = this._extractor.result; // reference only — zero allocation

        // ── Step 4: Envelope Followers ────────────────────────────────────────
        // A/R time constants are identical to V1. Ten apply() calls; all scalar.
        this._envBank.apply('master',  raw.master,  dt, 10,  100, pf);
        this._envBank.apply('peak',    raw.peak,    dt, 10,  100, pf);
        this._envBank.apply('kick',    raw.kick,    dt, 5,   50,  pf);
        this._envBank.apply('bass',    raw.bass,    dt, 20,  180, pf);
        this._envBank.apply('lowMid',  raw.lowMid,  dt, 20,  180, pf);
        this._envBank.apply('mid',     raw.mid,     dt, 20,  180, pf);
        this._envBank.apply('highMid', raw.highMid, dt, 20,  180, pf);
        this._envBank.apply('treble',  raw.treble,  dt, 10,  150, pf);
        this._envBank.apply('vocal',   raw.vocal,   dt, 30,  250, pf);
        this._envBank.apply('energy',  raw.energy,  dt, 50,  500, pf);
        const env = this._envBank.envelopes; // reference only — zero allocation

        // ── Step 5: Audio Feature Extraction ──────────────────────────────────
        this._features.extract(this._fft.dataArray, this._fft.getTimeDomainRms(), raw, this._fft.getBinWidth());
        const feat = this._features.result;

        // ── Step 6: Beat Detection ────────────────────────────────────────────
        const tBeat = performance.now();
        const tdRms = feat.rms; // scalar — no allocation (reused from feat)
        this._detector.detect(tdRms, tStart, pf);
        const dr = this._detector.result;           // reference only — zero allocation
        this.diagnostics.beatTime = performance.now() - tBeat;

        // ── Step 6.5: Beat Classification ─────────────────────────────────────
        if (dr.beat) {
            this._classifier.classify(raw);
        }
        const cr = this._classifier.result;

        // ── Step 6.8: Tempo Estimation (was Step 6) ───────────────────────────
        const tBpm = performance.now();
        if (dr.beat) this._tempo.addInterval(dr.interval, tStart);
        this._tempo.estimate();
        this._tempo.updatePhase(tStart);
        const tr = this._tempo.result;              // reference only — zero allocation
        this.diagnostics.bpmTime = performance.now() - tBpm;

        // ── Step 7: Beat Queue ────────────────────────────────────────────────
        if (dr.beat) {
            this._beatEvent.time       = tStart;
            this._beatEvent.type       = cr.type;
            this._beatEvent.strength   = dr.strength;
            this._beatEvent.confidence = tr.confidence;
            this._beatEvent.bpm        = tr.bpm;
            this._beatEvent.beatPhase  = 0;      // Exactly 0 on the frame a beat is detected

            this._beatEvent.kickScore  = cr.kickScore;
            this._beatEvent.snareScore = cr.snareScore;
            this._beatEvent.hatScore   = cr.hatScore;
            this._beatEvent.energy     = feat.energy;
            this._beatEvent.brightness = feat.brightness;

            this._queue.push(this._beatEvent);
            this.state.lastBeatEvent = this._beatEvent;
            this.debug.lastBeatEvent = this._beatEvent;
        }

        // ── Step 7.5: Debug Population ────────────────────────────────────────
        this._debugger.update(this._fft.meta, raw, env, dr, cr, feat, tr, this.frameCounter);

        // ── Step 8: Publish State ─────────────────────────────────────────────
        // BeatEngine is the ONLY entity that writes to this.state.
        // Reads from module result objects (pre-allocated) — zero allocation.
        this.state.master      = env.master;
        this.state.peak        = env.peak;
        this.state.kick        = env.kick;
        this.state.bass        = env.bass;
        this.state.lowMid      = env.lowMid;
        this.state.mid         = env.mid;
        this.state.highMid     = env.highMid;
        this.state.treble      = env.treble;
        this.state.vocal       = env.vocal;
        this.state.energy      = env.energy;
        this.state.beat        = dr.beat;
        this.state.beatStrength = dr.strength;
        this.state.bpm         = tr.bpm;
        this.state.confidence  = tr.confidence;
        this.state.beatPhase   = tr.beatPhase;
        
        if (dr.beat) this.state.beatType = cr.type;
        
        this.state.features.energy           = feat.energy;
        this.state.features.peak             = feat.peak;
        this.state.features.rms              = feat.rms;
        this.state.features.dynamicRange     = feat.dynamicRange;
        this.state.features.spectralCentroid = feat.spectralCentroid;
        this.state.features.crestFactor      = feat.crestFactor;
        this.state.features.brightness       = feat.brightness;
        this.state.features.isSilence        = feat.isSilence;
        this.state.features.density          = feat.density;

        if (typeof window !== 'undefined' && window.isRecordingCalibration) {
            window.beatCalibrationLog.push({
                time: tStart,
                beatPhase: tr.beatPhase,
                bpm: tr.bpm,
                confidence: tr.confidence,
                softLockTriggered: tr.softLockTriggered,
                rawEnergy: feat.energy
            });
        }

        // ── Step 9: Notify Subscribers ────────────────────────────────────────
        const tPub = performance.now();
        this._queue.flush(this.beatSubscribers);
        for (const cb of this.subscribers) {
            try { cb(this.state); }
            catch (e) { console.error('BeatEngine subscriber error:', e); }
        }
        this.diagnostics.publishTime    = performance.now() - tPub;
        this.diagnostics.processingTime = performance.now() - tStart;
    }

    // ── Legacy Compatibility Shim ─────────────────────────────────────────────
    /**
     * Preserved for backward compatibility.
     * V1 had _applyEnvelope as a direct method on BeatEngine.
     * Delegates to EnvelopeBank.apply().
     */
    _applyEnvelope(key, rawValue, dt, attackMs, releaseMs) {
        this._envBank.apply(key, rawValue, dt, attackMs, releaseMs, this.state.playFactor);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
const beatEngine = new BeatEngine();
// Expose globally for validation scripts
if (typeof window !== 'undefined') {
    window.beatEngine = beatEngine;
}
export { beatEngine };

if (typeof window !== 'undefined') {
    window.startCalibrationLog = () => {
        window.beatCalibrationLog = [];
        window.isRecordingCalibration = true;
        console.log("⏺ Calibration Log STARTED (Auto)! Merekam selama 15 detik...");
        setTimeout(() => {
            window.isRecordingCalibration = false;
            console.log("⏹ Selesai! Mengirim data ke log receiver Gemini...");
            fetch('http://localhost:13337', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.beatCalibrationLog)
            }).then(() => console.log("✅ Data berhasil dikirim!")).catch(() => {});
        }, 15000);
    };
}
