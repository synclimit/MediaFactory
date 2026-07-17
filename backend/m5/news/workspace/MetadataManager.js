class MetadataManager {
    createMetadata(overrides = {}) {
        return {
            created: Date.now(),
            updated: Date.now(),
            published: null,
            aiProvider: overrides.aiProvider || 'Gemini',
            promptVersion: overrides.promptVersion || 'v1',
            theme: overrides.theme || 'Light',
            template: overrides.template || 'Standard',
            duration: overrides.duration || 0,
            resolution: overrides.resolution || '1080x1920',
            renderCount: overrides.renderCount || 0,
            version: overrides.version || 1
        };
    }
    
    update(project) {
        project.metadata.updated = Date.now();
        project.metadata.version += 1;
    }
}
module.exports = MetadataManager;