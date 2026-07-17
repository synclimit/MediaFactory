import { getSubtitleEffectPreset } from './SubtitleEffectPresets';

class SubtitleEffectRegistry {
    constructor() {
        this._effects = new Map();
        this.currentPresetId = null;
    }

    register(effect) {
        if (!effect || !effect.id) return;
        this._effects.set(effect.id, effect);
    }

    unregister(id) {
        this._effects.delete(id);
    }

    get(id) {
        return this._effects.get(id) || null;
    }

    getAll() {
        return Array.from(this._effects.values());
    }

    loadPreset(id) {
        const preset = getSubtitleEffectPreset(id);
        if (!preset) return;

        this.currentPresetId = preset.id;

        for (const [effectId, effect] of this._effects.entries()) {
            const config = preset.effects[effectId];
            if (typeof effect.configure === 'function') {
                if (config) {
                    effect.configure(config);
                } else {
                    effect.configure({ enabled: false });
                }
            }
        }
    }

    executeAll(reactiveState, dt) {
        for (const effect of this._effects.values()) {
            if (effect.enabled) {
                effect.update(reactiveState, dt);
            }
        }
    }
    
    resetAll() {
        for (const effect of this._effects.values()) {
            if (typeof effect.reset === 'function') {
                effect.reset();
            }
        }
    }
}

export const subtitleEffectRegistry = new SubtitleEffectRegistry();
export default SubtitleEffectRegistry;
