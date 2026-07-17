export function validateSpectrumPipeline(comp) {
    if (!comp) {
        throw new Error('Validation Error: VisualComposition is null or undefined.');
    }

    if (!comp.geometry) {
        throw new Error('Validation Error: Missing category "geometry" in VisualComposition.');
    }

    // Verify types and catch NaN
    const checkNumber = (val, path) => {
        if (typeof val !== 'number' || Number.isNaN(val)) {
            throw new Error(`Validation Error: Invalid number at '${path}'. Value: ${val}`);
        }
    };

    checkNumber(comp.geometry.spectrumBands, 'geometry.spectrumBands');
    checkNumber(comp.geometry.spectrumPeak, 'geometry.spectrumPeak');
    checkNumber(comp.geometry.spectrumColorWeight, 'geometry.spectrumColorWeight');

    if (!(comp.geometry.spectrumHeights instanceof Float32Array)) {
        throw new Error('Validation Error: spectrumHeights must be a Float32Array.');
    }

    return true;
}
