import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class WordHighlightStrategy extends DisplayStrategy {
    static render(context) {
        if (!context.subtitle || !context.subtitle.lines) {
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
        const highlightedWords = [];

        const displayLines = context.subtitle.lines.map(line => {
            const mappedWords = line.words.map(w => {
                // Word Highlight Rule: Active word changes appearance. Positions never change.
                // We consider a word active if the current time is within its bounds.
                // (Adding a tiny buffer to avoid flickering if needed, but strict bounds are safer)
                const isHighlighted = currentTime >= w.start && currentTime <= w.end;
                
                if (isHighlighted) {
                    highlightedWords.push(w.index);
                }

                return {
                    ...w,
                    opacity: 1.0, // Always visible
                    highlighted: isHighlighted
                };
            });

            return {
                text: line.text,
                words: mappedWords,
                lineIndex: line.lineIndex,
                opacity: 1.0,
                scale: 1.0,
                offsetY: 0
            };
        });

        return {
            displayLines,
            highlightedWords,
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0, 
            visibleCharacters: -1
        };
    }
}

DisplayStrategyRegistry.register('Word Highlight', WordHighlightStrategy);
