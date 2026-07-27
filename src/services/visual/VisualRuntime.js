import { ZoomEffect } from './effects/ZoomEffect.js';
import { GlowEffect } from './effects/GlowEffect.js';
import { CameraEffect } from './effects/CameraEffect.js';
import { ParticleEffect } from './effects/ParticleEffect.js';
import { BlurEffect } from './effects/BlurEffect.js';
import { SpectrumEffect } from './effects/SpectrumEffect.js';
import { VisualComposition } from './VisualComposition.js';

/**
 * VisualRuntime
 * 
 * Orchestrates all visual effects and compiles their outputs into a single VisualComposition.
 * Uses a double-buffering pattern to ensure the Renderer always receives an immutable
 * composition without creating per-frame allocations.
 */
export class VisualRuntime {
    constructor() {
        // Initialize Effects
        this.zoomEffect = new ZoomEffect('Default');
        this.glowEffect = new GlowEffect('Default');
        this.cameraEffect = new CameraEffect('Default');
        this.particleEffect = new ParticleEffect('Burst');
        this.blurEffect = new BlurEffect('Gaussian');
        this.spectrumEffect = new SpectrumEffect('Classic');
        
        // Double Buffers
        this.buffers = [new VisualComposition(), new VisualComposition()];
        this.writeIndex = 0;
    }

    setZoomStyle(styleName) {
        if (this.zoomEffect) {
            this.zoomEffect.setStyle(styleName);
        }
    }

    setGlowStyle(styleName) {
        if (this.glowEffect) {
            this.glowEffect.setStyle(styleName);
        }
    }

    setCameraStyle(styleName) {
        if (this.cameraEffect) {
            this.cameraEffect.setStyle(styleName);
        }
    }

    setParticleStyle(styleName) {
        if (this.particleEffect) {
            this.particleEffect.setStyle(styleName);
        }
    }

    setBlurStyle(styleName) {
        if (this.blurEffect) {
            this.blurEffect.setStyle(styleName);
        }
    }

    setSpectrumStyle(styleName) {
        if (this.spectrumEffect) {
            this.spectrumEffect.setStyle(styleName);
        }
    }

    /**
     * @param {number} dt Delta time in seconds
     * @param {Object} audioDrivenState The AudioDrivenAdapter output
     * @returns {VisualComposition}
     */
    update(dt, audioDrivenState, objects = null) {
        // 1. Swap Buffers
        this.writeIndex = (this.writeIndex + 1) % 2;
        const writeComp = this.buffers[this.writeIndex];

        // 2. Reset Write Buffer to Baseline
        writeComp.reset();

        // RUNTIME CONTRACT VALIDATION
        if (!audioDrivenState || !audioDrivenState.musicalFeel || !audioDrivenState.kick || audioDrivenState.kick.justTriggered === undefined) {
            console.warn("[VisualRuntime] Invalid or missing audioDrivenState. Aborting visual update.");
            return writeComp;
        }

        // 3. Sync Active Effects from Scene Objects
        let isZoomActive = true; // Default to true for standalone validation/legacy calls
        if (objects && Array.isArray(objects)) {
            const activeZoomObj = objects.find(o => 
                (o.type === 'effect' || o.type === 'reactive') && 
                (o.effect === 'Zoom Pulse' || o.presetId === 'zoom-pulse' || o.name === 'Scale Pulse' || o.presetId === 'scale_pulse_default' || o.presetId === 'zoom_pulse_default') && 
                o.enabled !== false
            );
            if (activeZoomObj) {
                isZoomActive = true;
                const styleMapping = {
                    'Natural': 'Default',
                    'Soft': 'Pop',
                    'Bass': 'Rock',
                    'Cinematic': 'Cinematic',
                    'EDM': 'EDM',
                    'Hyper': 'Metal'
                };
                const styleName = styleMapping[activeZoomObj.name] || activeZoomObj.name || 'Default';
                if (this._lastZoomStyleName !== styleName) {
                    this.setZoomStyle(styleName);
                    this._lastZoomStyleName = styleName;
                }
                
                // Allow dynamic override from UI
                let dynamicDepth = activeZoomObj.props?.depth;
                if (dynamicDepth === undefined) {
                    dynamicDepth = activeZoomObj.amplitude;
                }
                
                if (dynamicDepth !== undefined) {
                    // Skala amplitudo dikembalikan ke /400 untuk pengujian terisolasi
                    this.zoomEffect.style.maxScale = this.zoomEffect.style.baseScale + (dynamicDepth / 400);
                }
            } else {
                isZoomActive = false;
            }
        }

        // 4. Update Effects and Apply Contributions (Zero allocations, Deterministic)
        const zoomState = this.zoomEffect.update(dt, audioDrivenState);
        if (isZoomActive && zoomState.scale !== 1.0) {
            writeComp.transform.scale *= zoomState.scale;
            writeComp.debug.activeEffects.push('Zoom');
        }
        writeComp.debug.zoom = {
            value: zoomState.scale - 1.0,
            velocity: this.zoomEffect.velocity || 0,
            impulse: this.zoomEffect.state === 'ATTACK' ? (this.zoomEffect.activeMaxScale - 1.0) : (this.zoomEffect.state !== 'IDLE' ? (this.zoomEffect.activeMaxScale - 1.0) : 0),
            state: this.zoomEffect.state,
            rawPunch: audioDrivenState && audioDrivenState.musicalFeel ? Number(audioDrivenState.musicalFeel.punch.toFixed(4)) : 0,
            confidence: audioDrivenState && audioDrivenState.musicalFeel ? Number(audioDrivenState.musicalFeel.confidence.toFixed(4)) : 0,
            kickTrigger: audioDrivenState && audioDrivenState.kick ? !!audioDrivenState.kick.justTriggered : false
        };

        const glowState = this.glowEffect.update(dt, audioDrivenState);
        if (glowState.intensity > 0 || glowState.radius > 0 || glowState.opacity > 0) {
            writeComp.postProcess.glowIntensity += glowState.intensity;
            writeComp.postProcess.glowRadius += glowState.radius;
            writeComp.postProcess.glowOpacity += glowState.opacity;
            writeComp.debug.activeEffects.push('Glow');
        }

        const cameraState = this.cameraEffect.update(dt, audioDrivenState);
        if (cameraState.state !== 'IDLE' || cameraState.shakeX !== 0 || cameraState.shakeY !== 0) {
            writeComp.camera.posX += cameraState.posX;
            writeComp.camera.posY += cameraState.posY;
            writeComp.camera.roll += cameraState.rotation;
            writeComp.camera.velocity = cameraState.velocity;
            writeComp.camera.momentum = cameraState.momentum;
            writeComp.camera.zoomBias += cameraState.zoomBias;
            writeComp.camera.shakeX += cameraState.shakeX;
            writeComp.camera.shakeY += cameraState.shakeY;
            writeComp.debug.activeEffects.push('Camera');
        }

        const particleState = this.particleEffect.update(dt, audioDrivenState);
        if (particleState.spawnRate > 0 || particleState.burstCount > 0) {
            writeComp.overlay.particleSpawnRate += particleState.spawnRate;
            writeComp.overlay.particleBurstCount += particleState.burstCount;
            writeComp.overlay.particleVelocity = particleState.velocity;
            writeComp.overlay.particleSpread = particleState.spread;
            writeComp.overlay.particleLifetime = particleState.lifetime;
            writeComp.overlay.particleOpacity = particleState.opacity;
            writeComp.debug.activeEffects.push('Particle');
        }

        const blurState = this.blurEffect.update(dt, audioDrivenState);
        if (blurState.radius > 0 || blurState.strength > 0) {
            writeComp.postProcess.blur += blurState.radius;
            writeComp.postProcess.blurDirection = blurState.direction;
            writeComp.postProcess.blurStrength += blurState.strength;
            writeComp.debug.activeEffects.push('Blur');
        }

        const spectrumState = this.spectrumEffect.update(dt, audioDrivenState);
        writeComp.geometry.spectrumBands = spectrumState.bands;
        writeComp.geometry.spectrumPeak = spectrumState.peak;
        writeComp.geometry.spectrumColorWeight = spectrumState.colorWeight;
        // Copy array values to avoid allocation
        for (let i = 0; i < spectrumState.bands; i++) {
            writeComp.geometry.spectrumHeights[i] = spectrumState.heights[i];
        }
        writeComp.debug.activeEffects.push('Spectrum');

        return writeComp;
    }

    getComposition() {
        // Returns the buffer that was completely written in the last update.
        // It acts as immutable until the next swap.
        return this.buffers[this.writeIndex];
    }
}

export const visualRuntime = new VisualRuntime();
