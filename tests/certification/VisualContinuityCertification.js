/**
 * VisualContinuityCertification.js
 * End-to-End Visual Continuity Certification Service for MediaFactory M3 Fast Workspace (MF-1409).
 * 
 * Rules:
 * - Must never call procedural strategies directly.
 * - Must only use RenderingContext existing public API (getPreviewObjects, adaptProjectObjects).
 * - Renderer-agnostic certification layer.
 */

import { fastWorkspaceManager } from '../../src/services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { RENDER_MODES } from '../../src/services/pipeline/fastrender/core/FastRenderState.js';
import { goldenFrameSuite } from './GoldenFrameSuite.js';
import { FrameComparator } from './FrameComparator.js';

export class VisualContinuityCertification {
    /**
     * Certify project visual continuity between Loop Start (t = 0) and Loop End (t = loopDuration)
     * @param {Object} project - Project state containing m3Objects and duration
     * @param {Object} [options]
     * @param {number} [options.tolerance=1e-4] - Floating point threshold for visual equivalence
     * @param {number} [options.loopDuration] - Loop duration override in seconds
     * @param {number} [options.frameCount=2] - Number of boundary frames evaluated
     * @returns {{ passed: boolean, frameCount: number, failedObjects: Array<string>, averageDifference: number, maxDifference: number, tolerance: number }}
     */
    certifyProject(project, options = {}) {
        const tolerance = options.tolerance !== undefined ? options.tolerance : 1e-4;
        const frameCount = options.frameCount !== undefined ? options.frameCount : 2;

        if (!project || !Array.isArray(project.m3Objects) || project.m3Objects.length === 0) {
            return {
                passed: true,
                frameCount,
                failedObjects: [],
                averageDifference: 0,
                maxDifference: 0,
                tolerance
            };
        }

        const loopDuration = options.loopDuration || project.duration || 10.0;

        // 1. Ensure Fast Workspace workspace context via FastWorkspaceManager
        fastWorkspaceManager.switchWorkspace(RENDER_MODES.FAST, project);
        const renderingContext = fastWorkspaceManager.getRenderingContext(project, 0.0);

        // 2. Evaluate overall scene loop continuity using GoldenFrameSuite
        const sceneResult = goldenFrameSuite.evaluateLoopContinuity(
            renderingContext,
            project.m3Objects,
            loopDuration,
            { tolerance }
        );

        // 3. Perform per-object visual continuity audit using RenderingContext exclusively
        const failedObjects = [];
        let globalMaxDiff = sceneResult.comparison.maxDifference;
        let globalSumDiff = sceneResult.comparison.pixelDifference;
        let globalCompared = sceneResult.comparison.comparedPixels;

        for (const obj of project.m3Objects) {
            const objId = String(obj.id || obj.type || 'unnamed');

            // Render object preview state at t=0 and t=loopDuration using RenderingContext API only
            const objFrameStart = renderingContext.getPreviewObjects([obj], 0.0);
            const objFrameEnd = renderingContext.getPreviewObjects([obj], loopDuration);

            const objComp = FrameComparator.compareFrame(objFrameStart, objFrameEnd, { tolerance });

            if (objComp.maxDifference > globalMaxDiff) {
                globalMaxDiff = objComp.maxDifference;
            }

            if (!objComp.identical && objComp.maxDifference > tolerance) {
                failedObjects.push(objId);
            }
        }

        const averageDifference = globalCompared > 0 ? (globalSumDiff / globalCompared) : 0;
        const passed = failedObjects.length === 0 && globalMaxDiff <= tolerance;

        return {
            passed,
            frameCount,
            failedObjects,
            averageDifference,
            maxDifference: globalMaxDiff,
            tolerance
        };
    }
}

// Export singleton instance and public function
export const visualContinuityCertification = new VisualContinuityCertification();

export function certifyProject(project, options) {
    return visualContinuityCertification.certifyProject(project, options);
}
