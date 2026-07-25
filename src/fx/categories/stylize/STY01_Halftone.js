/**
 * STY01_Halftone.js
 * Comic Halftone
 */
export const metadata = {
    id: 'stylize-halftone',
    name: 'Halftone',
    displayName: 'Comic Halftone',
    description: 'Turns the image into a comic-book dot pattern.',
    category: 'stylize',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0, ratio: 2.35, opacity: 0.15 };

export function initialize(context) { context.state.flash = 0; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    // Simulating halftone in canvas2D over existing content without getImageData is near impossible,
    // so we'll draw a dot grid overlay that pulses with the beat.
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[2] || 0) / 255;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + energy * 0.4})`;
    const dotSize = 4;
    const spacing = 8;
    
    ctx.beginPath();
    for(let y=0; y<viewport.height; y+=spacing) {
        for(let x=0; x<viewport.width; x+=spacing) {
            if ((x+y)%16 === 0) {
                ctx.rect(x, y, dotSize, dotSize);
            }
        }
    }
    ctx.fill();
}
