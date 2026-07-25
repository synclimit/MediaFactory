/**
 * PST01_Letterbox.js
 * Cinematic Letterbox
 */
export const metadata = {
    id: 'post-letterbox',
    name: 'Letterbox',
    displayName: 'Cinematic Letterbox',
    description: 'Adds cinematic black bars to the top and bottom.',
    category: 'post',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0, ratio: 2.35, opacity: 0.15 };

export function initialize(context) { context.state.flash = 0; }
export function update(context) {}
export function render(context) {
    const { viewport, config } = context;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const ratio = config.ratio || 2.35; // Scope ratio
    const targetHeight = viewport.width / ratio;
    const barHeight = (viewport.height - targetHeight) / 2;
    
    if (barHeight > 0) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, viewport.width, barHeight);
        ctx.fillRect(0, viewport.height - barHeight, viewport.width, barHeight);
    }
}
