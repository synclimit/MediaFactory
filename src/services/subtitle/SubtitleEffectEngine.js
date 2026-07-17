import { subtitleEffectRegistry } from './effects/SubtitleEffectRegistry';
import ScalePulseEffect from './effects/ScalePulseEffect';

class SubtitleEffectEngine {
    constructor() {
        this.state = Object.freeze({
            scale: 1.0,
            opacity: 1.0,
            glow: 0,
            blur: 0,
            rotation: 0,
            shadow: 0
        });
        
        // Register built-in effects
        subtitleEffectRegistry.register(new ScalePulseEffect());

        // Load default preset
        subtitleEffectRegistry.loadPreset('soft_beat');
    }

    update(reactiveState, dt) {
        if (!reactiveState) return;

        // Forward to registry
        subtitleEffectRegistry.executeAll(reactiveState, dt);

        // Merge every EffectState
        this._mergeStates();
    }

    _mergeStates() {
        // Reset to base defaults
        let newScale = 1.0;
        let newOpacity = 1.0;
        let newGlow = 0;
        let newBlur = 0;
        let newRotation = 0;
        let newShadow = 0;

        const effects = subtitleEffectRegistry.getAll();
        for (const effect of effects) {
            if (!effect.enabled) continue;
            
            const eState = effect.getState();
            if (eState.scale !== undefined) newScale *= eState.scale;
            if (eState.opacity !== undefined) newOpacity *= eState.opacity;
            if (eState.glow !== undefined) newGlow += eState.glow;
            if (eState.blur !== undefined) newBlur += eState.blur;
            if (eState.rotation !== undefined) newRotation += eState.rotation;
            if (eState.shadow !== undefined) newShadow += eState.shadow;
        }

        // Return a single immutable EffectState
        this.state = Object.freeze({
            scale: newScale,
            opacity: newOpacity,
            glow: newGlow,
            blur: newBlur,
            rotation: newRotation,
            shadow: newShadow
        });
    }

    reset() {
        subtitleEffectRegistry.resetAll();
        this._mergeStates();
    }

    getState() {
        return this.state;
    }
}

export const subtitleEffectEngine = new SubtitleEffectEngine();
export default SubtitleEffectEngine;
