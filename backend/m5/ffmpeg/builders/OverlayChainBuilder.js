const TranslatorRegistry = require('../registry/TranslatorRegistry');
const GraphUtils = require('../utils/GraphUtils');

class OverlayChainBuilder {
    /**
     * Translates an overlay chain from RenderGraph to FFmpeg FilterGraph Nodes.
     * @param {Object} overlayChainNode 
     */
    static build(overlayChainNode) {
        const overlayFilter = TranslatorRegistry.overlay.translate(overlayChainNode);
        
        return {
            chainId: overlayChainNode.chainId,
            filterStr: overlayFilter, // e.g. "overlay=x=10:y=10:enable='between(t,5,10)'"
            bgLink: null, // the main video link it sits on top of
            fgLink: null, // the asset link
            outLink: GraphUtils.generateLinkId('v')
        };
    }
}

module.exports = OverlayChainBuilder;
