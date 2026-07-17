// Simulated Zustand/Redux Store for Benchmark & UI
class EditorStore {
    constructor() {
        this.projects = new Map();
        this.activeProject = null;
        this.layers = [];
        this.selectedLayerId = null;
        this.history = [];
        this.historyIndex = -1;
    }
    
    openProject(id, layers) {
        this.activeProject = id;
        this.layers = layers;
        this.selectedLayerId = null;
        this.history = [JSON.stringify(layers)];
        this.historyIndex = 0;
    }
    
    selectLayer(id) {
        const start = performance.now();
        this.selectedLayerId = id;
        return performance.now() - start; // return selection time
    }
    
    updateLayer(id, props) {
        const layer = this.layers.find(l => l.id === id);
        if (layer) {
            layer.properties = { ...layer.properties, ...props };
            this._saveHistory();
        }
    }
    
    _saveHistory() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(JSON.stringify(this.layers));
        this.historyIndex++;
        if (this.history.length > 100) {
            this.history.shift();
            this.historyIndex--;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.layers = JSON.parse(this.history[this.historyIndex]);
        }
    }
}
module.exports = EditorStore;