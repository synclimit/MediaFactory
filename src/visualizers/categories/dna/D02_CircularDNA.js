/**
 * D02_CircularDNA.js
 * Circular DNA
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'dna-circular',
    name: 'CircularDNA',
    displayName: 'Circular DNA',
    description: 'A DNA helix bent into a continuous circle',
    category: 'DNA',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["dna","circular","ring"],
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
    
    const segments = 120;
    const ringRadius = 250;
    const helixRadius = 40;
    
    ctx.lineWidth = 2;
    
    for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2; // Position on the big ring
        
        const dataIdx = Math.floor((i / segments) * barCount);
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 30 * (gain || 1.0);
        
        const currentHelixR = helixRadius + pulse;
        
        // Spin around the tube
        const phi = (i * 0.5) + (time * 3);
        
        // 3D math for a torus-like knot
        const strand1X = cx + Math.cos(theta) * (ringRadius + Math.cos(phi) * currentHelixR);
        const strand1Y = cy + Math.sin(theta) * (ringRadius + Math.cos(phi) * currentHelixR);
        
        const strand2X = cx + Math.cos(theta) * (ringRadius + Math.cos(phi + Math.PI) * currentHelixR);
        const strand2Y = cy + Math.sin(theta) * (ringRadius + Math.cos(phi + Math.PI) * currentHelixR);
        
        // Draw rung
        ctx.strokeStyle = '#ffffff33';
        ctx.beginPath();
        ctx.moveTo(strand1X, strand1Y);
        ctx.lineTo(strand2X, strand2Y);
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = color || '#00ffcc';
        ctx.beginPath();
        ctx.arc(strand1X, strand1Y, 2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#ff5500';
        ctx.beginPath();
        ctx.arc(strand2X, strand2Y, 2, 0, Math.PI*2);
        ctx.fill();
    }
}
