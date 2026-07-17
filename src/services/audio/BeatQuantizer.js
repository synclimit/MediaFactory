export const QuantizeLevel = {
    QUARTER_BEAT:  'QUARTER_BEAT',   // fires 4× per beat (fine detail)
    HALF_BEAT:     'HALF_BEAT',      // fires 2× per beat
    ONE_BEAT:      'ONE_BEAT',       // fires every beat
    TWO_BEAT:      'TWO_BEAT',       // fires every 2 beats
    BAR:           'BAR',            // fires every 4 beats (1 bar in 4/4)
    DOWNBEAT:      'DOWNBEAT',       // fires on beat 1 of each bar
    MEASURE:       'MEASURE',        // fires every 2 bars (8 beats)
};

class BeatQuantizer {
    constructor() {
        this._beatCount    = 0;       // total beats since track start
        this._barCount     = 0;       // total bars (every 4 beats in 4/4)
        this._beatInBar    = 0;       // 0–3, which beat within current bar
        this._quarterTimer = 0;       // ms since last quarter-beat
        this._subscribers  = new Map(); 
        this._numerator    = 4;

        this._event = {
            level:      'ONE_BEAT',
            beat:       0,
            bar:        0,
            beatInBar:  0,
            bpm:        120,
            time:       0,
        };
        
        Object.values(QuantizeLevel).forEach(level => {
            this._subscribers.set(level, new Set());
        });
    }

    _onBeatEvent(ev) {
        this._beatCount++;
        this._beatInBar = (this._beatCount - 1) % this._numerator;
        if (this._beatInBar === 0) this._barCount++;
        
        this._event.beat = this._beatCount;
        this._event.bar = this._barCount;
        this._event.beatInBar = this._beatInBar;
        this._event.bpm = ev.bpm;
        this._event.time = ev.time || performance.now();

        this._fire(QuantizeLevel.ONE_BEAT);
        if (this._beatCount % 2 === 0) this._fire(QuantizeLevel.TWO_BEAT);
        if (this._beatInBar === 0) {
            this._fire(QuantizeLevel.DOWNBEAT);
            this._fire(QuantizeLevel.BAR);
            if (this._barCount % 2 === 0) this._fire(QuantizeLevel.MEASURE);
        }
    }

    _fire(level) {
        this._event.level = level;
        for (const cb of this._subscribers.get(level)) {
            try {
                cb(this._event);
            } catch (err) {
                console.error(`BeatQuantizer subscriber error on ${level}:`, err);
            }
        }
    }

    attachToEngine(beatEngine) {
        beatEngine.onBeat((ev) => this._onBeatEvent(ev));
    }

    subscribe(level, callback) {
        const s = this._subscribers.get(level);
        if (s) {
            s.add(callback);
            return () => s.delete(callback);
        }
        return () => {};
    }

    reset() {
        this._beatCount = 0;
        this._barCount = 0;
        this._beatInBar = 0;
        this._quarterTimer = 0;
    }

    setTimeSignature(numerator) {
        this._numerator = numerator;
    }

    getPosition() {
        return { beat: this._beatCount, bar: this._barCount, beatInBar: this._beatInBar };
    }
}

export const beatQuantizer = new BeatQuantizer();
