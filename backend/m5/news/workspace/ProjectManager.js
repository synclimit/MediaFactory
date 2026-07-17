const crypto = require('crypto');
const ProjectStates = require('./ProjectStates');

class ProjectManager {
    constructor(runtime) {
        this.runtime = runtime;
        this.projects = new Map();
    }
    
    create(title, category = 'News') {
        const id = crypto.randomUUID();
        const proj = {
            id,
            title,
            category,
            state: ProjectStates.DRAFT,
            isFavorite: false,
            tags: [],
            keywords: [],
            folderId: 'default',
            metadata: this.runtime.metadataManager.createMetadata()
        };
        this.projects.set(id, proj);
        this.runtime.recentManager.track(id);
        return proj;
    }
    
    open(id) {
        const p = this.projects.get(id);
        if (p) this.runtime.recentManager.track(id);
        return p;
    }
    
    duplicate(id) {
        const p = this.projects.get(id);
        if (!p) return null;
        
        const newProj = JSON.parse(JSON.stringify(p));
        newProj.id = crypto.randomUUID();
        newProj.title = 'Copy of ' + p.title;
        newProj.metadata = this.runtime.metadataManager.createMetadata();
        newProj.state = ProjectStates.DRAFT;
        
        this.projects.set(newProj.id, newProj);
        this.runtime.recentManager.track(newProj.id);
        return newProj;
    }
    
    rename(id, newTitle) {
        const p = this.projects.get(id);
        if (p) {
            p.title = newTitle;
            this.runtime.metadataManager.update(p);
        }
    }
    
    delete(id) {
        this.projects.delete(id);
    }
}
module.exports = ProjectManager;