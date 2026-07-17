class TransitionTranslator {
    /**
     * Translates a RenderGraph Transition Node into Abstract Filter Nodes.
     * @param {Object} transitionNode 
     */
    static translate(transitionNode) {
        if (!transitionNode) return [];
        
        if (transitionNode.type === 'crossfade') {
            return [{
                filter: 'xfade',
                params: { transition: 'fade', duration: transitionNode.duration || 1, offset: transitionNode.offset || 0 }
            }];
        }
        
        if (transitionNode.type === 'slide') {
            return [{
                filter: 'xfade',
                params: { transition: 'slideleft', duration: transitionNode.duration || 1, offset: transitionNode.offset || 0 }
            }];
        }

        return [];
    }
}

module.exports = TransitionTranslator;
