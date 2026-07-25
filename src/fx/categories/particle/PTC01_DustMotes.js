/**
 * PTC01_DustMotes.js
 * Dust Motes
 */
export const metadata = {
    id: 'particle-dust',
    name: 'DustMotes',
    displayName: 'Dust Motes',
    description: 'Floating dust particles reacting to low-frequency waves.',
    category: 'Particle FX',
    version: '1.0.0'
};

export const defaultConfig = { density: 50, speed: 1.0 };

export function initialize(context) {}
export function update(context) {}
export function render(context) {
    const { audio, state, config, viewport, deltaTime } = context;
    const { density, speed } = config;
    const ctx = context.renderer.getContext();
    if (!ctx) return;
    
    if (!state.particles) {
        state.particles = [];
        for(let i=0; i<(density||50); i++) {
            state.particles.push({
                x: Math.random() * viewport.width,
                y: Math.random() * viewport.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                r: Math.random() * 2 + 0.5
            });
        }
    }
    
    const rawData = audio.getSpectrum() || new Uint8Array(64);
    const energy = (rawData[2] || 0) / 255;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let p of state.particles) {
        p.x += p.vx * (speed||1) * (1 + energy*5) * (deltaTime || 0.016);
        p.y += p.vy * (speed||1) * (1 + energy*5) * (deltaTime || 0.016);
        
        if (p.x < 0) p.x = viewport.width;
        if (p.x > viewport.width) p.x = 0;
        if (p.y < 0) p.y = viewport.height;
        if (p.y > viewport.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
    }
}
