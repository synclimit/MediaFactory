const RandomSystem = require('./RandomSystem');

class PipelineConfig {
    /**
     * Immutable Configuration Object
     * @param {Object} overrides 
     */
    constructor(overrides = {}) {
        this.general = Object.freeze({
            projectName: overrides.general?.projectName || 'M5_Project',
            renderMode: overrides.general?.renderMode || 'Batch',
            pipelineVersion: 'M5 v1.0'
        });

        this.output = Object.freeze({
            targetResolution: overrides.output?.targetResolution || '1080x1920',
            fps: overrides.output?.fps || 30,
            videoCodec: overrides.output?.videoCodec || 'libx264',
            audioCodec: overrides.output?.audioCodec || 'aac',
            outputDir: overrides.output?.outputDir || 'D:\\MediaFactory\\Output\\M5',
            namingStrategy: overrides.output?.namingStrategy || 'RecipeHash'
        });

        this.performance = Object.freeze({
            profile: overrides.performance?.profile || 'BALANCED', // FAST, BALANCED, QUALITY
            threads: overrides.performance?.threads || 0, // 0 = auto
            bufferSize: overrides.performance?.bufferSize || '2M',
            faststart: overrides.performance?.faststart !== false
        });

        this.duration = Object.freeze({
            target: overrides.duration?.target || 60,
            hookMax: overrides.duration?.hookMax || 5,
            ctaMax: overrides.duration?.ctaMax || 5
        });

        this.layout = Object.freeze({
            preferBackground: overrides.layout?.preferBackground !== false
        });

        this.variation = Object.freeze({
            complexityLevel: overrides.variation?.complexityLevel || 'Medium',
            allowTransitions: overrides.variation?.allowTransitions !== false,
            colorGrading: overrides.variation?.colorGrading || 'Neutral'
        });

        this.formula = Object.freeze({
            type: overrides.formula?.type || 'STANDARD',
            forceHook: overrides.formula?.forceHook || false,
            forceCta: overrides.formula?.forceCta || false
        });

        this.random = Object.freeze({
            seed: overrides.random?.seed || RandomSystem.generateSeed(),
            entropy: overrides.random?.entropy || 'High'
        });

        this.ffmpeg = Object.freeze({
            preset: this._getPresetForProfile(this.performance.profile),
            crf: this._getCrfForProfile(this.performance.profile),
            hardwareAcceleration: overrides.ffmpeg?.hardwareAcceleration || 'auto'
        });

        this.logging = Object.freeze({
            level: overrides.logging?.level || 'INFO',
            enableMemoryTracking: overrides.logging?.enableMemoryTracking !== false,
            enablePerformanceMetrics: overrides.logging?.enablePerformanceMetrics !== false
        });

        this.debug = Object.freeze({
            dumpFilterGraph: overrides.debug?.dumpFilterGraph || false,
            mockRendering: overrides.debug?.mockRendering || false,
            keepTempFiles: overrides.debug?.keepTempFiles || false
        });

        Object.freeze(this);
    }

    _getPresetForProfile(profile) {
        if (profile === 'FAST') return 'ultrafast';
        if (profile === 'QUALITY') return 'slow';
        return 'fast'; // BALANCED
    }

    _getCrfForProfile(profile) {
        if (profile === 'FAST') return 28;
        if (profile === 'QUALITY') return 18;
        return 23; // BALANCED
    }
}

module.exports = PipelineConfig;
