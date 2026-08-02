/**
 * AdaptationContext.js
 * Context payload model for MediaFactory M3 Fast Workspace Procedural Adaptation (MF-1403).
 * Provides normalizedLoopTime in [0.0, 1.0) domain as the preferred execution domain for strategies.
 */

export class AdaptationContext {
    /**
     * @param {Object} config
     * @param {Object} config.object - M3 visual object to adapt
     * @param {number} [config.timeSec] - Current playback timecode in seconds
     * @param {number} [config.masterLoopDuration] - Master loop duration in seconds
     * @param {number} [config.seed] - Seed for PRNG / noise algorithms
     * @param {number} [config.fps] - Frames per second
     * @param {Object} [config.renderingContext] - RenderingContext instance
     */
    constructor(config = {}) {
        this.object = config.object || null;
        this.timeSec = typeof config.timeSec === 'number' ? config.timeSec : 0.0;
        this.masterLoopDuration = typeof config.masterLoopDuration === 'number' && config.masterLoopDuration > 0
            ? config.masterLoopDuration
            : 10.0;
        this.seed = typeof config.seed === 'number' ? config.seed : 1337;
        this.fps = typeof config.fps === 'number' && config.fps > 0 ? config.fps : 60;
        this.renderingContext = config.renderingContext || null;

        // Preferred Domain Calculation: normalizedLoopTime in [0.0, 1.0)
        const loopTime = ((this.timeSec % this.masterLoopDuration) + this.masterLoopDuration) % this.masterLoopDuration;
        this.normalizedLoopTime = loopTime / this.masterLoopDuration;
        this.frameIndex = Math.floor(this.timeSec * this.fps);
    }
}
