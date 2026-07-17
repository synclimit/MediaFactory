const _builderSecret = Symbol('RenderFrameBuilderSecret');

/**
 * RenderFrame
 * 
 * An immutable Read Model representing a single frame in the Render Pipeline.
 * It contains the metadata and snapshot states of all engines.
 * It must not contain any Engine instances.
 */
export class RenderFrame {
    /**
     * @private
     * RenderFrame should only be instantiated by FrameBuilder.
     */
    constructor(secret, metadata, engineStates) {
        if (secret !== _builderSecret) {
            throw new Error('RenderFrame is a Read Model and cannot be instantiated directly. Use FrameBuilder.build()');
        }

        // Validate metadata
        this.metadata = Object.freeze({
            schemaVersion: metadata.schemaVersion || '1.0',
            pipelineVersion: metadata.pipelineVersion || '1.0',
            frameNumber: metadata.frameNumber || 0,
            currentTime: metadata.currentTime || 0,
            deltaTime: metadata.deltaTime || 0,
            fps: metadata.fps || 0,
            renderMode: metadata.renderMode || 'RealtimePreview',
            engineVersion: metadata.engineVersion || '1.0',
            diagnostics: Object.freeze([...(metadata.diagnostics || [])])
        });

        // Store pure states. We trust the engines to provide immutable or safely double-buffered objects.
        // We shallow freeze the top level to prevent accidental mutation of the bucket references.
        this.states = Object.freeze({ ...engineStates });
        
        // Expose explicit domain state buckets
        this.beat = this.states.BeatEngine || {};
        this.motion = this.states.MotionEngine || {};
        this.subtitle = this.states.SubtitleEngine || {};
        this.playlist = this.states.PlaylistEngine || {};
        this.typography = this.states.TypographyEngine || {};
        this.reactive = this.states.ReactiveEngine || {};
        this.audio = this.states.AudioDrivenAdapter || {};
        
        // Expose immutable Composition for the Renderer
        this.composition = this.states.visual || null;
        
        // Logical domains for future renderer implementation
        this.camera = {};
        this.visualizer = {};
        this.overlay = {};
        
        // Debug domain
        this.debug = {
            metadata: this.metadata,
            beat: this.beat,
            reactive: this.reactive,
            motion: this.motion
        };
        
        // Metrics domain
        this.metrics = {};
        
        // Prevent any addition or modification to the RenderFrame instance itself
        Object.freeze(this);
    }

    static get BUILDER_SECRET() {
        return _builderSecret;
    }
}
