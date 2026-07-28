export class RuntimeContext {
    constructor(initialStates = {}) {
        this.featureStates = new Map();
        for (const [id, state] of Object.entries(initialStates)) {
            this.setFeatureState(id, state);
        }
        this.cacheHits = new Set();
        this.outputAssets = new Map();
        this.executionResults = new Map();
    }

    setFeatureState(featureId, state = {}) {
        const currentState = this.featureStates.get(featureId) || {
            enabled: true,
            cached: false,
            runtimeCost: 0,
            outputAsset: null,
            executionResult: null
        };
        this.featureStates.set(featureId, { ...currentState, ...state });
    }

    getFeatureState(featureId) {
        return this.featureStates.get(featureId) || {
            enabled: true,
            cached: false,
            runtimeCost: 0,
            outputAsset: null,
            executionResult: null
        };
    }

    markCached(featureId, isCached = true) {
        this.setFeatureState(featureId, { cached: isCached });
        if (isCached) this.cacheHits.add(featureId);
        else this.cacheHits.delete(featureId);
    }

    isCached(featureId) {
        return Boolean(this.getFeatureState(featureId).cached);
    }

    setOutputAsset(featureId, assetPath) {
        this.setFeatureState(featureId, { outputAsset: assetPath });
        this.outputAssets.set(featureId, assetPath);
    }

    getOutputAsset(featureId) {
        return this.outputAssets.get(featureId) || null;
    }
}
