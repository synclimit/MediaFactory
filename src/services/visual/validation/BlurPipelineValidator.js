export function validateBlurPipeline(comp) {
    if (!comp) {
        throw new Error('Validation Error: VisualComposition is null or undefined.');
    }

    if (!comp.postProcess) {
        throw new Error('Validation Error: Missing category "postProcess" in VisualComposition.');
    }

    // Verify types and catch NaN
    const checkNumber = (val, path) => {
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new Error(`Validation Error: Invalid number at '${path}'. Value: ${val}`);
        }
    };

    checkNumber(comp.postProcess.blur, 'postProcess.blur');
    checkNumber(comp.postProcess.blurDirection, 'postProcess.blurDirection');
    checkNumber(comp.postProcess.blurStrength, 'postProcess.blurStrength');

    return true;
}
