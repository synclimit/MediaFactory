const BasePanelService = require('../BasePanelService');

class EffectsService extends BasePanelService {
    constructor() {
        super('Effects', {
            assets: false,
            presets: true,
            validation: true,
            runtime: true,
            import: false,
            export: true,
            preview: true,
            queue: false,
            plugins: true
        });
    }

    getDefaultSettings() {
        return {
            activeEffects: []
        };
    }
}

module.exports = EffectsService;
