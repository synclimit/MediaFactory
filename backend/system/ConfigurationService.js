const ServiceRegistry = require('./ServiceRegistry');

class ConfigurationService {
    constructor() {
        this.cache = new Map();
        this.storage = null; 
    }

    _getStorage() {
        if (!this.storage) {
            this.storage = ServiceRegistry.resolve('StorageService');
        }
        return this.storage;
    }

    async load(filePath) {
        if (this.cache.has(filePath)) {
            return this.cache.get(filePath);
        }
        
        const storage = this._getStorage();
        if (!await storage.exists(filePath)) {
            return null;
        }

        const raw = await storage.read(filePath);
        try {
            const parsed = JSON.parse(raw);
            this.cache.set(filePath, parsed);
            return parsed;
        } catch (error) {
            console.warn(`[ConfigurationService] Failed to parse JSON at ${filePath}, checking backup...`);
            const bakPath = `${filePath}.bak`;
            if (await storage.exists(bakPath)) {
                try {
                    const bakRaw = await storage.read(bakPath);
                    const bakParsed = JSON.parse(bakRaw);
                    this.cache.set(filePath, bakParsed);
                    return bakParsed;
                } catch(e) {}
            }
            return null;
        }
    }

    async save(filePath, data) {
        const storage = this._getStorage();
        
        // Enforce Configuration Standard
        if (!data.schemaVersion) data.schemaVersion = 1;
        const now = new Date().toISOString();
        if (!data.createdAt) data.createdAt = now;
        data.updatedAt = now;
        if (!data.createdBy) data.createdBy = "MediaFactory";
        if (!data.lastModifiedBy) data.lastModifiedBy = "System";
        if (!data.data) data.data = {};

        const jsonString = JSON.stringify(data, null, 2);
        
        // Backup before writing if it exists
        if (await storage.exists(filePath)) {
            await this.backup(filePath);
        }

        await storage.write(filePath, jsonString);
        this.cache.set(filePath, data);
        return data;
    }

    async backup(filePath) {
        const storage = this._getStorage();
        if (await storage.exists(filePath)) {
            const backupPath = `${filePath}.bak`;
            await storage.copy(filePath, backupPath);
        }
    }

    invalidateCache(filePath) {
        this.cache.delete(filePath);
    }

    validate(data, schema) {
        // Validation foundation: Schema rules can be extended based on 'schema'
        if (!data.schemaVersion) throw new Error("Validation Error: Missing schemaVersion");
        if (!data.data) throw new Error("Validation Error: Missing data payload");
        return true;
    }

    async migrate(filePath, migrationFn) {
        const data = await this.load(filePath);
        if (data) {
            const migratedData = migrationFn(data);
            await this.save(filePath, migratedData);
            return migratedData;
        }
        return null;
    }
}

module.exports = ConfigurationService;
