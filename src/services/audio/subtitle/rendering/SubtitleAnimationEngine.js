/**
 * SubtitleAnimationEngine (V2 Architecture)
 * Responsibilities:
 * - Enter/Exit transitions ONLY (Fade, Zoom, Pop)
 * - NO display logic, NO subtitle text parsing.
 * 
 * Takes the RenderInstruction from the Display Strategy and enriches it with global transition offsets/opacities.
 */
export class SubtitleAnimationEngine {
    /**
     * @param {Object} runtimeState The shared state containing renderInstruction
     * @param {number} timestamp Current audio playback time in seconds
     */
    static compute(runtimeState, timestamp) {
        if (!runtimeState.renderInstruction || !runtimeState.activeSegment) return;

        const seg = runtimeState.activeSegment;
        const animationPreset = runtimeState.config?.animationPreset || 'Fade';
        
        const transitionDuration = 0.2; // 200ms transition
        let phase = 'active';
        let progress = 1.0;
        let tOffset = 0;

        if (timestamp < seg.start + transitionDuration) {
            phase = 'enter';
            progress = Math.max(0, Math.min(1, (timestamp - seg.start) / transitionDuration));
            tOffset = 1.0 - progress; 
        } else if (timestamp > seg.end - transitionDuration) {
            phase = 'exit';
            progress = Math.max(0, Math.min(1, (seg.end - timestamp) / transitionDuration));
            tOffset = 1.0 - progress; 
        }

        const instruction = runtimeState.renderInstruction;

        // Apply transition to RenderInstruction based on the selected animation preset
        switch (animationPreset) {
            case 'Fade':
                instruction.opacity = instruction.opacity * progress;
                break;
            case 'Slide':
                instruction.opacity = instruction.opacity * progress;
                instruction.offsetY = (instruction.offsetY || 0) + (phase === 'enter' ? tOffset * 20 : (phase === 'exit' ? -tOffset * 20 : 0));
                break;
            case 'Zoom':
                instruction.opacity = instruction.opacity * progress;
                instruction.scale = (instruction.scale || 1.0) * (phase === 'enter' ? 0.9 + (progress * 0.1) : 1.0);
                break;
            case 'None':
            default:
                // No extra transition, strategy output remains untouched
                break;
        }
    }
}
