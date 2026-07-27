import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class TypewriterStrategy extends DisplayStrategy {
    static render(context) {
        if (!context.subtitle || !context.subtitle.lines) {
            return {
                displayLines: [],
                highlightedWords: [],
                offsetX: 0,
                offsetY: 0,
                opacity: 0,
                visibleCharacters: 0
            };
        }

        const currentTime = context.currentTime;
        let totalVisibleCharacters = 0;
        let runningCharacterCount = 0;

        const displayLines = context.subtitle.lines.map(line => {
            const mappedWords = line.words.map(w => {
                const wordLength = w.text.length;
                let wordVisibleChars = 0;

                if (currentTime >= w.end) {
                    wordVisibleChars = wordLength;
                } else if (currentTime > w.start && currentTime < w.end) {
                    // Interpolate characters based on time
                    const progress = (currentTime - w.start) / (w.end - w.start);
                    wordVisibleChars = Math.floor(progress * wordLength);
                } else {
                    wordVisibleChars = 0;
                }
                
                totalVisibleCharacters += wordVisibleChars;
                // Add +1 for the space between words (if they were visible)
                if (wordVisibleChars > 0) {
                     // simplistic approximation for spaces
                     totalVisibleCharacters += 1; 
                }

                return {
                    ...w,
                    opacity: 1.0, 
                    highlighted: false
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
            // The renderer will use this to slice the total string
            visibleCharacters: totalVisibleCharacters
        };
    }
}

DisplayStrategyRegistry.register('Typewriter', TypewriterStrategy);
