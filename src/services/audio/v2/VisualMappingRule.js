export class VisualMappingRule {
    constructor(config = {}) {
        this.source = config.source || 'beat';
        this.target = config.target || 'Zoom';
        this.multiplier = config.multiplier !== undefined ? config.multiplier : 1.0;
        this.offset = config.offset || 0.0;
        this.min = config.min !== undefined ? config.min : -Infinity;
        this.max = config.max !== undefined ? config.max : Infinity;
        this.invert = config.invert || false;
        this.enabled = config.enabled !== undefined ? config.enabled : true;
        this.curve = config.curve || null; 
        
        Object.freeze(this);
    }
}
