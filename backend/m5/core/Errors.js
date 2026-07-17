class PipelineError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'PipelineError';
    }
}

const ErrorCodes = {
    M5_ASSET_NOT_FOUND: 'M5_ASSET_NOT_FOUND',
    M5_LIBRARY_EMPTY: 'M5_LIBRARY_EMPTY',
    M5_INVALID_LAYOUT: 'M5_INVALID_LAYOUT',
    M5_INVALID_TIMELINE: 'M5_INVALID_TIMELINE',
    M5_INVALID_RECIPE: 'M5_INVALID_RECIPE',
    M5_RENDER_FAILED: 'M5_RENDER_FAILED',
    M5_FFMPEG_ERROR: 'M5_FFMPEG_ERROR',
    M5_VALIDATION_FAILED: 'M5_VALIDATION_FAILED',
    M5_CONFIG_MISSING: 'M5_CONFIG_MISSING'
};

module.exports = {
    PipelineError,
    ErrorCodes
};
