/**
 * OverlayRenderer
 * Pure presentation layer for overlays (e.g. watermarks, social icons).
 * Strictly consumes RenderFrame and performs drawing operations.
 */
export class OverlayRenderer {
    initialize() {}

    /**
     * @param {RenderFrame} frame Immutable frame containing all snapshot states
     */
    draw(frame) {
        if (!frame) return;
        // Extracts OverlayState from frame.states
        // Draws overlays purely based on this data.
    }

    shutdown() {}
}
