const crypto = require('crypto');
class FolderManager {
    constructor() {
        this.folders = new Map();
        // default folder
        this.folders.set('default', { id: 'default', name: 'Uncategorized', projects: [] });
    }
    
    createFolder(name) {
        const id = crypto.randomUUID();
        this.folders.set(id, { id, name, projects: [] });
        return id;
    }
    
    moveToFolder(project, folderId) {
        if (this.folders.has(folderId)) {
            project.folderId = folderId;
        }
    }
}
module.exports = FolderManager;