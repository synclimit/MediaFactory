class SearchManager {
    search(projectsMap, query) {
        const results = [];
        const q = (query.text || '').toLowerCase();
        
        for (const [id, proj] of projectsMap.entries()) {
            let match = false;
            
            if (q && proj.title.toLowerCase().includes(q)) match = true;
            if (q && proj.category && proj.category.toLowerCase().includes(q)) match = true;
            if (q && proj.tags && proj.tags.some(t => t.toLowerCase().includes(q))) match = true;
            if (q && proj.keywords && proj.keywords.some(k => k.toLowerCase().includes(q))) match = true;
            
            if (query.status && proj.state !== query.status) match = false;
            if (query.folderId && proj.folderId !== query.folderId) match = false;
            if (query.favorite && !proj.isFavorite) match = false;
            
            // if no text query but other filters hit
            if (!q && (query.status || query.folderId || query.favorite)) {
                match = true;
            }
            
            if (match) results.push(proj);
        }
        return results;
    }
}
module.exports = SearchManager;