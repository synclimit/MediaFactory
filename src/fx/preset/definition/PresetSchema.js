/**
 * Representasi akhir dari sebuah FX Preset yang sudah tervalidasi dan ternormalisasi.
 * Kelas ini memisahkan metadata dari parameter secara tegas.
 */
export class PresetDefinition {
    /**
     * @param {Object} data - Raw data mentah (diasumsikan sudah lolos validator & normalisasi)
     */
    constructor(data) {
        // Metadata
        this.schemaVersion = data.schemaVersion || '1.0.0';
        this.presetVersion = data.presetVersion || '1.0.0';
        this.id = data.id || `preset_${Date.now()}`;
        this.name = data.name || 'Untitled Preset';
        this.genre = data.genre || 'Uncategorized';
        this.author = data.author || 'Unknown';
        this.createdBy = data.createdBy || 'Unknown';
        this.builtIn = data.builtIn === undefined ? false : data.builtIn;
        this.difficulty = data.difficulty || 'Beginner';
        this.thumbnailUrl = data.thumbnailUrl || '';
        this.description = data.description || '';
        this.tags = Array.isArray(data.tags) ? [...data.tags] : [];

        // Scope & Parameters
        this.applyScope = data.applyScope || {}; // { Background: true, Visualizer: true, ... }
        this.parameters = data.parameters || {}; // { Background: { blurAmount: 5 }, Visualizer: { color: '#fff' } }
    }

    /**
     * Mendapatkan parameter hanya untuk scope yang aktif
     * Ini bisa dipanggil oleh Controller.
     */
    getActiveParameters() {
        const activeParams = {};
        for (const [category, params] of Object.entries(this.parameters)) {
            if (this.applyScope[category] === true) {
                activeParams[category] = params;
            }
        }
        return activeParams;
    }

    /**
     * Serialisasi kembali ke bentuk raw object (untuk di save/export)
     */
    toJSON() {
        return {
            schemaVersion: this.schemaVersion,
            presetVersion: this.presetVersion,
            id: this.id,
            name: this.name,
            genre: this.genre,
            author: this.author,
            createdBy: this.createdBy,
            builtIn: this.builtIn,
            difficulty: this.difficulty,
            thumbnailUrl: this.thumbnailUrl,
            description: this.description,
            tags: this.tags,
            applyScope: this.applyScope,
            parameters: this.parameters
        };
    }
}
