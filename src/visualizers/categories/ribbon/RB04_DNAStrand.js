/**
 * RB04_DNAStrand.js
 * DNA Ribbon Strand
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'ribbon-dna',
    name: 'DNAStrand',
    displayName: 'DNA Ribbon Strand',
    description: 'A twisted ribbon resembling a DNA strand',
    category: 'Ribbon',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["ribbon","dna","twist"],
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
    const time = elapsedTime || 0;
    
    const segments = 100;
    const width = viewport.width * 0.8;
    const startX = cx - width / 2;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = color || '#00ffcc';
    
    for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const x = startX + t * width;
        
        const dataIdx = Math.floor(t * barCount) % barCount;
        const val = state.smoothedData[dataIdx] || 0;
        const pulse = (val / 255) * 50 * (gain || 1.0);
        
        // Two sine waves out of phase
        const y1 = cy + Math.sin(t * Math.PI * 6 + time * 3) * (50 + pulse);
        const y2 = cy + Math.sin(t * Math.PI * 6 + time * 3 + Math.PI) * (50 + pulse);
        
        // Draw the connecting rung
        if (i % 3 === 0) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
        }
        
        // Draw the edges
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = color || '#00ffcc';
        ctx.fillRect(x - 2, y1 - 2, 4, 4);
        
        ctx.fillStyle = '#ff00aa';
        ctx.fillRect(x - 2, y2 - 2, 4, 4);
    }
}
