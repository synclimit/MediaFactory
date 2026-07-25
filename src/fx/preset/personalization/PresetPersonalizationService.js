/**
 * PresetPersonalizationService
 * 
 * Abstraksi untuk LocalStorage yang mengelola preferensi pengguna
 * (Favorite, Recent, Last Applied). Service ini tidak menyimpan 
 * metadata preset, hanya array of presetIds.
 */

const STORAGE_KEY = 'fx_preset_personalization';
const STORAGE_VERSION = 1;
const MAX_RECENT = 20;

export class PresetPersonalizationService {
    static load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return PresetPersonalizationService.getDefault();
            
            const data = JSON.parse(raw);
            if (data.version !== STORAGE_VERSION) {
                // Future migration logic here
                return PresetPersonalizationService.getDefault();
            }
            return data;
        } catch (e) {
            console.warn('[Personalization] Failed to load from localStorage', e);
            return PresetPersonalizationService.getDefault();
        }
    }

    static save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[Personalization] Failed to save to localStorage', e);
        }
    }

    static getDefault() {
        return {
            version: STORAGE_VERSION,
            favoriteIds: [],
            recentPresetIds: [],
            lastAppliedPresetId: null
        };
    }

    static toggleFavorite(id) {
        const data = this.load();
        const idx = data.favoriteIds.indexOf(id);
        if (idx >= 0) {
            data.favoriteIds.splice(idx, 1);
        } else {
            data.favoriteIds.push(id);
        }
        this.save(data);
        return data.favoriteIds;
    }

    static isFavorite(id) {
        const data = this.load();
        return data.favoriteIds.includes(id);
    }

    static addRecent(id) {
        const data = this.load();
        // Hapus jika sudah ada (untuk dipindah ke atas)
        data.recentPresetIds = data.recentPresetIds.filter(pid => pid !== id);
        // Tambahkan ke indeks pertama
        data.recentPresetIds.unshift(id);
        
        if (data.recentPresetIds.length > MAX_RECENT) {
            data.recentPresetIds = data.recentPresetIds.slice(0, MAX_RECENT);
        }
        
        this.save(data);
        return data.recentPresetIds;
    }

    static getRecent() {
        return this.load().recentPresetIds;
    }

    static setLastApplied(id) {
        const data = this.load();
        data.lastAppliedPresetId = id;
        this.save(data);
        return id;
    }

    static getLastApplied() {
        return this.load().lastAppliedPresetId;
    }
}
