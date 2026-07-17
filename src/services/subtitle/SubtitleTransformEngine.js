import { subtitleReactiveAdapter } from './SubtitleReactiveAdapter';
import { subtitleEffectEngine } from './SubtitleEffectEngine';
import { subtitleAnimationEngine } from './animation/SubtitleAnimationEngine';

class SubtitleTransformEngine {
    static calculate(layoutData, config) {
        const defaultTransform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100, visible: true };
        const userTransform = config.transform || {};

        const baseScale = userTransform.scale !== undefined ? userTransform.scale : defaultTransform.scale;
        const effectState = subtitleEffectEngine.getState();
        const animState = subtitleAnimationEngine.getState();

        return {
            x: (userTransform.x || defaultTransform.x) + (animState.x || 0),
            y: (userTransform.y || defaultTransform.y) + (animState.y || 0),
            scale: baseScale * (effectState.scale || 1.0) * (animState.scale !== undefined ? animState.scale : 1.0),
            rotation: (userTransform.rotation || defaultTransform.rotation) + (animState.rotation || 0),
            opacity: (userTransform.opacity !== undefined ? userTransform.opacity : defaultTransform.opacity) * (animState.opacity !== undefined ? animState.opacity : 1.0),
            visible: userTransform.visible !== undefined ? userTransform.visible : defaultTransform.visible,
            reactiveState: subtitleReactiveAdapter.getState(),
            effectState: effectState,
            animationState: animState
        };
    }
}

export default SubtitleTransformEngine;
