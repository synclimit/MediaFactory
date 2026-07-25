/**
 * G04_BlackHole.js
 * Black Hole Event Horizon
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'galaxy-blackhole',
    name: 'BlackHole',
    displayName: 'Black Hole Event Horizon',
    description: 'A supermassive black hole warping light around it',
    category: 'Galaxy',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["galaxy","blackhole","warp"],
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
    const r = 100; // Event horizon
    
    // Average low frequencies to pulse the accretion disk
    let sum = 0;
    for(let i=0; i<10; i++) sum += state.smoothedData[i] || 0;
    const energy = sum / 10 / 255;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Accretion disk
    const diskR = r * 2.5 + (energy * 50 * (gain||1));
    
    ctx.save();
    // Tilt the disk
    ctx.scale(1, 0.3);
    ctx.rotate((elapsedTime || 0) * 0.5);
    
    const grad = ctx.createRadialGradient(0, 0, r, 0, 0, diskR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color || '#ff5500');
    grad.addColorStop(1, '#00000000');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, diskR, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    
    // The Event Horizon (Pitch Black Circle)
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 20;
    ctx.shadowColor = color || '#ff5500';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Photon ring / gravitational lensing ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 + (energy * 3);
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.restore();
}
