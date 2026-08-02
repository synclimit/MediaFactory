/**
 * TimelineProvider.js
 * Rendering provider for Timeline panel context in MediaFactory M3.
 * Manages timeline track visual indicators and loop region boundaries for NORMAL and FAST workspaces.
 */

export class TimelineProvider {
    /**
     * @param {string} mode - 'NORMAL' | 'FAST'
     */
    constructor(mode = 'NORMAL') {
        this.mode = mode;
        this.isFastMode = mode === 'FAST';
    }

    /**
     * Get active timeline mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Process timeline tracks formatting
     * @param {Array} audioTracks 
     * @param {Array} visualObjects 
     * @param {import('../RenderingContext.js').RenderingContext} [renderingContext]
     */
    processTimelineTracks(audioTracks = [], visualObjects = [], renderingContext = null) {
        const summary = renderingContext && typeof renderingContext.getTimelineCompositionSummary === 'function'
            ? renderingContext.getTimelineCompositionSummary()
            : null;

        return {
            mode: this.mode,
            isFastTimeline: this.isFastMode,
            audioTrackCount: audioTracks.length,
            visualObjectCount: visualObjects.length,
            trackStatus: this.isFastMode ? 'FAST_WORKSPACE_ACTIVE' : 'NORMAL_WORKSPACE_ACTIVE',
            compositionSummary: summary
        };
    }

    /**
     * Get timeline visual indicators
     * @param {import('../RenderingContext.js').RenderingContext} [renderingContext]
     */
    getTimelineIndicators(renderingContext = null) {
        if (renderingContext && typeof renderingContext.getTimelineCompositionSummary === 'function') {
            const summary = renderingContext.getTimelineCompositionSummary();
            return {
                mode: this.mode,
                accentColor: summary.accentColor,
                statusLabel: summary.statusLabel,
                hasGraph: summary.hasGraph,
                score: summary.score
            };
        }

        return {
            mode: this.mode,
            accentColor: this.isFastMode ? '#f97316' : '#2563eb',
            statusLabel: this.isFastMode ? 'Fast Workspace Timeline' : 'Normal Timeline'
        };
    }

    /**
     * Get loop preview timeline overlay data
     * @param {Object} [loopProvider]
     */
    getLoopOverlayData(loopProvider) {
        if (!this.isFastMode || !loopProvider || !loopProvider.isActive) {
            return {
                showLoopOverlay: false,
                loopStart: 0,
                loopEnd: 0,
                previewRegion: null
            };
        }

        const overlayData = typeof loopProvider.getTimelineOverlayData === 'function' 
            ? loopProvider.getTimelineOverlayData() 
            : null;

        return {
            showLoopOverlay: true,
            loopStart: overlayData ? overlayData.loopStart : 0,
            loopEnd: overlayData ? overlayData.loopEnd : 10.0,
            preRegion: overlayData ? overlayData.preBoundaryRegion : null,
            postRegion: overlayData ? overlayData.postBoundaryRegion : null,
            isLoopPreviewActive: overlayData ? overlayData.isLoopPreviewActive : false
        };
    }
}
