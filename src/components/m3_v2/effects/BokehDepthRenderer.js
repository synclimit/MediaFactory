/**
 * BokehDepthRenderer.js
 * (REVISED: Continuous 3D Noise Field)
 */

import { smoothstep } from './DepthMask.js';

// Pre-compute mask to isolate foreground objects (buildings) and discard flat background/sky
function computeObjectMask(depthMapData) {
    const { depthMap, width, height } = depthMapData;
    const mask = new Float32Array(width * height);
    for (let i = 0; i < depthMap.length; i++) {
        const depth = depthMap[i];
        // Retain mid-to-front depth, fade out flat background
        mask[i] = smoothstep(0.15, 0.35, depth);
    }
    return mask;
}

// Simple 3D Value Noise
function hash3D(x, y, z) {
    let n = x * 12.9898 + y * 78.233 + z * 37.719;
    n = Math.sin(n) * 43758.5453;
    return n - Math.floor(n);
}

function noise3D(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
  
    const lerp = (a, b, t) => a + (b - a) * t;
    const c000 = hash3D(xi, yi, zi),     c100 = hash3D(xi+1, yi, zi);
    const c010 = hash3D(xi, yi+1, zi),   c110 = hash3D(xi+1, yi+1, zi);
    const c001 = hash3D(xi, yi, zi+1),   c101 = hash3D(xi+1, yi, zi+1);
    const c011 = hash3D(xi, yi+1, zi+1), c111 = hash3D(xi+1, yi+1, zi+1);
  
    const x00 = lerp(c000, c100, xf), x10 = lerp(c010, c110, xf);
    const x01 = lerp(c001, c101, xf), x11 = lerp(c011, c111, xf);
    const y0 = lerp(x00, x10, yf), y1 = lerp(x01, x11, yf);
    return lerp(y0, y1, zf);
}

// Compute the organic glow map based on depth and noise
function computeGlowMap(depthMapData, objectMask, params, currentTimeSec) {
    const { depthMap, width, height } = depthMapData;
    const glowMap = new Float32Array(width * height);
  
    // Map UI params
    const density = 0.02 + (params.countPerc) * 0.08; 
    const timeScale = currentTimeSec * params.speed;
  
    let animAxisZ = 0;
    if (params.shape === 'Melayang') {
        animAxisZ = timeScale * 0.15;
    } else if (params.shape === 'Naik pelan') {
        animAxisZ = timeScale * 0.15;
    } else if (params.shape === 'Berdenyut') {
        animAxisZ = 0; 
    }
  
    const pulseFactor = params.shape === 'Berdenyut'
        ? 0.5 + Math.sin(timeScale * 2) * 0.5
        : 1.0;
  
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const mask = objectMask[idx];
            
            // Skip empty areas early for performance
            if (mask <= 0.01) continue;
  
            const depth = depthMap[idx];
  
            const sampleY = params.shape === 'Naik pelan'
                ? y + timeScale * 15
                : y;
  
            // 3D Noise: x, y, and depth+time
            const n = noise3D(
                x * density,
                sampleY * density,
                depth * 8 + animAxisZ
            );
  
            // Threshold noise to create veins/spots of light rather than flat glow
            const glow = smoothstep(0.55, 0.85, n) * mask * pulseFactor;
            glowMap[idx] = glow;
        }
    }
  
    return glowMap;
}

function hexToRGB(hex) {
    if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
    if (hex.startsWith('hsl')) {
        const offscreen = document.createElement('canvas');
        const ctx = offscreen.getContext('2d');
        ctx.fillStyle = hex;
        const computed = ctx.fillStyle;
        const r = parseInt(computed.slice(1, 3), 16) || 255;
        const g = parseInt(computed.slice(3, 5), 16) || 255;
        const b = parseInt(computed.slice(5, 7), 16) || 255;
        return { r, g, b };
    }
    const r = parseInt(hex.slice(1, 3), 16) || 255;
    const g = parseInt(hex.slice(3, 5), 16) || 255;
    const b = parseInt(hex.slice(5, 7), 16) || 255;
    return { r, g, b };
}

let offscreenCanvas = null;
let offscreenCtx = null;
let cachedObjectMask = null;
let lastDepthMapForMask = null;

export function renderBokehDepth(
    mainCtx, mainWidth, mainHeight, 
    timeMs, speed, shape, 
    opacityPerc, depthLevelPerc, sizePerc, countPerc, colorHex, 
    depthMapData, smoothVal
) {
    if (!depthMapData || !depthMapData.depthMap) return;
    const { width, height } = depthMapData;
    const currentTimeSec = timeMs / 1000.0;

    // Cache the object mask since it only depends on the static depth map
    if (lastDepthMapForMask !== depthMapData.depthMap || !cachedObjectMask) {
        cachedObjectMask = computeObjectMask(depthMapData);
        lastDepthMapForMask = depthMapData.depthMap;
    }

    const params = {
        shape,
        speed,
        countPerc,
        sizePerc
    };

    const glowMap = computeGlowMap(depthMapData, cachedObjectMask, params, currentTimeSec);

    // Initialize/resize offscreen canvas for blur pass
    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
    }

    const color = hexToRGB(colorHex);
    // Multiply by smoothVal to react to audio beat
    const globalOpacity = opacityPerc * (smoothVal !== undefined ? smoothVal : 1.0);
    const softness = 1.5 + (sizePerc) * 6; // up to 7.5px blur on 480x270

    // Create ImageData containing only the glow intensity mapped to Alpha channel
    // Using white color as base, and actual color will be applied via mainCtx
    const outputData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < glowMap.length; i++) {
        const alpha = glowMap[i] * globalOpacity;
        if (alpha <= 0) continue;
        const idx = i * 4;
        outputData[idx] = color.r;
        outputData[idx + 1] = color.g;
        outputData[idx + 2] = color.b;
        outputData[idx + 3] = alpha * 255;
    }
    
    offscreenCtx.putImageData(new ImageData(outputData, width, height), 0, 0);

    // Render to main canvas with Additive blending and Blur
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'lighter'; // Additive blending for glow
    // Fast Canvas Blur for soft glow
    mainCtx.filter = `blur(${softness * (mainWidth / width)}px)`;
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.imageSmoothingQuality = 'high';

    mainCtx.drawImage(offscreenCanvas, 0, 0, mainWidth, mainHeight);
    
    mainCtx.restore();
}
