/**
 * CapabilityRegistry.js
 * Central feature classification registry for MediaFactory M3 Fast Render Engine.
 * Encapsulates Category A/B/C/D rules, adaptation metadata, and inspector parameter lookups.
 * 
 * Classification Categories:
 * - CATEGORY_A (Native): Identical behavior, 100% loop-safe, cache-ready.
 * - CATEGORY_B (Compatible): Adapted deterministically (e.g. pre-baked FFT, seeded PRNG, periodic curves).
 * - CATEGORY_C (Unsafe): Postponed; risk of visual discontinuities or frame drops.
 * - CATEGORY_D (Unsupported): Hidden / disabled in Fast Render Workspace.
 */

export const FAST_RENDER_CATEGORIES = {
    A_NATIVE: 'A_NATIVE',
    B_COMPATIBLE: 'B_COMPATIBLE',
    C_UNSAFE: 'C_UNSAFE',
    D_UNSUPPORTED: 'D_UNSUPPORTED'
};

export class CapabilityRegistry {
    constructor() {
        this.registry = new Map();
        this.inspectorRegistry = new Map();
        this.initializeDefaults();
    }

    initializeDefaults() {
        // --- BACKGROUNDS & OVERLAYS ---
        this.register('bg_image', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Static Image Background', adaptType: 'none' });
        this.register('bg_solid', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Solid / Gradient Background', adaptType: 'none' });
        this.register('bg_video', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Video Background', adaptType: 'crossfade_loop' });
        this.register('overlay_image', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Static Graphic / Logo / Watermark', adaptType: 'none' });
        this.register('overlay_video', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Video Overlay (Chroma Key)', adaptType: 'keyed_alpha_loop' });
        this.register('social_widget', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Social Subscribe Widget', adaptType: 'fixed_interval' });
        this.register('procedural_speaker', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Subwoofer / Speaker Cone', adaptType: 'prebaked_kick_envelope' });

        // --- TEXT & TYPOGRAPHY ---
        this.register('text_static', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Static Text Layer', adaptType: 'none' });
        this.register('text_current_track', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Dynamic Track Title ({current_track})', adaptType: 'none' });
        this.register('subtitle_lyric', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Subtitle / Lyric Engine', adaptType: 'precalculated_timeline' });
        this.register('playlist_panel', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Track Playlist Panel', adaptType: 'prebaked_scroll' });

        // --- VISUALIZERS ---
        this.register('vis_bars', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Bars Visualizer (Vertical/Horizontal)', adaptType: 'prebaked_fft' });
        this.register('vis_waves', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Oscilloscope Waves', adaptType: 'prebaked_pcm' });
        this.register('vis_radial', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Radial Circle / Ring / Halo', adaptType: 'polar_fft' });
        this.register('vis_spiral', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Spiral / Mandala Visualizer', adaptType: 'quantized_rotation' });
        this.register('vis_terrain', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Terrain / Grid / Matrix', adaptType: 'periodic_noise' });
        this.register('vis_speaker_membrane', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Speaker Membrane Vibration', adaptType: 'prebaked_kick_envelope' });
        this.register('vis_particle_cloud', FAST_RENDER_CATEGORIES.C_UNSAFE, { label: 'Particle Spectrum Cloud', adaptType: 'postponed' });
        this.register('vis_3d_webgl', FAST_RENDER_CATEGORIES.C_UNSAFE, { label: '3D WebGL Volumetric Mesh', adaptType: 'postponed' });

        // --- PARTICLE ENGINE ---
        this.register('particle_shapes', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Particle Shapes', adaptType: 'seeded_prng' });
        this.register('particle_flows', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Particle Flow Dynamics', adaptType: 'prewarmed_cyclic' });
        this.register('particle_environmental', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Environmental (Snow, Rain, Stars)', adaptType: 'toroidal_wrap' });
        this.register('particle_trails', FAST_RENDER_CATEGORIES.C_UNSAFE, { label: 'Particle Accumulator Trails', adaptType: 'postponed' });

        // --- CAMERA MOTION & FX ---
        this.register('cam_shake', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Camera Shake', adaptType: 'seeded_4d_simplex' });
        this.register('cam_beat_zoom', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Beat Driven Zoom', adaptType: 'periodic_cosine' });
        this.register('cam_dolly_zoom', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Dolly Zoom (Vertigo)', adaptType: 'loop_matched_scale' });
        this.register('cam_pan_tilt', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Camera Pan & Tilt', adaptType: 'none' });
        this.register('cam_dutch_roll', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Dutch Angle Roll', adaptType: 'none' });

        // --- COLOR & SHADER FX ---
        this.register('fx_color_grade', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Color Grade (LUT Lookup)', adaptType: 'none' });
        this.register('fx_hue_shift', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Hue Shift', adaptType: 'none' });
        this.register('fx_saturation_exposure', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Saturation / Exposure / Contrast', adaptType: 'none' });
        this.register('fx_posterize_invert', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Posterize / Invert / Threshold', adaptType: 'none' });
        this.register('fx_vignette', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Vignette & Letterbox', adaptType: 'none' });
        this.register('fx_light_leak', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Light Leak Overlay', adaptType: 'none' });
        this.register('fx_film_grain', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'Film Grain Noise', adaptType: 'seeded_texture_loop' });
        this.register('fx_film_dust', FAST_RENDER_CATEGORIES.C_UNSAFE, { label: 'Dust & Scratches', adaptType: 'postponed' });
        this.register('fx_chromatic_aberration', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Chromatic Aberration', adaptType: 'none' });
        this.register('fx_bloom_glow', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Bloom & Glow Passes', adaptType: 'none' });
        this.register('fx_god_rays', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'God Rays & Light Sweep', adaptType: 'periodic_angle' });
        this.register('fx_wave_ripple', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Wave & Ripple Distortion', adaptType: 'none' });
        this.register('fx_blur', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Gaussian / Motion / Radial Blur', adaptType: 'none' });
        this.register('fx_stylize', FAST_RENDER_CATEGORIES.A_NATIVE, { label: 'Halftone / Comic / Neon Stylize', adaptType: 'none' });

        // --- UNSUPPORTED / GLITCH EFFECTS ---
        this.register('fx_rgb_split', FAST_RENDER_CATEGORIES.B_COMPATIBLE, { label: 'RGB Split Glitch', adaptType: 'periodic_waveform' });
        this.register('fx_strobe_flash', FAST_RENDER_CATEGORIES.D_UNSUPPORTED, { label: 'Strobe Flash Light', adaptType: 'unsupported_hide', reason: 'Strobe causes frame repetition & safety hazards in fast mode.' });
        this.register('fx_block_glitch', FAST_RENDER_CATEGORIES.D_UNSUPPORTED, { label: 'Block Glitch Corruption', adaptType: 'unsupported_hide', reason: 'Random macroblock tearing breaks frame deduplication.' });
        this.register('fx_datamosh', FAST_RENDER_CATEGORIES.D_UNSUPPORTED, { label: 'Data Mosh Codec Error', adaptType: 'unsupported_hide', reason: 'Non-deterministic frame corruption cannot be cached.' });
        this.register('fx_pixel_sort', FAST_RENDER_CATEGORIES.C_UNSAFE, { label: 'Pixel Sorting', adaptType: 'postponed', reason: 'Heavy sorting buffer latency.' });

        // --- INSPECTOR PARAMETER RULES ---
        this.registerInspectorRule('strobe-flash', { supported: false, reason: 'Strobe Flash is available in Normal Render Mode only.' });
        this.registerInspectorRule('glitch-digital', { supported: false, reason: 'Digital Glitch is available in Normal Render Mode only.' });
        this.registerInspectorRule('old-film-dust', { supported: false, reason: 'Film Dust & Scratches is available in Normal Render Mode only.' });
        this.registerInspectorRule('camera-shake', { supported: true, adapted: true, adaptLabel: '⚡ Fast Mode (Seeded Periodic Shake)' });
        this.registerInspectorRule('zoom-hentak', { supported: true, adapted: true, adaptLabel: '⚡ Fast Mode (Periodic Zoom Pulse)' });
    }

    /**
     * Register a feature entry.
     */
    register(featureId, category, metadata = {}) {
        if (!featureId || !category) {
            throw new Error('Feature ID and category are required.');
        }
        this.registry.set(featureId, {
            featureId,
            category,
            ...metadata
        });
    }

    /**
     * Register an inspector preset adaptation rule.
     */
    registerInspectorRule(presetId, rule) {
        this.inspectorRegistry.set(presetId, rule);
    }

    /**
     * Get feature categorization entry.
     */
    getFeature(featureId) {
        return this.registry.get(featureId) || {
            featureId,
            category: FAST_RENDER_CATEGORIES.A_NATIVE,
            label: featureId,
            adaptType: 'none'
        };
    }

    /**
     * Check if feature is supported in Fast Render.
     */
    isSupported(featureId) {
        const feature = this.getFeature(featureId);
        return feature.category !== FAST_RENDER_CATEGORIES.D_UNSUPPORTED;
    }

    /**
     * Check if feature is native (Category A).
     */
    isNative(featureId) {
        const feature = this.getFeature(featureId);
        return feature.category === FAST_RENDER_CATEGORIES.A_NATIVE;
    }

    /**
     * Check if feature is compatible with adaptation (Category B).
     */
    isCompatible(featureId) {
        const feature = this.getFeature(featureId);
        return feature.category === FAST_RENDER_CATEGORIES.B_COMPATIBLE;
    }

    /**
     * Check if feature is postponed/unsafe (Category C).
     */
    isUnsafe(featureId) {
        const feature = this.getFeature(featureId);
        return feature.category === FAST_RENDER_CATEGORIES.C_UNSAFE;
    }

    /**
     * Get Inspector preset rule.
     */
    getInspectorRule(presetId) {
        return this.inspectorRegistry.get(presetId) || { supported: true, adapted: false };
    }

    /**
     * Get all registered features.
     */
    getAllFeatures() {
        return Array.from(this.registry.values());
    }
}

// Export as singleton
export const capabilityRegistry = new CapabilityRegistry();
