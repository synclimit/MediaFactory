const path = require('path');
const ServiceRegistry = require('./ServiceRegistry');

class PluginService {
    constructor() {
        this.plugins = new Map();
        this.registeredAssets = [];
        this.registeredNodes = new Map();
    }

    _getConfig() { return ServiceRegistry.resolve('ConfigurationService'); }
    _getWorkspace() { return ServiceRegistry.resolve('WorkspaceService'); }
    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async registerPlugin(pluginManifest) {
        if (!pluginManifest.id || !pluginManifest.version) {
            throw new Error("Invalid Plugin Manifest: Must include id and version");
        }

        if (this.plugins.has(pluginManifest.id)) {
            throw new Error(`Plugin ${pluginManifest.id} already registered`);
        }

        this.plugins.set(pluginManifest.id, pluginManifest);

        if (pluginManifest.assetTypes) {
            this.registeredAssets.push(...pluginManifest.assetTypes);
        }

        if (pluginManifest.filterNodes) {
            for (const [nodeName, nodeBuilder] of Object.entries(pluginManifest.filterNodes)) {
                this.registeredNodes.set(nodeName, nodeBuilder);
            }
        }

        if (pluginManifest.validationRules) {
            const validator = ServiceRegistry.resolve('ValidationService');
            for (const rule of pluginManifest.validationRules) {
                validator.registerRule(rule.context, rule.fn);
            }
        }

        await this._updateDatabase(pluginManifest.id, pluginManifest.version);
        
        this._getRuntime().emit('Plugins.Registered', { pluginId: pluginManifest.id });
    }

    async _updateDatabase(pluginId, version) {
        const wsPath = this._getWorkspace()._getActivePath();
        if (!wsPath) return; 

        const config = this._getConfig();
        const dbPath = path.join(wsPath, 'Database', 'plugins.json');
        
        // Use ConfigurationService to load and create default if missing
        let db = await config.load(dbPath);
        if (!db) db = { data: { activePlugins: {} } };

        db.data.activePlugins[pluginId] = { version, registeredAt: new Date().toISOString() };
        await config.save(dbPath, db);
    }

    getRegisteredAssets() { return this.registeredAssets; }
    getRegisteredNodes() { return this.registeredNodes; }
}

module.exports = PluginService;
