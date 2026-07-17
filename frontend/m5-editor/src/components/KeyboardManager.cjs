class KeyboardManager {
    constructor(store) {
        this.store = store;
        this.keysDown = new Set();
    }
    
    handleKeyDown(e) {
        this.keysDown.add(e.key);
        
        // Ctrl+Z
        if (e.ctrlKey && e.key === 'z') this.store.undo();
        // Ctrl+Y
        if (e.ctrlKey && e.key === 'y') this.store.redo();
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.store.selectedLayerId) this.store.deleteLayer(this.store.selectedLayerId);
        }
        // Arrows (Nudge)
        if (e.key === 'ArrowUp') this.store.nudgeSelection(0, -1, e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowDown') this.store.nudgeSelection(0, 1, e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowLeft') this.store.nudgeSelection(-1, 0, e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowRight') this.store.nudgeSelection(1, 0, e.shiftKey ? 10 : 1);
        
        // Copy / Paste
        if (e.ctrlKey && e.key === 'c') this.store.copySelection();
        if (e.ctrlKey && e.key === 'v') this.store.pasteClipboard();
    }
    
    handleKeyUp(e) {
        this.keysDown.delete(e.key);
    }
}
module.exports = KeyboardManager;