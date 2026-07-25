/**
 * RB01_FlowingRibbon.js
 * Flowing Ribbon
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ribbon-flowing',
    name: 'FlowingRibbon',
    displayName: 'Flowing Ribbon',
    description: 'A smooth, flowing 3D ribbon that twists and turns with the audio',
    category: 'Ribbon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["ribbon","flowing","3d"],
    version: '1.0.0'
};

export const defaultConfig = {
    color: '#ff00aa',
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
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 1;
    
    const segments = 150;
    const width = 100;
    const time = elapsedTime || 0;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw ribbon as a series of connected lines between two oscillating edge paths
    for (let i = 0; i < segments; i++) {
        const t = i / segments; // 0 to 1
        
        // Modulate with audio
        const dataIdx = Math.floor(t * barCount);
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 50 * (gain || 1.0);
        
        // Complex oscillating path
        const xOffset = Math.sin(t * Math.PI * 4 + time * 2) * 300;
        const yOffset = Math.cos(t * Math.PI * 3 + time * 1.5) * 150;
        
        // Ribbon twist
        const twist = Math.sin(t * Math.PI * 8 + time * 3) * (width + pulse);
        
        const x1 = xOffset - twist;
        const x2 = xOffset + twist;
        const y1 = yOffset + Math.cos(t * Math.PI * 5) * 50;
        const y2 = yOffset - Math.cos(t * Math.PI * 5) * 50;
        
        // We just draw the cross-sections of the ribbon
        ctx.globalAlpha = 1.0 - (i / segments); // fade out at the tail
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Optionally connect edges (takes more logic for 2D, we just draw thick slices)
    }
    
    ctx.restore();
}
