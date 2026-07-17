import { FrameHashValidator } from './FrameHashValidator';
import { PlaybackMode } from '../providers/PlaybackMode';
import { bootstrapPipeline } from '../PipelineBootstrap';

/**
 * FrameComparison
 * Compares RenderFrame hashes across different playback modes.
 */
export class FrameComparison {
    /**
     * Compare a single frame by running it sequentially across all modes
     * Note: This is a synchronous benchmark function to validate pipeline determinism.
     */
    static compareModes(objects, currentTimeSec, frameIndex = 0) {
        const modes = [PlaybackMode.REALTIME_PREVIEW, PlaybackMode.OFFLINE_PREVIEW, PlaybackMode.FINAL_RENDER];
        const results = {};
        
        // Setup shared bootstrap payload
        const bootstrap = bootstrapPipeline();
        const { pipeline, frameInput, timeline } = bootstrap;

        modes.forEach(mode => {
            // Re-initialize for each mode
            timeline.initialize(mode);
            pipeline.registry.reset();
            
            // Provide stable input
            frameInput.setInputs(objects, {
                canvasMode: 'composer',
                currentTimeSec: currentTimeSec,
                totalDurationSec: 60
            });
            
            // Advance to the target frame index simulating fixed steps
            for (let i = 0; i <= frameIndex; i++) {
                timeline.stepForward(); // Forces fixed step
                pipeline.update();
            }

            const frame = pipeline.getFrame();
            const hash = FrameHashValidator.generateHash(frame);
            
            results[mode] = hash;
        });
        
        // Cleanup
        pipeline.shutdown();
        timeline.shutdown();

        // Check if all modes match
        const hashes = Object.values(results);
        const match = hashes.every(h => h === hashes[0]);

        return {
            realtimeHash: results[PlaybackMode.REALTIME_PREVIEW],
            offlineHash: results[PlaybackMode.OFFLINE_PREVIEW],
            exportHash: results[PlaybackMode.FINAL_RENDER],
            status: match ? 'MATCH' : 'MISMATCH'
        };
    }

    /**
     * Generate a full report for N frames
     */
    static generateReport(objects, numFrames = 10) {
        const report = {
            totalFrames: numFrames,
            matchedFrames: 0,
            mismatchedFrames: 0,
            mismatchPercentage: 0,
            averageFrameTime: 0,
            peakFrameTime: 0,
            droppedFrames: 0,
            details: []
        };

        let totalExecTime = 0;
        let peakTime = 0;

        for (let i = 0; i < numFrames; i++) {
            const t0 = performance.now();
            
            const result = this.compareModes(objects, i * (1/60), i);
            
            const t1 = performance.now();
            const execTime = t1 - t0;
            
            totalExecTime += execTime;
            if (execTime > peakTime) peakTime = execTime;

            if (result.status === 'MATCH') {
                report.matchedFrames++;
            } else {
                report.mismatchedFrames++;
            }

            report.details.push({
                frame: i,
                ...result,
                execTimeMs: execTime
            });
        }

        report.mismatchPercentage = (report.mismatchedFrames / report.totalFrames) * 100;
        report.averageFrameTime = totalExecTime / report.totalFrames;
        report.peakFrameTime = peakTime;

        return report;
    }
}
