/**
 * EffectPipeline.js
 * Manages post-processing effects and composite rendering for visualizers.
 */

export class EffectPipeline {
    constructor() {
        this.effects = [];
    }

    add(effect) {
        this.effects.push(effect);
        return this; // Chainable
    }

    clear() {
        this.effects = [];
    }

    /**
     * Builds the pipeline based on requested capabilities and config.
     * Stub for future modular effects implementation.
     */
    buildFromCapabilities(capabilities, config) {
        // In the future, this will instantiate effect classes (e.g. GlowEffect) 
        // based on capabilities and add them to the pipeline.
        return this;
    }

    /**
     * Executes the pipeline.
     * @param {Function} renderFn - The core rendering function of the visualizer plugin
     * @param {Object} context - The shared runtime context
     */
    execute(renderFn, context) {
        // Pre-render effects
        for (const effect of this.effects) {
            if (effect.preRender) {
                effect.preRender(context);
            }
        }

        // Core visualizer render
        renderFn(context);

        // Post-render effects
        for (const effect of this.effects) {
            if (effect.postRender) {
                effect.postRender(context);
            }
        }
    }
}
