const fs = require('fs/promises');
const path = require('path');
const ServiceRegistry = require('./ServiceRegistry');

class PresetManagerService {
    constructor() {
        // Base directories for presets
        this.baseDirs = {
            'built-in': 'assets/visualizers/starter',
            'user': 'assets/visualizers/user',
            'downloaded': 'assets/visualizers/downloaded',
            'plugins': 'assets/visualizers/plugins'
        };
        
        this.availableRenderers = ['spectrum']; // Currently supported renderers
        this.currentEngineVersion = '1.0.0';
    }

    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async initialize() {
        // Ensure all directories exist
        for (const [key, dir] of Object.entries(this.baseDirs)) {
            try {
                await fs.mkdir(path.resolve(__dirname, '../../', dir), { recursive: true });
            } catch (err) {
                console.error(`Failed to create preset directory: ${dir}`, err);
            }
        }
        console.log('[PresetManagerService] Initialized.');
    }

    async getLibrary() {
        const library = {
            'built-in': [],
            'user': [],
            'downloaded': [],
            'plugins': []
        };

        for (const [category, relPath] of Object.entries(this.baseDirs)) {
            const dirPath = path.resolve(__dirname, '../../', relPath);
            try {
                const files = await fs.readdir(dirPath);
                for (const file of files) {
                    if (file.endsWith('.visualizer') || file.endsWith('.json')) {
                        const filePath = path.join(dirPath, file);
                        const preset = await this.readAndValidatePreset(filePath);
                        if (preset) {
                            // Assign metadata source category
                            preset._source = category;
                            library[category].push(preset);
                        }
                    }
                }
            } catch (e) {
                console.warn(`[PresetManagerService] Could not read directory ${dirPath}`);
            }
        }

        return library;
    }

    async readAndValidatePreset(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const preset = JSON.parse(content);
            
            // 1. Schema Validation
            if (!preset.schemaVersion || !preset.engineVersion || !preset.presetVersion) {
                throw new Error("Missing version metadata.");
            }
            if (!preset.id || !preset.name || !preset.renderer) {
                throw new Error("Missing required preset fields (id, name, renderer).");
            }

            // 2. Version Validation
            // Basic check: string matching or semver for engineVersion (assuming strict for now)
            if (preset.engineVersion > this.currentEngineVersion) {
                preset._error = "Incompatible Engine Version";
                preset._valid = false;
            } else {
                preset._valid = true;
            }

            // 3. Renderer Validation
            if (!this.availableRenderers.includes(preset.renderer)) {
                preset._error = "Renderer not installed";
                preset._valid = false;
            }

            return preset;
        } catch (err) {
            console.error(`[PresetManagerService] Failed to validate preset at ${filePath}:`, err.message);
            return null;
        }
    }

    // Stub for import/export
    async importPreset(filePath, destination = 'downloaded') {}
    async exportPreset(presetId, destinationPath) {}
    async saveUserPreset(preset) {}
    async deleteUserPreset(presetId) {}
}

module.exports = PresetManagerService;
