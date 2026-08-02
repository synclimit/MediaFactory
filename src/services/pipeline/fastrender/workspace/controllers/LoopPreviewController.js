/**
 * LoopPreviewController.js
 * Core Loop Preview Controller for MediaFactory M3 Fast Workspace (MF-1401).
 * Manages configurable master loop duration, configurable preview windows (previewBeforeBoundary, previewAfterBoundary),
 * seamless loop boundary time mapping, and Boundary Step Mode debugging controls.
 */

import { fastRenderState } from '../../core/FastRenderState.js';

export class LoopPreviewController {
    /**
     * @param {Object} [config]
     * @param {number} [config.masterLoopDuration] - Configurable loop duration in seconds
     * @param {number} [config.previewBeforeBoundary] - Configurable preview range before boundary in seconds
     * @param {number} [config.previewAfterBoundary] - Configurable preview range after boundary in seconds
     */
    constructor(config = {}) {
        this.masterLoopDuration = typeof config.masterLoopDuration === 'number' && config.masterLoopDuration > 0
            ? config.masterLoopDuration
            : (fastRenderState.getMasterLoopDuration() || 10.0);

        this.previewBeforeBoundary = typeof config.previewBeforeBoundary === 'number' && config.previewBeforeBoundary >= 0
            ? config.previewBeforeBoundary
            : 2.0;

        this.previewAfterBoundary = typeof config.previewAfterBoundary === 'number' && config.previewAfterBoundary >= 0
            ? config.previewAfterBoundary
            : 2.0;

        this.isLoopPreviewActive = !!config.isLoopPreviewActive;

        this.boundaryStepMode = {
            isStepModeActive: false,
            isPausedAtBoundary: false,
            stepFrameIndex: 0,
            fps: 60
        };

        this.listeners = new Set();
    }

    /**
     * Master Loop Duration getter & setter
     */
    getMasterLoopDuration() {
        return this.masterLoopDuration;
    }

    setMasterLoopDuration(duration) {
        if (typeof duration === 'number' && duration > 0) {
            this.masterLoopDuration = duration;
            this.notifyListeners({ type: 'MASTER_DURATION_CHANGE', duration });
        }
    }

    /**
     * Configurable Preview Window getter & setter
     * @param {number} beforeSec - Seconds before boundary
     * @param {number} afterSec - Seconds after boundary
     */
    setPreviewWindow(beforeSec, afterSec) {
        if (typeof beforeSec === 'number' && beforeSec >= 0) {
            this.previewBeforeBoundary = beforeSec;
        }
        if (typeof afterSec === 'number' && afterSec >= 0) {
            this.previewAfterBoundary = afterSec;
        }
        this.notifyListeners({ 
            type: 'PREVIEW_WINDOW_CHANGE', 
            before: this.previewBeforeBoundary, 
            after: this.previewAfterBoundary 
        });
    }

    getPreviewWindow() {
        return {
            previewBeforeBoundary: this.previewBeforeBoundary,
            previewAfterBoundary: this.previewAfterBoundary,
            totalWindowDuration: this.previewBeforeBoundary + this.previewAfterBoundary
        };
    }

    /**
     * Loop Preview Active toggle
     */
    setLoopPreviewActive(active) {
        this.isLoopPreviewActive = !!active;
        this.notifyListeners({ type: 'LOOP_PREVIEW_TOGGLE', active: this.isLoopPreviewActive });
    }

    getLoopPreviewActive() {
        return this.isLoopPreviewActive;
    }

    /**
     * Get Loop Boundaries metadata
     */
    getLoopBoundaries() {
        return {
            loopStart: 0.0,
            loopEnd: this.masterLoopDuration
        };
    }

    /**
     * Get Preview Window Range Bounds on the Timeline
     */
    getPreviewWindowBounds() {
        const loopEnd = this.masterLoopDuration;
        const preStart = Math.max(0, loopEnd - this.previewBeforeBoundary);
        const postEnd = Math.min(loopEnd, this.previewAfterBoundary);

        return {
            preBoundaryRegion: { start: preStart, end: loopEnd },
            postBoundaryRegion: { start: 0.0, end: postEnd },
            totalWindowDuration: this.previewBeforeBoundary + this.previewAfterBoundary
        };
    }

    /**
     * Map input timecode seamlessly across loop boundary
     * Example (for 10s loop with 2s+2s window):
     * 0.0s -> 8.00s (Pre-boundary start)
     * 1.9s -> 9.90s (Approaching boundary)
     * 2.0s -> 0.00s (Boundary crossed, wraps back to start)
     * 3.9s -> 1.90s (Post-boundary end)
     * @param {number} rawTimeSec 
     * @returns {Object} { mappedPlaybackTime, formattedTime, isPreBoundary, isPostBoundary, progressPercent }
     */
    mapPreviewTime(rawTimeSec = 0) {
        const loopEnd = this.masterLoopDuration;
        if (!this.isLoopPreviewActive) {
            const normalized = ((rawTimeSec % loopEnd) + loopEnd) % loopEnd;
            return {
                mappedPlaybackTime: normalized,
                formattedTime: this.formatTimecode(normalized),
                isPreBoundary: false,
                isPostBoundary: false,
                isInPreviewWindow: false,
                progressPercent: (normalized / loopEnd) * 100
            };
        }

        if (this.boundaryStepMode.isStepModeActive && this.boundaryStepMode.isPausedAtBoundary) {
            // Step mode active: evaluate time based on step frame offset around boundary
            const frameTime = this.boundaryStepMode.stepFrameIndex / this.boundaryStepMode.fps;
            let stepTime = loopEnd - this.previewBeforeBoundary + frameTime;
            if (stepTime >= loopEnd) {
                stepTime = stepTime - loopEnd;
            }
            return {
                mappedPlaybackTime: stepTime,
                formattedTime: this.formatTimecode(stepTime),
                isPreBoundary: stepTime >= (loopEnd - this.previewBeforeBoundary),
                isPostBoundary: stepTime < this.previewAfterBoundary,
                isInPreviewWindow: true,
                isStepMode: true,
                stepFrameIndex: this.boundaryStepMode.stepFrameIndex
            };
        }

        const totalWindow = this.previewBeforeBoundary + this.previewAfterBoundary;
        if (totalWindow <= 0) {
            return {
                mappedPlaybackTime: 0,
                formattedTime: "00.00",
                isPreBoundary: false,
                isPostBoundary: false,
                isInPreviewWindow: true,
                progressPercent: 0
            };
        }

        const elapsedInWindow = ((rawTimeSec % totalWindow) + totalWindow) % totalWindow;
        let mappedTime = 0;
        let isPreBoundary = false;
        let isPostBoundary = false;

        if (elapsedInWindow < this.previewBeforeBoundary) {
            mappedTime = (loopEnd - this.previewBeforeBoundary) + elapsedInWindow;
            isPreBoundary = true;
        } else {
            mappedTime = elapsedInWindow - this.previewBeforeBoundary;
            isPostBoundary = true;
        }

        return {
            mappedPlaybackTime: mappedTime,
            formattedTime: this.formatTimecode(mappedTime),
            isPreBoundary,
            isPostBoundary,
            isInPreviewWindow: true,
            progressPercent: (elapsedInWindow / totalWindow) * 100
        };
    }

    /**
     * Format timecode into human-readable representation (e.g. 09.98, 10.00, 00.00, 00.08)
     */
    formatTimecode(sec) {
        if (typeof sec !== 'number' || isNaN(sec)) return "00.00";
        const normalized = Math.max(0, sec);
        const mins = Math.floor(normalized / 60);
        const seconds = (normalized % 60).toFixed(2);
        const secStr = parseFloat(seconds) < 10 ? `0${seconds}` : `${seconds}`;
        return mins > 0 ? `${mins}:${secStr}` : secStr;
    }

    /**
     * Boundary Step Mode Debugging Controls
     */
    toggleBoundaryStepMode(enable) {
        this.boundaryStepMode.isStepModeActive = !!enable;
        this.boundaryStepMode.isPausedAtBoundary = !!enable;
        if (enable) {
            // Start right at boundary (0 frames offset = pre-boundary end)
            this.boundaryStepMode.stepFrameIndex = Math.round(this.previewBeforeBoundary * this.boundaryStepMode.fps);
        }
        this.notifyListeners({ type: 'STEP_MODE_TOGGLE', active: this.boundaryStepMode.isStepModeActive });
    }

    pauseAtBoundary() {
        this.toggleBoundaryStepMode(true);
    }

    stepForward(frames = 1) {
        if (!this.boundaryStepMode.isStepModeActive) {
            this.toggleBoundaryStepMode(true);
        }
        const maxFrames = Math.round((this.previewBeforeBoundary + this.previewAfterBoundary) * this.boundaryStepMode.fps);
        this.boundaryStepMode.stepFrameIndex = (this.boundaryStepMode.stepFrameIndex + frames) % maxFrames;
        this.notifyListeners({ type: 'STEP_FRAME_CHANGE', stepFrameIndex: this.boundaryStepMode.stepFrameIndex });
    }

    stepBackward(frames = 1) {
        if (!this.boundaryStepMode.isStepModeActive) {
            this.toggleBoundaryStepMode(true);
        }
        const maxFrames = Math.round((this.previewBeforeBoundary + this.previewAfterBoundary) * this.boundaryStepMode.fps);
        this.boundaryStepMode.stepFrameIndex = (this.boundaryStepMode.stepFrameIndex - frames + maxFrames) % maxFrames;
        this.notifyListeners({ type: 'STEP_FRAME_CHANGE', stepFrameIndex: this.boundaryStepMode.stepFrameIndex });
    }

    /**
     * Subscribe to loop controller updates
     */
    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }
        return () => {};
    }

    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event, this);
            } catch (err) {
                console.error('[LoopPreviewController] Listener error:', err);
            }
        });
    }
}

// Export singleton instance
export const loopPreviewController = new LoopPreviewController();
