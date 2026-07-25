import { RenderFrame } from './models/RenderFrame';
import { FrameBuilder } from './builders/FrameBuilder';

/**
 * FrameComposer
 * 
 * Responsibilities:
 * - Collect VisualComposition
 * - Collect Subtitle output
 * - Collect Timeline state
 * - Build one RenderFrame
 * 
 * No rendering logic. Only compose data.
 */
export class FrameComposer {
    static compose(metadata, states, objects) {
        const t0 = performance.now();
        
        // Use FrameBuilder under the hood or construct directly
        const engineStates = {
            subtitle: states.subtitle || null,
            visual: states.visual || null,
            beat: states.beat || null,
            BeatEngine: states.BeatEngine || null,
            PlaylistEngine: states.PlaylistEngine || null,
            objects: objects || []
        };
        
        const frame = FrameBuilder.build(metadata, engineStates);
        
        const composeTime = performance.now() - t0;
        
        frame.metrics.composeTimeMicroseconds = composeTime * 1000;
        
        return frame;
    }
}
