class ArticleSchema {
    constructor(data = {}) {
        this.url = data.url || null;
        this.domain = data.domain || null;
        this.source = data.source || null;
        this.title = data.title || null;
        this.subtitle = data.subtitle || null;
        this.body = data.body || null;
        this.author = data.author || null;
        this.publishDate = data.publishDate || null;
        this.language = data.language || 'id';
        this.images = data.images || [];
        this.metadata = data.metadata || {};
        this.status = data.status || 'Extracted';
        this.createdAt = Date.now();
        
        // AI Reserved Fields (Not used in Sprint 1, but part of Unified Schema)
        this.summary = null;
        this.headline = null;
        this.category = null;
        this.keywords = [];
        this.mainEntity = null;
        this.recommendedLayout = null;
    }

    validate() {
        const errors = [];
        if (!this.title || this.title.trim() === '') errors.push('Title missing');
        if (!this.body || this.body.trim().length < 100) errors.push('Body missing or too short');
        if (!this.language) errors.push('Language missing');
        if (!this.domain) errors.push('Domain missing');
        if (!Array.isArray(this.images)) errors.push('Images array missing');
        if (typeof this.metadata !== 'object') errors.push('Metadata missing');
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ArticleSchema;
