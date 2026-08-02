/**
 * InspectorProvider.js
 * Rendering provider for Object Inspector panel context in MediaFactory M3.
 * Evaluates capability rules, suspended properties, and UI control indicators for NORMAL and FAST workspaces.
 */

import { capabilityRegistry } from '../../registry/CapabilityRegistry.js';
import { loopCapabilityRegistry } from '../registry/LoopCapabilityRegistry.js';

export class InspectorProvider {
    /**
     * @param {string} mode - 'NORMAL' | 'FAST'
     */
    constructor(mode = 'NORMAL') {
        this.mode = mode;
        this.isFastMode = mode === 'FAST';
    }

    /**
     * Get active inspector mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Process inspector property status for an object
     * @param {Object} object - Visual object inspecting
     * @param {import('../RenderingContext.js').RenderingContext} [renderingContext]
     * @returns {Object} Inspection metadata and capabilities
     */
    processInspectorProps(object, renderingContext = null) {
        if (!object) return { supported: true, mode: this.mode, classificationData: null };
        
        if (renderingContext && typeof renderingContext.getInspectorValidationSummary === 'function') {
            const summary = renderingContext.getInspectorValidationSummary(object);
            return {
                ...summary,
                inspectorRule: capabilityRegistry.getInspectorRule(object.presetId)
            };
        }

        const presetId = object.presetId;
        const objectType = object.type || 'object';
        const classificationData = loopCapabilityRegistry.getClassification(presetId || objectType || object);

        if (!this.isFastMode) {
            // Normal Workspace: all controls active
            return {
                supported: true,
                mode: 'NORMAL',
                isSuspended: false,
                reason: null,
                badge: null,
                classificationData
            };
        }

        // Fast Workspace: evaluate capability rules
        const inspectorRule = capabilityRegistry.getInspectorRule(presetId);
        const featureRule = capabilityRegistry.getFeature(presetId || objectType);

        const isSuspended = object.fastModeSuspended || inspectorRule.supported === false || classificationData.classification === 'Unsupported';
        const reason = object.fastModeReason || classificationData.unsupportedReason || featureRule.reason || inspectorRule.reason || (isSuspended ? 'Unsupported in Fast Workspace' : null);

        return {
            supported: !isSuspended,
            mode: 'FAST',
            isSuspended,
            reason,
            badge: isSuspended ? '⚡ SUSPENDED IN FAST MODE' : `⚡ CLASSIFICATION: ${classificationData.classification.toUpperCase()}`,
            classificationData
        };
    }
}
