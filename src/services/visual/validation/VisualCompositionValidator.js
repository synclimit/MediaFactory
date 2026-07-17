export function validateVisualComposition(comp) {
    if (!comp) {
        throw new Error('Validation Error: VisualComposition is null or undefined.');
    }

    const requiredCategories = ['transform', 'camera', 'postProcess', 'overlay', 'geometry', 'debug'];
    
    for (const category of requiredCategories) {
        if (!comp[category]) {
            throw new Error(`Validation Error: Missing category '${category}' in VisualComposition.`);
        }
    }

    // Verify types and catch NaN
    const checkNumber = (val, path) => {
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new Error(`Validation Error: Invalid number at '${path}'. Value: ${val}`);
        }
    };

    checkNumber(comp.transform.scale, 'transform.scale');
    checkNumber(comp.transform.rotation, 'transform.rotation');
    checkNumber(comp.camera.zoom, 'camera.zoom');
    checkNumber(comp.postProcess.glowIntensity, 'postProcess.glowIntensity');
    checkNumber(comp.overlay.opacity, 'overlay.opacity');
    
    // Check array type
    if (!Array.isArray(comp.debug.activeEffects)) {
        throw new Error('Validation Error: debug.activeEffects must be an array.');
    }

    return true;
}
