class RenderPlan {
    constructor(editorState) {
        this.id = crypto.randomUUID();
        this.canvas = { width: 1080, height: 1920 };
        this.layers = this._parseLayers(editorState.layers);
        this.typography = this._extractTypography(editorState.layers);
        this.images = this._extractImages(editorState.layers);
        this.audio = []; // Mock audio extraction
        this.effects = [];
        this.timing = { duration: 15, fps: 30 };
        this.output = { format: 'mp4', codec: 'h264' };
    }
    
    _parseLayers(layers) {
        if (!layers) return [];
        return layers.map(l => ({
            id: l.id,
            type: l.type || 'unknown',
            z: l.zIndex || 0,
            props: l.properties || {}
        })).sort((a,b) => a.z - b.z);
    }
    
    _extractTypography(layers) {
        if (!layers) return [];
        return layers.filter(l => l.properties && l.properties.text)
                     .map(l => ({ text: l.properties.text, font: l.properties.fontTitle || 'Inter' }));
    }
    
    _extractImages(layers) {
        if (!layers) return [];
        return layers.filter(l => l.properties && l.properties.url)
                     .map(l => ({ url: l.properties.url }));
    }
}
module.exports = RenderPlan;