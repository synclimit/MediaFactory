/**
 * FrameInputProvider
 * The official runtime source for scene data. Decouples the RenderPipeline
 * from Workspace-specific concepts.
 */
export class FrameInputProvider {
    constructor() {
        this.inputs = {
            subtitleObjects: [],
            playlistObjects: [],
            textObjects: [],
            backgroundObjects: [],
            visualizerObjects: [],
            settings: {}
        };
    }

    /**
     * Updates the current scene inputs.
     * Maps raw workspace objects into standardized pipeline buckets.
     * @param {Array} objects Array of scene objects
     * @param {Object} settings Global settings
     */
    setInputs(objects = [], settings = {}) {
        this.rawObjects = objects;
        this.rawSettings = settings;

        const subtitles = [];
        const playlists = [];
        const texts = [];
        const backgrounds = [];
        const visualizers = [];

        for (const obj of objects) {
            // Ignore disabled objects if necessary, but typically pipeline handles visibility
            if (obj.type === 'subtitle') subtitles.push(obj);
            else if (obj.type === 'playlist' || obj.type === 'track_list_column') playlists.push(obj);
            else if (obj.type === 'text') texts.push(obj);
            else if (obj.type === 'background') backgrounds.push(obj);
            else if (obj.type === 'visualizer') visualizers.push(obj);
        }

        this.inputs = {
            subtitleObjects: subtitles,
            playlistObjects: playlists,
            textObjects: texts,
            backgroundObjects: backgrounds,
            visualizerObjects: visualizers,
            settings
        };
    }

    getInputs() {
        return this.inputs;
    }

    getObjects() {
        return this.rawObjects || [];
    }

    getSettings() {
        return this.rawSettings || {};
    }
}
