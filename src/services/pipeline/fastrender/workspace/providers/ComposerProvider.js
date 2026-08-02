/**
 * ComposerProvider.js
 * Rendering provider for Studio / Composer composition context in MediaFactory M3.
 * Formats visual composition metadata for NORMAL and FAST workspaces without modifying Normal mode behavior.
 */

export class ComposerProvider {
    /**
     * @param {string} mode - 'NORMAL' | 'FAST'
     */
    constructor(mode = 'NORMAL') {
        this.mode = mode;
        this.isFastMode = mode === 'FAST';
    }

    /**
     * Get active composer mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Process project objects for composition rendering in current workspace mode
     * @param {Array} objects - M3 visual objects
     * @returns {Array} Processed visual objects for composer layer
     */
    processComposition(objects = []) {
        if (!Array.isArray(objects)) return [];
        if (!this.isFastMode) {
            // Normal workspace pass-through
            return objects;
        }

        // Fast workspace pass-through / formatting
        return objects.map(obj => {
            if (obj && obj.fastModeSuspended) {
                return { ...obj, _renderOpacity: 0.3, _renderBadge: 'SUSPENDED_FAST_MODE' };
            }
            return obj;
        });
    }

    /**
     * Get composer layer configuration
     */
    getLayerConfig() {
        return {
            mode: this.mode,
            fastCompositionActive: this.isFastMode,
            renderingEngine: this.isFastMode ? 'FastWorkspaceComposer' : 'NormalWorkspaceComposer'
        };
    }
}
