class PluginManifest {
    /**
     * Defines the standard structure for an M5 Plugin.
     * @param {Object} data 
     */
    constructor(data) {
        this.id = data.id;
        this.version = data.version;
        this.name = data.name;
        this.author = data.author;
        this.supportedPipelines = data.supportedPipelines || ['M5_v1.0', 'M5_v2.0', 'M5_v3.0'];
        this.type = data.type; // e.g. NodePlugin, TranslatorPlugin, RendererPlugin
        
        if (!this.id || !this.version || !this.type) {
            throw new Error('PluginManifest must include id, version, and type.');
        }

        Object.freeze(this);
    }
}

module.exports = PluginManifest;
