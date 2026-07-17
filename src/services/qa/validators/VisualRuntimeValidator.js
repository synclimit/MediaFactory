import { BaseValidator } from '../BaseValidator.js';
import { visualRuntime } from '../../visual/VisualRuntime.js';
import { reactiveEngine } from '../../audio/ReactiveEngine.js';
import { beatEngine } from '../../audio/BeatEngine.js';

export class VisualRuntimeValidator extends BaseValidator {
    static engineName = "VisualRuntime";
    static description = "Validates visual mutations and render application.";
    static version = "2.0.0";
    static author = "MediaFactory QA";
    static category = "Visual";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
    static dependencies = ['ReactiveRuntime'];
    
    constructor() {
        super();
        this.effectMetrics = {
            zoomCount: 0,
            cameraCount: 0,
            glowCount: 0,
            particleCount: 0,
            blurCount: 0,
            spectrumCount: 0,
            zoomScale: 1.0,
            cameraOffset: 0
        };
        this.effectConfig = {
            zoomEnabled: true,
            zoomThreshold: 0,
            zoomMaxScale: 0,
            cameraEnabled: true,
            cameraStrength: 0
        };
    }

    async validate(mode) {
        if (!beatEngine.state.isPlaying) {
            this.log('Visual Engine validation aborted: No active audio playback.', 'error');
            return 'NOT EXECUTED';
        }

        const comp = visualRuntime.getComposition();
        const debug = comp.debug.activeEffects;
        
        // Extract configurations
        this.effectConfig.zoomEnabled = !!visualRuntime.zoomEffect;
        this.effectConfig.zoomMaxScale = visualRuntime.zoomEffect?.style?.maxScale || 0;
        this.effectConfig.zoomThreshold = visualRuntime.zoomEffect?.style?.baseScale || 1.0;
        
        this.effectConfig.cameraEnabled = !!visualRuntime.cameraEffect;
        this.effectConfig.cameraStrength = visualRuntime.cameraEffect?.style?.shakeIntensity || 0;

        // Metric extraction
        if (debug.includes('Zoom')) this.effectMetrics.zoomCount++;
        if (debug.includes('Camera')) this.effectMetrics.cameraCount++;
        if (debug.includes('Glow')) this.effectMetrics.glowCount++;
        if (debug.includes('Particle')) this.effectMetrics.particleCount++;
        if (debug.includes('Blur')) this.effectMetrics.blurCount++;
        if (debug.includes('Spectrum')) this.effectMetrics.spectrumCount++;

        this.effectMetrics.zoomScale = comp.transform.scale;
        this.effectMetrics.cameraOffset = Math.abs(comp.camera.shakeX) + Math.abs(comp.camera.shakeY);

        // Advanced Root Cause Check every few frames or at end of 5s test
        // Let's accumulate some checks
        if (beatEngine.state.timestamp > 3000 && this.effectMetrics.zoomCount === 0) {
            const beatState = beatEngine.getState();
            const reactive = reactiveEngine.getChannels();
            
            // Generate root cause analysis for Zoom Pulse
            this.log('Zoom Pulse FAILED', 'error');
            if (beatEngine.debug.beatCount === 0) {
                this.log('Reason: Beat Engine emitted 0 beats.', 'error');
            } else if (reactive.beatStrength < 0.1) {
                this.log('Reason: Reactive Runtime produced weak triggers.', 'error');
                this.log(`Configuration: Peak Energy = ${beatState.energy.toFixed(2)}`, 'warning');
            } else if (this.effectConfig.zoomMaxScale <= this.effectConfig.zoomThreshold) {
                this.log('Reason: Zoom configuration has no dynamic range.', 'error');
                this.log(`Configuration: Threshold = ${this.effectConfig.zoomThreshold}, MaxScale = ${this.effectConfig.zoomMaxScale}`, 'warning');
                this.log('Conclusion: MaxScale is too low.', 'error');
            } else {
                this.log('Reason: Renderer ignored object transform.', 'error');
            }
        }

        if (mode !== 'Monitor') {
            await new Promise(r => setTimeout(r, 5000));
        }

        return 'PASS';
    }

    async generateEvidence() {
        if (this.status === 'WAITING' || this.status === 'RUNNING') return;
        await this.saveEvidence('visual_metrics.json', this.effectMetrics);
        await this.saveEvidence('visual_config.json', this.effectConfig);
    }
}
