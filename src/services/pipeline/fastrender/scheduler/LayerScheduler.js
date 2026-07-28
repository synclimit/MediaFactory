export class LayerScheduler {
    // Basic M3 standard ordering
    getStandardOrder() {
        return ['Background', 'Playlist', 'Visualizer', 'Particle', 'Overlay', 'Subtitle', 'Lyrics', 'Logo', 'Watermark'];
    }
    
    expand(segments) {
        const standard = this.getStandardOrder();
        return segments.map(seg => {
            // For simplicity, simulate standard layers active in each segment. 
            // In reality, this relies on RenderPlan.activeLayers if populated.
            return {
                segmentId: seg.segmentId,
                layers: standard.map((layer, idx) => ({ layerId: layer, zIndex: idx }))
            };
        });
    }
}
