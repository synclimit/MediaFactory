const EditorState = require('./EditorState');
const SelectionManager = require('./SelectionManager');
const LayerManager = require('./LayerManager');
const PropertyPanel = require('./PropertyPanel');
const HistoryManager = require('./HistoryManager');
const AutoSaveManager = require('./AutoSaveManager');
const ProjectManager = require('./ProjectManager');
const PresetManager = require('./PresetManager');

class LiveCardEditorEngine {
    constructor() {
        this.state = new EditorState();
        
        // Modules
        this.selectionManager = new SelectionManager(this.state);
        this.layerManager = new LayerManager(this.state);
        this.propertyPanel = new PropertyPanel(this.state);
        this.historyManager = new HistoryManager(this.state);
        this.autoSaveManager = new AutoSaveManager(this.state);
        this.projectManager = new ProjectManager(this.state);
        this.presetManager = new PresetManager();
        
        // Link layer manager for presets
        this.state._layerManager = this.layerManager;
    }
    
    loadCardState(cardState) {
        this.state.cardState = cardState;
        this.layerManager.initializeFromCard(cardState);
        this.historyManager.recordState(); // initial state
    }
    
    // Facade Methods for Workflow
    select(layerId) {
        return this.selectionManager.select(layerId);
    }
    
    updateProperties(props) {
        if (!this.state.selectedLayerId) return false;
        const res = this.propertyPanel.updateProperty(this.state.selectedLayerId, props);
        if (res) this.historyManager.recordState();
        return res;
    }
    
    undo() {
        return this.historyManager.undo();
    }
    
    redo() {
        return this.historyManager.redo();
    }
    
    applyPreset(name) {
        this.presetManager.applyPreset(this.state, name);
        this.historyManager.recordState();
    }
    
    startAutoSave() {
        this.autoSaveManager.start();
    }
    
    stopAutoSave() {
        this.autoSaveManager.stop();
    }
}
module.exports = LiveCardEditorEngine;