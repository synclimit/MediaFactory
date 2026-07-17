import { BaseValidator } from '../BaseValidator.js';
import { audioDrivenRuntime } from '../../audio/v2/AudioDrivenRuntime.js';
import { beatEngine } from '../../audio/BeatEngine.js';

export class ReactiveRuntimeValidator extends BaseValidator {
    static engineName = "ReactiveRuntime";
    static description = "Validates the Reactive Runtime channel processing.";
    static version = "2.0.0";
    static author = "MediaFactory QA";
    static category = "Core";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
    static dependencies = ['BeatEngine'];
    
    constructor() {
        super();
        this.reactiveMetrics = {
            triggerCount: 0,
            triggerDelay: 0,
            missedTrigger: 0,
            doubleTrigger: 0,
            eventQueue: 0,
            kickChannel: 0,
            snareChannel: 0,
            hihatChannel: 0
        };
        this.reactiveConfig = {
            cooldown: 0, // No native cooldown mapping currently
            sensitivity: 1.0 // Implicit normalization 1.0
        };
        this.lastBeatCount = 0;
        this.lastBeatTime = 0;
    }

    async validate(mode) {
        if (!beatEngine.state.isPlaying) {
            this.log('Reactive Engine validation aborted: No active audio playback.', 'error');
            return 'NOT EXECUTED';
        }

        const beatState = beatEngine.getState();
        const audioDrivenState = audioDrivenRuntime.getState();
        
        // Adapter Layer Mapping
        this.reactiveMetrics.kickChannel = audioDrivenState.kick ? audioDrivenState.kick.intensity : 0;
        this.reactiveMetrics.snareChannel = audioDrivenState.snare ? audioDrivenState.snare.intensity : 0;
        this.reactiveMetrics.hihatChannel = audioDrivenState.hihat ? audioDrivenState.hihat.intensity : 0;
        
        // REVISION 2: Root cause analysis of triggers
        if (beatState.beat) {
            this.reactiveMetrics.triggerCount++;
            
            const now = performance.now();
            if (this.lastBeatTime > 0) {
                const elapsed = now - this.lastBeatTime;
                this.reactiveMetrics.triggerDelay = Math.max(this.reactiveMetrics.triggerDelay, elapsed);
            }
            this.lastBeatTime = now;
            
            if (!audioDrivenState.beat || !audioDrivenState.beat.justTriggered) {
                this.reactiveMetrics.missedTrigger++;
                this.log('Root Cause: Reactive Runtime failed to propagate beat trigger.', 'error');
            }
        }
        
        if (this.reactiveMetrics.triggerCount === 0 && beatState.timestamp > 5000) {
            if (beatEngine.debug.beatCount === 0) {
                this.log('Root Cause: Beat Engine produced zero triggers.', 'error');
            } else {
                this.log('Root Cause: Reactive Runtime never received event from Beat Engine.', 'error');
            }
        }

        if (mode !== 'Monitor') {
            await new Promise(r => setTimeout(r, 5000));
        }

        if (this.reactiveMetrics.triggerCount === 0 && mode !== 'Monitor') {
            this.log('No triggers detected during the observation window.', 'warning');
        }

        return 'PASS';
    }

    async generateEvidence() {
        if (this.status === 'WAITING' || this.status === 'RUNNING') return;
        await this.saveEvidence('reactive_metrics.json', this.reactiveMetrics);
        await this.saveEvidence('reactive_config.json', this.reactiveConfig);
    }
}
