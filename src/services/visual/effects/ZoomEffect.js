import { getZoomProfile } from './ZoomProfiles.js';

/**
 * ZoomEffect
 * 
 * Produces an immutable Transform contribution based on MusicalFeel and ZoomStyle.
 */
export class ZoomEffect {
    constructor(styleName = 'Default') {
        this.style = getZoomProfile(styleName);

        this.state = 'IDLE'; // IDLE, ATTACK, HOLD, DECAY, RELEASE
        this.timeInState = 0;
        
        this.currentScale = this.style.baseScale;
        this.velocity = 0;
        this.progress = 0;
        this.lastScale = this.style.baseScale;
        
        this.adaptiveAttack = this.style.baseAttack;
        this.adaptiveDecay = this.style.baseDecay;
        this.adaptiveRelease = this.style.baseRelease;

        // Zero-allocation rolling window buffer (32 beats)
        this._punchHistory = new Float32Array(32);
        this._punchIndex = 0;
        this._punchCount = 0;

        // Pre-allocated output structure
        this._output = {
            scale: this.style.baseScale,
            velocity: 0,
            progress: 0,
            state: 'IDLE',
            adaptiveAttack: 0,
            adaptiveDecay: 0,
            adaptiveRelease: 0
        };
    }

    setStyle(styleName) {
        this.style = getZoomProfile(styleName);
    }

    _curveEaseOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
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
        const liveKick = audioDrivenState.liveKick || (audioDrivenState.kick ? audioDrivenState.kick.intensity : 0) || 0;
        const liveBass = audioDrivenState.liveBass || 0;

        const kickTrigger = (audioDrivenState.kick && audioDrivenState.kick.justTriggered) || 
                            (audioDrivenState.beat && audioDrivenState.beat.justTriggered) || 
                            (audioDrivenState.downbeat && audioDrivenState.downbeat.justTriggered);

        // Auto-Calibration Mapping (zero allocations)
        // Agility inversely affects time -> high agility = shorter time
        const agilityFactor = Math.max(0.1, feel.agility + this.style.momentumBoost);
        this.adaptiveAttack = this.style.baseAttack / agilityFactor;
        
        // Sustain directly affects time
        const sustainFactor = Math.max(0.1, feel.sustain);
        this.adaptiveDecay = this.style.baseDecay * sustainFactor;
        this.adaptiveRelease = this.style.baseRelease * sustainFactor;
        
        const scaleRange = Math.max(0.0, this.style.maxScale - this.style.baseScale);

        // Trigger logic
        if (kickTrigger && this.state !== 'ATTACK') {
            let targetMaxScale = this.style.maxScale;
            
            if (feel.punch > 0) {
                // Rolling Window 32 beats (Zero-Allocation Circular Buffer)
                this._punchHistory[this._punchIndex] = feel.punch;
                this._punchIndex = (this._punchIndex + 1) % 32;
                if (this._punchCount < 32) this._punchCount++;
                
                let minP = Infinity, maxP = -Infinity;
                for (let i = 0; i < this._punchCount; i++) {
                    const p = this._punchHistory[i];
                    if (p < minP) minP = p;
                    if (p > maxP) maxP = p;
                }
                
                // Mencegah range collapse pas chorus: paksa minimal range 0.35
                const effectiveMin = Math.min(minP, maxP - 0.35);
                const range = maxP - effectiveMin;
                const normalizedPunch = Math.max(0.0, Math.min(1.0, (feel.punch - effectiveMin) / range));
                
                // Punch factor maps normalized punch (0 to 1) ke (0.3 to 1.0)
                const punchFactor = 0.3 + (normalizedPunch * 0.7);
                const stabilityFactor = feel.stability > 0 ? Math.min(1.0, Math.max(0.6, feel.stability)) : 1.0;
                
                targetMaxScale = this.style.baseScale + (scaleRange * punchFactor * stabilityFactor);
            }
            
            // Enforce strict upper bound from UI setting
            this.activeMaxScale = Math.min(targetMaxScale, this.style.maxScale);
            this.state = 'ATTACK';
            this.timeInState = 0;
        }

        if (this.state === 'IDLE') {
            const targetBase = this.style.baseScale;
            // Apply smooth exponential return
            if (this.currentScale > targetBase) {
                this.currentScale += (targetBase - this.currentScale) * (1 - Math.exp(-dt * 15));
                if (this.currentScale - targetBase < 0.001) {
                    this.currentScale = targetBase;
                }
            } else {
                this.currentScale = targetBase;
            }
            this.velocity = 0;
            this.progress = 0;
            return this._getOutput();
        }

        this.timeInState += dt;

        if (this.state === 'ATTACK') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveAttack);
            const factor = this._evaluateCurve(this.progress);
            this.currentScale = this.style.baseScale + (this.activeMaxScale - this.style.baseScale) * factor;

            if (this.progress >= 1.0) {
                this.state = 'HOLD';
                this.timeInState = 0;
            }
        } else if (this.state === 'HOLD') {
            this.progress = 1.0;
            this.currentScale = this.activeMaxScale;

            if (this.timeInState >= this.style.baseHold) {
                this.state = 'DECAY';
                this.timeInState = 0;
            }
        } else if (this.state === 'DECAY') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveDecay);
            const factor = 1.0 - this._evaluateCurve(this.progress);
            this.currentScale = this.style.baseScale + (this.activeMaxScale - this.style.baseScale) * factor;

            if (this.progress >= 1.0) {
                this.state = 'RELEASE';
                this.timeInState = 0;
            }
        } else if (this.state === 'RELEASE') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveRelease);
            this.currentScale = this.style.baseScale;

            if (this.progress >= 1.0) {
                this.state = 'IDLE';
                this.timeInState = 0;
            }
        }

        this.velocity = (this.currentScale - this.lastScale) / (dt > 0 ? dt : 0.016);
        this.lastScale = this.currentScale;

        return this._getOutput();
    }

    _getOutput() {
        this._output.scale = this.currentScale;
        this._output.velocity = this.velocity;
        this._output.progress = this.progress;
        this._output.state = this.state;
        this._output.adaptiveAttack = this.adaptiveAttack;
        this._output.adaptiveDecay = this.adaptiveDecay;
        this._output.adaptiveRelease = this.adaptiveRelease;
        
        return Object.freeze({ ...this._output });
    }


}
