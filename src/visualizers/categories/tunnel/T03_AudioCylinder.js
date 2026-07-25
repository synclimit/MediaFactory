/**
 * T03_AudioCylinder.js
 * Audio Cylinder Tunnel
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'tunnel-cylinder',
    name: 'AudioCylinder',
    displayName: 'Audio Cylinder Tunnel',
    description: 'A 3D cylinder composed of frequency rings',
    category: 'Tunnel',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["tunnel","cylinder","audio"],
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
    const { audio, state, config, viewport, elapsedTime, deltaTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8);
    
    if (!state.rings) state.rings = [];
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const fov = 300;
    
    // Spawn new ring from audio data frequently
    state.rings.push({ z: 1000, data: new Float32Array(state.smoothedData) });
    
    const speed = 300; // constant speed
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 1;
    
    for (let i = state.rings.length - 1; i >= 0; i--) {
        const ring = state.rings[i];
        ring.z -= speed * (deltaTime || 0.016);
        
        if (ring.z <= 1) {
            state.rings.splice(i, 1);
            continue;
        }
        
        const scale = fov / ring.z;
        const alpha = Math.max(0, 1 - (ring.z / 1000));
        ctx.globalAlpha = alpha;
        
        // Draw the ring
        ctx.beginPath();
        const segments = 32;
        for (let s = 0; s <= segments; s++) {
            const angle = (s / segments) * Math.PI * 2;
            const dataIdx = Math.floor((s / segments) * barCount) % barCount;
            const val = ring.data[dataIdx] || 0;
            const pulse = (val / 255) * 50 * (gain || 1.0);
            
            const r = 300 - pulse; // pulse inward
            const x = cx + Math.cos(angle + elapsedTime) * r * scale;
            const y = cy + Math.sin(angle + elapsedTime) * r * scale;
            
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}
