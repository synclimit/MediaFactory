class CardState {
    constructor(data = {}) {
        this.headline = data.headline || '';
        this.summary = data.summary || '';
        this.badge = data.badge || '';
        this.image = data.image || '';
        this.source = data.source || '';
        
        this.theme = data.theme || 'Light';
        this.colors = data.colors || {};
        this.typography = data.typography || {};
        this.spacing = data.spacing || {};
        this.shadow = data.shadow || '';
        this.radius = data.radius || '';
        
        this.safeArea = data.safeArea || null;
        this.viewport = data.viewport || { width: 390, height: 844 };
        this.imageMode = data.imageMode || 'cover';
        
        this.layout = data.layout || 'Standard';
        this.template = data.template || null;
        
        this.validationWarnings = data.validationWarnings || [];
        this.overflowCount = data.overflowCount || 0;
    }
}
module.exports = CardState;