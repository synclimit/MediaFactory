import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class SlideUpStrategy extends DisplayStrategy {
    static render(context) {
        if (!context.subtitle || !context.subtitle.lines || context.subtitle.lines.length === 0) {
            return {
                displayLines: [],
                highlightedWords: [],
                offsetX: 0,
                offsetY: 0,
                opacity: 0,
                visibleCharacters: -1
            };
        }

        const currentTime = context.currentTime;
        const lines = context.subtitle.lines;

        // Determine the active line index based on word timings
        let activeLineIndex = 0;
        let lineProgress = 0.5; // Default center

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.words && line.words.length > 0) {
                const lineStart = line.words[0].start;
                const lineEnd = line.words[line.words.length - 1].end;

                if (currentTime >= lineStart && currentTime <= lineEnd) {
                    activeLineIndex = i;
                    
                    // Optional: calculate micro-progress for smooth scrolling if desired
                    // But spec says "When a new subtitle appears: Existing subtitles move upward"
                    // If we want smooth scrolling during the line, we use lineProgress.
                    // If we want discrete steps, we just use 0.
                    lineProgress = Math.max(0, Math.min(1, (currentTime - lineStart) / (lineEnd - lineStart)));
                    break;
                } else if (currentTime > lineEnd) {
                    // Keep moving active index forward if we're past this line
                    activeLineIndex = i;
                    lineProgress = 1.0; 
                }
            }
        }

        // Apply transition window logic (e.g., jump to next line slightly before it starts)
        // For simplicity, we just use the calculated activeLineIndex.

        const visibleLinesConfig = context.settings?.visibleLines || 3;
        const lineHeight = context.style?.fontSize ? context.style.fontSize * 1.5 : 54; 
        
        // Calculate the scroll offset to keep active line centered
        // If lineProgress is used, it smoothly scrolls. 
        // We will do discrete steps to match "When next arrives, move upward".
        const scrollY = -(activeLineIndex * lineHeight);

        const displayLines = lines.map((line, i) => {
            const isCurrent = i === activeLineIndex;
            // Distance from active line
            const distance = Math.abs(i - activeLineIndex);
            
            // Only show lines within the visible window
            const isVisible = distance <= Math.ceil(visibleLinesConfig / 2);
            
            let opacity = 0.0;
            if (isVisible) {
                // Focus line is full opacity, others are faded
                opacity = isCurrent ? 1.0 : Math.max(0.2, 1.0 - (distance * 0.4));
            }

            return {
                text: line.text,
                words: line.words.map(w => ({ ...w, highlighted: isCurrent })),
                lineIndex: line.lineIndex,
                opacity: opacity,
                scale: isCurrent ? 1.1 : 1.0, // Focus effect
                offsetY: (i * lineHeight) + scrollY
            };
        });

        return {
            displayLines,
            highlightedWords: [],
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0, 
            visibleCharacters: -1
        };
    }
}

DisplayStrategyRegistry.register('Slide Up', SlideUpStrategy);
