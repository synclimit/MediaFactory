/**
 * ADV01_ChromaKey.js
 * Chroma Key
 */
export const metadata = {
    id: 'adv-chroma',
    name: 'ChromaKey',
    displayName: 'Chroma Key',
    description: 'Green screen removal.',
    category: 'advanced',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
