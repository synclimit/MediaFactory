import { BaseFeatureValidator } from './BaseFeatureValidator.js';
import { beatEngine } from '../../audio/BeatEngine.js';
import { audioDrivenRuntime } from '../../audio/v2/AudioDrivenRuntime.js';
import { visualRuntime } from '../../visual/VisualRuntime.js';

export class ZoomPulseFeature extends BaseFeatureValidator {
    static featureName = "Zoom Pulse";
    static description = "Validates the Zoom Pulse feature end-to-end.";
    static requiredEngines = ['BeatEngine', 'AudioDrivenRuntime', 'VisualRuntime'];

    async validateConfiguration() {
        if (!visualRuntime.zoomEffect) {
            this.rootCause = 'Zoom Effect is not instantiated in VisualRuntime.';
            return 0;
        }
        
        const style = visualRuntime.zoomEffect.style;
        if (style.maxScale <= style.baseScale) {
            this.rootCause = 'Zoom configuration has no dynamic range (maxScale <= baseScale).';
            return 0;
        }

        return 100;
    }

    async validateOutput() {
        // Did the output change?
        const comp = visualRuntime.getComposition();
        if (comp.transform.scale === 1.0 && beatEngine.state.isPlaying) {
            // Need to verify if time elapsed
            await new Promise(r => setTimeout(r, 2000));
            const newComp = visualRuntime.getComposition();
            if (newComp.transform.scale === 1.0) {
                this.rootCause = 'VisualRuntime executed but Object Scale never changed.';
                return 0;
            }
        }
        return 100;
    }

    async validateAcceptance() {
        // Acceptance criteria: The image visibly pulses with kick intensity
        const state = audioDrivenRuntime.getState();
        const comp = visualRuntime.getComposition();
        
        // Ensure that high kick intensity correlates with higher scale
        let maxKick = 0;
        let maxScale = 1.0;
        
        for(let i=0; i<30; i++) {
            await new Promise(r => setTimeout(r, 100));
            const c = audioDrivenRuntime.getState();
            const cmp = visualRuntime.getComposition();
            maxKick = Math.max(maxKick, c.kick ? c.kick.intensity : 0);
            maxScale = Math.max(maxScale, cmp.transform.scale);
        }
        
        if (maxKick > 0.5 && maxScale <= 1.0) {
            this.rootCause = `High kick intensity (${maxKick.toFixed(2)}) did not trigger a visible scale increase.`;
            return 0;
        } else if (maxKick < 0.1 && maxScale > 1.05) {
            this.rootCause = `False positive: Object scaled up without sufficient kick triggers.`;
            return 50;
        }
        
        return 100;
    }
}
