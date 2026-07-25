/**
 * FXPresetDispatcher
 * 
 * Bertanggung jawab mendistribusikan parameter ke handler yang tepat.
 * Tidak mengetahui tentang UI, State Management library, ataupun nama store (seperti m3BgPool).
 * Hanya mengetahui kategori dan handler yang didaftarkan.
 */
export class FXPresetDispatcher {
    constructor() {
        this.handlers = new Map();
    }

    /**
     * Mendaftarkan handler untuk kategori tertentu.
     * @param {string} category - Contoh: 'Background', 'Visualizer'
     * @param {Function} handlerFn - Fungsi yang menerima (parameters)
     */
    registerHandler(category, handlerFn) {
        if (typeof handlerFn !== 'function') {
            throw new Error(`Handler for ${category} must be a function`);
        }
        this.handlers.set(category, handlerFn);
    }

    /**
     * Menerima payload preset yang sudah difilter oleh Controller,
     * lalu mendistribusikannya ke masing-masing handler.
     * @param {Object} presetConfig - Contoh: { Background: { blur: 10 }, Visualizer: { color: '#fff' } }
     */
    dispatch(presetConfig) {
        if (!presetConfig || typeof presetConfig !== 'object') return;

        for (const [category, parameters] of Object.entries(presetConfig)) {
            const handler = this.handlers.get(category);
            if (handler) {
                try {
                    handler(parameters);
                } catch (error) {
                    console.error(`[FXPresetDispatcher] Error dispatching to ${category}:`, error);
                }
            } else {
                console.warn(`[FXPresetDispatcher] No handler registered for category: ${category}`);
            }
        }
    }
}
