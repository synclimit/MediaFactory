const BasePanelService = require('../BasePanelService');

class OverlayService extends BasePanelService {
    constructor() {
        super('Overlay', {
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
            overlays: []
        };
    }
}

module.exports = OverlayService;
