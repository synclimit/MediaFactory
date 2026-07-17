const crypto = require('crypto');
const path = require('path');
const ServiceRegistry = require('../system/ServiceRegistry');

class AssetService {
    constructor() {}

    _getStorage() { return ServiceRegistry.resolve('StorageService'); }
    _getConfig() { return ServiceRegistry.resolve('ConfigurationService'); }
    _getWorkspace() { return ServiceRegistry.resolve('WorkspaceService'); }
    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async _getAssetsDb() {
        const wsPath = this._getWorkspace()._getActivePath();
        const dbPath = path.join(wsPath, 'Database', 'assets.json');
        
        let db = await this._getConfig().load(dbPath);
        if (!db) {
            db = { data: { assets: {} } };
        } else {
            if (!db.data) db.data = {};
            if (!db.data.assets) db.data.assets = {};
        }
        return { path: dbPath, data: db };
    }

    async import(filePath, category) {
        const storage = this._getStorage();
        const runtime = this._getRuntime();
        const config = this._getConfig();

        if (!await storage.exists(filePath)) {
            throw new Error("File to import does not exist");
        }

        const hash = await storage.hash(filePath, 'sha256');

        const { path: dbPath, data: dbData } = await this._getAssetsDb();
        const existing = Object.values(dbData.data.assets).find(a => a.hash === hash);
        if (existing) {
            runtime.emit('Assets.DuplicateDetected', { hash, originalId: existing.id });
            return existing;
        }

        const assetId = crypto.randomUUID();
        const ext = path.extname(filePath);
        const internalFilename = `${assetId}${ext}`;

        const assetsDir = this._getWorkspace().getAssetsPath(category);
        const targetPath = path.join(assetsDir, internalFilename);
        
        try {
            await storage.copy(filePath, targetPath);
            
            // Thumbnail & Metadata Workers would be dispatched here via Event or directly
            // runtime.emit('Assets.ProcessingRequired', { assetId, targetPath });

            const assetRecord = {
                id: assetId,
                category: category,
                hash: hash,
                originalFilename: path.basename(filePath),
                internalFilename: internalFilename,
                path: `Assets/${category}/${internalFilename}`,
                thumbnail: `Cache/thumbnails/${assetId}.webp`,
                preview: `Cache/previews/${assetId}.mp4`,
                metadata: {},
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            dbData.data.assets[assetId] = assetRecord;
            await config.save(dbPath, dbData);

            runtime.emit('Assets.Imported', { assetId, category });
            return assetRecord;

        } catch (error) {
            if (await storage.exists(targetPath)) await storage.delete(targetPath);
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    async delete(assetId) {
        const storage = this._getStorage();
        const config = this._getConfig();
        const { path: dbPath, data: dbData } = await this._getAssetsDb();
        
        const asset = dbData.data.assets[assetId];
        if (!asset) throw new Error("Asset not found");

        const absolutePath = path.join(this._getWorkspace()._getActivePath(), asset.path);
        
        if (await storage.exists(absolutePath)) {
            const trashPath = path.join(this._getWorkspace()._getActivePath(), 'Trash', path.basename(asset.path));
            await storage.move(absolutePath, trashPath);
        }

        delete dbData.data.assets[assetId];
        await config.save(dbPath, dbData);
        
        this._getRuntime().emit('Assets.Deleted', { assetId });
    }
}

module.exports = AssetService;
