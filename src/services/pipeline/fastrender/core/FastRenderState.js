/**
 * FastRenderState.js
 * Central state manager for Fast Render Engine in MediaFactory M3.
 * Manages renderMode state ('NORMAL' | 'FAST'), feature flag checks, reactive listeners,
 * and workspace Fast Render parameters.
 */

export const RENDER_MODES = {
    NORMAL: 'NORMAL',
    FAST: 'FAST'
};

class FastRenderState {
    constructor() {
        this.renderMode = RENDER_MODES.NORMAL;
        this.masterLoopDuration = 10.0; // Default 10.0 seconds visual loop
        this.isLoopPreviewActive = false;
        this.preFlightPassed = false;
        this.listeners = new Set();
        
        // Feature flag evaluation
        this.isFeatureFlagEnabled = this.evaluateFeatureFlag();
    }

    /**
     * Check environment feature flag
     */
    evaluateFeatureFlag() {
        try {
            if (typeof process !== 'undefined' && process.env && process.env.VITE_FAST_RENDER_ENABLED !== undefined) {
                return process.env.VITE_FAST_RENDER_ENABLED === 'true' || process.env.VITE_FAST_RENDER_ENABLED === true;
            }
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FAST_RENDER_ENABLED !== undefined) {
                return import.meta.env.VITE_FAST_RENDER_ENABLED === 'true' || import.meta.env.VITE_FAST_RENDER_ENABLED === true;
            }
        } catch (e) {
            // Default to enabled for M3 studio environment
        }
        return true;
    }

    /**
     * Get current render mode
     */
    getMode() {
        return this.renderMode;
    }

    /**
     * Check if currently in Fast Render Mode
     */
    isFastMode() {
        return this.renderMode === RENDER_MODES.FAST;
    }

    /**
     * Set active render mode
     */
    setMode(mode) {
        if (!Object.values(RENDER_MODES).includes(mode)) {
            console.warn(`[FastRenderState] Invalid render mode: ${mode}`);
            return;
        }
        if (this.renderMode !== mode) {
            const previousMode = this.renderMode;
            this.renderMode = mode;
            this.notifyListeners({ type: 'MODE_CHANGE', mode, previousMode });
        }
    }

    /**
     * Toggle mode between NORMAL and FAST
     */
    toggleMode() {
        const nextMode = this.renderMode === RENDER_MODES.FAST ? RENDER_MODES.NORMAL : RENDER_MODES.FAST;
        this.setMode(nextMode);
        return nextMode;
    }

    /**
     * Master loop duration getter/setter
     */
    getMasterLoopDuration() {
        return this.masterLoopDuration;
    }

    setMasterLoopDuration(duration) {
        if (typeof duration === 'number' && duration > 0) {
            this.masterLoopDuration = duration;
            this.notifyListeners({ type: 'LOOP_DURATION_CHANGE', duration });
        }
    }

    /**
     * Loop preview status
     */
    setLoopPreviewActive(active) {
        this.isLoopPreviewActive = !!active;
        this.notifyListeners({ type: 'LOOP_PREVIEW_TOGGLE', active: this.isLoopPreviewActive });
    }

    getLoopPreviewActive() {
        return this.isLoopPreviewActive;
    }

    /**
     * Subscribe to state updates
     */
    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
        return () => {};
    }

    /**
     * Notify subscribers
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event, this);
            } catch (err) {
                console.error('[FastRenderState] Listener error:', err);
            }
        });
    }
}

// Export as singleton
export const fastRenderState = new FastRenderState();
