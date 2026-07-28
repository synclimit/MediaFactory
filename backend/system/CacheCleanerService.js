const fs = require('fs/promises');
const path = require('path');
const AppPaths = require('./AppPaths');

class CacheCleanerService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }

    start() {
        // Run once on startup, then every 1 hour
        this.runScheduledCleanup();
        this.intervalId = setInterval(() => {
            this.runScheduledCleanup();
        }, 1000 * 60 * 60);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async runImmediateCleanup() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        try {
            const cacheDir = AppPaths.getCacheBase();
            await this._cleanDirectory(cacheDir, 0); // 0 threshold means delete everything inside
            console.log(`[CacheCleaner] Immediate cleanup completed.`);
        } catch (e) {
            console.error('[CacheCleaner] Error during immediate cleanup:', e);
        } finally {
            this.isRunning = false;
        }
    }

    async runScheduledCleanup() {
        if (this.isRunning) return;
        
        const mode = AppPaths.getCacheCleanupMode();
        if (!mode || mode === 'never' || mode === 'immediate') {
            return; // Immediate is handled manually by frontend trigger
        }

        let maxAgeMs = 0;
        if (mode === 'daily') {
            maxAgeMs = 24 * 60 * 60 * 1000;
        } else if (mode === 'weekly') {
            maxAgeMs = 7 * 24 * 60 * 60 * 1000;
        } else if (mode === 'monthly') {
            maxAgeMs = 30 * 24 * 60 * 60 * 1000;
        }

        if (maxAgeMs === 0) return;

        this.isRunning = true;
        try {
            const cacheDir = AppPaths.getCacheBase();
            await this._cleanDirectory(cacheDir, maxAgeMs);
            console.log(`[CacheCleaner] Scheduled cleanup completed for mode: ${mode}`);
        } catch (e) {
            console.error('[CacheCleaner] Error during scheduled cleanup:', e);
        } finally {
            this.isRunning = false;
        }
    }

    async _cleanDirectory(dirPath, maxAgeMs) {
        try {
            const now = Date.now();
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    await this._cleanDirectory(fullPath, maxAgeMs);
                    // Try to delete directory if it's empty
                    try {
                        const remaining = await fs.readdir(fullPath);
                        if (remaining.length === 0) {
                            await fs.rmdir(fullPath);
                        }
                    } catch (e) {}
                } else {
                    const stats = await fs.stat(fullPath);
                    const ageMs = now - stats.mtimeMs;
                    if (ageMs >= maxAgeMs) {
                        try {
                            await fs.unlink(fullPath);
                        } catch (err) {
                            console.error(`[CacheCleaner] Failed to delete file ${fullPath}:`, err.message);
                        }
                    }
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
}

module.exports = CacheCleanerService;
