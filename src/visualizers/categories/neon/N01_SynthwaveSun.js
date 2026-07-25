/**
 * N01_SynthwaveSun.js
 * Synthwave Sun
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'neon-sun',
    name: 'SynthwaveSun',
    displayName: 'Synthwave Sun',
    description: 'A retro 80s synthwave wireframe sun',
    category: 'Neon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["neon","synthwave","sun"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ffcc', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, elapsedTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const r = 150;
    
    const val = state.smoothedData[2] || 0; // bass
    const pulse = (val / 255) * 20 * (gain || 1.0);
    const currentR = r + pulse;
    
    // Draw glowing sun
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff00aa';
    
    const grad = ctx.createLinearGradient(0, cy - currentR, 0, cy + currentR);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(0.5, '#ff00aa');
    grad.addColorStop(1, '#ff00aa');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, Math.PI, 0); // top half
    ctx.fill();
    
    // Draw chopped bottom half
    const slices = 8;
    for (let i = 0; i < slices; i++) {
        const yStart = cy + (i * 20);
        const yEnd = yStart + 10 + (i * 2);
        
        if (yStart > cy + currentR) break;
        
        // intersection of line with circle equation
        const dy1 = yStart - cy;
        const dx1 = Math.sqrt(Math.max(0, currentR*currentR - dy1*dy1));
        
        const dy2 = yEnd - cy;
        const dx2 = Math.sqrt(Math.max(0, currentR*currentR - dy2*dy2));
        
        ctx.beginPath();
        ctx.moveTo(cx - dx1, yStart);
        ctx.lineTo(cx + dx1, yStart);
        ctx.lineTo(cx + dx2, yEnd);
        ctx.lineTo(cx - dx2, yEnd);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}
