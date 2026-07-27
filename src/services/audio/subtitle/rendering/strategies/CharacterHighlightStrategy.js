import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class CharacterHighlightStrategy extends DisplayStrategy {
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
                // Character Highlight: Fallback implementation (similar to Word Highlight if char timing is unavailable)
                // In a real implementation, w.characters would be iterated.
                const isHighlighted = currentTime >= w.start && currentTime <= w.end;
                
                return {
                    ...w,
                    opacity: 1.0, 
                    highlighted: isHighlighted,
                    // Signal to renderer to break this into spans per character
                    charLevelHighlight: true 
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

DisplayStrategyRegistry.register('Character Highlight', CharacterHighlightStrategy);
