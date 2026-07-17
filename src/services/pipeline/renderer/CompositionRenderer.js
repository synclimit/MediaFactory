import { renderSurface } from './RenderSurface.js';

/**
 * CompositionRenderer
 * 
 * Consumes the VisualComposition from the RenderFrame and maps it to the RenderSurface.
 * It has zero knowledge of Zoom or any specific effects, only Transform, Camera, etc.
 */
export class CompositionRenderer {
    initialize() {
    }

    /**
     * @param {RenderFrame} frame 
     */
    draw(frame) {
        if (!frame || !frame.composition) return;

        const comp = frame.composition;

        if (comp.transform) {
            renderSurface.applyTransform(comp.transform);
        }

        if (comp.postProcess) {
            renderSurface.applyPostProcess(comp.postProcess);
        }
    }

    shutdown() {
    }
}
