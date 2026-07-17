const Logger = require('../core/Logger');

class PluginRegistry {
    static plugins = new Map();

    /**
     * Registers a new plugin instance.
     * @param {PluginManifest} manifest 
     * @param {Object} implementation 
     */
    static register(manifest, implementation) {
        if (this.plugins.has(manifest.id)) {
            Logger.warn('PluginRegistry', `Plugin ${manifest.id} is already registered. Overwriting.`);
        }
        this.plugins.set(manifest.id, {
            manifest,
            implementation
        });
        Logger.info('PluginRegistry', `Successfully registered plugin: ${manifest.name} v${manifest.version}`);
    }

    /**
     * Retrieves all active plugins by type.
     * @param {string} type 
     */
    static getPluginsByType(type) {
        return Array.from(this.plugins.values())
            .filter(p => p.manifest.type === type)
            .map(p => p.implementation);
    }
}

module.exports = PluginRegistry;
