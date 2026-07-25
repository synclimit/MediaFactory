/**
 * COL01_ColorPulse.js
 * Color Pulse
 */
export const metadata = {
    id: 'color-pulse',
    name: 'ColorPulse',
    displayName: 'Color Pulse',
    description: 'Pulses the scene between two colors, synced to beat.',
    category: 'Color FX',
    version: '1.0.0'
};

export const defaultConfig = { colorA: '#ff0000', colorB: '#0000ff', intensity: 0.4, speed: 50.0 };

export function initialize(context) { context.state.toggle = false; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { colorA, colorB, intensity } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[2] || 0) / 255;
    
    if (energy > 0.5) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = state.toggle ? (colorA || '#ff0000') : (colorB || '#0000ff');
        ctx.globalAlpha = energy * (intensity || 0.4);
        
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        
        // toggle color on strong beat
        if (energy > 0.8 && Math.random() > 0.5) {
            state.toggle = !state.toggle;
        }
    }
}
