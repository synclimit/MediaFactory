/**
 * DepthScanRenderer.js
 * Renders the 3D depth scan effect using pseudo-depth maps.
 */

// Helper: smoothstep
function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

// Helper: CSS Color to RGB via 1x1 canvas pixel
function cssColorToRGB(ctx, colorStr) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2] };
}

let offscreenCanvas = null;
let offscreenCtx = null;

/**
 * Calculates current scan position (0.0 to 1.0)
 */
function getScanPosition(timeMs, speed, direction, smoothVal) {
    if (direction === 'Ikuti beat') {
        // Follows the beat: smoothVal ranges 0.0 to 1.0 based on audio reactivity
        return smoothVal || 0.0;
    }

    // 1 cycle = 2 seconds divided by speed
    const cycleDuration = 2000.0 / Math.max(0.1, speed); 
    let t = (timeMs % cycleDuration) / cycleDuration;
    
    if (direction === 'Mundur') {
        t = 1 - t;
    } else if (direction === 'Pantul') {
        t = t * 2;
        if (t > 1.0) t = 2.0 - t;
    }
    return t;
}

/**
 * Renders the depth scan highlights
 * @param {CanvasRenderingContext2D} mainCtx 
 * @param {number} mainWidth 
 * @param {number} mainHeight 
 * @param {number} timeMs 
 * @param {number} speed 
 * @param {string} direction 
 * @param {number} bandWidth 
 * @param {number} bandCount 
 * @param {number} opacity 
 * @param {string} colorHex 
 * @param {Object} depthMapData { depthMap, width, height }
 */
export function renderDepthScan(
    mainCtx, mainWidth, mainHeight, 
    timeMs, speed, direction, 
    bandWidth, bandCount, opacity, colorHex, 
    depthMapData, smoothVal
) {
    if (!depthMapData || !depthMapData.depthMap) return;
    const { depthMap, width, height } = depthMapData;
    
    // Initialize or resize offscreen canvas
    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
    }
    
    // Clear offscreen canvas
    offscreenCtx.clearRect(0, 0, width, height);
    
    // Create ImageData for output (all zeros initially)
    const outputData = new Uint8ClampedArray(width * height * 4);
    
    const scanPos = getScanPosition(timeMs, speed, direction, smoothVal);
    const color = cssColorToRGB(offscreenCtx, colorHex || '#ffffff');
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const depth = depthMap[idx];
            
            let scanSpace = depth;
            
            let maxIntensity = 0;
            for (let b = 0; b < bandCount; b++) {
                const bandOffset = b / bandCount;
                let bandPos = (scanPos + bandOffset) % 1;
                
                // Wrap around distance calculation
                let dist = Math.abs(scanSpace - bandPos);
                if (dist > 0.5) dist = 1.0 - dist;
                
                const intensity = smoothstep(bandWidth, 0, dist);
                maxIntensity = Math.max(maxIntensity, intensity);
            }
            
            if (maxIntensity > 0) {
                const finalAlpha = maxIntensity * opacity;
                const pixelIdx = idx * 4;
                
                // Additive color
                outputData[pixelIdx] = color.r;
                outputData[pixelIdx + 1] = color.g;
                outputData[pixelIdx + 2] = color.b;
                outputData[pixelIdx + 3] = finalAlpha * 255;
            }
        }
    }
    
    const imageData = new ImageData(outputData, width, height);
    offscreenCtx.putImageData(imageData, 0, 0);
    
    // Draw upscale to main canvas
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'screen';
    // Ensure smooth upscaling
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.imageSmoothingQuality = 'high';
    
    mainCtx.drawImage(offscreenCanvas, 0, 0, mainWidth, mainHeight);
    
    mainCtx.restore();
}
