/**
 * CAM02_BeatZoom.js
 * Beat Zoom
 */
export const metadata = {
    id: 'camera-zoom',
    name: 'BeatZoom',
    displayName: 'Beat Zoom',
    description: 'Rapid zoom-in/out synced to audio transients.',
    category: 'Camera FX',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 20.0, frequency: 8.0, zoomDepth: 0.5 };

export function initialize(context) { context.state.shakeTime = 0; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { zoomDepth } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[1] || 0) / 255; // Kick approximate
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    const scale = 1.0 + (energy * (zoomDepth || 0.5));
    
    // Zoom around center
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
}
