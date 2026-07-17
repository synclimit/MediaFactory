import { RenderFrame } from '../models/RenderFrame';

/**
 * FrameBuilder
 * 
 * The only valid way to instantiate a RenderFrame.
 * Gathers metadata and engine states, then constructs the immutable frame.
 */
export class FrameBuilder {
    /**
     * Builds an immutable RenderFrame.
     * 
     * @param {Object} partialMetadata Metadata values (currentTime, deltaTime, etc.)
     * @param {Object} engineStates Pure snapshot states gathered from the engines
     * @returns {RenderFrame}
     */
    static build(partialMetadata = {}, engineStates = {}) {
        // Construct the full metadata object with required defaults
        const metadata = {
            schemaVersion: '1.0',
            pipelineVersion: '1.0',
            frameNumber: partialMetadata.frameNumber || 0,
            currentTime: partialMetadata.currentTime || 0,
            deltaTime: partialMetadata.deltaTime || 0,
            fps: partialMetadata.fps || 0,
            renderMode: partialMetadata.renderMode || 'RealtimePreview',
            engineVersion: partialMetadata.engineVersion || '1.0',
            diagnostics: partialMetadata.diagnostics || []
        };

        // Instantiate the frame using the secret key
        return new RenderFrame(RenderFrame.BUILDER_SECRET, metadata, engineStates);
    }
}
