/**
 * RTR01_VHSGlitch.js
 * VHS Glitch Lines
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'retro-vhs',
    name: 'VHSGlitch',
    displayName: 'VHS Glitch Lines',
    description: 'Simulates tracking lines and glitches on strong beats',
    category: 'Retro',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["retro","vhs","glitch"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#ffffff', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    const energy = (rawData[5] || 0) / 255;
    
    if (energy > 0.7) {
        const bands = 5;
        for (let i = 0; i < bands; i++) {
            const y = Math.random() * viewport.height;
            const h = Math.random() * 20;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, y, viewport.width, h);
            
            // RGB shift fake
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(Math.random() * 10, y, viewport.width, h);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
            ctx.fillRect(-Math.random() * 10, y, viewport.width, h);
        }
    }
}
