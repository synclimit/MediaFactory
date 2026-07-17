const TranslatorRegistry = require('../registry/TranslatorRegistry');
const GraphUtils = require('../utils/GraphUtils');

class ConcatChainBuilder {
    /**
     * Builds concatenation nodes.
     * @param {Array<Object>} concatNodes 
     */
    static build(concatNodes) {
        // Simplified. In a real scenario, this orchestrates the concat filter or xfade filters.
        const nodes = [];

        concatNodes.forEach((node, index) => {
            if (node.transition && node.transition !== 'none') {
                const transFilter = TranslatorRegistry.transition.translate({ type: node.transition });
                nodes.push({
                    chainId: node.chainId,
                    filterStr: transFilter,
                    type: 'transition',
                    outLink: GraphUtils.generateLinkId('v')
                });
            } else {
                nodes.push({
                    chainId: node.chainId,
                    filterStr: 'concat=n=2:v=1:a=0', // very simplified logic for illustration
                    type: 'concat',
                    outLink: GraphUtils.generateLinkId('v')
                });
            }
        });

        return nodes;
    }
}

module.exports = ConcatChainBuilder;
