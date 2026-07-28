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
                setTimeout(processFrame, 100);
                return;
            }

            this.timeline.currentTime += this.dt;
            
            const enableDynamicWorker = window.__M3_FEATURE_FLAGS?.enableDynamicWorkerScheduler ?? false;
            
            if (enableDynamicWorker) {
                // DYNAMIC WORKER SCHEDULER LOGIC
                // Distribusi pekerjaan ke (Virtual) Worker berdasarkan Resource Mode.
                // Karena SharedArrayBuffer & entitas WebWorker fisik belum diimplementasikan 
                // secara utuh dalam arsitektur murni, ini berfungsi sebagai jembatan simulasi
                // distribusi beban.
                const mode = window.__M3_RESOURCE_MODE || 'Balanced';
                let virtualWorkers = 2;
                if (mode === 'Eco') virtualWorkers = 1;
                else if (mode === 'Performance') virtualWorkers = 4;
                else if (mode === 'Turbo') virtualWorkers = 8;
                
                // Mencegah Busy Wait / Spin Loop dengan mendelegasikan secara makro
                // Menggunakan setTimeout untuk benar-benar melepaskan (yield) utas utama (UI Thread)
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.pipeline.update(); 
                        resolve();
                    }, 0);
                });
            } else {
                // LEGACY SCHEDULER (Sequential, Zero Overhead)
                this.pipeline.update();
            }

            currentFrame++;
            if (onProgress) {
                onProgress(currentFrame / totalFrames);
            }

            if (currentFrame < totalFrames) {
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
