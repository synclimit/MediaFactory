/**
 * CINE01_LensFlare.js
 * Cinematic Lens Flare
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'cinematic-flare',
    name: 'LensFlare',
    displayName: 'Cinematic Lens Flare',
    description: 'A gorgeous anamorphic lens flare that shines on high frequencies',
    category: 'Cinematic',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["cinematic","lensflare","light"],
    version: '1.0.0'
};

export const defaultConfig = { color: '#00aaff', barCount: 64, gain: 1.0, smoothing: 0.8 };

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
    
    // Flare responds mostly to high mids and highs
    let hSum = 0;
    for(let i=barCount-15; i<barCount; i++) hSum += state.smoothedData[i] || 0;
    const hEnergy = (hSum / 15) / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    
    const intensity = hEnergy * (gain || 1.0);
    
    if (intensity > 0.05) {
        ctx.globalCompositeOperation = 'screen';
        
        // Main horizontal streak (anamorphic)
        const streakW = viewport.width * intensity * 2;
        const streakH = 10;
        
        const grad1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, streakW/2);
        grad1.addColorStop(0, '#ffffff');
        grad1.addColorStop(0.1, color || '#00aaff');
        grad1.addColorStop(1, '#00000000');
        
        ctx.fillStyle = grad1;
        ctx.fillRect(cx - streakW/2, cy - streakH/2, streakW, streakH);
        
        // Core glow
        const coreR = 100 * intensity;
        const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        grad2.addColorStop(0, '#ffffff');
        grad2.addColorStop(0.2, color || '#00aaff');
        grad2.addColorStop(1, '#00000000');
        
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI*2);
        ctx.fill();
        
        // Lens artifacts (ghosts)
        const ghosts = [
            { d: 150, r: 20, a: 0.3 },
            { d: -200, r: 40, a: 0.1 },
            { d: 300, r: 80, a: 0.05 },
            { d: -400, r: 10, a: 0.4 }
        ];
        
        ghosts.forEach(g => {
            const gx = cx + g.d;
            ctx.fillStyle = (color || '#00aaff') + Math.floor(g.a * intensity * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(gx, cy, g.r, 0, Math.PI*2);
            ctx.fill();
        });
        
        ctx.globalCompositeOperation = 'source-over';
    }
}
