/**
 * NAT01_AudioTree.js
 * Audio Tree
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'nature-tree',
    name: 'AudioTree',
    displayName: 'Audio Tree',
    description: 'A procedural tree that grows branches on frequencies',
    category: 'Nature',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["nature","tree","growth"],
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
    const cy = viewport.height;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineCap = 'round';
    
    // Recursive draw function
    const drawBranch = (x, y, len, angle, depth, dataIdx) => {
        if (depth === 0) return;
        
        const val = state.smoothedData[dataIdx % barCount] || 0;
        const pulse = ((val / 255) * 10 * (gain || 1.0));
        
        const endX = x + Math.cos(angle) * (len + pulse);
        const endY = y + Math.sin(angle) * (len + pulse);
        
        ctx.lineWidth = depth * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // sway in the wind
        const sway = Math.sin((elapsedTime||0) + depth) * 0.1;
        
        drawBranch(endX, endY, len * 0.7, angle - 0.5 + sway, depth - 1, dataIdx + 1);
        drawBranch(endX, endY, len * 0.7, angle + 0.5 + sway, depth - 1, dataIdx + 2);
    };
    
    drawBranch(cx, cy, 100, -Math.PI / 2, 7, 0);
}
