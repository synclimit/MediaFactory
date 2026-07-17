const crypto = require('crypto');
const path = require('path');
const ServiceRegistry = require('../system/ServiceRegistry');

class PresetService {
    constructor() {}

    _getConfig() { return ServiceRegistry.resolve('ConfigurationService'); }
    _getWorkspace() { return ServiceRegistry.resolve('WorkspaceService'); }
    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async _getPresetsDb() {
        const wsPath = this._getWorkspace()._getActivePath();
        const dbPath = path.join(wsPath, 'Database', 'presets.json');
        
        let db = await this._getConfig().load(dbPath);
        if (!db) db = { data: { presets: {} } };
        return { path: dbPath, data: db };
    }

    async savePreset(presetData) {
        const config = this._getConfig();
        const { path: dbPath, data: dbData } = await this._getPresetsDb();
        
        const presetId = presetData.id || crypto.randomUUID();
        const isNew = !presetData.id;
        
        const presetRecord = {
            id: presetId,
            name: presetData.name || "Untitled Preset",
            category: presetData.category || "General",
            version: presetData.version || 1,
            author: presetData.author || "System",
            description: presetData.description || "",
            tags: presetData.tags || [],
            compatibility: presetData.compatibility || "M3",
            data: presetData.data || {},
            createdAt: presetData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dbData.data.presets[presetId] = presetRecord;
        await config.save(dbPath, dbData);

        if (isNew) {
            this._getRuntime().emit('Presets.Created', { presetId });
        } else {
            this._getRuntime().emit('Presets.Updated', { presetId });
        }
        
        return presetRecord;
    }

    async loadPreset(presetId) {
        const { data: dbData } = await this._getPresetsDb();
        const preset = dbData.data.presets[presetId];
        if (!preset) throw new Error("Preset not found");
        return preset;
    }

    async duplicatePreset(presetId) {
        const preset = await this.loadPreset(presetId);
        
        const duplicated = {
            ...preset,
            id: null,
            name: `${preset.name} (Copy)`,
            createdAt: new Date().toISOString()
        };
        
        return await this.savePreset(duplicated);
    }

    async deletePreset(presetId) {
        const config = this._getConfig();
        const { path: dbPath, data: dbData } = await this._getPresetsDb();
        
        if (!dbData.data.presets[presetId]) throw new Error("Preset not found");
        
        delete dbData.data.presets[presetId];
        await config.save(dbPath, dbData);
        
        this._getRuntime().emit('Presets.Deleted', { presetId });
    }
}

module.exports = PresetService;
