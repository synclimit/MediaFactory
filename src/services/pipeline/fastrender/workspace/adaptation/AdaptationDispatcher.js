/**
 * AdaptationDispatcher.js
 * Generic Data-Driven Adaptation Dispatcher for MediaFactory M3 Fast Workspace (MF-1403).
 * Executes strategy lifecycles by consuming adaptationStrategy metadata from LoopCapabilityRegistry 
 * and delegating execution to StrategyRegistry without hardcoded feature conditionals.
 */

import { loopCapabilityRegistry } from '../registry/LoopCapabilityRegistry.js';
import { strategyRegistry } from './StrategyRegistry.js';
import { AdaptationContext } from './AdaptationContext.js';
import { AdaptationResult } from './AdaptationResult.js';

export class AdaptationDispatcher {
    /**
     * @param {import('./StrategyRegistry.js').StrategyRegistry} [registry]
     */
    constructor(registry = strategyRegistry) {
        this.registry = registry;
    }

    /**
     * Dispatch procedural adaptation for a visual object based on metadata
     * @param {Object} object - M3 visual object
     * @param {number} [timeSec] - Playback timecode in seconds
     * @param {number} [masterLoopDuration] - Master loop duration in seconds
     * @param {number} [seed] - Seed for PRNG
     * @param {Object} [renderingContext] - RenderingContext instance
     * @returns {AdaptationResult}
     */
    dispatch(object, timeSec = 0.0, masterLoopDuration = 10.0, seed = 1337, renderingContext = null) {
        if (!object) {
            return new AdaptationResult({
                adaptedObject: null,
                originalObject: null,
                strategyUsed: 'None',
                isAdapted: false
            });
        }

        // 1. Create AdaptationContext (calculates normalizedLoopTime in [0.0, 1.0) & frameIndex)
        const context = new AdaptationContext({
            object,
            timeSec,
            masterLoopDuration,
            seed,
            renderingContext
        });

        // 2. Query LoopCapabilityRegistry for data-driven classification metadata
        const classificationData = loopCapabilityRegistry.getClassification(object);
        const strategyName = classificationData.adaptationStrategy || 'PassThrough';

        // 3. Lookup strategy instance from StrategyRegistry
        const strategy = this.registry.getStrategy(strategyName);
        if (!strategy) {
            return new AdaptationResult({
                adaptedObject: object,
                originalObject: object,
                strategyUsed: 'PassThroughFallback',
                isAdapted: false
            });
        }

        // 4. Execute Strategy Lifecycle: supports() -> adapt() -> validate()
        if (!strategy.supports(context)) {
            return new AdaptationResult({
                adaptedObject: object,
                originalObject: object,
                strategyUsed: strategy.name,
                isAdapted: false,
                warnings: ['Strategy lifecycle supports() check returned false']
            });
        }

        const startTime = performance.now();
        const result = strategy.adapt(context);
        const executionMs = performance.now() - startTime;

        result.metadata = {
            ...result.metadata,
            executionTimeMs: executionMs,
            normalizedLoopTime: context.normalizedLoopTime,
            frameIndex: context.frameIndex,
            strategyName
        };

        const validation = strategy.validate(result);
        if (validation && validation.hints) {
            result.validationHints = {
                ...result.validationHints,
                ...validation.hints
            };
        }

        return result;
    }
}

// Export singleton instance
export const adaptationDispatcher = new AdaptationDispatcher();
