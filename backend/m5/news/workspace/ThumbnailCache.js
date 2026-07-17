class ThumbnailCache {
    constructor() {
        this.cache = new Map();
    }
    
    setThumbnail(projectId, base64) {
        this.cache.set(projectId, base64);
    }
    
    getThumbnail(projectId) {
        return this.cache.get(projectId) || null;
    }
}
module.exports = ThumbnailCache;