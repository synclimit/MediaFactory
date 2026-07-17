/**
 * VisualComposition
 * 
 * Preallocated presentation state that acts as the single source of truth for the Renderer.
 * Grouped into specific visual categories.
 * Mutated via double-buffering in VisualRuntime. The Renderer observes it as immutable.
 */
export class VisualComposition {
    constructor() {
        this.transform = {
            scale: 1.0,
            anchorX: 0.5,
            anchorY: 0.5,
            offsetX: 0.0,
            offsetY: 0.0,
            rotation: 0.0
        };

        this.camera = {
            shakeX: 0.0,
            shakeY: 0.0,
            zoom: 1.0,
            roll: 0.0,
            posX: 0.0,
            posY: 0.0,
            velocity: 0.0,
            momentum: 0.0,
            zoomBias: 0.0
        };

        this.postProcess = {
            brightness: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            blur: 0.0, // Used as Blur Radius
            blurDirection: 0.0,
            blurStrength: 0.0,
            glow: 0.0,
            glowIntensity: 0.0,
            glowRadius: 0.0,
            glowOpacity: 0.0
        };
        
        this.overlay = {
            opacity: 0.0,
            color: '#000000',
            particleSpawnRate: 0.0,
            particleBurstCount: 0,
            particleVelocity: 0.0,
            particleSpread: 0.0,
            particleLifetime: 0.0,
            particleOpacity: 0.0
        };

        this.geometry = {
            spectrumBands: 64,
            spectrumHeights: new Float32Array(64),
            spectrumPeak: 0.0,
            spectrumColorWeight: 0.0
        };
        
        this.debug = {
            activeEffects: []
        };
    }

    /**
     * Resets the composition to a neutral baseline frame.
     * Zero allocations.
     */
    reset() {
        this.transform.scale = 1.0;
        this.transform.anchorX = 0.5;
        this.transform.anchorY = 0.5;
        this.transform.offsetX = 0.0;
        this.transform.offsetY = 0.0;
        this.transform.rotation = 0.0;

        this.camera.shakeX = 0.0;
        this.camera.shakeY = 0.0;
        this.camera.zoom = 1.0;
        this.camera.roll = 0.0;
        this.camera.posX = 0.0;
        this.camera.posY = 0.0;
        this.camera.velocity = 0.0;
        this.camera.momentum = 0.0;
        this.camera.zoomBias = 0.0;

        this.postProcess.brightness = 1.0;
        this.postProcess.contrast = 1.0;
        this.postProcess.saturation = 1.0;
        this.postProcess.blur = 0.0;
        this.postProcess.blurDirection = 0.0;
        this.postProcess.blurStrength = 0.0;
        this.postProcess.glow = 0.0;
        this.postProcess.glowIntensity = 0.0;
        this.postProcess.glowRadius = 0.0;
        this.postProcess.glowOpacity = 0.0;

        this.overlay.opacity = 0.0;
        this.overlay.color = '#000000';
        this.overlay.particleSpawnRate = 0.0;
        this.overlay.particleBurstCount = 0;
        this.overlay.particleVelocity = 0.0;
        this.overlay.particleSpread = 0.0;
        this.overlay.particleLifetime = 0.0;
        this.overlay.particleOpacity = 0.0;

        this.geometry.spectrumHeights.fill(0);
        this.geometry.spectrumPeak = 0.0;
        this.geometry.spectrumColorWeight = 0.0;
        
        this.debug.activeEffects.length = 0;
    }
}
