export function validateParticlePipeline(comp) {
    if (!comp) {
        throw new Error('Validation Error: VisualComposition is null or undefined.');
    }

    if (!comp.overlay) {
        throw new Error('Validation Error: Missing category "overlay" in VisualComposition.');
    }

    // Verify types and catch NaN
    const checkNumber = (val, path) => {
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new Error(`Validation Error: Invalid number at '${path}'. Value: ${val}`);
        }
    };

    checkNumber(comp.overlay.particleSpawnRate, 'overlay.particleSpawnRate');
    checkNumber(comp.overlay.particleBurstCount, 'overlay.particleBurstCount');
    checkNumber(comp.overlay.particleVelocity, 'overlay.particleVelocity');
    checkNumber(comp.overlay.particleSpread, 'overlay.particleSpread');
    checkNumber(comp.overlay.particleLifetime, 'overlay.particleLifetime');
    checkNumber(comp.overlay.particleOpacity, 'overlay.particleOpacity');

    return true;
}
