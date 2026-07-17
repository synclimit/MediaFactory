/**
 * SubtitleRenderer
 * Pure presentation layer for the subtitles.
 * Prepares the payload for the React component without allocations.
 */
export class SubtitleRenderer {
    initialize() {}

    /**
     * @param {RenderFrame} frame Immutable frame containing all snapshot states
     */
    draw(frame) {
        if (!frame || !frame.subtitle) return;
        // In this architecture, the DOM/React layer automatically pulls from frame.subtitle.
        // We do not draw directly to the canvas context, so we just pass through.
    }

    shutdown() {}
}
