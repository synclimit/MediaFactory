const fs = require('fs');
const path = require('path');

class AutoSaveManager {
    constructor(editorState) {
        this.state = editorState;
        this.saveInterval = null;
        this.saveDir = path.join(__dirname, '../cache/autosaves');
        if (!fs.existsSync(this.saveDir)) fs.mkdirSync(this.saveDir, { recursive: true });
    }
    
    start() {
        // Auto Save Every 2 seconds
        this.saveInterval = setInterval(() => this.save(), 2000);
    }
    
    stop() {
        if (this.saveInterval) clearInterval(this.saveInterval);
    }
    
    save() {
        if (!this.state.isModified) return false;
        
        const projectId = this.state.projectId || 'unsaved_project';
        const file = path.join(this.saveDir, `${projectId}.json`);
        
        const data = {
            timestamp: Date.now(),
            layers: this.state.layers,
            cardState: this.state.cardState
        };
        
        fs.writeFileSync(file, JSON.stringify(data));
        this.state.isModified = false;
        this.state.lastSaved = Date.now();
        return true;
    }
    
    recover(projectId) {
        const file = path.join(this.saveDir, `${projectId}.json`);
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        return null;
    }
}
module.exports = AutoSaveManager;