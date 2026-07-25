/**
 * MX02_HexCode.js
 * Hexadecimal Grid
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'matrix-hexcode',
    name: 'HexCode',
    displayName: 'Hexadecimal Grid',
    description: 'A grid of flashing hex codes responding to frequencies',
    category: 'Matrix',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["matrix","hex","grid"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ff00', barCount: 64, gain: 1.0, smoothing: 0.8 };

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
    
    const cellSize = 30;
    const cols = Math.ceil(viewport.width / cellSize);
    const rows = Math.ceil(viewport.height / cellSize);
    
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Map grid pos to freq bucket
            const dataIdx = (r * cols + c) % barCount;
            const val = state.smoothedData[dataIdx] || 0;
            
            const x = c * cellSize + (cellSize/2);
            const y = r * cellSize + (cellSize/2);
            
            // Only draw if frequency is somewhat active
            if (val > 20) {
                const alpha = val / 255;
                ctx.fillStyle = (color || '#00ffcc') + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                
                // Show actual freq value as hex
                const hexVal = Math.floor(val * (gain || 1.0)).toString(16).toUpperCase().padStart(2, '0');
                ctx.fillText(hexVal, x, y);
            }
        }
    }
}
