class DraftObject {
    constructor(data = {}) {
        this.headline = data.headline || '';
        this.summary = data.summary || '';
        this.category = data.category || '';
        this.keywords = data.keywords || [];
        this.mainEntity = data.mainEntity || '';
        this.recommendedLayout = data.recommendedLayout || 'Standard';
        this.confidence = data.confidence || 0;
        this.language = data.language || 'id';
        this.tone = data.tone || 'Neutral';
        this.provider = data.provider || '';
        this.model = data.model || '';
        this.promptVersion = data.promptVersion || '';
        this.cached = data.cached || false;
        this.latencyMs = data.latencyMs || 0;
        this.tokenUsage = data.tokenUsage || 0;
        this.retryCount = data.retryCount || 0;
        this.createdAt = Date.now();
    }
}
module.exports = DraftObject;