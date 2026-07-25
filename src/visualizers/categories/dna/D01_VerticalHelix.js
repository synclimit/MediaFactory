/**
 * D01_VerticalHelix.js
 * Vertical Helix
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'dna-vertical',
    name: 'VerticalHelix',
    displayName: 'Vertical Helix',
    description: 'A vertical DNA double helix where the rungs react to frequencies',
    category: 'DNA',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["dna","vertical","helix"],
    version: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    barCount: 64,
    gain: 1.0,
    smoothing: 0.8
};

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
    const time = elapsedTime || 0;
    
    const rungs = Math.min(barCount, 60);
    const spacing = viewport.height / rungs;
    const radius = 100;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < rungs; i++) {
        const y = i * spacing;
        
        // Map frequency data to rung width
        const dataIdx = Math.floor((i / rungs) * barCount);
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 50 * (gain || 1.0);
        
        const currentR = radius + pulse;
        
        // 3D twist
        const phase = (i * 0.2) + (time * 2);
        
        const x1 = cx + Math.sin(phase) * currentR;
        const z1 = Math.cos(phase);
        
        const x2 = cx + Math.sin(phase + Math.PI) * currentR;
        const z2 = Math.cos(phase + Math.PI);
        
        // Fake Z-sorting for lines
        if (z1 < z2) {
            ctx.globalAlpha = 0.5 + (z1 * 0.5); // fade back
            ctx.strokeStyle = '#ffffff55';
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
            
            // Draw nodes
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = color || '#00ffcc';
            ctx.fillRect(x1 - 3, y - 3, 6, 6);
            ctx.fillStyle = '#ff00aa';
            ctx.fillRect(x2 - 3, y - 3, 6, 6);
        } else {
            ctx.globalAlpha = 0.5 + (z2 * 0.5); // fade back
            ctx.strokeStyle = '#ffffff55';
            ctx.beginPath();
            ctx.moveTo(x2, y);
            ctx.lineTo(x1, y);
            ctx.stroke();
            
            // Draw nodes
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ff00aa';
            ctx.fillRect(x2 - 3, y - 3, 6, 6);
            ctx.fillStyle = color || '#00ffcc';
            ctx.fillRect(x1 - 3, y - 3, 6, 6);
        }
    }
    ctx.globalAlpha = 1.0;
}
