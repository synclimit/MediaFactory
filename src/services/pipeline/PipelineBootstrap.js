import { RenderPipeline } from './RenderPipeline.js';
import { TimelineProvider } from './providers/TimelineProvider.js';
import { PlaybackMode } from './providers/PlaybackMode.js';
import { FrameInputProvider } from './providers/FrameInputProvider.js';
import { outputManager } from './output/OutputManager.js';
import { ReactPreviewAdapter } from './output/adapters/ReactPreviewAdapter.js';

/**
 * Bootstraps the complete Render Pipeline infrastructure.
 */
export function bootstrapPipeline() {
    const timeline = new TimelineProvider();
    const frameInput = new FrameInputProvider();

    // Initialize Timeline
    timeline.initialize(PlaybackMode.REALTIME);

    // Register Output Adapters
    const reactAdapter = new ReactPreviewAdapter();
    outputManager.registerAdapter('react_preview', reactAdapter);

    // Initialize Pipeline
    const pipeline = new RenderPipeline(outputManager, timeline, frameInput);
    pipeline.initialize({});
    
    // Expose for QA Validation
    window.renderPipeline = pipeline;
    
    return { pipeline, outputManager, timeline, frameInput };
}
