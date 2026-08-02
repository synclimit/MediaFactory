/**
 * PreflightValidator.js
 * Preflight validation service for MediaFactory M3 Fast Render Engine.
 * Performs pre-export project inspection to verify asset integrity and Fast Render compatibility.
 */

import { capabilityRegistry, FAST_RENDER_CATEGORIES } from '../registry/CapabilityRegistry.js';
import { fastRenderPlanner } from './FastRenderPlanner.js';

export class PreflightValidator {
    /**
     * Perform complete preflight validation on project state.
     * @param {Object} projectState - { m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings, m3TotalDurationSec }
     * @returns {Object} Validation Result
     */
    validate(projectState = {}) {
        const errors = [];
        const warnings = [];
        const info = [];

        const bgPool = projectState.m3BgPool || [];
        const audioTracks = projectState.m3AudioTracks || [];
        const objects = projectState.m3Objects || [];

        // 1. Asset & Media Integrity Checks
        if (bgPool.length === 0) {
            warnings.push({
                id: 'ERR_NO_BG',
                title: 'No Background Layer',
                message: 'No background image or video is loaded in the project.',
                recommendation: 'Add a background asset from the Media Library.'
            });
        }

        if (audioTracks.length === 0) {
            info.push({
                id: 'INFO_NO_AUDIO',
                title: 'No Audio Track',
                message: 'Project contains no audio tracks. Video will be silent.',
                recommendation: 'Add audio files if background music or lyrics are required.'
            });
        }

        // 2. Fast Render Capability Analysis via Planner
        const plan = fastRenderPlanner.createPlan(projectState);

        // Process Unsupported Features (Category D)
        plan.categorized.unsupported.forEach(item => {
            errors.push({
                id: `ERR_UNSUPPORTED_${item.presetId || item.type}`,
                title: `Unsupported Feature: ${item.name}`,
                message: item.reason || 'This feature is incompatible with Fast Render frame caching.',
                recommendation: 'Remove this feature or switch to Normal Render Mode.',
                targetId: item.id
            });
        });

        // Process Review Required Features (Category C)
        plan.categorized.reviewRequired.forEach(item => {
            warnings.push({
                id: `WARN_REVIEW_${item.presetId || item.type}`,
                title: `Review Suggested: ${item.name}`,
                message: 'This feature may show minor visual variations in Fast Render Mode.',
                recommendation: 'Inspect preview loop to confirm visual output.',
                targetId: item.id
            });
        });

        // Process Adapted Features (Category B)
        if (plan.categorized.adapted.length > 0) {
            info.push({
                id: 'INFO_ADAPTED_FEATURES',
                title: `${plan.categorized.adapted.length} Features Adapted for Fast Render`,
                message: 'Procedural and motion effects will use periodic seeded curves for seamless 10s looping.',
                recommendation: 'No action required.'
            });
        }

        const isValid = errors.length === 0;
        const canUseFastRender = isValid && plan.isFastRenderReady;

        return {
            isValid,
            canUseFastRender,
            summary: {
                errorCount: errors.length,
                warningCount: warnings.length,
                infoCount: info.length,
                estimatedSpeedup: plan.summary.estimatedSpeedup
            },
            errors,
            warnings,
            info,
            plan
        };
    }
}

// Export singleton
export const preflightValidator = new PreflightValidator();
