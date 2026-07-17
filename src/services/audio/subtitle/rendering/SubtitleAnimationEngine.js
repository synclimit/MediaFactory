/**
 * SubtitleAnimationEngine
 * Computes timestamp-based animation values (opacity, offset) for transitions.
 * Mutates the SubtitleRuntime state directly to avoid allocations.
 */
export class SubtitleAnimationEngine {
    static _registry = {
        'Classic': (state, phase, progress, tOffset) => {
            state.opacity = 1.0;
            state.offsetX = 0;
            state.offsetY = 0;
        },
        'Fade': (state, phase, progress, tOffset) => {
            state.opacity = progress;
            state.offsetX = 0;
            state.offsetY = 0;
        },
        'Slide': (state, phase, progress, tOffset) => {
            state.opacity = 1.0;
            state.offsetX = 0;
            state.offsetY = phase === 'enter' ? tOffset * 20 : (phase === 'exit' ? -tOffset * 20 : 0);
        },
        'Slide + Fade': (state, phase, progress, tOffset) => {
            state.opacity = progress;
            state.offsetX = 0;
            state.offsetY = phase === 'enter' ? tOffset * 20 : (phase === 'exit' ? -tOffset * 20 : 0);
        }
    };

    /**
     * Registers a new animation style.
     */
    static register(styleName, animationFn) {
        SubtitleAnimationEngine._registry[styleName] = animationFn;
    }

    /**
     * @param {Object} state The SubtitleRuntime state object
     * @param {number} timestamp The current audio playback time in seconds
     */
    static compute(state, timestamp) {
        if (!state.activeSegment) {
            state.opacity = 0;
            state.offsetX = 0;
            state.offsetY = 0;
            state.animationState.phase = 'idle';
            state.animationState.progress = 0;
            return;
        }

        const seg = state.activeSegment;
        const style = state.style || 'Classic';
        
        const transitionDuration = 0.2; // 200ms transition
        let phase = 'active';
        let progress = 1.0;
        let tOffset = 0;

        // Determine phase and progress based strictly on timestamps
        if (timestamp < seg.start + transitionDuration) {
            phase = 'enter';
            // Clamp progress between 0 and 1
            progress = Math.max(0, Math.min(1, (timestamp - seg.start) / transitionDuration));
            tOffset = 1.0 - progress; // 1.0 -> 0.0
        } else if (timestamp > seg.end - transitionDuration) {
            phase = 'exit';
            progress = Math.max(0, Math.min(1, (seg.end - timestamp) / transitionDuration));
            tOffset = 1.0 - progress; // 0.0 -> 1.0 (inverted mapping for exit)
        }

        state.animationState.phase = phase;
        state.animationState.progress = progress;

        const animator = SubtitleAnimationEngine._registry[style] || SubtitleAnimationEngine._registry['Classic'];
        animator(state, phase, progress, tOffset);
    }
}
