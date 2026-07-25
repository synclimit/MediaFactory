/**
 * FXStack.js
 * Manages the ordered pipeline of active effects.
 * Acts as the compositor that runs every frame after the Visualizer.
 */
import { fxRegistry } from '../registry/FXRegistry';

export class FXStack {
    constructor(renderer) {
        this.renderer = renderer; // Canvas2DRenderer or WebGLRenderer
        this.stack = []; // Array of active effect instances
    }

    /**
     * Adds an effect to the stack
     * @param {string} pluginId The ID of the effect in FXRegistry
     * @returns {Object} The created instance
     */
    addEffect(pluginId) {
        try {
            const instance = fxRegistry.createInstance(pluginId);
            
            // Pass the renderer context to the initialize function
            if (instance._plugin.initialize) {
                instance._plugin.initialize({
                    state: instance.state,
                    config: instance.config,
                    renderer: this.renderer
                });
            }
            
            this.stack.push(instance);
            return instance;
        } catch (e) {
            console.error(`Failed to add effect ${pluginId}:`, e);
            return null;
        }
    }

    /**
     * Removes an effect from the stack by its instance ID
     * @param {string} instanceId 
     */
    removeEffect(instanceId) {
        this.stack = this.stack.filter(fx => fx.id !== instanceId);
    }

    /**
     * Reorders an effect within the stack
     * @param {number} fromIndex Current position
     * @param {number} toIndex New position
     */
    reorderEffect(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.stack.length || toIndex < 0 || toIndex >= this.stack.length) {
            return;
        }
        const item = this.stack.splice(fromIndex, 1)[0];
        this.stack.splice(toIndex, 0, item);
    }

    /**
     * Gets all active effects in the stack
     * @returns {Array} Array of effect instances
     */
    getStack() {
        return this.stack;
    }

    /**
     * Clears all effects
     */
    clear() {
        this.stack = [];
    }

    /**
     * Executes the entire FX stack for the current frame
     * Should be called after the visualizer renders.
     * @param {Object} context The current render context (audio, viewport, time)
     */
    render(context) {
        if (!this.stack.length) return;
        
        // Ensure context has renderer reference
        if (!context.renderer) {
            context.renderer = this.renderer;
        }

        // Run through the stack in order
        for (let i = 0; i < this.stack.length; i++) {
            const fx = this.stack[i];
            
            if (!fx.enabled) continue;
            
            // Combine system context with effect-specific state/config
            const fxContext = {
                ...context,
                state: fx.state,
                config: fx.config
            };

            try {
                // Update internal state
                if (fx._plugin.update) {
                    fx._plugin.update(fxContext);
                }
                
                // Render effect
                if (fx._plugin.render) {
                    // For Canvas2D, this might draw overlays or use globalCompositeOperation
                    // For WebGL, this would bind shaders and process textures
                    fx._plugin.render(fxContext);
                }
            } catch (e) {
                console.error(`Error rendering effect ${fx.metadata.name}:`, e);
                // Optionally disable the effect if it crashes to prevent looping errors
                // fx.enabled = false; 
            }
        }
    }
}
