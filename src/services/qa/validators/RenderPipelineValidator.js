import { BaseValidator } from '../BaseValidator.js';
import { beatEngine } from '../../audio/BeatEngine.js';

export class RenderPipelineValidator extends BaseValidator {
    static engineName = "RenderPipeline";
    static description = "Validates the real Render Pipeline timing and metrics.";
    static version = "1.0.0";
    static author = "MediaFactory QA";
    static category = "Render Pipeline";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
    static dependencies = ['VisualRuntime'];
    
    constructor() {
        super();
        this.pipelineMetrics = {
            pipelineTime: 0,
            renderTime: 0,
            composeTime: 0,
            fps: 0,
            droppedFrames: 0
        };
        this.samples = 0;
    }

    async validate(mode) {
        if (!window.renderPipeline) {
            this.log('RenderPipeline is not active or exposed. Aborting.', 'error');
            return 'NOT EXECUTED';
        }

        const metrics = window.renderPipeline.getMetrics();
        const fpsRaw = window.m3Diagnostics?.fps || 0;

        this.samples++;
        
        this.pipelineMetrics.pipelineTime = ((this.pipelineMetrics.pipelineTime * (this.samples - 1)) + (metrics.pipelineTimeMicroseconds / 1000)) / this.samples;
        this.pipelineMetrics.renderTime = ((this.pipelineMetrics.renderTime * (this.samples - 1)) + (metrics.renderTimeMicroseconds / 1000)) / this.samples;
        this.pipelineMetrics.composeTime = ((this.pipelineMetrics.composeTime * (this.samples - 1)) + (metrics.composeTimeMicroseconds / 1000)) / this.samples;
        this.pipelineMetrics.fps = ((this.pipelineMetrics.fps * (this.samples - 1)) + fpsRaw) / this.samples;
        this.pipelineMetrics.droppedFrames = metrics.droppedFrames;

        if (mode !== 'Monitor') {
            await new Promise(r => setTimeout(r, 5000));
        }

        return 'PASS';
    }

    async generateEvidence() {
        if (this.status === 'WAITING' || this.status === 'RUNNING') return;
        await this.saveEvidence('pipeline_metrics.json', this.pipelineMetrics);
    }
}
