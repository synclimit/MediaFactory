/**
 * SubtitleLayoutEngine
 * Computes layout metrics for the current subtitle segment.
 * Mutates the provided layoutState object directly to avoid allocations.
 */
export class SubtitleLayoutEngine {
    /**
     * @param {Object} state The SubtitleRuntime state object
     * @param {Object} config The subtitle configuration (alignment, max width, font size, etc.)
     * @param {number} canvasWidth The width of the target render surface
     * @param {number} canvasHeight The height of the target render surface
     */
    static compute(state, config, canvasWidth, canvasHeight) {
        if (!state.activeSegment) {
            state.layoutState.lines.length = 0;
            state.layoutState.segmentRef = null;
            return;
        }

        const layout = state.layoutState;
        
        // Cache: Only calculate layout if segment or config changes
        if (layout.segmentRef === state.activeSegment && 
            layout.canvasWidth === canvasWidth && 
            layout.canvasHeight === canvasHeight &&
            layout.align === config.align &&
            layout.fontFamily === config.fontFamily &&
            layout.fontSize === config.fontSize &&
            layout.fontWeight === config.fontWeight &&
            layout.color === config.color &&
            layout.lineHeight === config.lineHeight &&
            layout.letterSpacing === config.letterSpacing &&
            layout.outline === config.outline &&
            layout.shadow === config.shadow &&
            layout.padding === config.padding) {
            state.diagnostics = state.diagnostics || {};
            state.diagnostics.layoutCacheHit = true;
            return;
        }

        state.diagnostics = state.diagnostics || {};
        state.diagnostics.layoutCacheHit = false;

        layout.segmentRef = state.activeSegment;
        layout.canvasWidth = canvasWidth;
        layout.canvasHeight = canvasHeight;
        layout.align = config.align || 'Bottom Center';
        layout.fontFamily = config.fontFamily;
        layout.fontSize = config.fontSize;
        layout.fontWeight = config.fontWeight;
        layout.color = config.color;
        layout.lineHeight = config.lineHeight;
        layout.letterSpacing = config.letterSpacing;
        layout.outline = config.outline;
        layout.shadow = config.shadow;
        layout.padding = config.padding;

        // 1. Basic Text Wrapping Mock
        // Since we calculate this only ONCE per segment, allocating a tiny array of words is acceptable (not per frame).
        const fontSize = config.fontSize || 36;
        const avgCharWidth = fontSize * 0.6; 
        const maxWidth = (config.width || canvasWidth * 0.8);
        
        const words = state.activeSegment.words || [];
        
        layout.lines.length = 0; // Clear previous lines without allocating new array
        let currentLine = [];
        let currentWidth = 0;

        for (let i = 0; i < words.length; i++) {
            const wordObj = words[i];
            const wText = wordObj.word;
            const wWidth = wText.length * avgCharWidth;
            
            // Assign a stable ID to avoid searching in React (mutates once)
            wordObj.id = wordObj.id || `${state.segmentIndex}-${i}`;
            
            if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
                layout.lines.push(currentLine);
                currentLine = [wordObj];
                currentWidth = wWidth + avgCharWidth;
            } else {
                currentLine.push(wordObj);
                currentWidth += wWidth + avgCharWidth;
            }
        }
        
        if (currentLine.length > 0) {
            layout.lines.push(currentLine);
        }

        // Update Line Tracking in State
        let currentLineIndex = -1;
        if (state.wordIndex !== -1 && layout.lines.length > 0) {
            for (let l = 0; l < layout.lines.length; l++) {
                if (layout.lines[l].some(w => w.id === state.highlightWordId)) {
                    currentLineIndex = l;
                    break;
                }
            }
        }

        state.currentLineIndex = currentLineIndex;
        state.currentLine = currentLineIndex !== -1 ? layout.lines[currentLineIndex] : null;
        state.previousLine = currentLineIndex > 0 ? layout.lines[currentLineIndex - 1] : null;
        state.nextLine = currentLineIndex !== -1 && currentLineIndex < layout.lines.length - 1 ? layout.lines[currentLineIndex + 1] : null;

        // 2. Compute Dimensions
        layout.width = Math.min(currentWidth, maxWidth);
        layout.height = layout.lines.length * (fontSize * 1.5); // 1.5 line height

        // 3. Alignment and Safe Margins
        const marginX = canvasWidth * 0.05; // 5% safe margin
        const marginY = canvasHeight * 0.05; 

        switch (layout.align) {
            case 'Bottom Center':
                layout.x = canvasWidth / 2;
                layout.y = canvasHeight - marginY - layout.height / 2;
                break;
            case 'Bottom Left':
                layout.x = marginX + layout.width / 2;
                layout.y = canvasHeight - marginY - layout.height / 2;
                break;
            case 'Bottom Right':
                layout.x = canvasWidth - marginX - layout.width / 2;
                layout.y = canvasHeight - marginY - layout.height / 2;
                break;
            case 'Top':
                layout.x = canvasWidth / 2;
                layout.y = marginY + layout.height / 2;
                break;
            case 'Center':
                layout.x = canvasWidth / 2;
                layout.y = canvasHeight / 2;
                break;
            default:
                layout.x = canvasWidth / 2;
                layout.y = canvasHeight - marginY - layout.height / 2;
                break;
        }
    }
}
