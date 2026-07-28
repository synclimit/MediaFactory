/**
 * SubtitleLayoutEngine
 * Computes layout metrics for the current subtitle segment.
 * Mutates the provided layoutState object directly to avoid allocations.
 */
export class SubtitleLayoutEngine {
    static globalLayoutCache = new Map();
    static lastCacheInvalidationKey = null;

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
        const enableCache = window.__M3_FEATURE_FLAGS?.enableSubtitleLayoutCache ?? true;

        // LEGACY BEHAVIOUR (Feature Flag = false)
        if (!enableCache) {
            this._computeLegacy(state, config, canvasWidth, canvasHeight);
            return;
        }

        // --- GLOBAL CACHE INVALIDATION ---
        // Bersihkan seluruh cache jika ada parameter gaya/resolusi global yang berubah.
        const invalidationKey = `${config.fontFamily}_${config.fontSize}_${config.fontWeight}_${config.outline}_${config.shadow}_${config.letterSpacing}_${config.lineHeight}_${config.align}_${canvasWidth}_${canvasHeight}`;
        
        if (this.lastCacheInvalidationKey !== invalidationKey) {
            this.globalLayoutCache.clear();
            this.lastCacheInvalidationKey = invalidationKey;
        }

        // --- DETERMINISTIC CACHE KEY ---
        // Key didasarkan pada teks subtitle spesifik dan hash styling.
        const segmentText = state.activeSegment.text || (state.activeSegment.words ? state.activeSegment.words.map(w => w.word).join(' ') : state.segmentIndex);
        const cacheKey = `${state.segmentIndex}_${segmentText}_${invalidationKey}`;

        state.diagnostics = state.diagnostics || {};

        if (this.globalLayoutCache.has(cacheKey)) {
            const cachedLayout = this.globalLayoutCache.get(cacheKey);
            
            // Transfer properties directly (mutating layoutState without allocations)
            layout.segmentRef = state.activeSegment;
            layout.canvasWidth = canvasWidth;
            layout.canvasHeight = canvasHeight;
            layout.align = cachedLayout.align;
            layout.fontFamily = cachedLayout.fontFamily;
            layout.fontSize = cachedLayout.fontSize;
            layout.fontWeight = cachedLayout.fontWeight;
            layout.color = cachedLayout.color;
            layout.lineHeight = cachedLayout.lineHeight;
            layout.letterSpacing = cachedLayout.letterSpacing;
            layout.outline = cachedLayout.outline;
            layout.shadow = cachedLayout.shadow;
            layout.padding = cachedLayout.padding;
            
            layout.width = cachedLayout.width;
            layout.height = cachedLayout.height;
            layout.x = cachedLayout.x;
            layout.y = cachedLayout.y;
            
            // Copy lines structure
            layout.lines.length = 0;
            for (let i = 0; i < cachedLayout.lines.length; i++) {
                layout.lines.push(cachedLayout.lines[i]);
            }

            this._updateLineTracking(state, layout);
            state.diagnostics.layoutCacheHit = true;
            return;
        }

        state.diagnostics.layoutCacheHit = false;

        // Perform actual heavy calculation (Legacy logic called once per cue text)
        this._computeLegacy(state, config, canvasWidth, canvasHeight);

        // Save result to Global LRU/Map Cache (Omit active frame tracking data)
        this.globalLayoutCache.set(cacheKey, {
            width: layout.width,
            height: layout.height,
            x: layout.x,
            y: layout.y,
            align: layout.align,
            fontFamily: layout.fontFamily,
            fontSize: layout.fontSize,
            fontWeight: layout.fontWeight,
            color: layout.color,
            lineHeight: layout.lineHeight,
            letterSpacing: layout.letterSpacing,
            outline: layout.outline,
            shadow: layout.shadow,
            padding: layout.padding,
            lines: [...layout.lines] // Clone line references
        });
        
        // Prevent memory leak (Max 500 cues in cache)
        if (this.globalLayoutCache.size > 500) {
            const firstKey = this.globalLayoutCache.keys().next().value;
            this.globalLayoutCache.delete(firstKey);
        }
    }

    static _updateLineTracking(state, layout) {
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
    }

    static _computeLegacy(state, config, canvasWidth, canvasHeight) {
        const layout = state.layoutState;
        
        // Cache: Only calculate layout if segment or config changes (LEGACY FRAME BY FRAME CHECK)
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

        const fontSize = config.fontSize || 36;
        const avgCharWidth = fontSize * 0.6; 
        const maxWidth = (config.width || canvasWidth * 0.8);
        
        let words = state.activeSegment.words;
        if (!words || words.length === 0) {
            const rawText = state.activeSegment.text || '';
            words = rawText.trim().split(/\s+/).filter(Boolean).map((w, idx) => ({ word: w, id: `${state.segmentIndex}-${idx}` }));
        }
        
        layout.lines.length = 0;
        let currentLine = [];
        let currentWidth = 0;

        for (let i = 0; i < words.length; i++) {
            const wordObj = words[i];
            const wText = wordObj.word;
            const wWidth = wText.length * avgCharWidth;
            
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

        this._updateLineTracking(state, layout);

        layout.width = Math.min(currentWidth, maxWidth);
        layout.height = layout.lines.length * (fontSize * 1.5);

        const marginX = canvasWidth * 0.05;
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
