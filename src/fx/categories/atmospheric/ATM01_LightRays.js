/**
 * ATM01_LightRays.js
 * Light Rays
 */
export const metadata = {
    id: 'atm-rays',
    name: 'LightRays',
    displayName: 'Light Rays',
    description: 'God rays shining down.',
    category: 'atmospheric',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
