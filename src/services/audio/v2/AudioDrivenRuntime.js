export const AnimationCurves = {
    Linear: (t) => t,
    EaseOut: (t) => 1 - Math.pow(1 - t, 3),
    EaseInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    Expo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    Elastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    Bounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    CustomBezier: (t, p1, p2, p3, p4) => {
        const u = 1 - t;
        return 3 * u * u * t * p2 + 3 * u * t * t * p3 + t * t * t; 
    }
};

import { MusicalFeelEngine } from './MusicalFeelEngine.js';

export class AudioDrivenEnvelope {
    constructor(config = {}) {
        this.attack = config.attack || 0.05;
        this.hold = config.hold || 0.0;
        this.decay = config.decay || 0.2;
        this.release = config.release || 0.2;
        this.curve = config.curve || AnimationCurves.EaseOut;
        
        this.state = 'IDLE'; // IDLE, ATTACK, HOLD, DECAY, RELEASE
        this.timeInState = 0;
        
        // Channel properties
        this.intensity = 0;
        this.velocity = 0;
        this.progress = 0;
        this.triggerIntensity = 0;
        this.lastValue = 0;
        this.justTriggered = false;
    }
    
    trigger(intensity) {
        this.state = 'ATTACK';
        this.timeInState = 0;
        this.triggerIntensity = intensity;
        this.progress = 0;
        this.intensity = 0;
        this.velocity = 0;
        this.justTriggered = true;
    }
    
    update(dt) {
        // Reset single-frame trigger flag
        const isTriggerFrame = this.justTriggered;
        this.justTriggered = false;

        if (this.state === 'IDLE') {
            this.intensity = 0;
            this.velocity = 0;
            this.progress = 0;
            // Store it temporarily for getState reading
            this._lastJustTriggered = isTriggerFrame;
            return this.intensity;
        }
        
        this.timeInState += dt;
        
        if (this.state === 'ATTACK') {
            this.progress = Math.min(1.0, this.timeInState / this.attack);
            this.intensity = this.curve(this.progress) * this.triggerIntensity;
            
            if (this.progress >= 1.0) {
                this.state = 'HOLD';
                this.timeInState = 0;
            }
        } else if (this.state === 'HOLD') {
            this.progress = 1.0;
            this.intensity = this.triggerIntensity;
            
            if (this.timeInState >= this.hold) {
                this.state = 'DECAY';
                this.timeInState = 0;
            }
        } else if (this.state === 'DECAY') {
            this.progress = Math.min(1.0, this.timeInState / this.decay);
            // Decay down to 0
            this.intensity = this.triggerIntensity * (1.0 - this.curve(this.progress));
            
            if (this.progress >= 1.0) {
                this.state = 'RELEASE';
                this.timeInState = 0;
            }
        } else if (this.state === 'RELEASE') {
            this.progress = Math.min(1.0, this.timeInState / this.release);
            this.intensity = 0;
            
            if (this.progress >= 1.0) {
                this.state = 'IDLE';
                this.timeInState = 0;
            }
        }
        
        this.velocity = (this.intensity - this.lastValue) / dt;
        this.lastValue = this.intensity;
        
        this._lastJustTriggered = isTriggerFrame;
        return this.intensity;
    }
    
    getState() {
        return Object.freeze({
            trigger: this.state !== 'IDLE',
            justTriggered: this._lastJustTriggered || false,
            intensity: this.intensity,
            velocity: this.velocity,
            progress: this.progress,
            decay: this.state === 'DECAY' || this.state === 'RELEASE'
        });
    }
}

export class AudioDrivenRuntime {
    constructor() {
        this.channels = {
            beat: new AudioDrivenEnvelope({ attack: 0.02, decay: 0.15 }),
            downbeat: new AudioDrivenEnvelope({ attack: 0.05, decay: 0.3 }),
            kick: new AudioDrivenEnvelope({ attack: 0.01, decay: 0.2 }),
            snare: new AudioDrivenEnvelope({ attack: 0.01, decay: 0.15 }),
            hihat: new AudioDrivenEnvelope({ attack: 0.005, decay: 0.05 }),
        };
        
        this.feelEngine = new MusicalFeelEngine();
        this.energyValue = 0;
        this.currentSpectrum = null;
        
        // Static mappings from envelopes to visual effects to match legacy behavior
        this.effectWeights = {
            zoom: { kick: 0.6, beat: 0.4 },
            glow: { energy: 0.5, hihat: 0.5 },
            blur: { snare: 1.0 },
            shake: { downbeat: 1.0 },
            pulse: { beat: 0.8, kick: 0.2 }
        };
    }
    
    processEvent(beatEvent) {
        if (!beatEvent) return;
        
        // Use flat properties provided by BeatEngine V2 Zero-Allocation Contract
        if (beatEvent.isBroadband !== undefined) {
            // New Multi-Band Architecture
            if (beatEvent.isBroadband || beatEvent.type === 'beat' || beatEvent.type === 'onset') {
                this.channels.beat.trigger(beatEvent.confidence || beatEvent.strength || 1.0);
            }
            if (beatEvent.type === 'downbeat') {
                this.channels.downbeat.trigger(beatEvent.confidence || beatEvent.strength || 1.0);
            }
            
            if (beatEvent.isKick) this.channels.kick.trigger(beatEvent.kickStrength || 1.0);
            if (beatEvent.isSnare) this.channels.snare.trigger(beatEvent.snareStrength || 1.0);
            if (beatEvent.isHat) this.channels.hihat.trigger(beatEvent.hatStrength || 1.0);
        } else {
            // Legacy Fallback
            if (beatEvent.type === 'beat' || beatEvent.type === 'onset' || beatEvent.confidence > 0) {
                this.channels.beat.trigger(beatEvent.confidence || beatEvent.strength || 1.0);
            }
            if (beatEvent.type === 'downbeat') {
                this.channels.downbeat.trigger(beatEvent.confidence || beatEvent.strength || 1.0);
            }
            if (beatEvent.kickScore > 0.5) this.channels.kick.trigger(beatEvent.strength || 1.0);
            if (beatEvent.snareScore > 0.5) this.channels.snare.trigger(beatEvent.strength || 1.0);
            if (beatEvent.hatScore > 0.5) this.channels.hihat.trigger(beatEvent.strength || 1.0);
        }
        
        this.energyValue = beatEvent.energy || 0;
        this.currentSpectrum = beatEvent.spectrum || null;
        this.feelEngine.processEvent(beatEvent);
    }
    
    update(dt, beatState = null) {
        if (beatState) {
            if (beatState.kick !== undefined) {
                this.liveKick = beatState.kick;
                this.liveBass = beatState.bass;
                this.liveEnergy = beatState.energy;
            }
        }

        // Evaluate all ADSR envelopes
        this.channels.beat.update(dt);
        this.channels.downbeat.update(dt);
        this.channels.kick.update(dt);
        this.channels.snare.update(dt);
        this.channels.hihat.update(dt);
        
        const bV = this.channels.beat.intensity;
        const dV = this.channels.downbeat.intensity;
        const kV = this.channels.kick.intensity;
        const sV = this.channels.snare.intensity;
        const hV = this.channels.hihat.intensity;
        const eV = this.energyValue;

        const state = {
            beat: this.channels.beat.getState(),
            kick: this.channels.kick.getState(),
            snare: this.channels.snare.getState(),
            hihat: this.channels.hihat.getState(),
            downbeat: this.channels.downbeat.getState(),
            energy: eV,
            liveKick: this.liveKick || 0,
            liveBass: this.liveBass || 0,
            liveEnergy: this.liveEnergy || 0,
            
            // Visual Aggregates
            zoom: Math.min(1.0, (kV * this.effectWeights.zoom.kick) + (bV * this.effectWeights.zoom.beat)),
            glow: Math.min(1.0, (eV * this.effectWeights.glow.energy) + (hV * this.effectWeights.glow.hihat)),
            blur: Math.min(1.0, sV * this.effectWeights.blur.snare),
            shake: Math.min(1.0, dV * this.effectWeights.shake.downbeat),
            pulse: Math.min(1.0, (bV * this.effectWeights.pulse.beat) + (kV * this.effectWeights.pulse.kick)),
            progress: bV,
            spectrum: this.currentSpectrum,
            
            musicalFeel: this.feelEngine.update(dt)
        };
        
        return Object.freeze(state);
    }
}

import { beatEngine } from '../BeatEngine.js';
export const audioDrivenRuntime = new AudioDrivenRuntime();

if (beatEngine && beatEngine.onBeat) {
    beatEngine.onBeat((ev) => audioDrivenRuntime.processEvent(ev));
} else if (beatEngine && beatEngine.beatSubscribers && beatEngine.beatSubscribers.add) {
    beatEngine.beatSubscribers.add((ev) => audioDrivenRuntime.processEvent(ev));
}

