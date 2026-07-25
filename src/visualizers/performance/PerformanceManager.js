/**
 * PerformanceManager.js
 * Monitors FPS, handles frame skipping, and adaptive quality.
 */

export class PerformanceManager {
    constructor() {
        this.fps = 60;
        this.frameTimes = [];
        this.lastTime = performance.now();
        
        this.metrics = {
            framesDropped: 0,
            averageFps: 60,
            qualityScale: 1.0 // 1.0 = High, 0.5 = Low
        };

        this.targetFps = 60;
        this.frameInterval = 1000 / this.targetFps;
    }

    beginFrame(timestamp) {
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Calculate rolling average FPS
        if (delta > 0) {
            this.frameTimes.push(delta);
            if (this.frameTimes.length > 60) {
                this.frameTimes.shift();
            }

            const avgDelta = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
            this.fps = 1000 / avgDelta;
        }

        // Adaptive quality
        if (this.fps < 30 && this.frameTimes.length === 60) {
            this.metrics.qualityScale = Math.max(0.5, this.metrics.qualityScale - 0.1);
        } else if (this.fps >= 58 && this.frameTimes.length === 60) {
            this.metrics.qualityScale = Math.min(1.0, this.metrics.qualityScale + 0.1);
        }

        return delta;
    }

    shouldSkipFrame(timestamp) {
        // Minimal implementation for frame skipping logic
        return false;
    }

    getMetrics() {
        return {
            fps: Math.round(this.fps),
            qualityScale: this.metrics.qualityScale,
            dropped: this.metrics.framesDropped
        };
    }
}
