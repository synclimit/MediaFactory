const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const AppPaths = require('../system/AppPaths');

class LibraryEngine {
    constructor() {
        this.cachePath = path.join(AppPaths.getCacheBase(), 'm5');
        this.stateFile = path.join(this.cachePath, 'library_state.json');
        this.state = {
            components: {}
        };
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.cachePath, { recursive: true });
            if (fsSync.existsSync(this.stateFile)) {
                const data = await fs.readFile(this.stateFile, 'utf8');
                this.state = JSON.parse(data);
            }
        } catch (e) {
            console.error('[M5 LibraryEngine] Error initializing:', e);
        }
    }

    async saveState() {
        try {
            await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
        } catch (e) {
            console.error('[M5 LibraryEngine] Error saving state:', e);
        }
    }

    async registerFile(category, filePath) {
        if (!this.state.components[category]) {
            this.state.components[category] = [];
        }
        
        const exists = this.state.components[category].find(c => c.path === filePath);
        if (!exists) {
            this.state.components[category].push({
                path: filePath,
                status: 'UNUSED',
                addedAt: Date.now()
            });
            await this.saveState();
        }
    }

    async getUnusedFile(category) {
        if (!this.state.components[category] || this.state.components[category].length === 0) {
            return null; // No files in this category
        }

        let unused = this.state.components[category].filter(c => c.status === 'UNUSED');
        
        if (unused.length === 0) {
            // Anti-duplicate reset: All used up, reset back to unused
            console.log(`[M5 LibraryEngine] Pool exhausted for ${category}, resetting to UNUSED.`);
            this.state.components[category].forEach(c => c.status = 'UNUSED');
            unused = this.state.components[category];
        }

        // Pick a random unused file
        const randomIdx = Math.floor(Math.random() * unused.length);
        const selected = unused[randomIdx];
        
        // Mark as used
        selected.status = 'USED';
        await this.saveState();

        return selected.path;
    }
}

module.exports = new LibraryEngine();
