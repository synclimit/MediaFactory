/**
 * MathUtils.js
 * High-performance math utilities for audio visualization and rendering.
 */

export const MathUtils = {
    /**
     * Linearly interpolates between two values.
     */
    lerp: (start, end, amt) => {
        return (1 - amt) * start + amt * end;
    },

    /**
     * Clamps a value between a min and max.
     */
    clamp: (val, min, max) => {
        return Math.min(Math.max(val, min), max);
    },

    /**
     * Maps a value from one range to another.
     */
    map: (n, start1, stop1, start2, stop2) => {
        return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    },

    /**
     * Exponential moving average (smoothing) for arrays.
     * Mutates the targetArray in place for performance.
     * @param {Uint8Array|Float32Array} sourceArray - New incoming data
     * @param {Uint8Array|Float32Array} targetArray - Previous state to be updated
     * @param {number} smoothing - Value between 0 (no smoothing) and 1 (max smoothing)
     */
    smoothArray: (sourceArray, targetArray, smoothing) => {
        if (!sourceArray) return targetArray || new Uint8Array(128);
        if (!targetArray || targetArray.length !== sourceArray.length) {
            targetArray = new Float32Array(sourceArray.length);
            for (let i = 0; i < sourceArray.length; i++) targetArray[i] = sourceArray[i];
            return targetArray;
        }
        const length = sourceArray.length;
        const factor = 1 - smoothing;
        for (let i = 0; i < length; i++) {
            targetArray[i] = (targetArray[i] * smoothing) + (sourceArray[i] * factor);
        }
        return targetArray;
    },

    /**
     * Converts polar coordinates to cartesian coordinates.
     * @param {number} radius 
     * @param {number} angle (in radians)
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @returns {{x: number, y: number}}
     */
    polarToCartesian: (radius, angle, cx = 0, cy = 0) => {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    },

    /**
     * Applies gravity and velocity to a physics object.
     */
    applyPhysics: (obj, gravity = 9.8, dt = 1/60) => {
        if (obj.vy !== undefined) {
            obj.vy += gravity * dt;
            obj.y += obj.vy * dt;
        }
        if (obj.vx !== undefined) {
            obj.x += obj.vx * dt;
        }
    }
};
