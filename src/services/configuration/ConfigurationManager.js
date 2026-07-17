import { presetManager } from '../presets/PresetManager';

const SCHEMA_VERSION = 1;

const DEFAULT_CATEGORIES = {
    reactivePreset: null,
    subtitleAnimationPreset: null,
    subtitleEffectPreset: null,
    typographyTheme: null,
    playlistTheme: null,
    visualizerPreset: null
};

class ConfigurationManager {
    constructor() {
        const now = new Date().toISOString();
        this.configuration = {
            schemaVersion: SCHEMA_VERSION,
            createdAt: now,
            updatedAt: now,
            ...DEFAULT_CATEGORIES
        };
        this._listeners = new Set();
    }

    // --- Event API ---

    subscribe(listener) {
        if (typeof listener === 'function') {
            this._listeners.add(listener);
        }
    }

    unsubscribe(listener) {
        this._listeners.delete(listener);
    }

    _notify(category, previousValue, currentValue) {
        if (previousValue === currentValue) return;

        const payload = {
            category,
            previousValue,
            currentValue,
            configuration: this.getConfiguration()
        };

        this._listeners.forEach(listener => {
            try {
                listener(payload);
            } catch (err) {
                console.error("ConfigurationManager: Error in event listener", err);
            }
        });
    }

    _notifyBulkChanges(oldConfig) {
        for (const category of this.getCategories()) {
            const previousValue = oldConfig[category];
            const currentValue = this.configuration[category];
            if (previousValue !== currentValue) {
                this._notify(category, previousValue, currentValue);
            }
        }
    }

    _touch() {
        this.configuration.updatedAt = new Date().toISOString();
    }

    // --- Core API ---
    
    getConfiguration() {
        // Return a shallow copy to prevent direct mutation
        return { ...this.configuration };
    }

    setConfiguration(configuration) {
        if (!configuration || typeof configuration !== 'object') return;
        
        const oldConfig = this.getConfiguration();
        let changed = false;

        for (const category of this.getCategories()) {
            if (configuration[category] !== undefined && this.configuration[category] !== configuration[category]) {
                this.configuration[category] = configuration[category];
                changed = true;
            }
        }

        if (changed) {
            this._touch();
            this._notifyBulkChanges(oldConfig);
        }
    }

    resetConfiguration() {
        const oldConfig = this.getConfiguration();
        const now = new Date().toISOString();
        
        this.configuration = {
            schemaVersion: SCHEMA_VERSION,
            createdAt: now,
            updatedAt: now,
            ...DEFAULT_CATEGORIES
        };
        
        this._notifyBulkChanges(oldConfig);
    }

    // --- Selection API ---

    setSelection(category, presetId) {
        if (!this._isValidCategory(category)) return false;
        
        // We only store the ID. No objects allowed.
        if (typeof presetId === 'object' && presetId !== null) {
            console.warn(`ConfigurationManager: Refusing to store object for category ${category}. Only strings are allowed.`);
            return false;
        }

        const previousValue = this.configuration[category];
        if (previousValue === presetId) return true; // No change

        this.configuration[category] = presetId;
        this._touch();
        this._notify(category, previousValue, presetId);
        
        return true;
    }

    getSelection(category) {
        if (!this._isValidCategory(category)) return null;
        return this.configuration[category] || null;
    }

    removeSelection(category) {
        if (!this._isValidCategory(category)) return false;
        
        const previousValue = this.configuration[category];
        if (previousValue === null) return true; // Already null

        this.configuration[category] = null;
        this._touch();
        this._notify(category, previousValue, null);
        
        return true;
    }

    hasSelection(category) {
        if (!this._isValidCategory(category)) return false;
        return this.configuration[category] !== null && this.configuration[category] !== undefined;
    }

    // --- Serialization API ---

    exportConfiguration() {
        return JSON.stringify(this.configuration);
    }

    importConfiguration(configurationStr) {
        if (!configurationStr) return false;
        
        try {
            const parsed = typeof configurationStr === 'string' ? JSON.parse(configurationStr) : configurationStr;
            
            const oldConfig = this.getConfiguration();
            let changed = false;

            // Restore metadata if present
            if (parsed.createdAt) {
                this.configuration.createdAt = parsed.createdAt;
            }
            if (parsed.schemaVersion !== undefined) {
                this.configuration.schemaVersion = parsed.schemaVersion;
            }

            for (const category of this.getCategories()) {
                if (parsed[category] !== undefined && this.configuration[category] !== parsed[category]) {
                    this.configuration[category] = parsed[category];
                    changed = true;
                }
            }

            if (changed) {
                this._touch();
                this._notifyBulkChanges(oldConfig);
            }
            
            return true;
        } catch (e) {
            console.error("ConfigurationManager: Failed to import configuration", e);
            return false;
        }
    }

    // --- Utility API ---

    getCategories() {
        return Object.keys(DEFAULT_CATEGORIES);
    }

    _isValidCategory(category) {
        return Object.prototype.hasOwnProperty.call(DEFAULT_CATEGORIES, category);
    }
}

// Export singleton instance
export const configurationManager = new ConfigurationManager();
export default ConfigurationManager;
