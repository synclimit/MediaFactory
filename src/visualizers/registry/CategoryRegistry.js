/**
 * CategoryRegistry.js
 * Manages all visualizer categories as defined in the official blueprint.
 */

class CategoryRegistry {
    constructor() {
        this.categories = new Map();
        this.initializeDefaults();
    }

    initializeDefaults() {
        const defaultCategories = [
            { id: 'Bars', icon: '▮', description: 'Vertical/horizontal frequency bars in all arrangements' },
            { id: 'Waves', icon: '〰', description: 'Oscilloscope lines, sine waves, bezier curves' },
            { id: 'Circle', icon: '◉', description: 'Circular/radial bar arrangements' },
            { id: 'Ring', icon: '◎', description: 'Concentric rings, orbits, halos' },
            { id: 'Spiral', icon: '꩜', description: 'Archimedean, logarithmic, fibonacci spirals' },
            { id: 'Mandala', icon: '✦', description: 'Symmetric geometric kaleidoscope patterns' },
            { id: 'Particle', icon: '✧', description: 'Point clouds, explosions, streams, fireflies' },
            { id: 'Galaxy', icon: '✶', description: 'Star systems, nebulae, cosmic simulations' },
            { id: 'Tunnel', icon: '⊙', description: 'Depth corridors, wormholes, vortex effects' },
            { id: 'Ribbon', icon: '≋', description: 'Flowing strips, aurora borealis, silk' },
            { id: 'DNA', icon: '⧬', description: 'Double helix, biological structures' },
            { id: 'Geometry', icon: '△', description: 'Polygons, fractals, sacred geometry, tessellations' },
            { id: 'Neon', icon: '✺', description: 'Glowing outlines, synthwave, retrowave' },
            { id: 'Speaker', icon: '◉', description: 'Physical speaker cones, woofers, membranes' },
            { id: 'Matrix', icon: '▦', description: 'Grids, digital rain, data streams' },
            { id: 'Terrain', icon: '⛰', description: 'Landscapes, mountains, cityscapes, horizons' },
            { id: 'Abstract', icon: '◈', description: 'Generative art, noise fields, organic forms' },
            { id: 'Minimal', icon: '○', description: 'Clean, elegant, single-element designs' },
            { id: 'Cinematic', icon: '▣', description: 'Movie-quality, epic, dramatic compositions' },
            { id: '3D', icon: '⬡', description: 'WebGL/Three.js volumetric renders' },
            { id: 'Fluid', icon: '≈', description: 'Liquid, smoke, fire, plasma simulations' },
            { id: 'Text', icon: 'A', description: 'Reactive typography, lyric animations' },
            { id: 'Retro', icon: '▧', description: 'VHS, CRT scanlines, pixel art, 8-bit' },
            { id: 'Nature', icon: '❀', description: 'Trees, flowers, water, rain, lightning' },
            { id: 'Experimental', icon: '✱', description: 'Avant-garde, glitch, unconventional' }
        ];

        defaultCategories.forEach(cat => this.register(cat));
    }

    register(category) {
        if (!category.id) throw new Error('Category must have an id');
        this.categories.set(category.id, {
            ...category,
            registeredAt: Date.now()
        });
    }

    get(id) {
        return this.categories.get(id);
    }

    getAll() {
        return Array.from(this.categories.values());
    }

    remove(id) {
        return this.categories.delete(id);
    }
}

// Export as singleton
export const categoryRegistry = new CategoryRegistry();
