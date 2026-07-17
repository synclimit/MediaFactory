const ProjectStates = require('./ProjectStates');
class DashboardManager {
    getStatistics(projectsMap) {
        const stats = {
            total: projectsMap.size,
            drafts: 0, rendering: 0, published: 0, favorites: 0
        };
        
        for (const [id, proj] of projectsMap.entries()) {
            if (proj.state === ProjectStates.DRAFT) stats.drafts++;
            if (proj.state === ProjectStates.RENDERING) stats.rendering++;
            if (proj.state === ProjectStates.PUBLISHED) stats.published++;
            if (proj.isFavorite) stats.favorites++;
        }
        return stats;
    }
}
module.exports = DashboardManager;