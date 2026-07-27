import { reactiveEngine } from './ReactiveEngine';

// Curves
export const curves = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => t * (2 - t),
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    spring: (t) => 1 - Math.cos(t * Math.PI * 4) * Math.exp(-t * 6),
    impulse: (t) => {
        const h = t * 10;
        return h * Math.exp(1 - h);
    }
};

// Operations
export const operations = {
    multiply: (val, amp) => val * amp,
    add: (val, amp) => val + amp,
    subtract: (val, amp) => val - amp,
    clamp: (val, amp) => Math.min(Math.max(val, 0), amp),
    invert: (val, amp) => amp - (val * amp),
    remap: (val, amp) => (val * 2 - 1) * amp // -1 to 1 scaled by amp
};

class ReactiveObjectProcessor {
    constructor() {
        this.values = new Map();
        this.states = new Map();
        this.diagnostics = new Map();
    }

    update(m3Objects, dt, isPlaying = false) {
        // dt is expected in seconds
        if (!m3Objects) return;
        
        for (const obj of m3Objects) {
            if (obj.type !== 'reactive' && obj.type !== 'effect') continue;
            if (obj.enabled === false) {
                this.values.set(obj.id, 0);
                this.diagnostics.delete(obj.id);
                continue;
            }

            if (isPlaying !== true) {
                this.states.set(obj.id, 0);
                this.values.set(obj.id, 0);
                continue;
            }

            const sourceChannel = obj.source || 'energy';
            let rawValue = reactiveEngine.getChannel(sourceChannel);
            const originalRaw = rawValue;

            // Apply threshold
            const threshold = (obj.threshold !== undefined ? obj.threshold : 0) / 100;
            if (rawValue < threshold) {
                rawValue = 0;
            } else if (threshold < 1) {
                // Normalize above threshold to 0-1
                rawValue = (rawValue - threshold) / (1 - threshold);
            }
            const postThreshold = rawValue;

            // Envelope follower state
            let currentState = this.states.get(obj.id) || 0;
            
            // Force snappy defaults for Visual FX to ensure they hit hard on the beat
            const isVisualFX = obj.type === 'effect';
            const effAttack = isVisualFX ? 2 : obj.attack;
            const effRelease = isVisualFX ? 80 : obj.release;
            const effSmoothness = isVisualFX ? 0 : obj.smoothness;

            const attack = Math.max((effAttack !== undefined ? effAttack : 10) / 1000, 0.001);
            const release = Math.max((effRelease !== undefined ? effRelease : 100) / 1000, 0.001);
            
            // Smoothing based on dt
            const attRate = dt / attack;
            const relRate = dt / release;

            if (rawValue > currentState) {
                currentState += (rawValue - currentState) * Math.min(attRate, 1);
            } else {
                currentState -= (currentState - rawValue) * Math.min(relRate, 1);
            }

            // Optional extra smoothness (low pass filter)
            let smoothed = currentState;
            if (effSmoothness > 0) {
                const smoothFactor = 1 - (effSmoothness / 100);
                const prevSmoothed = this.states.get(obj.id) || 0;
                smoothed = prevSmoothed + (currentState - prevSmoothed) * Math.max(smoothFactor, 0.01);
            }

            this.states.set(obj.id, smoothed);
            const postEnvelope = smoothed;

            // Apply Curve
            const curveFn = curves[obj.curve] || curves.linear;
            let curvedValue = curveFn(smoothed);

            // Apply Operation & Amplitude
            const amplitude = obj.amplitude !== undefined ? obj.amplitude / 100 : 1.0;
            const opFn = operations[obj.operation] || operations.multiply;
            
            let finalValue = opFn(curvedValue, amplitude);

            this.values.set(obj.id, finalValue);

            // Store diagnostics
            this.diagnostics.set(obj.id, {
                rawInput: originalRaw,
                thresholdOutput: postThreshold,
                envelopeOutput: postEnvelope,
                finalOutput: finalValue,
                config: {
                    effect: obj.effect,
                    source: obj.source,
                    operation: obj.operation,
                    curve: obj.curve,
                    threshold: obj.threshold,
                    amplitude: obj.amplitude,
                    attack: obj.attack,
                    release: obj.release,
                    smoothness: obj.smoothness
                }
            });
        }
    }

    getValue(id) {
        return this.values.get(id) || 0;
    }
    
    getValues() {
        return this.values;
    }

    getDiagnostics() {
        return this.diagnostics;
    }
}

export const reactiveObjectProcessor = new ReactiveObjectProcessor();
