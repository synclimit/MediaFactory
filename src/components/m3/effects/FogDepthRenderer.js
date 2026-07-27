/**
 * FogDepthRenderer.js
 */

import { smoothstep } from './DepthMask.js';

function computeBaseFogMap(depthMapData, threshold) {
    const { depthMap, width, height } = depthMapData;
    const fogMap = new Float32Array(width * height);
    for (let i = 0; i < depthMap.length; i++) {
        fogMap[i] = 1.0 - smoothstep(0, threshold, depthMap[i]);
    }
    return fogMap;
}

function noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

// Helper: CSS Color to RGB
function cssColorToRGB(ctx, colorStr) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2] };
}

let offscreenCanvas = null;
let offscreenCtx = null;
let cachedFogMap = null;
let lastThreshold = -1;
let lastDepthMap = null;

export function renderFogDepth(
    mainCtx, mainWidth, mainHeight, 
    timeMs, speed, shape, 
    density, depthLevel, colorHex, 
    depthMapData, smoothVal
) {
    const { width, height } = depthMapData;
    const currentTimeSec = timeMs / 1000.0;
    
    // Initialize or resize offscreen canvas
    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
    }
    
    // Cache the fog map if depth map or threshold hasn't changed
    const threshold = depthLevel;
    if (lastDepthMap !== depthMapData.depthMap || lastThreshold !== threshold || !cachedFogMap) {
        cachedFogMap = computeBaseFogMap(depthMapData, threshold);
        lastDepthMap = depthMapData.depthMap;
        lastThreshold = threshold;
    }
    
    const color = cssColorToRGB(offscreenCtx, colorHex || '#ffffff');
    const globalOpacity = (density * 2.0) * (smoothVal !== undefined ? smoothVal : 1.0);
    
    // We only need to write color and alpha.
    const outputData = new Uint8ClampedArray(width * height * 4);
    
    const pulseFactor = shape === 'Berdenyut' 
        ? 0.6 + Math.sin(currentTimeSec * speed * 1.5) * 0.4 
        : 1.0;
        
    const driftOffset = currentTimeSec * speed * 20;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            let fogAmount = cachedFogMap[idx];
            
            if (shape === 'Berarak') {
                const noiseVal = noise2D((x + driftOffset) * 0.01, y * 0.01);
                fogAmount *= (0.6 + noiseVal * 0.4);
            } else if (shape === 'Berdenyut') {
                fogAmount *= pulseFactor;
            }
            
            const alpha = fogAmount * globalOpacity;
            if (alpha <= 0) continue;
            
            const pixelIdx = idx * 4;
            outputData[pixelIdx] = color.r;
            outputData[pixelIdx + 1] = color.g;
            outputData[pixelIdx + 2] = color.b;
            outputData[pixelIdx + 3] = alpha * 255; // Let canvas compositor do the source-over blend
        }
    }
    
    const imageData = new ImageData(outputData, width, height);
    offscreenCtx.putImageData(imageData, 0, 0);
    
    // Draw to main canvas with normal alpha blending
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'source-over'; // standard alpha blend
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.imageSmoothingQuality = 'high';
    
    mainCtx.drawImage(offscreenCanvas, 0, 0, mainWidth, mainHeight);
    
    mainCtx.restore();
}
