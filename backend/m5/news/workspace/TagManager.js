class TagManager {
    addTag(project, tag) {
        if (!project.tags) project.tags = [];
        if (!project.tags.includes(tag)) project.tags.push(tag);
    }
    
    removeTag(project, tag) {
        if (!project.tags) return;
        project.tags = project.tags.filter(t => t !== tag);
    }
}
module.exports = TagManager;