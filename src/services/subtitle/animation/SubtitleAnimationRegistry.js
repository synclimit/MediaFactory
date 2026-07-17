import { getSubtitleAnimationPreset } from './SubtitleAnimationPresets';

class SubtitleAnimationRegistry {
    constructor() {
        this._animations = new Map();
        this.currentPresetId = null;
    }

    register(animation) {
        if (!animation || !animation.id) return;
        this._animations.set(animation.id, animation);
    }

    unregister(id) {
        this._animations.delete(id);
    }

    get(id) {
        return this._animations.get(id) || null;
    }

    getAll() {
        return Array.from(this._animations.values());
    }

    loadPreset(id) {
        const preset = getSubtitleAnimationPreset(id);
        if (!preset) return;

        this.currentPresetId = preset.id;

        for (const [animId, anim] of this._animations.entries()) {
            const config = preset.animations[animId];
            if (typeof anim.configure === 'function') {
                if (config) {
                    anim.configure(config);
                } else {
                    anim.configure({ enabled: false });
                }
            }
        }
    }

    executeAll(playbackState, dt) {
        for (const anim of this._animations.values()) {
            if (anim.enabled && typeof anim.update === 'function') {
                anim.update(playbackState, dt);
            }
        }
    }

    resetAll() {
        for (const anim of this._animations.values()) {
            if (typeof anim.reset === 'function') {
                anim.reset();
            }
        }
    }
}

export const subtitleAnimationRegistry = new SubtitleAnimationRegistry();
export default SubtitleAnimationRegistry;
