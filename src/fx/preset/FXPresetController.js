import { fxParameterRegistry } from './definition/ParameterRegistry.js';

/**
 * FXPresetController
 * 
 * Pusat logika untuk operasi FX Preset.
 * Bukan singleton. Harus diinisiasi dengan dispatcher dan store.
 */
export class FXPresetController {
    /**
     * @param {Object} dispatcher - Instance dari FXPresetDispatcher
     * @param {Object} store - Zustand store (useFXPresetStore)
     */
    constructor(dispatcher, store) {
        if (!dispatcher || !store) {
            throw new Error('[FXPresetController] Dispatcher and Store are required');
        }
        this.dispatcher = dispatcher;
        this.store = store;
    }

    /**
     * Menerapkan preset. Hanya meneruskan kategori yang diizinkan oleh Apply Scope.
     * @param {Object} presetDefinition - Objek PresetDefinition dari Definition Layer
     */
    applyPreset(presetDefinition) {
        if (!presetDefinition || !presetDefinition.parameters) return;

        // 1. Baca Apply Scope dari store
        const { applyScope } = this.store.getState();
        
        // 2. Filter payload berdasarkan kategori yang diizinkan
        const filteredConfig = {};
        for (const [category, parameters] of Object.entries(presetDefinition.parameters)) {
            if (applyScope[category] === true) {
                filteredConfig[category] = parameters;
            }
        }

        // 3. Dispatch ke handler
        this.dispatcher.dispatch(filteredConfig);

        // 4. Update status ke 'Preset' dan simpan metadata
        const metadata = {
            id: presetDefinition.id,
            name: presetDefinition.name,
            author: presetDefinition.author,
            presetVersion: presetDefinition.presetVersion,
            schemaVersion: presetDefinition.schemaVersion,
            builtIn: presetDefinition.builtIn,
            createdBy: presetDefinition.createdBy
        };
        this.store.getState().setActivePreset(metadata);
    }

    /**
     * Dipanggil oleh aplikasi ketika ada perubahan parameter manual lewat Inspector.
     * @param {string} category - Kategori yang berubah (misal: 'Visualizer')
     * @param {string} parameterName - Nama parameter (misal: 'color')
     * @param {*} oldValue - Nilai sebelum berubah
     * @param {*} newValue - Nilai setelah berubah
     */
    notifyParameterChanged(category, parameterName, oldValue, newValue) {
        const currentState = this.store.getState();
        
        // Hanya proses jika status saat ini masih 'Preset'
        if (currentState.status === 'Preset') {
            // Validasi apakah parameter ini termasuk yang dipantau (SSOT di Registry)
            if (fxParameterRegistry.isParameterSupported(category, parameterName)) {
                console.log(`[FXPresetController] Preset diverged due to manual change in ${category}.${parameterName}`);
                currentState.setCustomStatus();
            }
        }
    }
}
