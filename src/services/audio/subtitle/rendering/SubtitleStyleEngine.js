/**
 * SubtitleStyleEngine (V2 Architecture)
 * Responsibilities:
 * - Visual styling ONLY (Fonts, Colors, Outline, Glow)
 * - NO display logic, NO transitions, NO behavior.
 * 
 * Takes the RenderInstruction from the Display Strategy and enriches it with style properties.
 */
export const SubtitleStyleEngine = {
    compute: (runtimeState) => {
        if (!runtimeState.renderInstruction) return;

        const instruction = runtimeState.renderInstruction;
        const styleConfig = runtimeState.config || {};

        // 1. Process visual style for the entire block
        instruction.style = {
            fontFamily: styleConfig.fontFamily || 'Inter, sans-serif',
            fontSize: (styleConfig.fontSize || 36) + 'px',
            fontWeight: styleConfig.fontWeight || 'bold',
            color: styleConfig.color || '#ffffff',
            textShadow: styleConfig.shadow || '0px 2px 4px rgba(0,0,0,0.8)',
            textAlign: 'center', // Can be overridden by layout
            lineHeight: styleConfig.lineHeight || 1.5,
            letterSpacing: styleConfig.letterSpacing || 'normal',
            padding: styleConfig.padding || 0,
            WebkitTextStroke: styleConfig.strokeEnabled ? `${styleConfig.strokeWidth || 1}px ${styleConfig.strokeColor || '#000000'}` : 'none',
            glow: styleConfig.glowEnabled ? `0 0 ${styleConfig.glowBlur || 18}px ${styleConfig.glowColor || '#a855f7'}` : 'none'
        };

        // 2. Map word highlights to actual styles
        // The strategy decided WHICH words are highlighted. The style engine decides WHAT that looks like.
        if (instruction.displayLines) {
            for (const line of instruction.displayLines) {
                for (const word of line.words) {
                    if (word.highlighted) {
                        word.style = {
                            color: styleConfig.glowColor || '#a855f7',
                            transform: 'scale(1.1)',
                            transition: 'all 0.1s ease-out'
                        };
                    } else {
                        word.style = {
                            color: 'inherit',
                            transform: 'scale(1)',
                            transition: 'none'
                        };
                    }
                }
            }
        }
    }
};
