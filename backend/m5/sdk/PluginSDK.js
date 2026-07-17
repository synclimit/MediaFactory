const PluginManifest = require('./PluginManifest');
const PluginRegistry = require('./PluginRegistry');
const LifecycleHooks = require('./LifecycleHooks');
const NodeRegistry = require('../rendergraph/NodeRegistry');
const TranslatorRegistry = require('../ffmpeg/registry/TranslatorRegistry');

class PluginSDK {
    /**
     * Registers a new plugin into the M5 ecosystem.
     * @param {Object} manifestData 
     * @param {Object} implementation 
     */
    static registerPlugin(manifestData, implementation) {
        const manifest = new PluginManifest(manifestData);
        
        PluginRegistry.register(manifest, implementation);

        // Auto-register specific components if provided
        if (implementation.nodes) {
            implementation.nodes.forEach(nodeType => NodeRegistry.registerType(nodeType));
        }

        if (implementation.translators) {
            Object.keys(implementation.translators).forEach(domain => {
                TranslatorRegistry.register(domain, implementation.translators[domain]);
            });
        }
    }

    /**
     * Subscribe to core pipeline events.
     * @param {string} event 
     * @param {Function} callback 
     */
    static on(event, callback) {
        LifecycleHooks.subscribe(event, callback);
    }
}

module.exports = PluginSDK;
