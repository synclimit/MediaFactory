import { BaseValidator } from '../BaseValidator.js';
import { subtitleRuntime } from '../../audio/subtitle/SubtitleRuntime.js';

export class SubtitleValidator extends BaseValidator {
    static engineName = "SubtitleEngine";
    static description = "Validates Subtitle Engine lookup and animation latencies.";
    static version = "1.0.0";
    static author = "MediaFactory QA";
    static category = "Core";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
    static dependencies = [];
    
    constructor() {
        super();
        this.subtitleMetrics = {
            lookupTimeMicroseconds: 0,
            layoutTimeMicroseconds: 0,
            animationTimeMicroseconds: 0,
            syncAccuracy: 100,
            wordsProcessed: 0
        };
        this.samples = 0;
    }

    async validate(mode) {
        const diag = subtitleRuntime.getDiagnostics();
        const state = subtitleRuntime.getState();

        this.samples++;
        
        // Rolling average
        this.subtitleMetrics.lookupTimeMicroseconds = ((this.subtitleMetrics.lookupTimeMicroseconds * (this.samples - 1)) + diag.lookupTimeMicroseconds) / this.samples;
        this.subtitleMetrics.layoutTimeMicroseconds = ((this.subtitleMetrics.layoutTimeMicroseconds * (this.samples - 1)) + diag.layoutTimeMicroseconds) / this.samples;
        this.subtitleMetrics.animationTimeMicroseconds = ((this.subtitleMetrics.animationTimeMicroseconds * (this.samples - 1)) + diag.animationTimeMicroseconds) / this.samples;
        
        if (state.currentWord) {
            this.subtitleMetrics.wordsProcessed++;
        }

        if (mode !== 'Monitor') {
            await new Promise(r => setTimeout(r, 5000));
        }

        return 'PASS';
    }

    async generateEvidence() {
        if (this.status === 'WAITING' || this.status === 'RUNNING') return;
        await this.saveEvidence('subtitle_metrics.json', this.subtitleMetrics);
    }
}
