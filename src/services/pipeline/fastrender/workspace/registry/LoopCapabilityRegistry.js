/**
 * LoopCapabilityRegistry.js
 * Centralized, data-driven classification registry for MediaFactory M3 Fast Workspace (MF-1402).
 * Serves as the canonical single source of truth for all feature loop classifications and rich metadata.
 * Standalone module; DOES NOT modify the frozen CapabilityRegistry.js.
 */

export const LOOP_CLASSIFICATIONS = {
    LOOP_NATIVE: 'LoopNative',
    LOOP_ADAPTED: 'LoopAdapted',
    TIMELINE_ONLY: 'TimelineOnly',
    UNSUPPORTED: 'Unsupported'
};

export class LoopCapabilityRegistry {
    constructor() {
        this.registry = new Map();
        this.initializeDefaultMappings();
    }

    /**
     * Populate standard data-driven classification mappings
     */
    initializeDefaultMappings() {
        // --- 1. LoopNative Features ---
        const nativeFeatures = [
            'text', 'title', 'image', 'video', 'background', 'bg_image', 'bg_video',
            'shape', 'branding', 'social-widget', 'fx_color_grade', 'overlay'
        ];

        for (const feat of nativeFeatures) {
            this.registerClassification(feat, {
                classification: LOOP_CLASSIFICATIONS.LOOP_NATIVE,
                supportsLoop: true,
                requiresAdaptation: false,
                timelineOnly: false,
                unsupportedReason: null,
                adaptationStrategy: 'PassThrough',
                loopContinuity: 'Perfect',
                validationRequired: false,
                label: 'Loop Native'
            });
        }

        // --- 2. LoopAdapted Features ---
        this.registerClassification('camera-shake', {
            classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
            supportsLoop: true,
            requiresAdaptation: true,
            timelineOnly: false,
            unsupportedReason: null,
            adaptationStrategy: 'SeededNoise',
            loopContinuity: 'Good',
            validationRequired: true,
            label: 'Loop Adapted (Seeded Periodic Shake)'
        });
        this.registerClassification('cam_shake', this.registry.get('camera-shake'));

        this.registerClassification('zoom-hentak', {
            classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
            supportsLoop: true,
            requiresAdaptation: true,
            timelineOnly: false,
            unsupportedReason: null,
            adaptationStrategy: 'PeriodicNoise',
            loopContinuity: 'Good',
            validationRequired: true,
            label: 'Loop Adapted (Periodic Cosine Pulse)'
        });

        this.registerClassification('visualizer', {
            classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
            supportsLoop: true,
            requiresAdaptation: true,
            timelineOnly: false,
            unsupportedReason: null,
            adaptationStrategy: 'FFTCache',
            loopContinuity: 'Good',
            validationRequired: true,
            label: 'Loop Adapted (FFT Spectrum Cache)'
        });
        this.registerClassification('vis_bars', this.registry.get('visualizer'));
        this.registerClassification('vis_spectrum', this.registry.get('visualizer'));

        this.registerClassification('particle', {
            classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
            supportsLoop: true,
            requiresAdaptation: true,
            timelineOnly: false,
            unsupportedReason: null,
            adaptationStrategy: 'ParticleCache',
            loopContinuity: 'Risky',
            validationRequired: true,
            label: 'Loop Adapted (Seeded PRNG Particle Cache)'
        });
        this.registerClassification('particles', this.registry.get('particle'));

        const adaptedEffects = [
            'disco-light', 'neon-depth', 'deep-light', 'god-rays', 'depth-bokeh',
            'depth-scan', 'depth-fog', 'speed-lines', 'light-leak', 'vignette',
            'letterbox', 'scanline', 'film-grain', 'old-film-dust'
        ];

        for (const fx of adaptedEffects) {
            this.registerClassification(fx, {
                classification: LOOP_CLASSIFICATIONS.LOOP_ADAPTED,
                supportsLoop: true,
                requiresAdaptation: true,
                timelineOnly: false,
                unsupportedReason: null,
                adaptationStrategy: 'PeriodicEnvelope',
                loopContinuity: 'Good',
                validationRequired: true,
                label: 'Loop Adapted (Periodic Envelope)'
            });
        }

        // --- 3. TimelineOnly Features ---
        const timelineFeatures = [
            'subtitle', 'lyrics', 'audio', 'playlist', 'track_list_column', 'intro', 'outro'
        ];

        for (const feat of timelineFeatures) {
            this.registerClassification(feat, {
                classification: LOOP_CLASSIFICATIONS.TIMELINE_ONLY,
                supportsLoop: false,
                requiresAdaptation: false,
                timelineOnly: true,
                unsupportedReason: 'Timeline Event / Opening Sequence',
                adaptationStrategy: null,
                loopContinuity: null,
                validationRequired: false,
                label: 'Timeline Only'
            });
        }

        // --- 4. Unsupported Features ---
        this.registerClassification('strobe-flash', {
            classification: LOOP_CLASSIFICATIONS.UNSUPPORTED,
            supportsLoop: false,
            requiresAdaptation: false,
            timelineOnly: false,
            unsupportedReason: 'Temporal Discontinuity (High Frequency Strobe)',
            adaptationStrategy: null,
            loopContinuity: 'Discontinuous',
            validationRequired: true,
            label: 'Unsupported in Fast Mode'
        });
        this.registerClassification('fx_strobe_flash', this.registry.get('strobe-flash'));

        this.registerClassification('block-glitch', {
            classification: LOOP_CLASSIFICATIONS.UNSUPPORTED,
            supportsLoop: false,
            requiresAdaptation: false,
            timelineOnly: false,
            unsupportedReason: 'Temporal Discontinuity (Random Glitch Split)',
            adaptationStrategy: null,
            loopContinuity: 'Discontinuous',
            validationRequired: true,
            label: 'Unsupported in Fast Mode'
        });
        this.registerClassification('glitch-digital', this.registry.get('block-glitch'));
        this.registerClassification('fx_block_glitch', this.registry.get('block-glitch'));

        this.registerClassification('vis_3d_webgl', {
            classification: LOOP_CLASSIFICATIONS.UNSUPPORTED,
            supportsLoop: false,
            requiresAdaptation: false,
            timelineOnly: false,
            unsupportedReason: 'Unsafe 3D WebGL Context',
            adaptationStrategy: null,
            loopContinuity: 'Discontinuous',
            validationRequired: true,
            label: 'Unsupported in Fast Mode'
        });
    }

    /**
     * Register or override a feature classification
     * @param {string} key - Preset ID, object type, or feature name
     * @param {Object} metadata - Classification metadata record
     */
    registerClassification(key, metadata) {
        if (!key || !metadata) return;
        this.registry.set(String(key).toLowerCase(), {
            classification: metadata.classification || LOOP_CLASSIFICATIONS.LOOP_NATIVE,
            supportsLoop: metadata.supportsLoop !== undefined ? !!metadata.supportsLoop : true,
            requiresAdaptation: metadata.requiresAdaptation !== undefined ? !!metadata.requiresAdaptation : false,
            timelineOnly: metadata.timelineOnly !== undefined ? !!metadata.timelineOnly : false,
            unsupportedReason: metadata.unsupportedReason || null,
            adaptationStrategy: metadata.adaptationStrategy || null,
            loopContinuity: metadata.loopContinuity || null,
            validationRequired: metadata.validationRequired !== undefined ? !!metadata.validationRequired : false,
            label: metadata.label || metadata.classification || 'Loop Native'
        });
    }

    /**
     * Get rich classification metadata for a preset ID or object type
     * @param {string|Object} presetIdOrType - Preset ID, type string, or object instance
     * @returns {Object} Rich metadata record
     */
    getClassification(presetIdOrType) {
        if (!presetIdOrType) return this.getDefaultFallback();

        let key = '';
        if (typeof presetIdOrType === 'object') {
            key = presetIdOrType.presetId || presetIdOrType.type || presetIdOrType.name || '';
        } else {
            key = String(presetIdOrType);
        }

        const normalizedKey = key.toLowerCase().trim();
        if (this.registry.has(normalizedKey)) {
            return { ...this.registry.get(normalizedKey) };
        }

        // Try fallback matches
        if (normalizedKey.includes('shake')) return this.getClassification('camera-shake');
        if (normalizedKey.includes('zoom')) return this.getClassification('zoom-hentak');
        if (normalizedKey.includes('strobe')) return this.getClassification('strobe-flash');
        if (normalizedKey.includes('glitch')) return this.getClassification('block-glitch');
        if (normalizedKey.includes('particle')) return this.getClassification('particle');
        if (normalizedKey.includes('vis') || normalizedKey.includes('spectrum')) return this.getClassification('visualizer');
        if (normalizedKey.includes('sub') || normalizedKey.includes('lyric')) return this.getClassification('subtitle');

        return this.getDefaultFallback();
    }

    /**
     * Default fallback for unmapped features
     */
    getDefaultFallback() {
        return {
            classification: LOOP_CLASSIFICATIONS.LOOP_NATIVE,
            supportsLoop: true,
            requiresAdaptation: false,
            timelineOnly: false,
            unsupportedReason: null,
            adaptationStrategy: 'PassThrough',
            loopContinuity: 'Perfect',
            validationRequired: false,
            label: 'Loop Native (Default)'
        };
    }

    /**
     * Get all registered classifications
     */
    getAllClassifications() {
        const result = {};
        this.registry.forEach((val, key) => {
            result[key] = { ...val };
        });
        return result;
    }
}

// Export singleton instance
export const loopCapabilityRegistry = new LoopCapabilityRegistry();
