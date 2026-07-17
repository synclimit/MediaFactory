import { getBlurProfile } from './BlurProfiles.js';

/**
 * BlurEffect
 * 
 * Generates dynamic blur parameters based on audio triggers and musical feel.
 * Zero allocations inside update().
 */
export class BlurEffect {
    constructor(styleName = 'Gaussian') {
        this.style = getBlurProfile(styleName);

        this.radius = 0.0;
        this.direction = 0.0;
        this.strength = 0.0;

        this.currentEnergy = 0.0;

        // Pre-allocated output structure
        this._output = {
            radius: 0.0,
            direction: 0.0,
            strength: 0.0
        };
    }

    setStyle(styleName) {
        this.style = getBlurProfile(styleName);
    }

    update(dt, audioDrivenState) {
        if (!audioDrivenState || !audioDrivenState.musicalFeel || !this.style.reactive) {
            return this._getOutput();
        }

        const feel = audioDrivenState.musicalFeel;
        const kickTrigger = audioDrivenState.kick ? audioDrivenState.kick.justTriggered : false;
        const downbeatTrigger = audioDrivenState.downbeat ? audioDrivenState.downbeat.justTriggered : false;

        let impulse = 0.0;
        if (downbeatTrigger) impulse = 1.0;
        else if (kickTrigger) impulse = 0.5;

        // Aggressive smooth decay based on agility and recovery speed to preserve readability
        const decayRate = dt * 15.0 * Math.max(0.5, feel.agility) * this.style.recoverySpeed;
        this.currentEnergy = Math.max(0.0, this.currentEnergy - decayRate);
        
        // Add impulse scaled by punch
        if (impulse > 0) {
            this.currentEnergy = Math.min(1.0, this.currentEnergy + impulse * feel.punch);
        }

        // Apply style multipliers and current state
        this.radius = this.currentEnergy * this.style.radiusMultiplier * feel.energy;
        this.strength = this.currentEnergy * this.style.strengthMultiplier * feel.sustain;
        this.direction = this.style.direction; // Static per profile or could be modulated

        return this._getOutput();
    }

    _getOutput() {
        this._output.radius = this.radius;
        this._output.direction = this.direction;
        this._output.strength = this.strength;
        
        return this._output;
    }
}
