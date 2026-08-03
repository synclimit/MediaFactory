import { RenderFrame } from '../models/RenderFrame';
import { RenderContextAdapter } from '../../../engine/adapters/RenderContextAdapter.js';
import { AudioStateAdapter } from '../../../engine/adapters/AudioStateAdapter.js';

/**
 * FrameBuilder [Status: ACTIVE - PASS-THROUGH ONLY]
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

        // Construct passive AudioState & RenderContext for Sprint 03 (Standby mode - PASS-THROUGH ONLY)
        const audioState = AudioStateAdapter.createFromFrame(engineStates);
        const renderContext = RenderContextAdapter.createFromFrame(
            { metadata, engineStates },
            { width: partialMetadata.width || 1920, height: partialMetadata.height || 1080 }
        );

        const updatedEngineStates = {
            ...engineStates,
            audioState,    // Passive standby AudioState object
            renderContext  // Passive standby RenderContext object
        };

        // Instantiate the frame using the secret key
        return new RenderFrame(RenderFrame.BUILDER_SECRET, metadata, updatedEngineStates);
    }
}

