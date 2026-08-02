/**
 * StrategyRegistry.js
 * Standalone Strategy Registry for MediaFactory M3 Fast Workspace (MF-1403).
 * Decouples AdaptationDispatcher from concrete strategy classes through dynamic registration.
 */

import { PassThroughStrategy } from './strategies/PassThroughStrategy.js';
import { SeededNoiseStrategy } from './strategies/SeededNoiseStrategy.js';
import { PeriodicNoiseStrategy } from './strategies/PeriodicNoiseStrategy.js';
import { FFTCacheStrategy } from './strategies/FFTCacheStrategy.js';
import { ParticleCacheStrategy } from './strategies/ParticleCacheStrategy.js';
import { PeriodicEnvelopeStrategy } from './strategies/PeriodicEnvelopeStrategy.js';

export class StrategyRegistry {
    constructor() {
        this.strategies = new Map();
        this.initializeDefaultStrategies();
    }

    /**
     * Populate standard strategy interfaces
     */
    initializeDefaultStrategies() {
        this.register('PassThrough', new PassThroughStrategy());
        this.register('SeededNoise', new SeededNoiseStrategy());
        this.register('PeriodicNoise', new PeriodicNoiseStrategy());
        this.register('FFTCache', new FFTCacheStrategy());
        this.register('ParticleCache', new ParticleCacheStrategy());
        this.register('PeriodicEnvelope', new PeriodicEnvelopeStrategy());
    }

    /**
     * Register a strategy instance by name
     * @param {string} name - Strategy identifier
     * @param {import('./ProceduralAdapter.js').ProceduralAdapter} strategyInstance 
     */
    register(name, strategyInstance) {
        if (!name || !strategyInstance) return;
        this.strategies.set(String(name).toLowerCase(), strategyInstance);
    }

    /**
     * Get strategy instance by name
     * @param {string} name 
     * @returns {import('./ProceduralAdapter.js').ProceduralAdapter|null}
     */
    getStrategy(name) {
        if (!name) return this.strategies.get('passthrough') || null;
        const normalized = String(name).toLowerCase().trim();
        return this.strategies.get(normalized) || this.strategies.get('passthrough') || null;
    }

    /**
     * Check if a strategy name is registered
     * @param {string} name 
     */
    hasStrategy(name) {
        if (!name) return false;
        return this.strategies.has(String(name).toLowerCase().trim());
    }

    /**
     * Get all registered strategy names
     */
    getAllStrategyNames() {
        return Array.from(this.strategies.keys());
    }
}

// Export singleton instance
export const strategyRegistry = new StrategyRegistry();
