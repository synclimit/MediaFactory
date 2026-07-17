export function validateCameraPipeline(comp) {
    if (!comp) {
        throw new Error('Validation Error: VisualComposition is null or undefined.');
    }

    if (!comp.camera) {
        throw new Error('Validation Error: Missing category "camera" in VisualComposition.');
    }

    // Verify types and catch NaN
    const checkNumber = (val, path) => {
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new Error(`Validation Error: Invalid number at '${path}'. Value: ${val}`);
        }
    };

    checkNumber(comp.camera.posX, 'camera.posX');
    checkNumber(comp.camera.posY, 'camera.posY');
    checkNumber(comp.camera.roll, 'camera.roll');
    checkNumber(comp.camera.shakeX, 'camera.shakeX');
    checkNumber(comp.camera.shakeY, 'camera.shakeY');
    checkNumber(comp.camera.momentum, 'camera.momentum');
    checkNumber(comp.camera.velocity, 'camera.velocity');
    checkNumber(comp.camera.zoomBias, 'camera.zoomBias');

    return true;
}
