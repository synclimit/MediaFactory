/**
 * ParameterRegistry
 * 
 * Single Source of Truth untuk mendefinisikan parameter apa saja
 * yang tersedia dan dipantau oleh sistem FX Preset.
 * Tidak mengandung informasi UI (seperti komponen slider, warna, dll).
 */
export class ParameterRegistry {
    constructor() {
        // Struktur internal: Map<Category, Map<ParameterName, Metadata>>
        this.categories = new Map();
        
        this._initializeDefaultRegistry();
    }

    /**
     * Mendaftarkan parameter baru ke dalam registry
     */
    registerParameter(category, paramName, metadata) {
        if (!this.categories.has(category)) {
            this.categories.set(category, new Map());
        }
        
        const defaultMetadata = {
            type: 'number', // 'number', 'string', 'boolean', 'color'
            defaultValue: 0,
            description: '',
            version: '1.0.0', // Versi engine ketika parameter ini mulai didukung
            flags: [] // e.g., ['requires-gpu', 'experimental']
        };

        this.categories.get(category).set(paramName, { ...defaultMetadata, ...metadata });
    }

    /**
     * Mengecek apakah parameter didukung oleh sistem
     */
    isParameterSupported(category, paramName) {
        return this.categories.has(category) && this.categories.get(category).has(paramName);
    }

    /**
     * Mengambil definisi (metadata) dari sebuah parameter
     */
    getParameterDef(category, paramName) {
        if (!this.categories.has(category)) return null;
        return this.categories.get(category).get(paramName) || null;
    }

    /**
     * Mengambil seluruh parameter dalam sebuah kategori
     */
    getParametersByCategory(category) {
        if (!this.categories.has(category)) return [];
        return Array.from(this.categories.get(category).entries()).map(([name, meta]) => ({
            name,
            ...meta
        }));
    }

    /**
     * Inisialisasi parameter default berdasarkan Ownership Audit
     */
    _initializeDefaultRegistry() {
        // Background
        this.registerParameter('Background', 'blurAmount', { type: 'number', defaultValue: 0, description: 'Gaussian blur intensity' });
        this.registerParameter('Background', 'overlayDarkness', { type: 'number', defaultValue: 30, description: 'Darken overlay opacity' });
        this.registerParameter('Background', 'x', { type: 'number', defaultValue: 50, description: 'X offset' });
        this.registerParameter('Background', 'y', { type: 'number', defaultValue: 50, description: 'Y offset' });
        this.registerParameter('Background', 'bgZoom', { type: 'number', defaultValue: 0, description: 'Scale factor' });
        
        // Visualizer
        this.registerParameter('Visualizer', 'visualizerId', { type: 'string', defaultValue: 'viz-1', description: 'Visualizer type ID' });
        this.registerParameter('Visualizer', 'color', { type: 'color', defaultValue: '#ffffff', description: 'Primary color' });
        this.registerParameter('Visualizer', 'colorLeft', { type: 'color', defaultValue: '#AB55F7', description: 'Gradient left color' });
        this.registerParameter('Visualizer', 'colorRight', { type: 'color', defaultValue: '#F59E0B', description: 'Gradient right color' });
        this.registerParameter('Visualizer', 'colorMode', { type: 'string', defaultValue: 'Solid', description: 'Color fill mode' });
        this.registerParameter('Visualizer', 'barCount', { type: 'number', defaultValue: 64, description: 'Number of spectrum bars' });
        this.registerParameter('Visualizer', 'opacity', { type: 'number', defaultValue: 100, description: 'Opacity percentage' });
        
        // Particle
        this.registerParameter('Particle', 'presetId', { type: 'string', defaultValue: 'none', description: 'Particle system preset' });
        this.registerParameter('Particle', 'count', { type: 'number', defaultValue: 100, description: 'Particle density/count' });
        this.registerParameter('Particle', 'wind', { type: 'number', defaultValue: 0, description: 'Wind force X' });
        this.registerParameter('Particle', 'gravity', { type: 'number', defaultValue: 1, description: 'Gravity force Y' });

        // Subtitle
        this.registerParameter('Subtitle', 'font', { type: 'string', defaultValue: 'Arial', description: 'Font family' });
        this.registerParameter('Subtitle', 'fontSize', { type: 'number', defaultValue: 32, description: 'Font size' });
        this.registerParameter('Subtitle', 'color', { type: 'color', defaultValue: '#ffffff', description: 'Text color' });
        
        // Effects
        // Placeholder for future effect properties based on matrix
    }
}

// Export singleton instance as the global registry
export const fxParameterRegistry = new ParameterRegistry();
