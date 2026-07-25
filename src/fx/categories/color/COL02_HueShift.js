/**
 * COL02_HueShift.js
 * Hue Shift
 */
export const metadata = {
    id: 'color-hue',
    name: 'HueShift',
    displayName: 'Hue Shift',
    description: 'Rotates the entire color wheel.',
    category: 'Color FX',
    version: '1.0.0'
};

export const defaultConfig = { colorA: '#ff0000', colorB: '#0000ff', intensity: 0.4, speed: 50.0 };

export function initialize(context) { context.state.toggle = false; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { speed } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    if (!state.hue) state.hue = 0;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[2] || 0) / 255;
    
    state.hue += (speed || 50) * (deltaTime || 0.016) * (1 + energy);
    if (state.hue > 360) state.hue -= 360;
    
    // In Canvas2D, changing hue of an already drawn image is hard without filter.
    // So we apply a filter directly to the context. 
    // WARNING: filter is computationally expensive in Canvas2D.
    ctx.filter = `hue-rotate(${Math.floor(state.hue)}deg)`;
}
