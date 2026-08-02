/**
 * ModeSwitchAdapter.js
 * Handles non-destructive mode switching between NORMAL and FAST render modes.
 * Encapsulates snapshot creation, property conversion, suspended property storage,
 * and state restoration to guarantee zero data loss when toggling render modes.
 */

import { capabilityRegistry, FAST_RENDER_CATEGORIES } from '../registry/CapabilityRegistry.js';
import { fastRenderState, RENDER_MODES } from './FastRenderState.js';

export class ModeSwitchAdapter {
    constructor() {
        this.snapshots = new Map();
        this.suspendedProps = new Map(); // Store properties not supported in Fast mode per object ID
    }

    /**
     * Create a snapshot of the current project state.
     * @param {Object} projectState - { m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings }
     * @returns {string} Snapshot ID
     */
    createSnapshot(projectState) {
        const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const serialized = JSON.stringify({
            m3BgPool: projectState.m3BgPool || [],
            m3AudioTracks: projectState.m3AudioTracks || [],
            m3Objects: projectState.m3Objects || [],
            m3RenderSettings: projectState.m3RenderSettings || {},
            timestamp: Date.now()
        });

        this.snapshots.set(snapshotId, serialized);
        return snapshotId;
    }

    /**
     * Restore a snapshot by ID.
     * @param {string} snapshotId 
     * @returns {Object|null} Deserialized project state
     */
    restoreSnapshot(snapshotId) {
        const serialized = this.snapshots.get(snapshotId);
        if (!serialized) {
            console.warn(`[ModeSwitchAdapter] Snapshot ID ${snapshotId} not found.`);
            return null;
        }
        try {
            return JSON.parse(serialized);
        } catch (e) {
            console.error('[ModeSwitchAdapter] Failed to parse snapshot:', e);
            return null;
        }
    }

    /**
     * Adapt an object's properties for FAST render mode without destroying original data.
     * @param {Object} object - M3 visual object
     * @returns {Object} Adapted M3 visual object
     */
    adaptObjectForFastMode(object) {
        if (!object || !object.id) return object;

        const objId = object.id;
        const objectType = object.type || 'object';
        const presetId = object.presetId;

        // Check if preset or type has suspended rules
        const inspectorRule = capabilityRegistry.getInspectorRule(presetId);
        const featureRule = capabilityRegistry.getFeature(presetId || objectType);

        // Store original properties before adapting
        if (!this.suspendedProps.has(objId)) {
            this.suspendedProps.set(objId, JSON.parse(JSON.stringify(object)));
        }

        const adapted = { ...object };

        // 1. Handle Strobe / Unsupported effects
        if (featureRule.category === FAST_RENDER_CATEGORIES.D_UNSUPPORTED || inspectorRule.supported === false) {
            adapted.enabled = false;
            adapted.fastModeSuspended = true;
            adapted.fastModeReason = featureRule.reason || inspectorRule.reason || 'Unsupported in Fast Render Mode';
            return adapted;
        }

        // 2. Handle Camera Shake adaptation (Seeded noise)
        if (presetId === 'camera-shake') {
            adapted.props = {
                ...(adapted.props || {}),
                mode: 'Seeded Periodic Shake (Fast Mode)',
                seed: 1337
            };
        }

        // 3. Handle Beat Zoom adaptation (Periodic Cosine Envelope)
        if (presetId === 'zoom-hentak') {
            adapted.props = {
                ...(adapted.props || {}),
                mode: 'Periodic Cosine Pulse (Fast Mode)',
                speed: 1.0
            };
        }

        // 4. Handle Particle adaptation (Seeded PRNG)
        if (objectType === 'particle') {
            adapted.randomScale = true;
            adapted.randomSeed = 1337;
            adapted.fastPreWarm = true;
        }

        return adapted;
    }

    /**
     * Restore an object's properties to exact NORMAL render mode state.
     * @param {Object} object - M3 visual object
     * @returns {Object} Original M3 visual object
     */
    restoreObjectForNormalMode(object) {
        if (!object || !object.id) return object;

        const objId = object.id;
        const suspended = this.suspendedProps.get(objId);

        if (suspended) {
            // Restore complete original object state
            return JSON.parse(JSON.stringify(suspended));
        }

        const restored = { ...object };
        delete restored.fastModeSuspended;
        delete restored.fastModeReason;
        delete restored.fastPreWarm;
        delete restored.randomSeed;

        return restored;
    }

    /**
     * Perform full project state mode conversion.
     * @param {Object} projectState - { m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings }
     * @param {string} targetMode - 'FAST' or 'NORMAL'
     * @returns {Object} Converted project state
     */
    convertProjectState(projectState, targetMode) {
        if (!projectState) return projectState;

        const isFast = targetMode === RENDER_MODES.FAST;
        const m3Objects = (projectState.m3Objects || []).map(obj => {
            return isFast ? this.adaptObjectForFastMode(obj) : this.restoreObjectForNormalMode(obj);
        });

        const m3BgPool = (projectState.m3BgPool || []).map(bg => {
            return isFast ? this.adaptObjectForFastMode(bg) : this.restoreObjectForNormalMode(bg);
        });

        if (!isFast) {
            // Clear suspended properties cache on return to Normal mode
            this.suspendedProps.clear();
        }

        return {
            ...projectState,
            m3BgPool,
            m3Objects
        };
    }
}

// Export as singleton
export const modeSwitchAdapter = new ModeSwitchAdapter();
