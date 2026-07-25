/**
 * UserPresetRepository
 * 
 * Bertanggung jawab mengelola penyimpanan User Presets.
 * Saat ini menggunakan localStorage.
 */

const STORAGE_KEY = 'fx_user_presets';

export class UserPresetRepository {
    /**
     * @returns {Object[]} Array of raw preset definitions
     */
    static getAll() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            console.error('[UserPresetRepository] Failed to load', e);
            return [];
        }
    }

    /**
     * @param {Object[]} presets 
     */
    static save(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
        } catch (e) {
            console.error('[UserPresetRepository] Failed to save', e);
        }
    }

    /**
     * @param {string} id 
     * @returns {Object|null}
     */
    static getById(id) {
        const presets = this.getAll();
        return presets.find(p => p.id === id) || null;
    }

    /**
     * @param {import('../definition/PresetSchema').PresetDefinition} presetDefinition 
     */
    static create(presetDefinition) {
        const presets = this.getAll();
        
        // Cek ID unik
        if (presets.some(p => p.id === presetDefinition.id)) {
            throw new Error(`Preset with id ${presetDefinition.id} already exists`);
        }
        
        presets.push(presetDefinition.toJSON());
        this.save(presets);
    }
}
