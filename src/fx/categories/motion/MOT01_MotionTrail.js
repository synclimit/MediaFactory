/**
 * MOT01_MotionTrail.js
 * Motion Trail
 */
export const metadata = {
    id: 'motion-trail',
    name: 'MotionTrail',
    displayName: 'Motion Trail',
    description: 'Echoing motion trails.',
    category: 'motion',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
