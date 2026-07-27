import { DisplayStrategy, DisplayStrategyRegistry } from './DisplayStrategyRegistry';

export class ParagraphStrategy extends DisplayStrategy {
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

        // Paragraph mode displays the entire block at once, ensuring stable multi-line text
        const displayLines = context.subtitle.lines.map(line => ({
            text: line.text,
            words: line.words.map(w => ({ ...w, highlighted: false })), 
            lineIndex: line.lineIndex,
            opacity: 1.0,
            scale: 1.0,
            offsetY: 0
        }));

        return {
            displayLines,
            highlightedWords: [],
            offsetX: 0,
            offsetY: 0,
            opacity: 1.0,
            visibleCharacters: -1 // Show all
        };
    }
}

DisplayStrategyRegistry.register('Paragraph', ParagraphStrategy);
