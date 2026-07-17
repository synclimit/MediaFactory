const ProjectManager = require('./ProjectManager');
const QueueManager = require('./QueueManager');
const FolderManager = require('./FolderManager');
const SearchManager = require('./SearchManager');
const TagManager = require('./TagManager');
const FavoriteManager = require('./FavoriteManager');
const ArchiveManager = require('./ArchiveManager');
const DashboardManager = require('./DashboardManager');
const ThumbnailCache = require('./ThumbnailCache');
const MetadataManager = require('./MetadataManager');
const RecentManager = require('./RecentManager');
const ProjectStates = require('./ProjectStates');

const fs = require('fs');
const path = require('path');

class ProjectRuntime {
    constructor() {
        this.metadataManager = new MetadataManager();
        this.recentManager = new RecentManager();
        this.projectManager = new ProjectManager(this);
        this.queueManager = new QueueManager();
        this.folderManager = new FolderManager();
        this.searchManager = new SearchManager();
        this.tagManager = new TagManager();
        this.favoriteManager = new FavoriteManager();
        this.archiveManager = new ArchiveManager();
        this.dashboardManager = new DashboardManager();
        this.thumbnailCache = new ThumbnailCache();
        
        this.ProjectStates = ProjectStates;
        
        this.saveDir = path.join(__dirname, '../cache/autosaves_workspace');
        if (!fs.existsSync(this.saveDir)) fs.mkdirSync(this.saveDir, { recursive: true });
    }
    
    // Workflow Facade methods
    autoSave() {
        const data = Array.from(this.projectManager.projects.entries());
        fs.writeFileSync(path.join(this.saveDir, 'workspace.json'), JSON.stringify(data));
        return true;
    }
    
    crashRecovery() {
        const file = path.join(this.saveDir, 'workspace.json');
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            this.projectManager.projects = new Map(data);
            return true;
        }
        return false;
    }
    
    changeState(projectId, newState) {
        const p = this.projectManager.open(projectId);
        if (p) {
            p.state = newState;
            this.metadataManager.update(p);
        }
    }
}
module.exports = ProjectRuntime;