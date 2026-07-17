const crypto = require('crypto');

class ProjectManager {
    constructor(editorState) {
        this.state = editorState;
        this.projects = new Map(); // In-memory mock for DB
    }
    
    open(projectId) {
        const p = this.projects.get(projectId);
        if (p) {
            this.state.projectId = p.id;
            this.state.cardState = p.cardState;
            this.state.layers = p.layers;
            this.state.isModified = false;
            return true;
        }
        return false;
    }
    
    save() {
        if (!this.state.projectId) {
            this.state.projectId = crypto.randomUUID();
        }
        this.projects.set(this.state.projectId, {
            id: this.state.projectId,
            name: `Project ${this.state.projectId.substring(0,6)}`,
            cardState: this.state.cardState,
            layers: this.state.layers,
            updatedAt: Date.now()
        });
        this.state.isModified = false;
        return this.state.projectId;
    }
    
    duplicate(projectId) {
        const p = this.projects.get(projectId);
        if (!p) return null;
        
        const newId = crypto.randomUUID();
        this.projects.set(newId, {
            ...p,
            id: newId,
            name: `Copy of ${p.name}`,
            updatedAt: Date.now()
        });
        return newId;
    }
    
    rename(projectId, newName) {
        const p = this.projects.get(projectId);
        if (p) p.name = newName;
    }
    
    delete(projectId) {
        this.projects.delete(projectId);
    }
}
module.exports = ProjectManager;