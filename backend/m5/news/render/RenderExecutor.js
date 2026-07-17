// Simulates FFmpeg execution
class RenderExecutor {
    async execute(plan, progress, hardware = 'CPU') {
        return new Promise((resolve, reject) => {
            let p = 0;
            const start = Date.now();
            
            // Mock hardware speed
            const speedMs = hardware === 'GPU' ? 10 : 30;
            
            const interval = setInterval(() => {
                p += 20;
                let state = 'Rendering';
                if (p > 60) state = 'Encoding';
                if (p > 80) state = 'Muxing';
                if (p >= 100) state = 'Completed';
                
                progress.update(state, p, Date.now() - start);
                
                if (p >= 100) {
                    clearInterval(interval);
                    resolve({
                        file: `/renders/${plan.id}.mp4`,
                        renderTimeMs: Date.now() - start,
                        hardware
                    });
                }
            }, speedMs);
        });
    }
}
module.exports = RenderExecutor;