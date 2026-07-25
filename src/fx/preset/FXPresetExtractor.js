/**
 * FXPresetExtractor
 * 
 * Bertugas mengekstrak parameter-parameter dari state Editor 
 * (m3BgPool, m3Objects) dan menyusunnya menjadi sebuah "Raw Preset" object.
 * Pure function, tidak bergantung pada React State maupun Store.
 */

export class FXPresetExtractor {
    /**
     * @param {Object} editorState - Current editor state
     * @param {Array} editorState.m3BgPool
     * @param {Array} editorState.m3Objects
     * @returns {Object} Raw Preset Object
     */
    static extract(editorState) {
        const { m3BgPool = [], m3Objects = [] } = editorState;
        
        const rawPreset = {
            applyScope: {},
            parameters: {}
        };

        // --- 1. Background ---
        if (m3BgPool.length > 0) {
            const bgProps = m3BgPool[0].props || {};
            // Extract only known properties that belong to the preset schema
            const bgParams = {};
            if (bgProps.blurAmount !== undefined) bgParams.blurAmount = bgProps.blurAmount;
            if (bgProps.overlayDarkness !== undefined) bgParams.overlayDarkness = bgProps.overlayDarkness;
            if (bgProps.bgZoom !== undefined) bgParams.bgZoom = bgProps.bgZoom;
            
            if (Object.keys(bgParams).length > 0) {
                rawPreset.applyScope.Background = true;
                rawPreset.parameters.Background = bgParams;
            }
        }

        // --- 2. Visualizer ---
        const visualizer = m3Objects.find(obj => obj.type === 'visualizer');
        if (visualizer) {
            rawPreset.applyScope.Visualizer = true;
            const vizParams = { visualizerId: visualizer.visualizerId || 'viz-1' };
            if (visualizer.color) vizParams.color = visualizer.color;
            if (visualizer.colorMode) vizParams.colorMode = visualizer.colorMode;
            if (visualizer.colorLeft) vizParams.colorLeft = visualizer.colorLeft;
            if (visualizer.colorRight) vizParams.colorRight = visualizer.colorRight;
            if (visualizer.barCount !== undefined) vizParams.barCount = visualizer.barCount;
            if (visualizer.opacity !== undefined) vizParams.opacity = visualizer.opacity;
            
            rawPreset.parameters.Visualizer = vizParams;
        }

        // --- 3. Particle ---
        const particle = m3Objects.find(obj => obj.type === 'particles');
        if (particle) {
            rawPreset.applyScope.Particle = true;
            const ptcParams = { presetId: particle.presetId || 'snow' };
            if (particle.count !== undefined) ptcParams.count = particle.count;
            if (particle.wind !== undefined) ptcParams.wind = particle.wind;
            if (particle.gravity !== undefined) ptcParams.gravity = particle.gravity;
            
            rawPreset.parameters.Particle = ptcParams;
        }

        // --- 4. Subtitle ---
        const subtitle = m3Objects.find(obj => obj.type === 'subtitle' || obj.type === 'text');
        if (subtitle) {
            rawPreset.applyScope.Subtitle = true;
            const subParams = {};
            if (subtitle.font) subParams.font = subtitle.font;
            if (subtitle.fontSize !== undefined) subParams.fontSize = subtitle.fontSize;
            if (subtitle.color) subParams.color = subtitle.color;
            
            if (Object.keys(subParams).length > 0) {
                rawPreset.parameters.Subtitle = subParams;
            } else {
                delete rawPreset.applyScope.Subtitle;
            }
        }

        return rawPreset;
    }
}
