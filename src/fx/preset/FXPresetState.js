import { create } from 'zustand';
import { PresetPersonalizationService } from './personalization/PresetPersonalizationService';
import { PresetLibrary } from './library/PresetLibrary';

export const useFXPresetStore = create((set, get) => ({
    activePresetMetadata: null,
    status: 'Custom', // 'Preset' | 'Custom'
    
    // Dynamic map of scopes: { [categoryName]: boolean }
    // By default, it's empty, and populated when categories are registered
    applyScope: {},

    // Personalization State
    favoriteIds: [],
    recentPresetIds: [],
    lastAppliedPresetId: null,

    // Actions
    setActivePreset: (metadata) => set({
        activePresetMetadata: metadata,
        status: 'Preset'
    }),

    setCustomStatus: () => {
        if (get().status !== 'Custom') {
            set({ status: 'Custom' });
        }
    },

    setApplyScope: (category, isEnabled) => set((state) => ({
        applyScope: {
            ...state.applyScope,
            [category]: isEnabled
        },
        // Changing scope technically means we are diverging from the full preset design
        status: 'Custom'
    })),

    // Used by UI to discover what categories are available
    registerCategory: (category, defaultEnabled = true) => set((state) => {
        if (state.applyScope[category] !== undefined) return state; // Already registered
        return {
            applyScope: {
                ...state.applyScope,
                [category]: defaultEnabled
            }
        };
    }),

    // --- Personalization Actions ---
    
    refreshPersonalization: () => {
        const data = PresetPersonalizationService.load();
        
        // Validasi: hanya pertahankan ID yang ada di Library
        const validFavorites = data.favoriteIds.filter(id => PresetLibrary.getPresetById(id) !== null);
        const validRecents = data.recentPresetIds.filter(id => PresetLibrary.getPresetById(id) !== null);
        let validLastApplied = data.lastAppliedPresetId;
        if (validLastApplied && !PresetLibrary.getPresetById(validLastApplied)) {
            validLastApplied = null;
        }

        set({
            favoriteIds: validFavorites,
            recentPresetIds: validRecents,
            lastAppliedPresetId: validLastApplied
        });
    },

    toggleFavorite: (id) => {
        const newFavorites = PresetPersonalizationService.toggleFavorite(id);
        set({ favoriteIds: newFavorites });
    },

    addRecent: (id) => {
        const newRecents = PresetPersonalizationService.addRecent(id);
        set({ recentPresetIds: newRecents });
    },

    setLastApplied: (id) => {
        const newLastApplied = PresetPersonalizationService.setLastApplied(id);
        set({ lastAppliedPresetId: newLastApplied });
    }
}));
