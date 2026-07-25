/**
 * GEO02_PlatonicSolids.js
 * Platonic Solids
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'geometry-platonic',
    name: 'PlatonicSolids',
    displayName: 'Platonic Solids',
    description: 'Rotating 3D wireframe cubes and pyramids',
    category: 'Geometry',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Medium',
    tags: ["geometry","3d","cube"],
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
    const time = elapsedTime || 0;
    
    const val = state.smoothedData[2] || 0; // bass
    const scale = 1 + (val / 255) * (gain || 1.0);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = 2;
    
    // 3D Projection Helper
    const project = (x, y, z) => {
        // Rotation
        const rotX = time;
        const rotY = time * 0.7;
        
        // Rotate Y
        const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        
        // Rotate X
        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
        
        // Perspective
        const fov = 400;
        const dist = 500;
        const pScale = fov / (dist + z2);
        
        return { px: x1 * pScale, py: y2 * pScale };
    };
    
    const size = 100;
    const verts = [
        [-size, -size, -size], [size, -size, -size], [size, size, -size], [-size, size, -size],
        [-size, -size, size], [size, -size, size], [size, size, size], [-size, size, size]
    ];
    
    const edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
    ];
    
    ctx.beginPath();
    edges.forEach(edge => {
        const p1 = project(...verts[edge[0]]);
        const p2 = project(...verts[edge[1]]);
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
    });
    ctx.stroke();
    
    ctx.restore();
}
