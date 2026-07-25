/**
 * ENV01_Fog.js
 * Fog
 */
export const metadata = {
    id: 'env-fog',
    name: 'Fog',
    displayName: 'Fog',
    description: 'Adds ambient fog.',
    category: 'environmental',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
