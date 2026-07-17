class HistoryManager {
    constructor(editorState) {
        this.state = editorState;
        this.historyStack = [];
        this.redoStack = [];
        this.maxActions = 100;
    }
    
    recordState() {
        // Deep clone the layers for history
        const snapshot = JSON.stringify(this.state.layers);
        if (this.historyStack.length >= this.maxActions) {
            this.historyStack.shift();
        }
        this.historyStack.push(snapshot);
        this.redoStack = []; // Clear redo on new action
    }
    
    undo() {
        if (this.historyStack.length > 1) {
            const current = this.historyStack.pop();
            this.redoStack.push(current);
            const previous = this.historyStack[this.historyStack.length - 1];
            this.state.layers = JSON.parse(previous);
            this.state.isModified = true;
            return true;
        }
        return false;
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const next = this.redoStack.pop();
            this.historyStack.push(next);
            this.state.layers = JSON.parse(next);
            this.state.isModified = true;
            return true;
        }
        return false;
    }
}
module.exports = HistoryManager;