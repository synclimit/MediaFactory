import { BaseFeatureValidator } from './BaseFeatureValidator.js';
import { beatEngine } from '../../audio/BeatEngine.js';
import { audioDrivenRuntime } from '../../audio/v2/AudioDrivenRuntime.js';

export class BeatReactiveFeature extends BaseFeatureValidator {
    static featureName = "Beat Reactive";
    static description = "Validates the Audio -> Beat -> Reactive pipeline.";
    static requiredEngines = ['BeatEngine', 'AudioDrivenRuntime'];

    async validateConfiguration() {
        return 100;
    }

    async validateOutput() {
        if (!beatEngine.state.isPlaying) {
            this.rootCause = 'No audio playing.';
            return 0;
        }
        return 100;
    }

    async validateAcceptance() {
        const beatState = beatEngine.getState();
        if (beatState.beatCount === 0 && beatState.timestamp > 3000) {
            this.rootCause = 'No beats detected during playback.';
            return 0;
        }
        return 100;
    }
}
