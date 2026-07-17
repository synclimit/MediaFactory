class MotionTranslator {
    /**
     * Translates a RenderGraph Motion Node into Abstract Filter Nodes.
     * @param {Object} motionNode 
     */
    static translateVideo(motionNode) {
        if (!motionNode) return [];
        
        const nodes = [];

        // 1. SPEED
        if (motionNode.speed && motionNode.speed !== 1.0) {
            const ptsRatio = (1.0 / motionNode.speed).toFixed(4);
            nodes.push({ filter: 'setpts', params: { expr: `${ptsRatio}*PTS` } });
        }

        // 2. REVERSE
        if (motionNode.reverse) {
            nodes.push({ filter: 'reverse', params: {} });
        }

        // 3. FRAME BLEND
        if (motionNode.frameBlend) {
            nodes.push({ filter: 'minterpolate', params: { mi_mode: 'blend' } });
        }

        // 4. MOTION BLUR
        if (motionNode.motionBlur) {
            nodes.push({ filter: 'tmix', params: { frames: motionNode.motionBlur, weights: '1' } });
        }

        return nodes;
    }

    /**
     * Translates audio speed
     * @param {Object} motionNode 
     */
    static translateAudio(motionNode) {
        if (!motionNode) return [];
        const nodes = [];

        if (motionNode.speed && motionNode.speed !== 1.0) {
            nodes.push({ filter: 'atempo', params: { tempo: motionNode.speed.toFixed(4) } });
        }

        if (motionNode.reverse) {
            nodes.push({ filter: 'areverse', params: {} });
        }

        return nodes;
    }
}

module.exports = MotionTranslator;
