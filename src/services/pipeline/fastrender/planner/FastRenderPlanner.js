/**
 * FastRenderPlanner.js
 * Generates deterministic execution plans for MediaFactory M3 Fast Render Engine.
 * Analyzes project components against CapabilityRegistry and calculates workload metrics.
 */

import { capabilityRegistry, FAST_RENDER_CATEGORIES } from '../registry/CapabilityRegistry.js';
import { fastRenderState } from '../core/FastRenderState.js';

export class FastRenderPlanner {
    /**
     * Generate a deterministic execution plan for the given project state.
     * @param {Object} projectState - { m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings, m3TotalDurationSec }
     * @returns {Object} Execution Plan
     */
    createPlan(projectState = {}) {
        const objects = projectState.m3Objects || [];
        const bgPool = projectState.m3BgPool || [];
        const audioTracks = projectState.m3AudioTracks || [];
        const totalDurationSec = projectState.m3TotalDurationSec || 60.0;
        const masterLoopDuration = fastRenderState.getMasterLoopDuration() || 10.0;

        const native = [];
        const adapted = [];
        const reviewRequired = [];
        const unsupported = [];

        const allItems = [...bgPool, ...objects];

        allItems.forEach(item => {
            let featureKey = item.presetId || item.type || 'unknown';
            if (item.type === 'background') {
                featureKey = item.mediaType === 'video' ? 'bg_video' : 'bg_image';
            } else if (item.type === 'text') {
                featureKey = 'text_static';
            } else if (item.presetId === 'camera-shake') {
                featureKey = 'cam_shake';
            } else if (item.presetId === 'strobe-flash') {
                featureKey = 'fx_strobe_flash';
            }

            const rule = capabilityRegistry.getFeature(featureKey);
            const inspectorRule = capabilityRegistry.getInspectorRule(item.presetId || featureKey);


            const analyzedItem = {
                id: item.id,
                name: item.name || item.type || 'Object',
                type: item.type,
                presetId: item.presetId,
                category: rule.category,
                reason: rule.reason || inspectorRule.reason
            };

            switch (rule.category) {
                case FAST_RENDER_CATEGORIES.A_NATIVE:
                    native.push(analyzedItem);
                    break;
                case FAST_RENDER_CATEGORIES.B_COMPATIBLE:
                    adapted.push(analyzedItem);
                    break;
                case FAST_RENDER_CATEGORIES.C_UNSAFE:
                    reviewRequired.push(analyzedItem);
                    break;
                case FAST_RENDER_CATEGORIES.D_UNSUPPORTED:
                    unsupported.push(analyzedItem);
                    break;
                default:
                    native.push(analyzedItem);
            }
        });

        const targetFps = 60;
        const masterFrames = Math.ceil(masterLoopDuration * targetFps);
        const totalFrames = Math.ceil(totalDurationSec * targetFps);
        const estimatedSpeedup = Math.max(1.0, Number((totalFrames / Math.max(1, masterFrames)).toFixed(1)));

        // Deterministic sequence generation
        const sequence = [
            { step: 1, name: 'Preflight Validation', status: 'pending' },
            { step: 2, name: 'Master Loop Cache Render', frames: masterFrames, durationSec: masterLoopDuration, status: 'pending' },
            { step: 3, name: 'Audio Pipeline Synthesis', trackCount: audioTracks.length, status: 'pending' },
            { step: 4, name: 'Fast Loop Concat Packaging', loopRepeats: Math.ceil(totalDurationSec / masterLoopDuration), status: 'pending' },
            { step: 5, name: 'Final Container Assembly', format: projectState.m3RenderSettings?.format || 'mp4', status: 'pending' }
        ];

        return {
            isFastRenderReady: unsupported.length === 0,
            summary: {
                totalObjects: allItems.length,
                nativeCount: native.length,
                adaptedCount: adapted.length,
                reviewCount: reviewRequired.length,
                unsupportedCount: unsupported.length,
                estimatedSpeedup: `${estimatedSpeedup}x`
            },
            categorized: {
                native,
                adapted,
                reviewRequired,
                unsupported
            },
            workload: {
                masterLoopDurationSec: masterLoopDuration,
                totalDurationSec,
                masterFrames,
                totalFrames,
                estimatedSpeedupRatio: estimatedSpeedup
            },
            sequence
        };
    }
}

// Export singleton
export const fastRenderPlanner = new FastRenderPlanner();
