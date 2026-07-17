export class AssetManager {
    constructor() {
        this.cacheDb = new Map();
        this.fonts = new Map();
    }

    async validateAsset(assetPath) {
        if (!assetPath) return { valid: false, error: 'Empty path' };
        // If it's an HTTP URL
        if (assetPath.startsWith('http')) {
            try {
                const res = await fetch(assetPath, { method: 'HEAD' });
                return { valid: res.ok, type: res.headers.get('content-type') };
            } catch (err) {
                return { valid: false, error: 'Network error' };
            }
        }
        
        // For local files, we'd ideally use Node fs via an API, but for the front-end simulation:
        return { valid: true, cached: this.cacheDb.has(assetPath) };
    }

    async detectMissingAssets(projectState) {
        const missing = [];
        
        // Check Backgrounds
        for (const bg of projectState.m3BgPool || []) {
            const url = bg.sourcePath || bg.filename;
            if (url) {
                const check = await this.validateAsset(url);
                if (!check.valid) missing.push({ id: bg.id, type: 'Background', path: url });
            }
        }
        
        // Check Audio Tracks
        for (const track of projectState.m3AudioTracks || []) {
            const url = track.sourcePath || track.sourceUrl;
            if (url) {
                const check = await this.validateAsset(url);
                if (!check.valid) missing.push({ id: track.id, type: 'Audio', path: url });
            }
        }

        return missing;
    }

    relinkAsset(oldPath, newPath, projectState) {
        // Relink in Backgrounds
        (projectState.m3BgPool || []).forEach(bg => {
            if (bg.sourcePath === oldPath) bg.sourcePath = newPath;
            if (bg.filename === oldPath) bg.filename = newPath;
        });

        // Relink in Audio Tracks
        (projectState.m3AudioTracks || []).forEach(track => {
            if (track.sourcePath === oldPath) track.sourcePath = newPath;
            if (track.sourceUrl === oldPath) track.sourceUrl = newPath;
        });

        return projectState;
    }

    manageFonts(fontList) {
        fontList.forEach(f => this.fonts.set(f.name, f.url));
    }

    cleanupCache() {
        this.cacheDb.clear();
        console.log('[AssetManager] Cache cleaned up.');
    }
}

export const assetManager = new AssetManager();
