import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class KaraokeFillStrategy extends DisplayStrategy {
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
        let activeKaraokeWord = null;

        const displayLines = context.subtitle.lines.map(line => {
            const mappedWords = line.words.map(w => {
                const isHighlighted = currentTime >= w.start && currentTime <= w.end;
                
                let fillProgress = 0;
                if (isHighlighted) {
                    highlightedWords.push(w.index);
                    fillProgress = (currentTime - w.start) / (w.end - w.start);
                    activeKaraokeWord = { index: w.index, progress: fillProgress };
                } else if (currentTime > w.end) {
                    fillProgress = 1.0;
                }

                return {
                    ...w,
                    opacity: 1.0, 
                    highlighted: isHighlighted,
                    fillProgress // Renderer uses this for clipping/gradient mask
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
            karaokeActiveWord: activeKaraokeWord,
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0, 
            visibleCharacters: -1
        };
    }
}

DisplayStrategyRegistry.register('Karaoke Fill', KaraokeFillStrategy);
