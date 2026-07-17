const BasePanelService = require('../BasePanelService');

class PlaylistService extends BasePanelService {
    constructor() {
        super('Playlist', {
            assets: true,
            presets: false,
            validation: true,
            runtime: true,
            import: true,
            export: false,
            preview: true,
            queue: false,
            plugins: false
        });
    }

    getDefaultSettings() {
        return {
            tracks: [],
            shuffle: false,
            loop: true
        };
    }
}

module.exports = PlaylistService;
