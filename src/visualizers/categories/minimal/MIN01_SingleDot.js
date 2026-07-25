/**
 * MIN01_SingleDot.js
 * Minimal Single Dot
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'minimal-dot',
    name: 'SingleDot',
    displayName: 'Minimal Single Dot',
    description: 'A single elegant dot that breathes with the bass',
    category: 'Minimal',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["minimal","dot","clean"],
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
    
    // Average low freq
    let sum = 0;
    for(let i=0; i<5; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 5 / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    const r = 5 + energy * 150 * (gain || 1.0);
    
    ctx.fillStyle = color || '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
}
