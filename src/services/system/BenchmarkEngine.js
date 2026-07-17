export class BenchmarkEngine {
    constructor() {
        this.metrics = {
            fps: [],
            cpu: [],
            ram: [],
            frameTime: [],
            droppedFrames: 0,
            gcEvents: 0
        };
        this.isRunning = false;
        this.startTime = 0;
        this.lastFrameTime = performance.now();
    }

    start() {
        this.isRunning = true;
        this.startTime = performance.now();
        this.lastFrameTime = performance.now();
        this.metrics = { fps: [], cpu: [], ram: [], frameTime: [], droppedFrames: 0, gcEvents: 0 };
        console.log('[Benchmark] Started');
    }

    recordFrame() {
        if (!this.isRunning) return;
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const fps = 1000 / delta;
        this.metrics.fps.push(fps);
        this.metrics.frameTime.push(delta);

        if (delta > 33.33) { // Threshold for 30fps drop
            this.metrics.droppedFrames++;
        }

        // Mock CPU/RAM for browser context since `performance.memory` is non-standard
        if (performance.memory) {
            this.metrics.ram.push(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
    }

    stopAndGenerateReport() {
        this.isRunning = false;
        const duration = (performance.now() - this.startTime) / 1000;
        
        const avgFps = this.metrics.fps.length ? this.metrics.fps.reduce((a,b)=>a+b,0) / this.metrics.fps.length : 0;
        const avgFrameTime = this.metrics.frameTime.length ? this.metrics.frameTime.reduce((a,b)=>a+b,0) / this.metrics.frameTime.length : 0;
        const peakRam = this.metrics.ram.length ? Math.max(...this.metrics.ram) : 0;

        const report = `
# MediaFactory Benchmark Report
Duration: ${duration.toFixed(2)}s
Average FPS: ${avgFps.toFixed(1)}
Average Frame Time: ${avgFrameTime.toFixed(2)}ms
Dropped Frames: ${this.metrics.droppedFrames}
Peak JS Heap RAM: ${peakRam.toFixed(2)} MB
Estimated Export Speed Multiplier: ${(avgFps / 60).toFixed(2)}x
`;
        console.log(report);
        return report;
    }
}

export const benchmarkEngine = new BenchmarkEngine();
