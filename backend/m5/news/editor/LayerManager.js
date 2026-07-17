class LayerManager {
    constructor(editorState) {
        this.state = editorState;
        this.defaultLayers = ['Background', 'Image', 'Gradient', 'Badge', 'Headline', 'Summary', 'Source'];
    }
    
    initializeFromCard(cardState) {
        this.state.layers = this.defaultLayers.map((name, index) => ({
            id: name.toLowerCase(),
            name: name,
            type: name,
            visible: true,
            locked: false,
            zIndex: index,
            properties: this._getDefaultProps(name, cardState)
        }));
    }
    
    _getDefaultProps(name, card) {
        if (name === 'Headline') return { text: card.headline, color: card.colors.text, fontSize: 24, align: 'left', opacity: 1, scale: 1, rotation: 0 };
        if (name === 'Summary') return { text: card.summary, color: card.colors.text, fontSize: 16, align: 'left', opacity: 0.8, scale: 1, rotation: 0 };
        if (name === 'Badge') return { text: card.badge, color: card.colors.accent, opacity: 1, scale: 1, rotation: 0 };
        if (name === 'Image') return { url: card.image, fitMode: card.imageMode, opacity: 1, scale: 1, rotation: 0 };
        return { opacity: 1, scale: 1, rotation: 0 };
    }
    
    toggleVisibility(layerId) {
        const layer = this.state.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.state.isModified = true;
        }
    }
    
    toggleLock(layerId) {
        const layer = this.state.layers.find(l => l.id === layerId);
        if (layer) {
            layer.locked = !layer.locked;
            this.state.isModified = true;
        }
    }
    
    reorder(layerId, newZIndex) {
        const layer = this.state.layers.find(l => l.id === layerId);
        if (layer) {
            layer.zIndex = newZIndex;
            // Sorting to maintain array order matching zIndex
            this.state.layers.sort((a, b) => a.zIndex - b.zIndex);
            this.state.isModified = true;
        }
    }
}
module.exports = LayerManager;