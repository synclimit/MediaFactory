import { getParticleProfile } from './ParticleProfiles.js';

/**
 * ParticleEffect
 * 
 * Generates emission parameters (spawn rates, burst counts) driven by audio.
 * It DOES NOT simulate individual particles, but passes parameters to the Renderer.
 * Zero allocations during update().
 */
export class ParticleEffect {
    constructor(styleName = 'Burst') {
        this.style = getParticleProfile(styleName);

        this.spawnRate = 0.0;
        this.burstCount = 0;
        this.velocity = 0.0;
        this.spread = 0.0;
        this.lifetime = 0.0;
        this.opacity = 0.0;

        // Pre-allocated output structure
        this._output = {
            spawnRate: 0.0,
            burstCount: 0,
            velocity: 0.0,
            spread: 0.0,
            lifetime: 0.0,
            opacity: 0.0
        };
    }

    setStyle(styleName) {
        this.style = getParticleProfile(styleName);
    }

    update(dt, audioDrivenState) {
        if (!audioDrivenState || !audioDrivenState.musicalFeel) {
            return this._getOutput();
        }

        const feel = audioDrivenState.musicalFeel;
        const kickTrigger = audioDrivenState.kick ? audioDrivenState.kick.justTriggered : false;
        const downbeatTrigger = audioDrivenState.downbeat ? audioDrivenState.downbeat.justTriggered : false;
        const confidence = audioDrivenState.confidence || 0;

        // Reset burst count each frame (it's an instantaneous impulse)
        this.burstCount = 0;

        if (this.style.reactive) {
            // Spawn rate scaled by energy and agility, with hard cap for FPS stability
            const activeEnergy = feel.energy * feel.agility * feel.sustain; // Bind density to sustain
            this.spawnRate = Math.min(200, this.style.baseSpawnRate + (activeEnergy * this.style.baseSpawnRate));

            if (downbeatTrigger) {
                this.burstCount = Math.min(100, Math.floor(this.style.burstMultiplier * feel.punch * 2.0));
            } else if (kickTrigger) {
                this.burstCount = Math.min(50, Math.floor(this.style.burstMultiplier * feel.punch));
            }
            
            // Confidence dampens velocity variance
            const variance = 1.0 + (1.0 - feel.stability) * 0.5;
            this.velocity = this.style.velocity * (1.0 + feel.punch) * variance;
            this.spread = this.style.spread * (1.0 + (1.0 - confidence) * 0.2); // Spread increases if uncertain
            this.opacity = this.style.opacity * feel.sustain;
            this.lifetime = this.style.lifetime * feel.sustain;
        } else {
            // Non-reactive (e.g. Rain, Snow, Dust)
            this.spawnRate = this.style.baseSpawnRate;
            this.burstCount = 0;
            this.velocity = this.style.velocity;
            this.spread = this.style.spread;
            this.opacity = this.style.opacity;
            this.lifetime = this.style.lifetime;
        }

        return this._getOutput();
    }

    _getOutput() {
        this._output.spawnRate = this.spawnRate;
        this._output.burstCount = this.burstCount;
        this._output.velocity = this.velocity;
        this._output.spread = this.spread;
        this._output.lifetime = this.lifetime;
        this._output.opacity = this.opacity;
        
        return this._output;
    }
}
