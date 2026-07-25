/**
 * MIN02_ThinLine.js
 * Minimal Thin Line
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'minimal-line',
    name: 'ThinLine',
    displayName: 'Minimal Thin Line',
    description: 'A single ultra-thin horizontal line that bends slightly with the music',
    category: 'Minimal',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["minimal","line","clean"],
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
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cy = viewport.height / 2;
    
    ctx.strokeStyle = color || '#ffffff';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let i = 0; i <= barCount; i++) {
        const x = (i / barCount) * viewport.width;
        const val = state.smoothedData[i] || 0;
        
        // Very subtle bend
        const yOffset = (val / 255) * 20 * (gain || 1.0) * (i % 2 === 0 ? -1 : 1);
        
        if (i === 0) ctx.moveTo(x, cy);
        else ctx.lineTo(x, cy + yOffset);
    }
    ctx.stroke();
}
