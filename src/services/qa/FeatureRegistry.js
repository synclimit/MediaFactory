export class FeatureRegistry {
    static _features = [];
    static _history = {};

    static register(featureClass) {
        if (!this._features.includes(featureClass)) {
            this._features.push(featureClass);
        }
    }

    static getFeatures() {
        return this._features;
    }

    static coverage() {
        // Mock coverage logic based on registered features
        const totalKnownFeatures = 15; // Arbitrary for UI
        const implemented = this._features.length;
        
        return {
            total: totalKnownFeatures,
            implemented,
            percentage: Math.round((implemented / totalKnownFeatures) * 100) || 0
        };
    }
}
