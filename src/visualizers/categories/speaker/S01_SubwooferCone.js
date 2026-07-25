/**
 * S01_SubwooferCone.js
 * Subwoofer Cone
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'speaker-sub',
    name: 'SubwooferCone',
    displayName: 'Subwoofer Cone',
    description: 'A realistic speaker cone that vibrates with the bass',
    category: 'Speaker',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["speaker","subwoofer","cone"],
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
    
    // Subwoofer reacts primarily to bass (lowest frequencies)
    let sum = 0;
    for(let i=0; i<3; i++) sum += state.smoothedData[i] || 0;
    const bass = sum / 3 / 255;
    
    const pulse = bass * 40 * (gain || 1.0);
    const r = 150 + pulse;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Speaker chassis (outer ring)
    ctx.fillStyle = '#222222';
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Speaker surround (rubber edge)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, 0, Math.PI*2);
    ctx.stroke();
    
    // Cone
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, '#333333');
    grad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r - 15, 0, Math.PI*2);
    ctx.fill();
    
    // Dust cap (center dome)
    ctx.fillStyle = color || '#00ffcc';
    ctx.shadowBlur = 20;
    ctx.shadowColor = color || '#00ffcc';
    ctx.beginPath();
    ctx.arc(0, 0, 40 + pulse*0.5, 0, Math.PI*2);
    ctx.fill();
    
    // Vibration blur effect on heavy bass
    if (bass > 0.8) {
        ctx.strokeStyle = (color || '#00ffcc') + '55';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 165 + Math.random()*10, 0, Math.PI*2);
        ctx.stroke();
    }
    
    ctx.restore();
}
