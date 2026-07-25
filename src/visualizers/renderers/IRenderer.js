/**
 * IRenderer.js
 * Base interface for all rendering abstractions (Canvas2D, WebGL, etc.)
 */

export class IRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        if (this.constructor === IRenderer) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.canvas = canvas;
    }

    /**
     * Setup the rendering context
     */
    initialize() {
        throw new Error("Method 'initialize()' must be implemented.");
    }

    /**
     * Called at the beginning of each frame
     */
    beginFrame() {
        throw new Error("Method 'beginFrame()' must be implemented.");
    }

    /**
     * Called at the end of each frame
     */
    endFrame() {
        throw new Error("Method 'endFrame()' must be implemented.");
    }

    /**
     * Resize the rendering context
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        throw new Error("Method 'resize()' must be implemented.");
    }

    /**
     * Clean up resources
     */
    dispose() {
        throw new Error("Method 'dispose()' must be implemented.");
    }
}
