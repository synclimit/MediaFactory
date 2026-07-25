/**
 * RendererRegistry.js
 * Manages rendering engines (Canvas2D, WebGL, etc.)
 */

class RendererRegistry {
    constructor() {
        this.renderers = new Map();
    }

    register(id, rendererClass) {
        if (!id) throw new Error('Renderer must have an id');
        this.renderers.set(id, rendererClass);
    }

    get(id) {
        return this.renderers.get(id);
    }

    getAll() {
        return Array.from(this.renderers.entries()).map(([id, rendererClass]) => ({
            id,
            rendererClass
        }));
    }

    has(id) {
        return this.renderers.has(id);
    }

    remove(id) {
        return this.renderers.delete(id);
    }
}

// Export as singleton
export const rendererRegistry = new RendererRegistry();
