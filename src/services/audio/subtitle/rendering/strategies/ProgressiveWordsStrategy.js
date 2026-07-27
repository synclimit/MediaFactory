import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class ProgressiveWordsStrategy extends DisplayStrategy {
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

        const displayLines = context.subtitle.lines.map(line => {
            const mappedWords = line.words.map(w => {
                // Progressive Words Rule: Hidden -> Visible. Never disappear.
                const isVisible = currentTime >= w.start;
                
                return {
                    ...w,
                    opacity: isVisible ? 1.0 : 0.0,
                    highlighted: false // Progressive words doesn't highlight, just reveals
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
            highlightedWords: [],
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0, 
            visibleCharacters: -1
        };
    }
}

DisplayStrategyRegistry.register('Progressive Words', ProgressiveWordsStrategy);
