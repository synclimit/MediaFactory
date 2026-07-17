const crypto = require('crypto');
const ServiceRegistry = require('../system/ServiceRegistry');

class BasePanelService {
    constructor(panelName, capabilities = {}) {
        this.panelName = panelName;
        this.schemaVersion = 1;
        this.serviceVersion = 1;
        this.capabilities = {
            assets: true,
            presets: true,
            validation: true,
            runtime: true,
            import: true,
            export: false,
            preview: true,
            queue: false,
            plugins: true,
            ...capabilities
        };
        
        // Plugin extension points placeholder
        this.pluginAssets = [];
        this.pluginPresets = [];
        this.pluginValidationRules = [];
        this.pluginSettings = {};
        this.pluginRuntimeEvents = [];
    }

    _getWorkspaceService() { return ServiceRegistry.resolve('WorkspaceService'); }
    _getConfigService() { return ServiceRegistry.resolve('ConfigurationService'); }
    _getRuntimeService() { return ServiceRegistry.resolve('RuntimeService'); }
    _getValidationService() { return ServiceRegistry.resolve('ValidationService'); }

    _generateHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data || {})).digest('hex');
    }

    async initialize() {
        const settings = await this.loadSettings();
        const runtime = await this.runtime();
        const validation = await this.validate(settings);

        return {
            schemaVersion: this.schemaVersion,
            serviceVersion: this.serviceVersion,
            capabilities: this.capabilities,
            settings: settings,
            settingsHash: this._generateHash(settings),
            runtime: runtime,
            validation: validation
        };
    }

    async loadSettings() {
        const ws = this._getWorkspaceService();
        const config = this._getConfigService();
        if (!ws.getCurrentWorkspace()) {
            return {};
        }
        
        const configPath = ws.getConfigPath(`m3_${this.panelName.toLowerCase()}`);
        let data = await config.load(configPath);
        
        if (!data || !data.data) {
            data = { data: this.getDefaultSettings() };
            await config.save(configPath, data);
        }
        return data.data;
    }

    async saveSettings(settingsPayload, providedHash) {
        const ws = this._getWorkspaceService();
        const config = this._getConfigService();
        if (!ws.getCurrentWorkspace()) {
            throw new Error('No active workspace');
        }

        const currentSettings = await this.loadSettings();
        const currentHash = this._generateHash(currentSettings);

        if (providedHash && providedHash !== currentHash) {
            throw new Error('Settings conflict. Hash mismatch.');
        }

        const configPath = ws.getConfigPath(`m3_${this.panelName.toLowerCase()}`);
        const fullData = await config.load(configPath) || { data: {} };
        fullData.data = { ...fullData.data, ...settingsPayload };
        
        await config.save(configPath, fullData);

        const runtime = this._getRuntimeService();
        if (runtime) {
            runtime.emit(`M3.${this.panelName}.Saved`, fullData.data);
        }

        return {
            settings: fullData.data,
            settingsHash: this._generateHash(fullData.data)
        };
    }

    async validate(settings) {
        // Use ValidationService in real implementation
        return { valid: true, errors: [] };
    }

    async runtime() {
        return { status: 'Ready' };
    }

    async refresh() {
        const runtime = this._getRuntimeService();
        if (runtime) {
            runtime.emit(`M3.${this.panelName}.Refreshed`);
        }
        return await this.initialize();
    }

    dispose() {
        // Cleanup resources
    }

    getDefaultSettings() {
        return {};
    }
}

module.exports = BasePanelService;
