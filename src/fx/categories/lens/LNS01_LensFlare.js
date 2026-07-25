/**
 * LNS01_LensFlare.js
 * Optical Lens Flare
 */
export const metadata = {
    id: 'lens-flare',
    name: 'LensFlare',
    displayName: 'Optical Lens Flare',
    description: 'Cinematic anamorphic flares responding to high frequencies.',
    category: 'Lens FX',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 1.0 };

export function initialize(context) {}
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { intensity } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    let hSum = 0;
    for(let i=50; i<60; i++) hSum += rawData[i] || 0;
    const hEnergy = (hSum / 10) / 255;
    
    if (hEnergy > 0.3) {
        ctx.globalCompositeOperation = 'screen';
        const cx = viewport.width / 2;
        const cy = viewport.height / 2;
        const w = viewport.width * hEnergy * (intensity || 1.0);
        
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(cx - w/2, cy - 2, w, 4);
        
        ctx.beginPath();
        ctx.arc(cx, cy, 50 * hEnergy, 0, Math.PI*2);
        ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
    }
}
