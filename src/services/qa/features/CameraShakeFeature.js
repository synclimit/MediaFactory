import { BaseFeatureValidator } from './BaseFeatureValidator.js';
import { beatEngine } from '../../audio/BeatEngine.js';
import { audioDrivenRuntime } from '../../audio/v2/AudioDrivenRuntime.js';
import { visualRuntime } from '../../visual/VisualRuntime.js';

export class CameraShakeFeature extends BaseFeatureValidator {
    static featureName = "Camera Shake";
    static description = "Validates the Camera Shake feature end-to-end.";
    static requiredEngines = ['BeatEngine', 'AudioDrivenRuntime', 'VisualRuntime'];

    async validateConfiguration() {
        if (!visualRuntime.cameraEffect) {
            this.rootCause = 'Camera Effect is not instantiated in VisualRuntime.';
            return 0;
        }
        
        const style = visualRuntime.cameraEffect.style;
        if (style.shakeIntensity <= 0) {
            this.rootCause = 'Camera Shake intensity is zero or disabled.';
            return 0;
        }

        return 100;
    }

    async validateOutput() {
        const comp = visualRuntime.getComposition();
        if (comp.camera.shakeX === 0 && comp.camera.shakeY === 0 && beatEngine.state.isPlaying) {
            await new Promise(r => setTimeout(r, 2000));
            const newComp = visualRuntime.getComposition();
            if (newComp.camera.shakeX === 0 && newComp.camera.shakeY === 0) {
                this.rootCause = 'VisualRuntime executed but Camera Offset never changed.';
                return 0;
            }
        }
        return 100;
    }

    async validateAcceptance() {
        let maxShake = 0;
        for(let i=0; i<30; i++) {
            await new Promise(r => setTimeout(r, 100));
            const cmp = visualRuntime.getComposition();
            maxShake = Math.max(maxShake, Math.abs(cmp.camera.shakeX) + Math.abs(cmp.camera.shakeY));
        }
        
        if (maxShake === 0 && beatEngine.state.isPlaying) {
            this.rootCause = 'Camera failed to visibly shake during playback.';
            return 0;
        }
        return 100;
    }
}
