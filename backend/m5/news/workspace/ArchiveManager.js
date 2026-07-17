const ProjectStates = require('./ProjectStates');
class ArchiveManager {
    archive(project) {
        project.state = ProjectStates.ARCHIVED;
    }
    
    restore(project) {
        project.state = ProjectStates.DRAFT;
    }
}
module.exports = ArchiveManager;