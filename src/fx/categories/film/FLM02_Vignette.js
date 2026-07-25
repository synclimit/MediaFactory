/**
 * FLM02_Vignette.js
 * Vignette
 */
export const metadata = {
    id: 'film-vignette',
    name: 'Vignette',
    displayName: 'Vignette',
    description: 'Darkens edges of the frame.',
    category: 'Film FX',
    version: '1.0.0'
};

export const defaultConfig = { density: 20.0, intensity: 50.0, radius: 0.5, beatReact: true };

export function initialize(context) {}
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { intensity, radius, beatReact } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    let currentRadius = radius || 0.5;
    
    if (beatReact) {
        const rawData = audio.getSpectrum() || new Uint8Array(64);
        const energy = (rawData[2] || 0) / 255;
        currentRadius -= energy * 0.2; // tighter on beat
    }
    
    const maxDist = Math.sqrt(cx*cx + cy*cy);
    
    const grad = ctx.createRadialGradient(
        cx, cy, maxDist * Math.max(0.1, currentRadius),
        cx, cy, maxDist
    );
    
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${(intensity || 50) / 100})`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
}
