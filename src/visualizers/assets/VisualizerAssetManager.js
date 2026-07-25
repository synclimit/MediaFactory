/**
 * VisualizerAssetManager.js
 * Handles lazy loading and caching of visualizer thumbnails and previews.
 */

class VisualizerAssetManager {
    constructor() {
        this.cache = new Map();
        this.basePath = '/assets/visualizers/';
    }

    async loadThumbnail(id, url) {
        if (this.cache.has(`thumb_${id}`)) {
            return this.cache.get(`thumb_${id}`);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(`thumb_${id}`, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load thumbnail for ${id}`));
            img.src = url || `${this.basePath}thumbnails/${id}.jpg`;
        });
    }

    async loadPreview(id, url) {
        // Returns video URL or preloads video depending on strategy
        return url || `${this.basePath}previews/${id}.mp4`;
    }

    clearCache() {
        this.cache.clear();
    }
}

export const visualizerAssetManager = new VisualizerAssetManager();
