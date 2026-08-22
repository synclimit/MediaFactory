/**
 * FrameComparator.js
 * Generic frame comparison utility for MediaFactory certification testing.
 * Renderer agnostic: knows nothing about Fast Workspace, strategies, or timeline contexts.
 */

export class FrameComparator {
    /**
     * Compare two frames (raw pixel buffers or structured rendered state trees)
     * @param {Object|Array} frameA 
     * @param {Object|Array} frameB 
     * @param {Object} [options]
     * @param {number} [options.tolerance=0] - Threshold for numerical equivalence
     * @returns {{ identical: boolean, pixelDifference: number, averageDifference: number, maxDifference: number, comparedPixels: number }}
     */
    static compareFrame(frameA, frameB, options = {}) {
        const tolerance = options.tolerance !== undefined ? options.tolerance : 0;

        if (frameA === frameB) {
            return {
                identical: true,
                pixelDifference: 0,
                averageDifference: 0,
                maxDifference: 0,
                comparedPixels: 1
            };
        }

        if (!frameA || !frameB) {
            return {
                identical: false,
                pixelDifference: Infinity,
                averageDifference: Infinity,
                maxDifference: Infinity,
                comparedPixels: 0
            };
        }

        // Case 1: Direct buffer / ImageData comparison ({ width, height, data })
        if (this.isBufferFrame(frameA) && this.isBufferFrame(frameB)) {
            return this.compareBuffers(frameA, frameB, tolerance);
        }

        // Case 2: Array or object structure comparison
        return this.compareStructures(frameA, frameB, tolerance);
    }

    /**
     * Check if object has image buffer characteristics
     */
    static isBufferFrame(frame) {
        return frame && typeof frame === 'object' && ('data' in frame) && (
            Array.isArray(frame.data) || 
            ArrayBuffer.isView(frame.data)
        );
    }

    /**
     * Compare raw pixel buffer frames
     */
    static compareBuffers(bufA, bufB, tolerance) {
        const dataA = bufA.data;
        const dataB = bufB.data;

        const lenA = dataA.length;
        const lenB = dataB.length;

        if (lenA !== lenB) {
            return {
                identical: false,
                pixelDifference: Math.abs(lenA - lenB),
                averageDifference: Infinity,
                maxDifference: Math.abs(lenA - lenB),
                comparedPixels: Math.max(lenA, lenB)
            };
        }

        let totalDiff = 0;
        let maxDiff = 0;

        for (let i = 0; i < lenA; i++) {
            const diff = Math.abs(dataA[i] - dataB[i]);
            totalDiff += diff;
            if (diff > maxDiff) maxDiff = diff;
        }

        const comparedPixels = (bufA.width && bufA.height) 
            ? (bufA.width * bufA.height) 
            : Math.ceil(lenA / 4);

        const avgDiff = comparedPixels > 0 ? totalDiff / comparedPixels : 0;
        const identical = maxDiff <= tolerance;

        return {
            identical,
            pixelDifference: totalDiff,
            averageDifference: avgDiff,
            maxDifference: maxDiff,
            comparedPixels
        };
    }

    /**
     * Compare structured rendered object trees or lists recursively
     */
    static compareStructures(structA, structB, tolerance) {
        const numbersA = [];
        const numbersB = [];

        this.extractNumericValues(structA, '', numbersA);
        this.extractNumericValues(structB, '', numbersB);

        const keysA = new Map(numbersA.map(item => [item.path, item.val]));
        const keysB = new Map(numbersB.map(item => [item.path, item.val]));

        const allPaths = new Set([...keysA.keys(), ...keysB.keys()]);
        
        let totalDiff = 0;
        let maxDiff = 0;
        let comparedCount = 0;

        for (const path of allPaths) {
            const valA = keysA.has(path) ? keysA.get(path) : 0;
            const valB = keysB.has(path) ? keysB.get(path) : 0;

            const diff = Math.abs(valA - valB);
            totalDiff += diff;
            if (diff > maxDiff) maxDiff = diff;
            comparedCount++;
        }

        const comparedPixels = Math.max(1, comparedCount);
        const avgDiff = totalDiff / comparedPixels;
        const identical = maxDiff <= tolerance;

        return {
            identical,
            pixelDifference: totalDiff,
            averageDifference: avgDiff,
            maxDifference: maxDiff,
            comparedPixels
        };
    }

    /**
     * Recursively extract numeric values with key pathing
     */
    static extractNumericValues(obj, prefix, out) {
        if (obj === null || obj === undefined) return;

        if (typeof obj === 'number') {
            if (!isNaN(obj) && isFinite(obj)) {
                out.push({ path: prefix || 'val', val: obj });
            }
            return;
        }

        if (typeof obj === 'boolean') {
            out.push({ path: prefix || 'val', val: obj ? 1 : 0 });
            return;
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                this.extractNumericValues(obj[i], `${prefix}[${i}]`, out);
            }
            return;
        }

        if (typeof obj === 'object') {
            // Ignore non-render metadata if any
            const keys = Object.keys(obj).sort();
            for (const key of keys) {
                if (key.startsWith('_') && key !== '_pulseScale' && key !== '_shake' && key !== '_renderOpacity') {
                    // Internal transient references except adapted render attributes
                    continue;
                }
                this.extractNumericValues(obj[key], prefix ? `${prefix}.${key}` : key, out);
            }
        }
    }
}

/**
 * Convenience functional export
 */
export function compareFrame(frameA, frameB, options) {
    return FrameComparator.compareFrame(frameA, frameB, options);
}
