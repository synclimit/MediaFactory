import { ReactivePresets } from '../reactive/ReactivePresets';
import { SubtitleAnimationPresets } from '../subtitle/animation/SubtitleAnimationPresets';
import { SubtitleEffectPresets } from '../subtitle/effects/SubtitleEffectPresets';
import { TypographyThemes } from '../typography/TypographyThemes';

class PresetManager {
    constructor() {
        this._libraries = new Map();
        this._initializeBuiltInLibraries();
    }

    _initializeBuiltInLibraries() {
        this.registerLibrary('reactive', 'Reactive Presets', ReactivePresets);
        this.registerLibrary('subtitle_animation', 'Subtitle Animation Presets', SubtitleAnimationPresets);
        this.registerLibrary('subtitle_effect', 'Subtitle Effect Presets', SubtitleEffectPresets);
        this.registerLibrary('typography', 'Typography Themes', TypographyThemes);
    }

    registerLibrary(id, name, presetsData) {
        if (!id || !presetsData) return;

        let presets = [];
        if (Array.isArray(presetsData)) {
            presets = presetsData;
        } else if (typeof presetsData === 'object') {
            presets = Object.values(presetsData);
        }

        this._libraries.set(id, {
            id,
            name,
            presets
        });
    }

    unregisterLibrary(id) {
        this._libraries.delete(id);
    }

    getLibrary(id) {
        return this._libraries.get(id) || null;
    }

    getAllLibraries() {
        return Array.from(this._libraries.values());
    }

    getPreset(libraryId, presetId) {
        const lib = this.getLibrary(libraryId);
        if (!lib) return null;
        return lib.presets.find(p => p.id === presetId) || null;
    }

    getAllPresets(libraryId) {
        const lib = this.getLibrary(libraryId);
        return lib ? lib.presets : [];
    }
}

export const presetManager = new PresetManager();
export default PresetManager;
