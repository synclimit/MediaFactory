/**
 * TXT01_LyricBounce.js
 * Lyric Bounce
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'text-bounce',
    name: 'LyricBounce',
    displayName: 'Lyric Bounce',
    description: 'A sample text that scales with the music',
    category: 'Text',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["text","typography","bounce"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#ffffff', barCount: 64, gain: 1.0, smoothing: 0.8 };

export function initialize(context) { context.state.smoothedData = null; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport } = context;
    const { color, barCount, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getSpectrum() || new Uint8Array(barCount);
    let bass = 0;
    for(let i=0; i<4; i++) bass += rawData[i] || 0;
    bass = (bass / 4) / 255;
    
    const scale = 1 + (bass * 0.5 * (gain || 1.0));
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    ctx.fillStyle = color || '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AUDIO', 0, 0);
    
    ctx.restore();
}
