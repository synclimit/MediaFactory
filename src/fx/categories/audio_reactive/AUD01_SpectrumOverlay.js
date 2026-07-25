/**
 * AUD01_SpectrumOverlay.js
 * Spectrum Overlay
 */
export const metadata = {
    id: 'audio-spectrum',
    name: 'SpectrumOverlay',
    displayName: 'Spectrum Overlay',
    description: 'Overlays raw spectrum data.',
    category: 'audio_reactive',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 50.0 };

export function initialize(context) { }
export function update(context) {}
export function render(context) {
    const { ctx } = context;
    if(!ctx) return;
}
