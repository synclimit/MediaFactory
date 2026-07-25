/**
 * RTR02_CRTScanlines.js
 * CRT Scanlines
 */
export const metadata = {
    id: 'retro-crt',
    name: 'CRTScanlines',
    displayName: 'CRT Scanlines',
    description: 'Simulates old TV scanlines.',
    category: 'retro',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0, ratio: 2.35, opacity: 0.15 };

export function initialize(context) { context.state.flash = 0; }
export function update(context) {}
export function render(context) {
    const { viewport, config } = context;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const opacity = config.opacity || 0.15;
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    
    for(let y=0; y<viewport.height; y+=4) {
        ctx.fillRect(0, y, viewport.width, 2);
    }
}
