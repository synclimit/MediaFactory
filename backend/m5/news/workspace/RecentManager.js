class RecentManager {
    constructor() {
        this.recentIds = [];
    }
    
    track(projectId) {
        this.recentIds = this.recentIds.filter(id => id !== projectId);
        this.recentIds.unshift(projectId);
        if (this.recentIds.length > 50) this.recentIds.pop();
    }
    
    getRecent() {
        return this.recentIds;
    }
}
module.exports = RecentManager;