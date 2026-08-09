/**
 * ValidationEngine.js [Visualizer 3 Quality Gatekeeper]
 * Bitwise Pixel-by-Pixel RGBA diff engine and heatmap generator.
 */

export class ValidationEngine {
  static compareCanvases(canvasA, canvasB, heatmapCanvas = null, tolerance = 2) {
    if (!canvasA || !canvasB) {
      return { passed: false, error: 'Target canvas element is missing' };
    }

    const ctxA = canvasA.getContext('2d', { willReadFrequently: true });
    const ctxB = canvasB.getContext('2d', { willReadFrequently: true });

    const width = canvasA.width;
    const height = canvasA.height;

    if (canvasB.width !== width || canvasB.height !== height) {
      return {
        passed: false,
        error: `Canvas dimensions mismatch (${width}x${height} vs ${canvasB.width}x${canvasB.height})`
      };
    }

    const imgDataA = ctxA.getImageData(0, 0, width, height);
    const imgDataB = ctxB.getImageData(0, 0, width, height);

    const dataA = imgDataA.data;
    const dataB = imgDataB.data;
    const totalPixels = width * height;

    let mismatchedPixels = 0;
    let totalColorDelta = 0;

    let heatmapCtx = null;
    let heatmapImgData = null;

    if (heatmapCanvas) {
      heatmapCanvas.width = width;
      heatmapCanvas.height = height;
      heatmapCtx = heatmapCanvas.getContext('2d');
      heatmapImgData = heatmapCtx.createImageData(width, height);
    }

    const heatmapData = heatmapImgData ? heatmapImgData.data : null;

    for (let i = 0; i < dataA.length; i += 4) {
      const rA = dataA[i];
      const gA = dataA[i + 1];
      const bA = dataA[i + 2];
      const aA = dataA[i + 3];

      const rB = dataB[i];
      const gB = dataB[i + 1];
      const bB = dataB[i + 2];
      const aB = dataB[i + 3];

      const diffR = Math.abs(rA - rB);
      const diffG = Math.abs(gA - gB);
      const diffB = Math.abs(bA - bB);
      const diffA = Math.abs(aA - aB);

      const maxDiff = Math.max(diffR, diffG, diffB, diffA);
      totalColorDelta += diffR + diffG + diffB + diffA;

      const isMismatch = maxDiff > tolerance;
      if (isMismatch) {
        mismatchedPixels++;
      }

      if (heatmapData) {
        if (isMismatch) {
          // Highlight mismatched pixel in MAGENTA/PINK
          heatmapData[i] = 255;
          heatmapData[i + 1] = 0;
          heatmapData[i + 2] = 128;
          heatmapData[i + 3] = 255;
        } else {
          // Matching pixels transparent grayscale
          const gray = Math.round((rA * 0.299 + gA * 0.587 + bA * 0.114) * 0.2);
          heatmapData[i] = gray;
          heatmapData[i + 1] = gray;
          heatmapData[i + 2] = gray;
          heatmapData[i + 3] = 255;
        }
      }
    }

    if (heatmapCtx && heatmapImgData) {
      heatmapCtx.putImageData(heatmapImgData, 0, 0);
    }

    const matchingPixels = totalPixels - mismatchedPixels;
    const matchPercentage = (matchingPixels / totalPixels) * 100;
    const passed = mismatchedPixels === 0;

    return {
      passed,
      totalPixels,
      matchingPixels,
      mismatchedPixels,
      matchPercentage: Number(matchPercentage.toFixed(4)),
      averageDelta: Number((totalColorDelta / (totalPixels * 4)).toFixed(4)),
      timestamp: new Date().toISOString()
    };
  }
}
