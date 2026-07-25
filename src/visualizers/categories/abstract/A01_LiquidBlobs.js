/**
 * A01_LiquidBlobs.js
 * Liquid Blobs
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'abstract-blobs',
    name: 'LiquidBlobs',
    displayName: 'Liquid Blobs',
    description: 'Metaball-like abstract liquid shapes that merge and split with bass',
    category: 'Abstract',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    tags: ["abstract","liquid","blob"],
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
    
    // Average energies
    let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
    const third = Math.floor(barCount / 3);
    for(let i=0; i<third; i++) lowEnergy += state.smoothedData[i];
    for(let i=third; i<third*2; i++) midEnergy += state.smoothedData[i];
    for(let i=third*2; i<barCount; i++) highEnergy += state.smoothedData[i];
    
    lowEnergy = (lowEnergy / third) / 255;
    midEnergy = (midEnergy / third) / 255;
    highEnergy = (highEnergy / (barCount - third*2)) / 255;
    
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const time = elapsedTime || 0;
    
    ctx.fillStyle = color || '#00ffcc';
    
    // We use a fake metaball approach with overlapping circles and high contrast
    // Using global composite operations to merge them smoothly is tricky in standard Canvas 2D without filters,
    // so we will draw organic wavy blobs
    
    const drawBlob = (x, y, baseR, energyLevel, phaseOffset, points) => {
        const r = baseR * (1 + energyLevel * (gain || 1.0));
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            
            // Add noise/waves to the radius
            const wave1 = Math.sin(angle * 3 + time * 2 + phaseOffset) * (r * 0.2);
            const wave2 = Math.cos(angle * 5 - time * 1.5) * (r * 0.1);
            
            const currentR = r + wave1 + wave2;
            
            const px = x + Math.cos(angle) * currentR;
            const py = y + Math.sin(angle) * currentR;
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.fill();
    };
    
    // Main center blob (Bass)
    drawBlob(cx, cy, 100, lowEnergy, 0, 60);
    
    // Orbiting blobs (Mids and Highs)
    const orbit1X = cx + Math.cos(time) * 150;
    const orbit1Y = cy + Math.sin(time) * 150;
    ctx.fillStyle = '#ff00aa';
    drawBlob(orbit1X, orbit1Y, 50, midEnergy, 1, 40);
    
    const orbit2X = cx + Math.cos(-time * 1.5) * 120;
    const orbit2Y = cy + Math.sin(-time * 1.5) * 120;
    ctx.fillStyle = '#ffcc00';
    drawBlob(orbit2X, orbit2Y, 30, highEnergy, 2, 30);
}
