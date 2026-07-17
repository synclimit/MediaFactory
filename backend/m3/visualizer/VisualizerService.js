const BasePanelService = require('../BasePanelService');

class VisualizerService extends BasePanelService {
    constructor() {
        super('Visualizer', {
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
            preset: 'default',
            color: '#ffffff',
            intensity: 50
        };
    }
}

module.exports = VisualizerService;
