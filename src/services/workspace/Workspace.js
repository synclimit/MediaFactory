import { configurationManager } from '../configuration/ConfigurationManager';
import { presetManager } from '../presets/PresetManager';

const ALLOWED_CATEGORIES = [
    'reactivePreset',
    'subtitleAnimationPreset',
    'subtitleEffectPreset',
    'typographyTheme',
    'playlistTheme',
    'visualizerPreset'
];

const CATEGORY_TO_LIBRARY_MAP = {
    'reactivePreset': 'reactive',
    'subtitleAnimationPreset': 'subtitle_animation',
    'subtitleEffectPreset': 'subtitle_effect',
    'typographyTheme': 'typography',
    'playlistTheme': 'playlist',
    'visualizerPreset': 'visualizer'
};

class Workspace {
    
    /**
     * Set the active preset ID for a specific category.
     * Delegates entirely to ConfigurationManager.
     */
    setSelection(category, presetId) {
        this._validateCategory(category);
        return configurationManager.setSelection(category, presetId);
    }

    /**
     * Get the active preset ID for a specific category.
     */
    getSelectionId(category) {
        this._validateCategory(category);
        return configurationManager.getSelection(category);
    }

    /**
     * Get the resolved preset object for a specific category.
     * This orchestrates ConfigurationManager (for ID) and PresetManager (for Object).
     */
    getActivePreset(category) {
        this._validateCategory(category);
        
        const presetId = configurationManager.getSelection(category);
        if (!presetId) return null;

        const libraryId = CATEGORY_TO_LIBRARY_MAP[category];
        if (!libraryId) return null;

        return presetManager.getPreset(libraryId, presetId);
    }

    _validateCategory(category) {
        if (!ALLOWED_CATEGORIES.includes(category)) {
            throw new Error(`Workspace: Invalid category '${category}'. Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
        }
    }
}

export const workspace = new Workspace();
export default Workspace;
