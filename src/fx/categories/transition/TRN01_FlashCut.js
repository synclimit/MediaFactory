/**
 * TRN01_FlashCut.js
 * Flash Cut
 */
export const metadata = {
    id: 'transition-flash',
    name: 'FlashCut',
    displayName: 'Flash Cut',
    description: 'White flash transition.',
    category: 'transition',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    // Placeholder logic
    const { ctx } = context;
    if(!ctx) return;
}
