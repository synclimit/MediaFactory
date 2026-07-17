import { getGlowProfile } from './GlowProfiles.js';

/**
 * GlowEffect
 * 
 * Produces immutable Glow contributions based on MusicalFeel and GlowStyle.
 * Base properties (intensity, radius, opacity) are always 0.0 when idle.
 * Uses stability as a peak dampener.
 */
export class GlowEffect {
    constructor(styleName = 'Default') {
        this.style = getGlowProfile(styleName);

        this.state = 'IDLE'; // IDLE, ATTACK, HOLD, DECAY, RELEASE
        this.timeInState = 0;
        
        this.currentIntensity = 0.0;
        this.currentRadius = 0.0;
        this.currentOpacity = 0.0;
        
        this.progress = 0;
        
        this.adaptiveAttack = this.style.baseAttack;
        this.adaptiveDecay = this.style.baseDecay;
        this.adaptiveRelease = this.style.baseRelease;

        // Target active states
        this.activeIntensity = 0.0;
        this.activeRadius = 0.0;
        this.activeOpacity = 0.0;

        // Pre-allocated output structure
        this._output = {
            intensity: 0.0,
            radius: 0.0,
            opacity: 0.0,
            progress: 0,
            state: 'IDLE',
            adaptiveAttack: 0,
            adaptiveDecay: 0,
            adaptiveRelease: 0
        };
    }

    setStyle(styleName) {
        this.style = getGlowProfile(styleName);
    }

    _curveEaseOut(t) { return 1 - Math.pow(1 - t, 3); }
    _curveLinear(t) { return t; }
    _curveExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    _curveEaseInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    
    _evaluateCurve(t) {
        if (this.style.curve === 'EaseOut') return this._curveEaseOut(t);
        if (this.style.curve === 'Linear') return this._curveLinear(t);
        if (this.style.curve === 'Expo') return this._curveExpo(t);
        if (this.style.curve === 'EaseInOut') return this._curveEaseInOut(t);
        return this._curveEaseOut(t);
    }

    update(dt, audioDrivenState) {
        if (!audioDrivenState || !audioDrivenState.musicalFeel) {
            return this._getOutput();
        }

        const feel = audioDrivenState.musicalFeel;
        const kickTrigger = audioDrivenState.kick ? audioDrivenState.kick.justTriggered : false;
        const snareTrigger = audioDrivenState.snare ? audioDrivenState.snare.justTriggered : false;
        const downbeatTrigger = audioDrivenState.downbeat ? audioDrivenState.downbeat.justTriggered : false;

        // Auto-Calibration Mapping (zero allocations)
        const agilityFactor = Math.max(0.1, feel.agility + this.style.momentumBoost);
        this.adaptiveAttack = this.style.baseAttack / agilityFactor;
        
        const sustainFactor = Math.max(0.1, feel.sustain);
        this.adaptiveDecay = this.style.baseDecay * sustainFactor;
        this.adaptiveRelease = this.style.baseRelease * sustainFactor;
        
        // Target peaks: dampening uses stability. High stability = less dampening, low stability = more dampening
        // Stability ranges from 0 to 1. E.g. stability 1.0 => dampener = 1.0; stability 0.2 => dampener = 0.2
        const dampener = feel.stability;
        // Jitter dampener can also use groove
        const jitterDampener = (feel.groove > 0) ? feel.groove : 1.0;
        
        const impact = feel.punch * dampener * jitterDampener;

        const targetIntensity = this.style.maxIntensity * impact;
        const targetRadius = this.style.maxRadius * impact;
        const targetOpacity = this.style.maxOpacity * impact;

        // Trigger logic
        if ((kickTrigger || snareTrigger || downbeatTrigger) && this.state !== 'ATTACK') {
            this.state = 'ATTACK';
            this.timeInState = 0;
            this.activeIntensity = targetIntensity;
            this.activeRadius = targetRadius;
            this.activeOpacity = targetOpacity;
        }

        if (this.state === 'IDLE') {
            const decayFactor = 1 - Math.exp(-dt * 10.0);
            if (this.currentIntensity > 0) {
                this.currentIntensity -= this.currentIntensity * decayFactor;
                if (this.currentIntensity < 0.001) this.currentIntensity = 0;
            }
            if (this.currentRadius > 0) {
                this.currentRadius -= this.currentRadius * decayFactor;
                if (this.currentRadius < 0.001) this.currentRadius = 0;
            }
            if (this.currentOpacity > 0) {
                this.currentOpacity -= this.currentOpacity * decayFactor;
                if (this.currentOpacity < 0.001) this.currentOpacity = 0;
            }
            
            this.progress = 0;
            return this._getOutput();
        }

        this.timeInState += dt;

        if (this.state === 'ATTACK') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveAttack);
            const factor = this._evaluateCurve(this.progress);
            
            this.currentIntensity = this.activeIntensity * factor;
            this.currentRadius = this.activeRadius * factor;
            this.currentOpacity = this.activeOpacity * factor;

            if (this.progress >= 1.0) {
                this.state = 'HOLD';
                this.timeInState = 0;
            }
        } else if (this.state === 'HOLD') {
            this.progress = 1.0;
            this.currentIntensity = this.activeIntensity;
            this.currentRadius = this.activeRadius;
            this.currentOpacity = this.activeOpacity;

            if (this.timeInState >= this.style.baseHold) {
                this.state = 'DECAY';
                this.timeInState = 0;
            }
        } else if (this.state === 'DECAY') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveDecay);
            const factor = 1.0 - this._evaluateCurve(this.progress);
            
            this.currentIntensity = this.activeIntensity * factor;
            this.currentRadius = this.activeRadius * factor;
            this.currentOpacity = this.activeOpacity * factor;

            if (this.progress >= 1.0) {
                this.state = 'RELEASE';
                this.timeInState = 0;
            }
        } else if (this.state === 'RELEASE') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveRelease);
            const factor = 1.0 - this._evaluateCurve(this.progress); // In release, it fully fades to 0
            
            // Re-apply decay logic but for release to 0, since release is often a continuation
            // Here we assume decay already dropped it low, but for simplicity, we treat DECAY and RELEASE smoothly
            // Usually DECAY brings it down, and RELEASE fades out the rest. 
            // In Glow's case, base is 0.
            // Let's make DECAY bring it down 50% and RELEASE bring it to 0.
            
            // To be consistent with standard envelope:
            // For Glow, we fade to 0 in DECAY. Wait, ZoomEffect decays to baseScale, then releases to baseScale.
            // Let's just have it fade fully to 0 during DECAY, and stay 0 during RELEASE. 
            // Better yet, scale factor accordingly.
            this.currentIntensity = this.activeIntensity * factor;
            this.currentRadius = this.activeRadius * factor;
            this.currentOpacity = this.activeOpacity * factor;

            if (this.progress >= 1.0) {
                this.currentIntensity = 0;
                this.currentRadius = 0;
                this.currentOpacity = 0;
                this.state = 'IDLE';
                this.timeInState = 0;
            }
        }

        return this._getOutput();
    }

    _getOutput() {
        this._output.intensity = this.currentIntensity;
        this._output.radius = this.currentRadius;
        this._output.opacity = this.currentOpacity;
        this._output.progress = this.progress;
        this._output.state = this.state;
        this._output.adaptiveAttack = this.adaptiveAttack;
        this._output.adaptiveDecay = this.adaptiveDecay;
        this._output.adaptiveRelease = this.adaptiveRelease;
        
        return Object.freeze({ ...this._output });
    }
}
