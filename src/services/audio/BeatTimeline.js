export class BeatTimeline {
    constructor(events, bpm, sampleRate) {
        this._bpm = bpm;
        this._sampleRate = sampleRate;
        this._entries = [];
        this._buildEntries(events);
    }

    _buildEntries(events) {
        if (!events || events.length === 0) return;
        
        let bar = 0;
        let beatInBar = 0;
        const timeSigNum = 4; // Assuming 4/4 time

        this._entries = events.map((ev, index) => {
            const entry = {
                index:      index,
                time:       ev.time,
                type:       ev.type,
                strength:   ev.strength,
                bpm:        ev.bpm,
                beatPhase:  0,
                bar:        bar,
                beat:       beatInBar,
                quantized: {
                    quarter: ev.time, // Simplification for MVP
                    half:    ev.time,
                    one:     ev.time,
                    two:     ev.time,
                    bar:     ev.time,
                }
            };

            beatInBar++;
            if (beatInBar >= timeSigNum) {
                beatInBar = 0;
                bar++;
            }

            return entry;
        });
    }

    // ── Build ───────────────────────────────────────────────────────────────
    static fromCache(analysisCache) {
        if (!analysisCache) return new BeatTimeline([], 120, 44100);
        return new BeatTimeline(analysisCache.events, analysisCache.bpm, analysisCache.sampleRate);
    }

    static fromRealtimeRecording(recorder) {
        const session = recorder.stop();
        // Assuming session.events has the recorded beat events
        return new BeatTimeline(session.events, 120, 44100);
    }

    // ── Query ───────────────────────────────────────────────────────────────
    getAll() {
        return this._entries;
    }

    getAt(index) {
        if (index < 0 || index >= this._entries.length) return null;
        return this._entries[index];
    }

    getRange(startSec, endSec) {
        return this._entries.filter(e => e.time >= startSec && e.time <= endSec);
    }

    getNearest(timeSec, type = null) {
        let nearest = null;
        let minDiff = Infinity;
        for (const e of this._entries) {
            if (type && e.type !== type) continue;
            const diff = Math.abs(e.time - timeSec);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = e;
            }
        }
        return nearest;
    }

    getBar(barIndex) {
        return this._entries.filter(e => e.bar === barIndex);
    }

    getByType(type) {
        return this._entries.filter(e => e.type === type);
    }

    getDuration() {
        if (this._entries.length === 0) return 0;
        return this._entries[this._entries.length - 1].time;
    }

    getBeatCount() {
        return this._entries.length;
    }

    getAverageBpm() {
        return this._bpm;
    }

    // ── Serialise ────────────────────────────────────────────────────────────
    toJSON() {
        return JSON.stringify(this._entries);
    }

    toBeatMarkers() {
        // Simple mock DAW-compatible marker format
        return this._entries.map(e => `${e.time}\t${e.type}`).join('\n');
    }

    // ── Bar/Beat Mapping ─────────────────────────────────────────────────────
    timeToBarBeat(timeSec) {
        const nearest = this.getNearest(timeSec);
        if (!nearest) return { bar: 0, beat: 0 };
        return { bar: nearest.bar, beat: nearest.beat };
    }

    barBeatToTime(bar, beat) {
        const ev = this._entries.find(e => e.bar === bar && e.beat === beat);
        return ev ? ev.time : 0;
    }
}
