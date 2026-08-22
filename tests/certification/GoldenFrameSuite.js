/**
 * GoldenFrameSuite.js
 * Responsible for producing Golden Frames and comparing them against rendered Loop End frames.
 * Architecture Flow:
 * Project -> RenderingContext -> Preview Frame (t=0) -> Loop End Frame (t=loopEnd) -> Frame Comparator -> Certification Result
 */

import { FrameComparator } from './FrameComparator.js';

export class GoldenFrameSuite {
    /**
     * Generate Golden Frame representation at loop start (t = 0)
     * @param {import('../../src/services/pipeline/fastrender/workspace/RenderingContext.js').RenderingContext} renderingContext 
     * @param {Array} [objects] 
     * @returns {Array} Rendered objects frame at t = 0
     */
    generateGoldenFrame(renderingContext, objects) {
        if (!renderingContext) return [];
        const targetObjects = objects || renderingContext.projectState?.m3Objects || [];
        return renderingContext.getPreviewObjects(targetObjects, 0.0);
    }

    /**
     * Generate Test Frame representation at loop end (t = loopEnd)
     * @param {import('../../src/services/pipeline/fastrender/workspace/RenderingContext.js').RenderingContext} renderingContext 
     * @param {Array} [objects] 
     * @param {number} [timeSec=10.0] 
     * @returns {Array} Rendered objects frame at t = timeSec
     */
    generateTestFrame(renderingContext, objects, timeSec = 10.0) {
        if (!renderingContext) return [];
        const targetObjects = objects || renderingContext.projectState?.m3Objects || [];
        return renderingContext.getPreviewObjects(targetObjects, timeSec);
    }

    /**
     * Evaluate visual continuity by comparing Golden Frame (t=0) against Loop End Frame (t=loopEnd)
     * @param {import('../../src/services/pipeline/fastrender/workspace/RenderingContext.js').RenderingContext} renderingContext 
     * @param {Array} [objects] 
     * @param {number} [loopDuration=10.0] 
     * @param {Object} [options]
     * @returns {{ goldenFrame: Array, loopEndFrame: Array, comparison: Object, loopDuration: number }}
     */
    evaluateLoopContinuity(renderingContext, objects, loopDuration = 10.0, options = {}) {
        const targetObjects = objects || renderingContext?.projectState?.m3Objects || [];
        const goldenFrame = this.generateGoldenFrame(renderingContext, targetObjects);
        const loopEndFrame = this.generateTestFrame(renderingContext, targetObjects, loopDuration);

        const comparison = FrameComparator.compareFrame(goldenFrame, loopEndFrame, options);

        return {
            goldenFrame,
            loopEndFrame,
            comparison,
            loopDuration
        };
    }
}

// Export singleton instance
export const goldenFrameSuite = new GoldenFrameSuite();
