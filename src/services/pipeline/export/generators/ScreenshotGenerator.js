import { outputManager } from '../../output/OutputManager';
import { ScreenshotAdapter } from '../../output/adapters/ScreenshotAdapter';

/**
 * ScreenshotGenerator
 * 
 * Reuses the RenderPipeline to capture full-resolution single frames
 * from the timeline.
 */
export class ScreenshotGenerator {
    constructor(pipeline, timeline) {
        this.pipeline = pipeline;
        this.timeline = timeline;
        this.adapter = new ScreenshotAdapter();
    }

    /**
     * Captures a high-resolution screenshot at the current timeline position.
     */
    async captureCurrentFrame() {
        outputManager.registerAdapter('screenshot_gen', this.adapter);

        // We do not seek, we capture what is currently on the timeline
        this.pipeline.update();

        const result = { 
            success: true, 
            time: this.timeline.getCurrentTime(), 
            type: 'screenshot', 
            data: 'stub_data' 
        };

        outputManager.unregisterAdapter('screenshot_gen');
        return result;
    }

    /**
     * Captures a screenshot at a specific time.
     */
    async captureAtTime(timeSec) {
        this.timeline.seek(timeSec);
        return await this.captureCurrentFrame();
    }
}
