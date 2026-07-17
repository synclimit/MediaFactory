import { subtitleAnimationRegistry } from './SubtitleAnimationRegistry';
import FadeInAnimation from './FadeInAnimation';

class SubtitleAnimationEngine {
    constructor() {
        this.state = Object.freeze({
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1
        });

        // Register default animations
        subtitleAnimationRegistry.register(new FadeInAnimation());

        // Load default preset
        subtitleAnimationRegistry.loadPreset('smooth_fade');
    }

    update(playbackState, dt) {
        if (!playbackState) return;

        // Forward to registry
        subtitleAnimationRegistry.executeAll(playbackState, dt);

        this._mergeStates();
    }

    _mergeStates() {
        // Reset to base defaults
        let newX = 0;
        let newY = 0;
        let newScale = 1.0;
        let newRotation = 0;
        let newOpacity = 1.0;

        const animations = subtitleAnimationRegistry.getAll();
        for (const anim of animations) {
            if (!anim.enabled) continue;
            
            const aState = anim.getState();
            if (aState.x !== undefined) newX += aState.x;
            if (aState.y !== undefined) newY += aState.y;
            if (aState.scale !== undefined) newScale *= aState.scale;
            if (aState.rotation !== undefined) newRotation += aState.rotation;
            if (aState.opacity !== undefined) newOpacity *= aState.opacity;
        }

        // Return a single immutable AnimationState
        this.state = Object.freeze({
            x: newX,
            y: newY,
            scale: newScale,
            rotation: newRotation,
            opacity: newOpacity
        });
    }

    reset() {
        subtitleAnimationRegistry.resetAll();
        this._mergeStates();
    }

    getState() {
        return this.state;
    }
}

export const subtitleAnimationEngine = new SubtitleAnimationEngine();
export default SubtitleAnimationEngine;
