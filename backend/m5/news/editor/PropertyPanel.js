class PropertyPanel {
    constructor(editorState) {
        this.state = editorState;
    }
    
    updateProperty(layerId, propertyObj) {
        const layer = this.state.layers.find(l => l.id === layerId);
        if (!layer) return false;
        if (layer.locked) return false; // Cannot edit locked layer
        
        layer.properties = { ...layer.properties, ...propertyObj };
        this.state.isModified = true;
        return true;
    }
    
    getAvailableProperties(layerId) {
        const layer = this.state.layers.find(l => l.id === layerId);
        if (!layer) return null;
        
        // Mock returning the UI-available properties for that specific layer type
        return Object.keys(layer.properties);
    }
}
module.exports = PropertyPanel;