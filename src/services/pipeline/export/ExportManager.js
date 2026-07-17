import { ExportQueue } from './ExportQueue';
import { RenderScheduler } from './RenderScheduler';
import { FFmpegPipeline } from './FFmpegPipeline';

/**
 * ExportManager
 * 
 * Orchestrates the export session. Combines the queue, scheduler, and encoders.
 */
export class ExportManager {
    constructor(pipeline, timeline) {
        this.pipeline = pipeline;
        this.timeline = timeline;
        this.queue = new ExportQueue();
        this.scheduler = new RenderScheduler(pipeline, timeline);
        this.ffmpeg = new FFmpegPipeline();
    }

    addExportJob(config) {
        this.queue.addJob(config);
        // Auto-start if scheduler is idle
        if (!this.scheduler.isRunning) {
            this.processNextJob();
        }
    }

    async processNextJob() {
        const job = this.queue.getNextJob();
        if (!job) return;

        this.queue.updateJobStatus(job.id, 'processing', 0);
        
        await this.ffmpeg.initialize(job.format || 'mp4');

        // Note: The ExportAdapter would ideally be registered with OutputManager here
        // outputManager.registerAdapter('export', new ExportAdapter(this.ffmpeg));

        this.scheduler.start(
            job.durationSec || 10,
            job.fps || 60,
            (progress) => {
                this.queue.updateJobStatus(job.id, 'processing', progress);
            },
            async () => {
                const result = await this.ffmpeg.finalize();
                this.queue.updateJobStatus(job.id, 'completed', 1.0);
                // outputManager.unregisterAdapter('export');
                
                // Process next in queue
                this.processNextJob();
            }
        );
    }

    pause() {
        this.scheduler.pause();
    }

    resume() {
        this.scheduler.resume();
    }

    cancel() {
        this.scheduler.cancel();
        if (this.queue.activeJob) {
            this.queue.updateJobStatus(this.queue.activeJob.id, 'failed');
        }
    }
}
