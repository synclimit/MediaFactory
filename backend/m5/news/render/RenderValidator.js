class RenderValidator {
    validate(renderPlan) {
        const warnings = [];
        const errors = [];
        
        if (!renderPlan.canvas.width || !renderPlan.canvas.height) {
            errors.push('Invalid Canvas dimensions');
        }
        
        if (renderPlan.layers.length === 0) {
            errors.push('Invalid Layer: No layers found in plan');
        }
        
        renderPlan.typography.forEach(t => {
            if (!t.font) warnings.push(`Missing Font definition for "${t.text}"`);
        });
        
        renderPlan.images.forEach(img => {
            if (!img.url || img.url === '') errors.push('Missing Image source');
        });
        
        if (renderPlan.audio.length === 0) {
            warnings.push('Missing Audio track');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
module.exports = RenderValidator;