const BasePanelService = require('../BasePanelService');

class ReactiveService extends BasePanelService {
    constructor() {
        super('Reactive', {
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
            reactors: []
        };
    }
}

module.exports = ReactiveService;
