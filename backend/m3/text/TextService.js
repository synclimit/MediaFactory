const BasePanelService = require('../BasePanelService');

class TextService extends BasePanelService {
    constructor() {
        super('Text', {
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
            texts: []
        };
    }
}

module.exports = TextService;
