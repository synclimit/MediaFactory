/**
 * FastWorkspaceManager.js
 * Core workspace manager for MediaFactory M3 Fast Workspace Foundation (MF-1400).
 * Orchestrates workspace runtimes (NormalWorkspaceRuntime, FastWorkspaceRuntime), 
 * non-destructive state conversions via ModeSwitchAdapter, and reactive UI subscriptions.
 */

import { fastRenderState, RENDER_MODES } from '../core/FastRenderState.js';
import { modeSwitchAdapter } from '../core/ModeSwitchAdapter.js';
import { NormalWorkspaceRuntime, FastWorkspaceRuntime } from './runtime/WorkspaceRuntime.js';

export class FastWorkspaceManager {
    constructor() {
        this.activeMode = RENDER_MODES.NORMAL;
        this.runtimes = {
            [RENDER_MODES.NORMAL]: new NormalWorkspaceRuntime(),
            [RENDER_MODES.FAST]: new FastWorkspaceRuntime()
        };
        this.activeRuntime = this.runtimes[RENDER_MODES.NORMAL];
        this.listeners = new Set();
        this.currentProjectSnapshotId = null;

        // Synchronize with FastRenderState changes
        fastRenderState.subscribe((event) => {
            if (event.type === 'MODE_CHANGE' && event.mode !== this.activeMode) {
                this.switchWorkspace(event.mode);
            }
        });
    }

    /**
     * Get active workspace mode ('NORMAL' | 'FAST')
     */
    getActiveWorkspace() {
        return this.activeMode;
    }

    /**
     * Check if currently in Fast Workspace mode
     */
    isFastWorkspaceActive() {
        return this.activeMode === RENDER_MODES.FAST;
    }

    /**
     * Get active workspace runtime instance
     * @returns {import('./runtime/WorkspaceRuntime.js').WorkspaceRuntime}
     */
    getRuntime() {
        return this.activeRuntime;
    }

    /**
     * Get active RenderingContext for component dependency injection
     * @param {Object} [projectState] 
     * @param {number} [currentTimeSec] 
     * @returns {import('./RenderingContext.js').RenderingContext}
     */
    getRenderingContext(projectState = null, currentTimeSec = 0) {
        return this.activeRuntime.createRenderingContext(projectState, currentTimeSec);
    }

    /**
     * Switch active editing workspace between NORMAL and FAST
     * @param {'NORMAL' | 'FAST'} targetMode 
     * @param {Object} [projectState] Current project state to adapt non-destructively
     * @returns {Object} { mode: string, runtime: WorkspaceRuntime, adaptedState: Object|null }
     */
    switchWorkspace(targetMode, projectState = null) {
        if (!Object.values(RENDER_MODES).includes(targetMode)) {
            console.warn(`[FastWorkspaceManager] Invalid workspace mode: ${targetMode}`);
            return { mode: this.activeMode, runtime: this.activeRuntime, adaptedState: projectState };
        }

        const previousMode = this.activeMode;
        if (targetMode === RENDER_MODES.FAST && projectState && !this.currentProjectSnapshotId) {
            // Take non-destructive snapshot when entering Fast Workspace
            this.currentProjectSnapshotId = modeSwitchAdapter.createSnapshot(projectState);
        }

        let adaptedState = projectState;
        if (projectState) {
            adaptedState = modeSwitchAdapter.convertProjectState(projectState, targetMode);
        }

        this.activeMode = targetMode;
        this.activeRuntime = this.runtimes[targetMode];

        // Sync back with global fastRenderState singleton
        if (fastRenderState.getMode() !== targetMode) {
            fastRenderState.setMode(targetMode);
        }

        const renderingContext = this.activeRuntime.createRenderingContext(adaptedState, 0);

        this.notifyListeners({
            type: 'WORKSPACE_SWITCH',
            mode: targetMode,
            previousMode,
            runtime: this.activeRuntime,
            renderingContext,
            adaptedState
        });

        if (targetMode === RENDER_MODES.NORMAL) {
            this.currentProjectSnapshotId = null;
        }

        return {
            mode: targetMode,
            runtime: this.activeRuntime,
            renderingContext,
            adaptedState
        };
    }

    /**
     * Restore project state safely to Normal Workspace
     * @param {Object} projectState 
     * @returns {Object} Restored project state
     */
    restoreNormalWorkspace(projectState) {
        return this.switchWorkspace(RENDER_MODES.NORMAL, projectState).adaptedState;
    }

    /**
     * Subscribe to workspace state & runtime changes
     * @param {Function} listener 
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
        return () => {};
    }

    /**
     * Notify subscribers of workspace events
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event, this);
            } catch (err) {
                console.error('[FastWorkspaceManager] Listener error:', err);
            }
        });
    }
}

// Export singleton instance
export const fastWorkspaceManager = new FastWorkspaceManager();
