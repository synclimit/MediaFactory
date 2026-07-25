/**
 * A02_ChaoticSplatter.js
 * Chaotic Splatter
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'abstract-splatter',
    name: 'ChaoticSplatter',
    displayName: 'Chaotic Splatter',
    description: 'Random abstract paint splatters reacting to high frequencies',
    category: 'Abstract',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["abstract","splatter","chaos"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ffcc', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let highFreq = 0;
    for(let i=barCount-10; i<barCount; i++) highFreq += rawData[i] || 0;
    highFreq = (highFreq / 10) / 255;
    
    if (!state.splats) state.splats = [];
    
    // Fade background slowly for trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    if (highFreq > 0.6 && Math.random() > 0.5) {
        // Spawn splat
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        const count = 5 + Math.random() * 10;
        
        for (let i = 0; i < count; i++) {
            state.splats.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                r: Math.random() * 20 * (gain || 1.0) * highFreq,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 1.0,
                c: Math.random() > 0.5 ? (color || '#00ffcc') : '#ffffff'
            });
        }
    }
    
    for (let i = state.splats.length - 1; i >= 0; i--) {
        const s = state.splats[i];
        s.life -= deltaTime || 0.016;
        
        if (s.life <= 0) {
            state.splats.splice(i, 1);
            continue;
        }
        
        s.x += s.vx * (deltaTime || 0.016);
        s.y += s.vy * (deltaTime || 0.016);
        s.r *= 0.95; // shrink
        
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
    }
}
