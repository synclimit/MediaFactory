/**
 * BLR01_MotionBlur.js
 * Motion Blur
 */
export const metadata = {
    id: 'blur-motion',
    name: 'MotionBlur',
    displayName: 'Motion Blur',
    description: 'Simulates fast camera movement.',
    category: 'blur',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0, ratio: 2.35, opacity: 0.15 };

export function initialize(context) { context.state.flash = 0; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { intensity } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    // In Canvas2D, true motion blur is heavy. We can approximate using a CSS filter on the canvas element,
    // or by drawing a semi-transparent black rectangle to create trails (which is what most visualizers do).
    // Let's do the trail effect if intensity is high.
    if ((intensity || 50) > 0) {
        ctx.fillStyle = `rgba(0,0,0,${1.0 - (intensity/100)})`;
        ctx.fillRect(0, 0, viewport.width, viewport.height);
    }
}
