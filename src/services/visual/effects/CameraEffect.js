import { getCameraProfile } from './CameraProfiles.js';

/**
 * CameraEffect
 * 
 * Translates MusicalFeel and Triggers into Camera movements (shake, impact, momentum).
 * Zero allocations during update().
 */
export class CameraEffect {
    constructor(styleName = 'Default') {
        this.style = getCameraProfile(styleName);

        this.state = 'IDLE'; // IDLE, ATTACK, RECOVERY
        this.timeInState = 0;
        
        // Output properties
        this.posX = 0.0;
        this.posY = 0.0;
        this.rotation = 0.0;
        this.velocity = 0.0;
        this.momentum = 0.0;
        this.zoomBias = 0.0;
        this.shakeX = 0.0;
        this.shakeY = 0.0;
        
        this.progress = 0;
        
        this.adaptiveAttack = 0.05;
        this.adaptiveRecovery = 0.3;

        // Active target states
        this.activeTargetPos = 0.0;
        this.activeTargetRot = 0.0;
        this.activeTargetZoom = 0.0;

        // Pre-allocated output structure
        this._output = {
            posX: 0.0,
            posY: 0.0,
            rotation: 0.0,
            velocity: 0.0,
            momentum: 0.0,
            zoomBias: 0.0,
            shakeX: 0.0,
            shakeY: 0.0,
            state: 'IDLE',
            progress: 0
        };
    }

    setStyle(styleName) {
        this.style = getCameraProfile(styleName);
    }

    _curveEaseOut(t) { return 1 - Math.pow(1 - t, 3); }
    _curveLinear(t) { return t; }
    _curveExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    _curveEaseInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    
    _evaluateCurve(t) {
        if (this.style.recoveryCurve === 'EaseOut') return this._curveEaseOut(t);
        if (this.style.recoveryCurve === 'Linear') return this._curveLinear(t);
        if (this.style.recoveryCurve === 'Expo') return this._curveExpo(t);
        if (this.style.recoveryCurve === 'EaseInOut') return this._curveEaseInOut(t);
        return this._curveEaseOut(t);
    }

    update(dt, audioDrivenState) {
        if (!audioDrivenState || !audioDrivenState.musicalFeel) {
            return this._getOutput();
        }

        const feel = audioDrivenState.musicalFeel;
        const kickTrigger = audioDrivenState.kick ? audioDrivenState.kick.justTriggered : false;
        const downbeatTrigger = audioDrivenState.downbeat ? audioDrivenState.downbeat.justTriggered : false;
        const beatTrigger = audioDrivenState.beat ? audioDrivenState.beat.justTriggered : false;

        // Agility drives attack speed. Higher agility = faster attack.
        const agilityFactor = Math.max(0.1, feel.agility);
        this.adaptiveAttack = 0.05 / agilityFactor;
        
        // Sustain and Momentum drive recovery speed.
        const sustainFactor = Math.max(0.1, feel.sustain);
        this.adaptiveRecovery = 0.25 * sustainFactor * this.style.momentumMultiplier;

        // Impact magnitude based on punch and stability.
        const dampener = feel.stability;
        const impact = feel.punch * dampener;

        // Check triggers
        if (downbeatTrigger || kickTrigger || beatTrigger) {
            this.state = 'ATTACK';
            this.timeInState = 0;
            
            let posMag = 0.0;
            let rotMag = 0.0;
            let zoomMag = 0.0;

            if (downbeatTrigger) {
                posMag = 2.0;
                rotMag = 1.0;
                zoomMag = 0.05;
                this.momentum = Math.min(1.0, this.momentum + 0.5 * this.style.momentumMultiplier);
            } else if (kickTrigger) {
                posMag = 1.0;
                zoomMag = 0.02;
                this.momentum = Math.min(1.0, this.momentum + 0.2 * this.style.momentumMultiplier);
            } else if (beatTrigger) {
                posMag = 0.5;
                rotMag = 0.5;
            }

            this.activeTargetPos = Math.min(5.0, posMag * impact * this.style.positionMultiplier);
            this.activeTargetRot = Math.min(2.0, Math.max(-2.0, rotMag * impact * this.style.rotationMultiplier)); // Clamp rotation to prevent motion sickness
            this.activeTargetZoom = Math.min(0.2, zoomMag * impact * this.style.positionMultiplier);
        }

        // Apply Momentum Friction
        if (this.momentum > 0) {
            this.momentum = Math.max(0, this.momentum - (dt * 0.5 / this.style.momentumMultiplier));
        }

        if (this.state === 'IDLE') {
            // Apply gentle breathing if LoFi
            if (this.style.recoveryCurve === 'Linear' && this.style.shakeMultiplier < 0.5) {
                // Approximate slow sine wave using modulo time
                const breathing = Math.sin(Date.now() * 0.001) * 0.5 * feel.energy;
                this.posX = breathing * this.style.positionMultiplier;
                this.posY = breathing * 0.5 * this.style.positionMultiplier;
            } else {
                this.posX = 0;
                this.posY = 0;
                this.rotation = 0;
                this.zoomBias = 0;
            }
            this.velocity = 0;
            this.progress = 0;
            this.shakeX = 0;
            this.shakeY = 0;
            
            return this._getOutput();
        }

        this.timeInState += dt;

        let previousPosY = this.posY;

        if (this.state === 'ATTACK') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveAttack);
            const factor = this._curveLinear(this.progress); // Linear attack
            
            this.posX = 0;
            this.posY = this.activeTargetPos * factor;
            this.rotation = this.activeTargetRot * factor;
            this.zoomBias = this.activeTargetZoom * factor;
            
            if (this.progress >= 1.0) {
                this.state = 'RECOVERY';
                this.timeInState = 0;
            }
        } else if (this.state === 'RECOVERY') {
            this.progress = Math.min(1.0, this.timeInState / this.adaptiveRecovery);
            const factor = 1.0 - this._evaluateCurve(this.progress);
            
            this.posX = 0;
            this.posY = this.activeTargetPos * factor;
            this.rotation = this.activeTargetRot * factor;
            this.zoomBias = this.activeTargetZoom * factor;

            if (this.progress >= 1.0) {
                this.state = 'IDLE';
                this.timeInState = 0;
            }
        }

        // Calculate velocity based on Y movement
        this.velocity = (this.posY - previousPosY) / (dt > 0 ? dt : 0.016);

        // Calculate Shake (high frequency noise scaled by energy and shakeMultiplier)
        const shakeBase = feel.energy * this.style.shakeMultiplier * this.momentum;
        if (shakeBase > 0) {
            // Pseudo-random high frequency shake without allocations
            const timePhase = Date.now() * 0.05;
            this.shakeX = Math.sin(timePhase) * shakeBase;
            this.shakeY = Math.cos(timePhase * 1.3) * shakeBase;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        return this._getOutput();
    }

    _getOutput() {
        this._output.posX = this.posX;
        this._output.posY = this.posY;
        this._output.rotation = this.rotation;
        this._output.velocity = this.velocity;
        this._output.momentum = this.momentum;
        this._output.zoomBias = this.zoomBias;
        this._output.shakeX = this.shakeX;
        this._output.shakeY = this.shakeY;
        this._output.state = this.state;
        this._output.progress = this.progress;
        
        return this._output;
    }
}
