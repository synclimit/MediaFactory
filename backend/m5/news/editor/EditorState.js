class EditorState {
    constructor(cardState = null) {
        this.cardState = cardState;
        this.selectedLayerId = null;
        this.layers = [];
        this.isModified = false;
        this.lastSaved = null;
        this.projectId = null;
    }
}
module.exports = EditorState;