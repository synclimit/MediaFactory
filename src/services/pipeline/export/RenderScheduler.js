/**
 * RenderScheduler
 * 
 * Replaces the realtime requestAnimationFrame loop with a deterministic,
 * sequential ticking mechanism for offline rendering.
 */
export class RenderScheduler {
    constructor(pipeline, timeline) {
        this.pipeline = pipeline;
        this.timeline = timeline;
        this.isRunning = false;
        this.isPaused = false;
        this.fps = 60;
        this.dt = 1 / 60;
    }

    start(durationSec, fps = 60, onProgress, onComplete) {
        this.isRunning = true;
        this.isPaused = false;
        this.fps = fps;
        this.dt = 1 / fps;
        
        this.timeline.seek(0);
        this.pipeline.reset();

        const totalFrames = Math.ceil(durationSec * fps);
        let currentFrame = 0;

        const processFrame = async () => {
            if (!this.isRunning) return;
            if (this.isPaused) {
                // Poll check if unpaused
                setTimeout(processFrame, 100);
                return;
            }

            // Move timeline deterministically
            this.timeline.currentTime += this.dt;
            
            // Execute Pipeline exactly once per frame
            this.pipeline.update();

            // Await output managers / encoders (they must be synchronous or fast enough)
            // Or if ExportAdapter returns a promise, we await it here.
            // For now, we simulate synchronous tick.

            currentFrame++;
            if (onProgress) {
                onProgress(currentFrame / totalFrames);
            }

            if (currentFrame < totalFrames) {
                // Yield to event loop
                setTimeout(processFrame, 0);
            } else {
                this.isRunning = false;
                if (onComplete) onComplete();
            }
        };

        processFrame();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    cancel() {
        this.isRunning = false;
    }
}
