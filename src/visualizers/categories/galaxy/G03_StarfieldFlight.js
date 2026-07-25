/**
 * G03_StarfieldFlight.js
 * Starfield Flight
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'galaxy-starfield',
    name: 'StarfieldFlight',
    displayName: 'Starfield Flight',
    description: 'Flying through a 3D starfield, speed controlled by music',
    category: 'Galaxy',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["galaxy","starfield","3d"],
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
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let sum = 0;
    for(let i=0; i<5; i++) sum += rawData[i] || 0;
    const bass = (sum / 5) / 255;
    
    if (!state.stars) {
        state.stars = [];
        for(let i=0; i<300; i++) {
            state.stars.push({
                x: (Math.random() - 0.5) * viewport.width * 2,
                y: (Math.random() - 0.5) * viewport.height * 2,
                z: Math.random() * 1000
            });
        }
    }
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.fillStyle = color || '#ffffff';
    
    const speed = 100 + (bass * 1000 * (gain || 1.0));
    
    for (let i = 0; i < state.stars.length; i++) {
        const s = state.stars[i];
        
        s.z -= speed * (deltaTime || 0.016);
        
        if (s.z <= 1) {
            s.z = 1000;
            s.x = (Math.random() - 0.5) * viewport.width * 2;
            s.y = (Math.random() - 0.5) * viewport.height * 2;
        }
        
        // 3D Projection
        const fov = 256;
        const scale = fov / s.z;
        const x2d = cx + s.x * scale;
        const y2d = cy + s.y * scale;
        
        // Don't draw if outside screen
        if (x2d >= 0 && x2d <= viewport.width && y2d >= 0 && y2d <= viewport.height) {
            // Brightness and size based on Z distance
            const alpha = Math.max(0, Math.min(1, 1 - (s.z / 1000)));
            const size = Math.max(0.5, 3 * scale);
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}
