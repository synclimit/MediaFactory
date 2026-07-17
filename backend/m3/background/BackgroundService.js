const BasePanelService = require('../BasePanelService');

class BackgroundService extends BasePanelService {
    constructor() {
        super('Background', {
            assets: true,
            presets: true,
            validation: true,
            runtime: true,
            import: true,
            export: false,
            preview: true,
            queue: false,
            plugins: true
        });
    }

    getDefaultSettings() {
        return {
            type: 'none',
            filename: null,
            opacity: 100
        };
    }
}

module.exports = BackgroundService;
