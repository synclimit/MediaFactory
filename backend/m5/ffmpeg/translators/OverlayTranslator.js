class OverlayTranslator {
    /**
     * Translates a RenderGraph Overlay Node into Abstract Filter Nodes.
     * @param {Object} overlayNode 
     */
    static translate(overlayNode) {
        if (!overlayNode) return [];
        
        const params = {};
        params.x = overlayNode.x || '(main_w-overlay_w)/2';
        params.y = overlayNode.y || '(main_h-overlay_h)/2';

        if (overlayNode.start !== undefined && overlayNode.duration !== undefined) {
            const end = overlayNode.start + overlayNode.duration;
            params.enable = `'between(t,${overlayNode.start},${end})'`;
        }

        return [{ filter: 'overlay', params: params }];
    }
}

module.exports = OverlayTranslator;
