/**
 * GLT01_RGBShift.js
 * RGB Shift
 */
export const metadata = {
    id: 'glitch-rgb',
    name: 'RGBShift',
    displayName: 'RGB Shift',
    description: 'Separates RGB channels during loud hits.',
    category: 'Glitch FX',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 20.0 };

export function initialize(context) {}
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { intensity } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[5] || 0) / 255; // Snare/mid
    
    if (energy > 0.6) {
        // In full WebGL this offsets the texture reads for R, G, B separately.
        // In Canvas2D, this is very hard to do on already drawn content without getImageData (too slow).
        // We will simulate it by drawing semi-transparent shifted colored boxes 
        // to represent chromatic aberration on the screen edges.
        const shift = energy * (intensity || 20);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(-shift, 0, viewport.width, viewport.height);
        
        ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.fillRect(shift, 0, viewport.width, viewport.height);
        
        ctx.globalCompositeOperation = 'source-over';
    }
}
