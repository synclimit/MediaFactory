const BasePanelService = require('../BasePanelService');

class BrandingService extends BasePanelService {
    constructor() {
        super('Branding', {
            assets: true,
            presets: true,
            validation: true,
            runtime: true,
            import: true,
            export: true,
            preview: true,
            queue: false,
            plugins: true
        });
    }

    getDefaultSettings() {
        return {
            logo: null,
            watermark: null,
            subscribeAnim: null,
            intro: null,
            outro: null,
            defaultFont: null
        };
    }
}

module.exports = BrandingService;
