class VisualTranslator {
    /**
     * Translates a RenderGraph Visual Node into Abstract Filter Nodes.
     * @param {Object} visualNode - Values extracted from RenderGraph/Recipe
     * @returns {Array<Object>} - Array of abstract filter objects
     */
    static translate(visualNode) {
        if (!visualNode) return [];
        
        const nodes = [];

        // 1. EQ
        const eqParams = {};
        if (visualNode.brightness !== undefined && visualNode.brightness !== 1.0) {
            eqParams.brightness = (visualNode.brightness - 1.0).toFixed(2);
        }
        if (visualNode.contrast !== undefined && visualNode.contrast !== 1.0) {
            eqParams.contrast = visualNode.contrast.toFixed(2);
        }
        if (visualNode.gamma !== undefined && visualNode.gamma !== 1.0) {
            eqParams.gamma = visualNode.gamma.toFixed(2);
        }
        if (visualNode.saturation !== undefined && visualNode.saturation !== 1.0) {
            eqParams.saturation = visualNode.saturation.toFixed(2);
        }

        if (Object.keys(eqParams).length > 0) {
            nodes.push({ filter: 'eq', params: eqParams });
        }

        // 2. HUE
        if (visualNode.hue !== undefined && visualNode.hue !== 0) {
            nodes.push({ filter: 'hue', params: { h: visualNode.hue } });
        }

        // 3. SHARPEN
        if (visualNode.sharpen) {
            nodes.push({ filter: 'unsharp', params: { lx: 5, ly: 5, la: visualNode.sharpen.toFixed(2) } });
        }

        // 4. NOISE
        if (visualNode.noise) {
            nodes.push({ filter: 'noise', params: { alls: Math.round(visualNode.noise * 100), allf: 't+u' } });
        }

        // 5. BLUR
        if (visualNode.blur) {
            nodes.push({ filter: 'boxblur', params: { r: visualNode.blur } });
        }

        return nodes;
    }
}

module.exports = VisualTranslator;
