/**
 * DepthMapCache.js
 * Generates and caches pseudo-depth maps from image elements.
 * Optimized for performance by downscaling before computation.
 */

const depthMapStore = new Map();

/**
 * Generates a pseudo-depth map based on luminance and vertical position.
 * @param {ImageData} imageData 
 * @returns {Float32Array} Depth map values (0.0 to 1.0)
 */
function generateDepthMap(imageData) {
    const { data, width, height } = imageData;
    const depthMap = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
        const verticalFactor = y / height; // 0 di atas, 1 di bawah

        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            // Perceptual luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            // Kombinasi: 60% dari luminance, 40% dari posisi vertikal
            // (Asumsi objek lebih terang dan di bawah lebih dekat)
            const depth = luminance * 0.6 + verticalFactor * 0.4;

            depthMap[y * width + x] = Math.min(1, Math.max(0, depth));
        }
    }

    return depthMap;
}

/**
 * Gets or creates a depth map for an image element.
 * @param {HTMLImageElement} imgElement 
 * @param {number} downscaleWidth 
 * @param {number} downscaleHeight 
 */
export function getDepthMap(imgElement, downscaleWidth = 480, downscaleHeight = 270) {
    if (!imgElement || !imgElement.src) return null;
    
    const key = imgElement.src;
    
    if (depthMapStore.has(key)) {
        return depthMapStore.get(key);
    }

    try {
        // Create an offscreen canvas to extract pixel data
        const canvas = document.createElement('canvas');
        canvas.width = downscaleWidth;
        canvas.height = downscaleHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.drawImage(imgElement, 0, 0, downscaleWidth, downscaleHeight);
        const imageData = ctx.getImageData(0, 0, downscaleWidth, downscaleHeight);
        
        const depthMap = generateDepthMap(imageData);
        
        const result = { depthMap, width: downscaleWidth, height: downscaleHeight };
        depthMapStore.set(key, result);
        
        return result;
    } catch (e) {
        console.error("Failed to generate depth map:", e);
        return null;
    }
}
