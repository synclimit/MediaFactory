/**
 * AudioDSP.js
 * Pure DSP modules extracted from BeatEngine for reuse in OfflineAudioContext.
 * Zero DOM / zero AudioContext dependency (except for the typed arrays passed in).
 */

export class FFTAnalyzer {
    constructor() {
        this.analyser        = null;
        this.dataArray       = new Uint8Array(64);
        this.timeDomainArray = new Uint8Array(64);

        // Pre-allocated metadata object — read by BeatDebugger each frame.
        // Never recreated; fields are overwritten in place.
        this.meta = {
            sampleRate: 0,
            fftSize:    0,
            binCount:   0,
            binWidth:   0,
            nyquist:    0,
        };
    }

    /**
     * Attach (or detach) an AnalyserNode as the audio source.
     * Allocates new typed arrays sized to the node's frequencyBinCount.
     * Called from BeatEngine.setSource() only — never from update().
     *
     * @param {AnalyserNode|null} node
     */
    setSource(node) {
        this.analyser = node;
        if (node) {
            const n              = node.frequencyBinCount || 1024;
            this.dataArray       = new Uint8Array(n);
            this.timeDomainArray = new Uint8Array(n);
        }
    }

    /**
     * Pull the latest frame from the AnalyserNode into the typed arrays.
     * When stopped and playFactor has fully decayed, both buffers are
     * zero-filled so downstream modules see silence (Playback Contract).
     *
     * @param {boolean} isPlaying
     * @param {number}  playFactor  smooth 0–1 play state
     */
    update(isPlaying, playFactor) {
        if (this.analyser && isPlaying) {
            this.analyser.getByteFrequencyData(this.dataArray);
            this.analyser.getByteTimeDomainData(this.timeDomainArray);

            if (this.analyser.context) {
                const sr             = this.analyser.context.sampleRate;
                const fsz            = this.analyser.fftSize;
                this.meta.sampleRate = sr;
                this.meta.fftSize    = fsz;
                this.meta.binCount   = this.analyser.frequencyBinCount;
                this.meta.nyquist    = sr / 2;
                this.meta.binWidth   = (sr / 2) / this.analyser.frequencyBinCount;
            }
        } else if (!isPlaying && playFactor <= 0.01) {
            this.dataArray.fill(0);
            this.timeDomainArray.fill(128); // 128 = silence in unsigned 8-bit PCM
        }
    }

    /**
     * @returns {number} Hz per FFT bin (safe fallback when metadata is unavailable)
     */
    getBinWidth() {
        return this.meta.binWidth > 0
            ? this.meta.binWidth
            : 24000 / this.dataArray.length;
    }

    /**
     * Compute per-frame time-domain RMS.
     * Uses raw PCM — immune to the AnalyserNode's smoothingTimeConstant,
     * so transient peaks are captured faithfully.
     * @returns {number} 0–1
     */
    getTimeDomainRms() {
        const buf = this.timeDomainArray;
        const len = buf.length;
        let   sum = 0;
        for (let i = 0; i < len; i++) {
            const s = (buf[i] - 128) * (1 / 128); // hoist division to multiply
            sum += s * s;
        }
        return Math.sqrt(sum / len);
    }
}

export class BandExtractor {
    constructor() {
        this.result = {
            master:  0,
            peak:    0,
            rms:     0,
            kick:    0,
            bass:    0,
            lowMid:  0,
            mid:     0,
            highMid: 0,
            treble:  0,
            vocal:   0,
            energy:  0,
        };
    }

    extract(data, binWidth) {
        const r   = this.result;
        const len = data.length;

        r.master = r.peak = r.rms = r.kick = r.bass = 0;
        r.lowMid = r.mid = r.highMid = r.treble = r.vocal = r.energy = 0;

        let peakVal = 0,    rmsSum  = 0;
        let kickSum = 0,    kickN   = 0;
        let bassSum = 0,    bassN   = 0;
        let loMidS  = 0,    loMidN  = 0;
        let midSum  = 0,    midN    = 0;
        let hiMidS  = 0,    hiMidN  = 0;
        let trebS   = 0,    trebN   = 0;
        let vocS    = 0,    vocN    = 0;

        for (let i = 0; i < len; i++) {
            const v = data[i];
            if (v > peakVal) peakVal = v;
            rmsSum += v * v;
            const hz = i * binWidth;
            if (hz >= 20   && hz < 80)    { kickSum += v; kickN++;  }
            if (hz >= 80   && hz < 250)   { bassSum += v; bassN++;  }
            if (hz >= 250  && hz < 500)   { loMidS  += v; loMidN++; }
            if (hz >= 500  && hz < 2000)  { midSum  += v; midN++;   }
            if (hz >= 2000 && hz < 6000)  { hiMidS  += v; hiMidN++; }
            if (hz >= 6000 && hz < 20000) { trebS   += v; trebN++;  }
            if (hz >= 300  && hz < 3000)  { vocS    += v; vocN++;   }
        }

        const k   = 1 / 255;
        r.peak    = peakVal * k;
        r.rms     = Math.sqrt(rmsSum / len) * k;
        r.kick    = kickN  > 0 ? (kickSum / kickN)  * k : 0;
        r.bass    = bassN  > 0 ? (bassSum / bassN)  * k : 0;
        r.lowMid  = loMidN > 0 ? (loMidS  / loMidN) * k : 0;
        r.mid     = midN   > 0 ? (midSum  / midN)   * k : 0;
        r.highMid = hiMidN > 0 ? (hiMidS  / hiMidN) * k : 0;
        r.treble  = trebN  > 0 ? (trebS   / trebN)  * k : 0;
        r.vocal   = vocN   > 0 ? (vocS    / vocN)   * k : 0;
        r.energy  = r.rms;
        r.master  = r.peak;
    }
}

export class EnvelopeBank {
    constructor() {
        this.envelopes = {
            master:  0,
            peak:    0,
            rms:     0,
            kick:    0,
            bass:    0,
            lowMid:  0,
            mid:     0,
            highMid: 0,
            treble:  0,
            vocal:   0,
            energy:  0,
        };
    }

    apply(key, raw, dt, attackMs, releaseMs, pf) {
        let   cur = this.envelopes[key];
        const tgt = raw * pf;
        const att = dt / (attackMs  * 1e-3);
        const rel = dt / (releaseMs * 1e-3);
        if (tgt > cur) {
            cur += (tgt - cur) * (att < 1 ? att : 1);
        } else {
            cur -= (cur - tgt) * (rel < 1 ? rel : 1);
        }
        this.envelopes[key] = cur;
    }
}

export class BeatDetector {
    constructor(baseCooldown = 300) {
        this._baseCooldown = baseCooldown;
        this._emaShort     = 0;
        this._emaLong      = 0;
        this._lastBeatTime = 0;

        this.result = {
            beat:     false,
            strength: 0,
            interval: 0,
            energy:            0,
            emaShort:          0,
            emaLong:           0,
            flux:              0,
            threshold:         0.15,
            cooldownRemaining: 0,
            lastBeatTime:      0,
            blockedReason:    'UNKNOWN',
            detected:          false,
        };
    }

    get lastBeatTime() { return this._lastBeatTime; }

    detect(energy, now, playFactor) {
        const r = this.result;

        r.beat     = false;
        r.strength = 0;
        r.interval = 0;
        r.detected = false;
        r.lastBeatTime = this._lastBeatTime;
        r.energy       = energy;

        if (playFactor < 0.1) {
            r.blockedReason    = 'PLAYBACK_STOPPED';
            r.flux             = 0;
            r.threshold        = 0.15;
            r.cooldownRemaining = 0;
            r.emaShort         = this._emaShort;
            r.emaLong          = this._emaLong;
            return;
        }

        const AS = 0.6, AL = 0.03;
        this._emaShort = AS * energy + (1 - AS) * this._emaShort;
        this._emaLong  = AL * energy + (1 - AL) * this._emaLong;

        r.emaShort = this._emaShort;
        r.emaLong  = this._emaLong;

        const flux = this._emaLong > 0.001
            ? Math.max(0, this._emaShort / this._emaLong - 1.0)
            : 0;

        const threshold         = 0.15;
        const timeSinceLast     = now - this._lastBeatTime;
        const cooldownRemaining = timeSinceLast < this._baseCooldown ? this._baseCooldown - timeSinceLast : 0;

        r.flux              = flux;
        r.threshold         = threshold;
        r.cooldownRemaining = cooldownRemaining;

        if (this._emaLong < 0.001) {
            r.blockedReason = 'NO_HISTORY';
        } else if (energy < 0.003) {
            r.blockedReason = 'LOW_ENERGY';
        } else if (cooldownRemaining > 0) {
            r.blockedReason = 'COOLDOWN';
        } else if (flux <= threshold) {
            r.blockedReason = 'BELOW_THRESHOLD';
        } else {
            r.blockedReason = 'SUCCESS';
            r.detected      = true;
            r.beat          = true;
            r.strength = Math.max(
                Math.min((flux - threshold) / (0.6 - threshold), 1.0),
                0.3
            );
            r.interval         = now - this._lastBeatTime;
            this._lastBeatTime = now;
        }
    }
}

export class BeatClassifier {
    constructor() {
        this.result = {
            type: 'beat',
            kickScore: 0,
            snareScore: 0,
            hatScore: 0,
        };
    }

    classify(raw) {
        const r = this.result;
        
        const total = Math.max(0.001, raw.kick + raw.bass + raw.lowMid + raw.mid + raw.highMid + raw.treble);

        const kickScore  = (raw.kick + raw.bass) / total;
        const snareScore = (raw.mid + raw.highMid) / total;
        const hatScore   = raw.treble / total;

        r.kickScore  = kickScore;
        r.snareScore = snareScore;
        r.hatScore   = hatScore;

        if (kickScore > snareScore && kickScore > hatScore && kickScore > 0.4) {
            r.type = 'kick';
        } else if (snareScore > kickScore && snareScore > hatScore && snareScore > 0.3) {
            r.type = 'snare';
        } else if (hatScore > kickScore && hatScore > snareScore && hatScore > 0.4) {
            r.type = 'hat';
        } else {
            r.type = 'transient';
        }
    }
}

export class AudioFeatureExtractor {
    constructor() {
        this.result = {
            energy: 0,
            peak: 0,
            rms: 0,
            dynamicRange: 0,
            spectralCentroid: 0,
            crestFactor: 0,
            brightness: 0,
            isSilence: false,
            density: 0,
        };
    }

    extract(dataArray, timeDomainRms, bands, binWidth) {
        const r = this.result;
        const len = dataArray.length;
        if (len === 0) return;

        let sumData = 0;
        let sumSq = 0;
        let sumFreqData = 0;
        let peak = 0;
        let overFloorCount = 0;

        for (let i = 0; i < len; i++) {
            const val = dataArray[i];
            sumData += val;
            sumSq += val * val;
            sumFreqData += val * (i * binWidth);
            if (val > peak) peak = val;
            if (val > 5) overFloorCount++;
        }

        const rmsEnergy = Math.sqrt(sumSq / len) / 255;
        const peakNorm = peak / 255;
        const timeRms = Math.max(timeDomainRms, 0.001);

        r.energy = rmsEnergy;
        r.peak = peakNorm;
        r.rms = timeDomainRms;
        r.dynamicRange = 1.0 - (peakNorm / timeRms);
        r.spectralCentroid = sumData > 0 ? (sumFreqData / sumData) : 0;
        r.crestFactor = Math.min(peakNorm / timeRms, 10.0);
        r.brightness = (bands.highMid + bands.treble) / 2;
        r.isSilence = timeDomainRms < 0.003;
        r.density = overFloorCount / len;
    }
}

export class HypothesisTempoEstimator {
    constructor() {
        this._intervals = new Float32Array(32); // 32 interval sliding window
        this._idx = 0;
        this._count = 0;
        this._lastBeatTime = 0;
        
        this.result = {
            bpm: 120,
            confidence: 0,
            beatPhase: 0,
            softLockTriggered: false
        };
    }

    addInterval(ms, now) {
        this.result.softLockTriggered = false; // reset per beat

        let bpm = 60000 / ms;
        if (bpm < 20 || bpm > 600) return; // Ignore absurdly fast/slow intervals
        
        // Harmonic fold to 90-180 range
        while (bpm < 90) bpm *= 2;
        while (bpm > 180) bpm /= 2;
        const foldedBpm = Math.round(bpm);
        
        // Add to sliding window
        this._intervals[this._idx] = foldedBpm;
        this._idx = (this._idx + 1) % this._intervals.length;
        this._count = Math.min(this._count + 1, this._intervals.length);
        
        // Rebuild histogram immediately to check confidence
        this.estimate();
        
        // ----------------------------------------------------------------
        // Soft Lock Logic (Phase Reset)
        // ----------------------------------------------------------------
        
        // 1. Is the metronome near the wrap point? (expected beat)
        const phase = this.result.beatPhase;
        const isNearWrap = phase > 0.85 || phase < 0.15;
        
        // 2. Is the new interval consistent with the currently locked BPM?
        const diffRatio = Math.abs(foldedBpm - this.result.bpm) / this.result.bpm;
        const isConsistent = diffRatio < 0.10; // within 10%
        
        // 3. Fallback: Has it been too long since the last correction?
        const timeSinceLastLock = now - this._lastBeatTime;
        const isFallback = timeSinceLastLock > 4000 && this.result.confidence >= 0.5;
        
        let shouldLock = false;
        
        // First few beats lock aggressively to bootstrap the clock
        if (this._count < 4) {
            shouldLock = true;
        } 
        else if ((isNearWrap && isConsistent) || isFallback) {
            shouldLock = true;
        }

        if (shouldLock) {
            this._lastBeatTime = now;
            this.result.softLockTriggered = true;
            this.result.beatPhase = 0; // instantly snap
        }
    }

    estimate() {
        const r = this.result;
        r.softLockTriggered = r.softLockTriggered || false; // preserve within the frame

        if (this._count === 0) return;

        // Rebuild histogram from the 32-item buffer
        const histogram = new Float32Array(91); // 90 to 180 inclusive
        
        for (let i = 0; i < this._count; i++) {
            const b = this._intervals[i];
            if (b >= 90 && b <= 180) {
                const idx = b - 90;
                histogram[idx] += 1.0;
                // Light smoothing kernel
                if (idx > 0) histogram[idx - 1] += 0.5;
                if (idx < 90) histogram[idx + 1] += 0.5;
            }
        }

        let maxVote = 0;
        let bestIdx = 0;
        for (let i = 0; i <= 90; i++) {
            if (histogram[i] > maxVote) {
                maxVote = histogram[i];
                bestIdx = i;
            }
        }

        // Lock BPM and compute confidence based on dominance
        r.bpm = bestIdx + 90;
        // Max possible vote for a single bin (with center=1.0) is exactly this._count.
        // Confidence approaches 1.0 when all beats agree on the exact same BPM.
        r.confidence = Math.min(1.0, maxVote / this._count);
    }

    updatePhase(now) {
        if (this.result.bpm > 0 && this._count >= 2) {
            const beatIntervalMs = 60000 / this.result.bpm;
            const elapsed = now - this._lastBeatTime;
            this.result.beatPhase = (elapsed / beatIntervalMs) % 1.0;
        } else {
            this.result.beatPhase = 0;
        }
        // reset the flag for the next frame if it wasn't a beat frame
        // Wait, BeatEngine consumes this every frame, so BeatEngine must capture it when beat is true.
    }
}
