class AssetMetadataCache {
    constructor() {
        this.cache = new Map();
    }

    set(absolutePath, metadata) {
        this.cache.set(absolutePath, metadata);
    }

    get(absolutePath) {
        return this.cache.get(absolutePath) || null;
    }

    has(absolutePath) {
        return this.cache.has(absolutePath);
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = new AssetMetadataCache();
