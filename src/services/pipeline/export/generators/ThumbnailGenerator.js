import { outputManager } from '../../output/OutputManager';
import { ThumbnailAdapter } from '../../output/adapters/ThumbnailAdapter';

/**
 * ThumbnailGenerator
 * 
 * Reuses the RenderPipeline to capture static representations of the timeline.
 */
export class ThumbnailGenerator {
    constructor(pipeline, timeline) {
        this.pipeline = pipeline;
        this.timeline = timeline;
        
        // Prepare adapter
        this.adapter = new ThumbnailAdapter();
    }

    /**
     * Captures a thumbnail at a specific time.
     */
    async captureAtTime(timeSec) {
        // Register adapter temporarily
        outputManager.registerAdapter('thumbnail_gen', this.adapter);

        // Seek timeline deterministically
        this.timeline.seek(timeSec);

        // Run pipeline to generate frame
        this.pipeline.update();

        // The adapter has now received the frame via outputManager dispatch
        // For the stub, we simulate getting a base64 or Blob back
        const result = { success: true, time: timeSec, type: 'thumbnail', data: 'stub_data' };

        // Unregister
        outputManager.unregisterAdapter('thumbnail_gen');

        return result;
    }

    /**
     * Automatically generates thumbnails based on percentage segments.
     */
    async generateAutoThumbnails(durationSec, count = 5) {
        const thumbnails = [];
        const interval = durationSec / (count + 1);
        
        for (let i = 1; i <= count; i++) {
            const time = i * interval;
            const thumb = await this.captureAtTime(time);
            thumbnails.push(thumb);
        }
        return thumbnails;
    }

    /**
     * Preset thumbnail captures (e.g., beginning, middle, end)
     */
    async generatePresetThumbnails(durationSec) {
        return await Promise.all([
            this.captureAtTime(0),
            this.captureAtTime(durationSec / 2),
            this.captureAtTime(durationSec)
        ]);
    }
}
