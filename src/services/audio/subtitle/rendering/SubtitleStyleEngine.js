/**
 * SubtitleStyleEngine
 * Responsibilities:
 * - Style selection
 * - Style registry
 * - Style execution
 * 
 * Converts animation values into final presentation style using zero allocations.
 */
export const SubtitleStyleEngine = {
    registry: {
        'Classic': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            for(let i = 0; i < layoutState.lines.length; i++) {
                const obj = getLineObj();
                obj.line = layoutState.lines[i];
                obj.opacity = 1.0;
                obj.scale = 1.0;
                obj.offsetY = 0;
                obj.isCurrent = i === runtimeState.currentLineIndex;
            }
            styleState.globalOpacity = 1.0;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = 0;
        },
        'Fade': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            for(let i = 0; i < layoutState.lines.length; i++) {
                const obj = getLineObj();
                obj.line = layoutState.lines[i];
                obj.opacity = 1.0;
                obj.scale = 1.0;
                obj.offsetY = 0;
                obj.isCurrent = i === runtimeState.currentLineIndex;
            }
            styleState.globalOpacity = animationState.progress;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = 0;
        },
        'Slide': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            for(let i = 0; i < layoutState.lines.length; i++) {
                const obj = getLineObj();
                obj.line = layoutState.lines[i];
                obj.opacity = 1.0;
                obj.scale = 1.0;
                obj.offsetY = 0;
                obj.isCurrent = i === runtimeState.currentLineIndex;
            }
            styleState.globalOpacity = 1.0;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = runtimeState.offsetY;
        },
        'Slide + Fade': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            for(let i = 0; i < layoutState.lines.length; i++) {
                const obj = getLineObj();
                obj.line = layoutState.lines[i];
                obj.opacity = 1.0;
                obj.scale = 1.0;
                obj.offsetY = 0;
                obj.isCurrent = i === runtimeState.currentLineIndex;
            }
            styleState.globalOpacity = animationState.progress;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = runtimeState.offsetY;
        },
        'Highlight Current Line': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            for(let i = 0; i < layoutState.lines.length; i++) {
                const obj = getLineObj();
                obj.line = layoutState.lines[i];
                
                let isCurrent = i === runtimeState.currentLineIndex;
                if (isCurrent) {
                    obj.opacity = 1.0;
                    obj.scale = 1.1;
                } else if (i === runtimeState.currentLineIndex - 1 || i === runtimeState.currentLineIndex + 1) {
                    obj.opacity = 0.5;
                    obj.scale = 1.0;
                } else {
                    obj.opacity = 0.2;
                    obj.scale = 1.0;
                }
                
                obj.offsetY = 0;
                obj.isCurrent = isCurrent;
            }
            styleState.globalOpacity = animationState.progress;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = runtimeState.offsetY;
        },
        'Rolling Lyrics': (runtimeState, layoutState, animationState, styleState, getLineObj) => {
            const currentLine = runtimeState.currentLine;
            let lineProgress = 0.5;
            if (currentLine && currentLine.length > 0) {
                const lineStart = currentLine[0].start;
                const lineEnd = currentLine[currentLine.length - 1].end;
                const ts = runtimeState.diagnostics?.lastTimestamp || 0;
                if (lineEnd > lineStart) {
                    lineProgress = Math.max(0, Math.min(1, (ts - lineStart) / (lineEnd - lineStart)));
                }
            }
            
            const lineHeight = (layoutState.fontSize || 36) * 1.5;
            const scrollY = - (runtimeState.currentLineIndex * lineHeight) - (lineProgress * lineHeight * 0.5); 
            
            for(let i = 0; i < layoutState.lines.length; i++) {
                if (Math.abs(i - runtimeState.currentLineIndex) <= 1) {
                    const obj = getLineObj();
                    obj.line = layoutState.lines[i];
                    
                    let isCurrent = i === runtimeState.currentLineIndex;
                    if (isCurrent) {
                        obj.opacity = 1.0;
                        obj.scale = 1.1;
                    } else {
                        obj.opacity = 0.5;
                        obj.scale = 1.0;
                    }
                    
                    obj.offsetY = (i * lineHeight) + scrollY;
                    obj.isCurrent = isCurrent;
                }
            }
            
            styleState.globalOpacity = animationState.progress;
            styleState.globalOffsetX = 0;
            styleState.globalOffsetY = runtimeState.offsetY;
        }
    },
    
    compute: (runtimeState) => {
        if (!runtimeState.activeSegment) {
            if (runtimeState.styleState) {
                runtimeState.styleState.displayLines.length = 0;
                runtimeState.styleState.globalOpacity = 0;
                runtimeState.styleState.globalOffsetX = 0;
                runtimeState.styleState.globalOffsetY = 0;
            }
            return;
        }

        const styleName = runtimeState.style || 'Classic';
        let handler = SubtitleStyleEngine.registry[styleName];
        if (!handler) {
            handler = SubtitleStyleEngine.registry['Classic'];
        }
        
        if (!runtimeState.styleState) {
            runtimeState.styleState = { displayLines: [] };
        }
        
        let poolIndex = 0;
        const getLineObj = () => {
            if (poolIndex >= runtimeState.styleState.displayLines.length) {
                runtimeState.styleState.displayLines.push({ line: null, opacity: 1, scale: 1, offsetY: 0, isCurrent: false });
            }
            const obj = runtimeState.styleState.displayLines[poolIndex];
            poolIndex++;
            return obj;
        };
        
        handler(runtimeState, runtimeState.layoutState, runtimeState.animationState, runtimeState.styleState, getLineObj);
        
        // Zero allocation array truncation
        runtimeState.styleState.displayLines.length = poolIndex;
    }
};
