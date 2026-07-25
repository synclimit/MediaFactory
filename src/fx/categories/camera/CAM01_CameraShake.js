/**
 * CAM01_CameraShake.js
 * Camera Shake
 */
export const metadata = {
    id: 'camera-shake',
    name: 'CameraShake',
    displayName: 'Camera Shake',
    description: 'Simulates handheld camera vibration. Randomized X/Y displacement.',
    category: 'Camera FX',
    version: '1.0.0'
};

export const defaultConfig = { intensity: 20.0, frequency: 8.0, zoomDepth: 0.5 };

export function initialize(context) { context.state.shakeTime = 0; }
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { intensity, frequency, triggerSource } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    // Simplistic trigger based on bass or kick
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[2] || 0) / 255; // Bass approximate
    
    if (energy > 0.6) {
        state.shakeTime = 0.5; // active for 0.5s
    }
    
    if (state.shakeTime > 0) {
        state.shakeTime -= deltaTime || 0.016;
        const currentIntensity = (intensity || 20) * (state.shakeTime / 0.5);
        
        // Use translate on canvas
        const dx = (Math.random() - 0.5) * currentIntensity;
        const dy = (Math.random() - 0.5) * currentIntensity;
        
        // Note: In a real compositor, this would shift the entire frame buffer.
        // For Canvas2D FX overlay, we might just shift the context before drawing the next FX.
        ctx.translate(dx, dy);
    }
}
