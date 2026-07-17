class EffectCostRegistry {
    static costs = {
        blur: { cpu: 8, gpu: 2, memory: 5, compatibility: 1.0 },
        noise: { cpu: 5, gpu: 1, memory: 2, compatibility: 1.0 },
        zoompan: { cpu: 2, gpu: 1, memory: 1, compatibility: 0.8 },
        eq: { cpu: 1, gpu: 1, memory: 1, compatibility: 1.0 },
        sharpen: { cpu: 1, gpu: 1, memory: 1, compatibility: 1.0 },
        frameblend: { cpu: 9, gpu: 3, memory: 6, compatibility: 0.9 },
        overlay: { cpu: 2, gpu: 1, memory: 2, compatibility: 1.0 }
    };

    /**
     * Returns the cost profile of a given effect.
     * @param {string} effectName 
     */
    static getCost(effectName) {
        return this.costs[effectName.toLowerCase()] || { cpu: 1, gpu: 1, memory: 1, compatibility: 1.0 };
    }
}

module.exports = EffectCostRegistry;
