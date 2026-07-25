/**
 * W04_BezierSpline.js
 * Bezier Spline Wave
 */
import { MathUtils } from '../../utils/MathUtils';

export const metadata = {
    id: 'waves-bezier-spline',
    name: 'BezierSpline',
    displayName: 'Bezier Spline Wave',
    description: 'Extremely smooth curving bezier wave',
    category: 'Waves',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ["wave","bezier","spline"],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
    package: 'core',
    license: 'MIT',
    visibility: 'public'
};

export const manifest = {
    requiredRenderer: 'Canvas2DRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: ['glow', 'reflection', 'gradient'],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#00ffcc',
    thickness: 2,
    gain: 1.0,
    smoothing: 0.5
};

export const schema = {
    color: { type: 'color', default: '#00ffcc', label: 'Color' },
    thickness: { type: 'range', min: 1, max: 20, default: 2, label: 'Thickness' },
    gain: { type: 'range', min: 0.1, max: 5.0, default: 1.0, step: 0.1, label: 'Height Multiplier' },
    smoothing: { type: 'range', min: 0, max: 0.99, default: 0.5, step: 0.01, label: 'Smoothing' }
};

export function initialize(context) {
    const { config, state } = context;
    state.smoothedData = null; // initialized in render when length is known
}

export function update(context) {
}

export function render(context) {
    const { audio, state, config, viewport } = context;
    const { color, thickness, gain, smoothing } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    const rawData = audio.getWaveform() || new Uint8Array(256);
    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
        state.smoothedData = new Float32Array(rawData.length);
    }
    MathUtils.smoothArray(rawData, state.smoothedData, smoothing || 0.8); // High smoothing
    
    ctx.strokeStyle = color || '#00ffcc';
    ctx.lineWidth = thickness || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const cy = viewport.height / 2;
    // Sample fewer points for a smoother bezier
    const sampleRate = 4; 
    const step = (viewport.width * sampleRate) / (rawData.length - 1);
    
    const points = [];
    for (let i = 0; i < rawData.length; i += sampleRate) {
        const val = state.smoothedData[i] || 128;
        const offset = ((val - 128) / 128) * (viewport.height / 2) * (gain || 1.0);
        points.push({ x: (i/sampleRate) * step, y: cy + offset });
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
        const xMid = (points[i].x + points[i + 1].x) / 2;
        const yMid = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xMid, yMid);
    }
    if (points.length > 0) {
        ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
    }
    
    ctx.stroke();
}
