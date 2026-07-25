/**
 * T02_HyperspaceWarp.js
 * Hyperspace Warp
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'tunnel-hyperspace',
    name: 'HyperspaceWarp',
    displayName: 'Hyperspace Warp',
    description: 'Star Trek style hyperspace speed tunnel',
    category: 'Tunnel',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["tunnel","hyperspace","warp"],
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
    let energy = 0;
    for(let i=0; i<rawData.length; i++) energy += rawData[i];
    energy = (energy / rawData.length) / 255;
    
    if (!state.streaks) {
        state.streaks = [];
        for(let i=0; i<200; i++) {
            state.streaks.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.random() * 500 + 50,
                z: Math.random() * 1000
            });
        }
    }
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineCap = 'round';
    
    const speed = 1000 + (energy * 3000 * (gain || 1.0)); // VERY fast
    
    for (let i = 0; i < state.streaks.length; i++) {
        const s = state.streaks[i];
        
        const oldZ = s.z;
        s.z -= speed * (deltaTime || 0.016);
        
        if (s.z <= 1) {
            s.z = 1000;
            s.angle = Math.random() * Math.PI * 2;
            s.dist = Math.random() * 500 + 50;
        }
        
        const fov = 300;
        
        // Current pos
        const scale1 = fov / s.z;
        const x1 = cx + Math.cos(s.angle) * s.dist * scale1;
        const y1 = cy + Math.sin(s.angle) * s.dist * scale1;
        
        // Old pos (tail of the streak)
        const scale2 = fov / oldZ;
        const x2 = cx + Math.cos(s.angle) * s.dist * scale2;
        const y2 = cy + Math.sin(s.angle) * s.dist * scale2;
        
        const alpha = Math.max(0, 1 - (s.z / 1000));
        ctx.globalAlpha = alpha;
        
        ctx.lineWidth = 2 * scale1;
        
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}
