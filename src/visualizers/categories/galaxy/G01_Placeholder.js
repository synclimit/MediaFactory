/**
 * G01_Placeholder.js
 * Placeholder for Galaxy Category
 */

export const metadata = {
    id: 'galaxy-placeholder',
    name: 'Galaxy Placeholder',
    displayName: 'Galaxy Placeholder',
    description: 'Stub for Galaxy visualizers',
    category: 'Galaxy',
    subcategory: 'Standard',
    difficulty: 'Easy',
    performance: 'Low',
    thumbnail: null,
    previewVideo: null,
    tags: ['placeholder'],
    version: '1.0.0',
    author: 'MediaFactory',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
    package: 'core',
    license: 'MIT',
    visibility: 'public',
    capabilities: []
};

export const manifest = {
    requiredRenderer: 'Canvas2DRenderer',
    requiredCapabilities: ['canvas2d'],
    supportedEffects: [],
    minEngineVersion: '1.0.0'
};

export const defaultConfig = {
    color: '#333333'
};

export const schema = {
    color: { type: 'color', default: '#333333', label: 'Color' }
};

export function initialize(context) {
}

export function update(context) {
}

export function render(context) {
    const { renderer, viewport } = context;
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    
    ctx.fillStyle = '#ffaa00';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Galaxy Plugin in Development", viewport.width/2, viewport.height/2);
}
