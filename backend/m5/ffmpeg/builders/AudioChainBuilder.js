const TranslatorRegistry = require('../registry/TranslatorRegistry');
const FilterUtils = require('../utils/FilterUtils');
const GraphUtils = require('../utils/GraphUtils');

class AudioChainBuilder {
    /**
     * Translates an audio chain from RenderGraph to FFmpeg FilterGraph Nodes.
     * @param {Object} audioChainNode 
     */
    static build(audioChainNode) {
        const filters = [];

        // 1. Audio Effects (Volume, Fade, Normalize, EQ)
        const audioFilter = TranslatorRegistry.audio.translate(audioChainNode.audio);
        if (audioFilter) filters.push(audioFilter);

        const filterStr = FilterUtils.chain(filters);
        
        return {
            chainId: audioChainNode.chainId,
            filterStr: filterStr,
            inLink: null,
            outLink: GraphUtils.generateLinkId('a')
        };
    }
}

module.exports = AudioChainBuilder;
