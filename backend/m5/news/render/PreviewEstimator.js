class PreviewEstimator {
    estimate(renderPlan) {
        const fps = renderPlan.timing.fps;
        const duration = renderPlan.timing.duration;
        const resMultiplier = renderPlan.canvas.width === 1080 ? 1 : 0.5;
        
        const estTimeSec = (duration * 2.5) * (fps / 30) * resMultiplier;
        const estSizeMB = duration * 2.1 * resMultiplier;
        
        return {
            estimatedTimeSeconds: parseFloat(estTimeSec.toFixed(2)),
            estimatedSizeMB: parseFloat(estSizeMB.toFixed(2)),
            resolution: `${renderPlan.canvas.width}x${renderPlan.canvas.height}`,
            fps: fps,
            outputPath: `/renders/${renderPlan.id}.mp4`
        };
    }
}
module.exports = PreviewEstimator;