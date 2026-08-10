/**
 * DepthMask.js
 * Utility functions for depth-based masking.
 */

export function smoothstep(edge0, edge1, x) {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * Returns 1.0 for foreground (near) and 0.0 for background (far).
 * @param {number} depth Depth value (0 = far, 1 = near)
 * @param {number} threshold Split threshold
 * @param {number} softness Softness of the split
 */
export function getForegroundMask(depth, threshold, softness = 0.15) {
    return smoothstep(threshold - softness, threshold + softness, depth);
}

/**
 * Returns 1.0 for background (far) and 0.0 for foreground (near).
 */
export function getBackgroundMask(depth, threshold, softness = 0.15) {
    return 1.0 - getForegroundMask(depth, threshold, softness);
}
