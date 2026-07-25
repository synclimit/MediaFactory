/**
 * MX01_DigitalRain.js
 * Digital Rain
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'matrix-rain',
    name: 'DigitalRain',
    displayName: 'Digital Rain',
    description: 'Falling green code like The Matrix, speed and density react to audio',
    category: 'Matrix',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["matrix","rain","code"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00ff00', barCount: 64, gain: 1.0, smoothing: 0.8 };

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
    
    const fontSize = 14;
    const columns = Math.floor(viewport.width / fontSize);
    
    if (!state.drops || state.drops.length !== columns) {
        state.drops = [];
        for(let i=0; i<columns; i++) {
            state.drops[i] = {
                y: Math.random() * viewport.height,
                speed: 50 + Math.random() * 100
            };
        }
    }
    
    // Draw fade layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    ctx.fillStyle = color || '#00ff00';
    ctx.font = fontSize + 'px monospace';
    
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*';
    
    const globalSpeedBoost = energy * 500 * (gain || 1.0);
    
    for (let i = 0; i < state.drops.length; i++) {
        const drop = state.drops[i];
        
        // Random character
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        // Audio reactive brightness for the head
        const dataIdx = i % barCount;
        const val = rawData[dataIdx] || 0;
        
        if (val > 150) {
            ctx.fillStyle = '#ffffff'; // white head on loud beats
        } else {
            ctx.fillStyle = color || '#00ff00';
        }
        
        ctx.fillText(text, i * fontSize, drop.y);
        
        drop.y += (drop.speed + globalSpeedBoost) * (deltaTime || 0.016);
        
        if (drop.y > viewport.height && Math.random() > 0.95) {
            drop.y = 0;
            drop.speed = 50 + Math.random() * 100;
        }
    }
}
