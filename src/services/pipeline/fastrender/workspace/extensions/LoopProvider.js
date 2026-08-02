/**
 * LoopProvider.js
 * Extension point for Fast Workspace seamless loop preview and boundary inspection (MF-1401).
 * Inactive in Normal Workspace; Active in Fast Workspace via FastLoopProvider.
 */

import { loopPreviewController } from '../controllers/LoopPreviewController.js';

export class LoopProvider {
    constructor() {
        this.isActive = false;
    }

    getLoopDuration() {
        return null;
    }

    getPreviewWindow() {
        return null;
    }

    mapPreviewTime(timeSec) {
        return {
            mappedPlaybackTime: timeSec,
            formattedTime: "00.00",
            isPreBoundary: false,
            isPostBoundary: false,
            isInPreviewWindow: false,
            progressPercent: 0
        };
    }

    getBoundaryStepControls() {
        return null;
    }

    getTimelineOverlayData() {
        return null;
    }
}

export class FastLoopProvider extends LoopProvider {
    /**
     * @param {import('../controllers/LoopPreviewController.js').LoopPreviewController} [controller]
     */
    constructor(controller = loopPreviewController) {
        super();
        this.isActive = true;
        this.controller = controller;
    }

    getLoopDuration() {
        return this.controller.getMasterLoopDuration();
    }

    setLoopDuration(duration) {
        this.controller.setMasterLoopDuration(duration);
    }

    getPreviewWindow() {
        return this.controller.getPreviewWindow();
    }

    setPreviewWindow(beforeSec, afterSec) {
        this.controller.setPreviewWindow(beforeSec, afterSec);
    }

    isLoopPreviewActive() {
        return this.controller.getLoopPreviewActive();
    }

    setLoopPreviewActive(active) {
        this.controller.setLoopPreviewActive(active);
    }

    mapPreviewTime(timeSec) {
        return this.controller.mapPreviewTime(timeSec);
    }

    getBoundaryStepControls() {
        return {
            stepModeActive: this.controller.boundaryStepMode.isStepModeActive,
            isPausedAtBoundary: this.controller.boundaryStepMode.isPausedAtBoundary,
            toggleStepMode: (enable) => this.controller.toggleBoundaryStepMode(enable),
            stepForward: (frames) => this.controller.stepForward(frames),
            stepBackward: (frames) => this.controller.stepBackward(frames),
            pauseAtBoundary: () => this.controller.pauseAtBoundary()
        };
    }

    getTimelineOverlayData() {
        const loopDuration = this.controller.getMasterLoopDuration();
        const windowBounds = this.controller.getPreviewWindowBounds();
        return {
            loopStart: 0.0,
            loopEnd: loopDuration,
            preBoundaryRegion: windowBounds.preBoundaryRegion,
            postBoundaryRegion: windowBounds.postBoundaryRegion,
            totalWindowDuration: windowBounds.totalWindowDuration,
            isLoopPreviewActive: this.controller.getLoopPreviewActive()
        };
    }
}

export const inactiveLoopProvider = new LoopProvider();
export const activeFastLoopProvider = new FastLoopProvider();
