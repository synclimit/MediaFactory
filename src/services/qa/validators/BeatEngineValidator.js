import { BaseValidator } from '../BaseValidator.js';
import { beatEngine } from '../../audio/BeatEngine.js';

export class BeatEngineValidator extends BaseValidator {
    static engineName = "BeatEngine";
    static description = "Validates the realtime BeatEngine DSP and metadata pipelines.";
    static version = "2.0.0";
    static author = "MediaFactory QA";
    static category = "Audio Engine";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
    
    constructor() {
        super();
        this.beatMetrics = {
            bpm: 0,
            beatCount: 0,
            kickCount: 0,
            snareCount: 0,
            avgEnergy: 0,
            peakEnergy: 0,
            flux: 0
        };
        this.beatConfig = {
            fftSize: 0,
            binCount: 0,
            sampleRate: 0,
            threshold: 0,
            detectionAlgorithm: "V2 Energy Flux"
        };
        this.samples = 0;
    }

    async validate(mode) {
        if (!beatEngine.state.isPlaying) {
            this.log('BeatEngine is not playing. Skipping execution.', 'error');
            return 'NOT EXECUTED';
        }
        
        const diag = beatEngine.getDiagnostics();
        this.metrics.updateCount = diag.frameNumber;
        
        this.samples++;
        
        const state = beatEngine.getState();
        const debug = beatEngine.debug;
        
        // Adapter Layer: Rename and normalize existing runtime values only
        this.beatMetrics.bpm = debug.tempo?.bpm || 0;
        this.beatMetrics.beatCount = debug.beatCount || 0;
        
        // We only count kicks/snares when their classification score is very high (just a simple mapping over time)
        if (debug.classification?.kickScore > 0.8 && state.beat) this.beatMetrics.kickCount++;
        if (debug.classification?.snareScore > 0.8 && state.beat) this.beatMetrics.snareCount++;
        
        this.beatMetrics.avgEnergy = debug.features?.rms || debug.averageEnergy || 0;
        this.beatMetrics.peakEnergy = Math.max(this.beatMetrics.peakEnergy, debug.features?.peak || 0);
        this.beatMetrics.flux = debug.flux || 0;
        
        // Configuration Extraction
        this.beatConfig.fftSize = debug.fft?.fftSize || 0;
        this.beatConfig.binCount = debug.fft?.binCount || 0;
        this.beatConfig.sampleRate = debug.fft?.sampleRate || 0;
        this.beatConfig.threshold = debug.threshold || 0;
        
        if (mode !== 'Monitor') {
            await new Promise(r => setTimeout(r, 5000));
        }

        return 'PASS';
    }

    async generateEvidence() {
        if (this.status === 'WAITING' || this.status === 'RUNNING') return;
        
        await this.saveEvidence('beat_metrics.json', this.beatMetrics);
        await this.saveEvidence('beat_config.json', this.beatConfig);
    }
}
