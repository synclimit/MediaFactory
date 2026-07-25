/**
 * FLM01_FilmGrain.js
 * Film Grain
 */
export const metadata = {
    id: 'film-grain',
    name: 'FilmGrain',
    displayName: 'Film Grain',
    description: 'Photochemical noise simulating analog film stock.',
    category: 'Film FX',
    version: '1.0.0'
};

export const defaultConfig = { density: 20.0, intensity: 50.0, radius: 0.5, beatReact: true };

export function initialize(context) {}
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { density } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    // In Canvas2D, true film grain overlay requires generating noise.
    // For performance, we pre-generate a small noise pattern and tile it,
    // or draw random pixels if density is low.
    
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255,255,255,${(density || 20) / 100 * 0.15})`;
    
    // Quick random noise strips
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        const w = Math.random() * 5 + 1;
        const h = Math.random() * 5 + 1;
        ctx.fillRect(x, y, w, h);
    }
    
    ctx.globalCompositeOperation = 'source-over';
}
