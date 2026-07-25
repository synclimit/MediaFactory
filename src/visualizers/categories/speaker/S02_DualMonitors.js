/**
 * S02_DualMonitors.js
 * Dual Studio Monitors
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'speaker-dual',
    name: 'DualMonitors',
    displayName: 'Dual Studio Monitors',
    description: 'Left and right speakers reacting to stereo channels (simulated)',
    category: 'Speaker',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["speaker","stereo","monitors"],
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
    
    // We'll simulate L/R by splitting the spectrum, or just use the same for both if mono
    const mid = Math.floor(barCount / 2);
    
    let lSum = 0; for(let i=0; i<3; i++) lSum += state.smoothedData[i] || 0;
    let rSum = 0; for(let i=mid; i<mid+3; i++) rSum += state.smoothedData[i] || 0;
    
    const lBass = lSum / 3 / 255;
    const rBass = rSum / 3 / 255;
    
    const drawSpeaker = (x, y, bassLevel) => {
        const pulse = bassLevel * 20 * (gain || 1.0);
        
        ctx.save();
        ctx.translate(x, y);
        
        // Box
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fillRect(-80, -120, 160, 240);
        ctx.strokeRect(-80, -120, 160, 240);
        
        // Tweeter
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, -60, 30, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, -60, 10, 0, Math.PI*2);
        ctx.fill();
        
        // Woofer
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 40, 60 + pulse, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = color || '#00ffcc';
        ctx.beginPath();
        ctx.arc(0, 40, 20 + pulse*0.5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    };
    
    drawSpeaker(cx - 150, cy, lBass);
    drawSpeaker(cx + 150, cy, rBass);
}
