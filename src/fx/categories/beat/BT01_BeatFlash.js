/**
 * BT01_BeatFlash.js
 * Beat Flash
 */
export const metadata = {
    id: 'beat-flash',
    name: 'BeatFlash',
    displayName: 'Beat Flash',
    description: 'Flashes the screen white on strong kicks.',
    category: 'beat',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0, ratio: 2.35, opacity: 0.15 };

export function initialize(context) { context.state.flash = 0; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[1] || 0) / 255; // Kick
    
    if (energy > 0.8) {
        state.flash = 1.0;
    }
    
    if (state.flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.flash})`;
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        state.flash -= (deltaTime || 0.016) * 3; // fade out fast
    }
}
