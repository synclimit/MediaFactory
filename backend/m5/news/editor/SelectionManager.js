class SelectionManager {
    constructor(editorState) {
        this.state = editorState;
    }
    
    select(layerId) {
        this.state.selectedLayerId = layerId;
        return this.getSelectedLayer();
    }
    
    clearSelection() {
        this.state.selectedLayerId = null;
    }
    
    getSelectedLayer() {
        if (!this.state.selectedLayerId) return null;
        return this.state.layers.find(l => l.id === this.state.selectedLayerId) || null;
    }
}
module.exports = SelectionManager;