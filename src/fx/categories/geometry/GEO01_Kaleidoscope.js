/**
 * GEO01_Kaleidoscope.js
 * Kaleidoscope
 */
export const metadata = {
    id: 'geo-kaleido',
    name: 'Kaleidoscope',
    displayName: 'Kaleidoscope',
    description: 'Mirrors the screen.',
    category: 'geometry',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
