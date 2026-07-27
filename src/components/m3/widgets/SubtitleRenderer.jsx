import React, { useState, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

// V2 Renderer: Purely consumes RenderInstruction
export default function SubtitleRenderer({ config, id }) {
    const [frame, setFrame] = useState(() => renderFrameStore.getFrame());

    useEffect(() => {
        const handleFrame = (newFrame) => setFrame(newFrame);
        renderFrameStore.subscribe(handleFrame);
        return () => renderFrameStore.unsubscribe(handleFrame);
    }, []);

    const state = frame?.subtitle?.[id];
    
    if (!state || !state.activeSegment || !state.renderInstruction || state.renderInstruction.displayLines.length === 0) return null;

    const { layoutState, renderInstruction } = state;
    const { displayLines, offsetX, offsetY, opacity, style, visibleCharacters } = renderInstruction;

    // Use style object calculated by StyleEngine, fallback to layoutState/config if needed
    const containerStyle = style || {};

    return (
        <div 
            id={`subtitle-renderer-${id}`}
            className="absolute flex flex-col pointer-events-none items-center justify-center"
            style={{
                left: layoutState.x,
                top: layoutState.y,
                width: layoutState.width > 0 ? layoutState.width + 'px' : 'auto',
                opacity: opacity !== undefined ? opacity : 1.0,
                transform: `translate(calc(-50% + ${offsetX || 0}px), calc(-50% + ${offsetY || 0}px))`,
                ...containerStyle,
                textAlign: layoutState.align ? (layoutState.align.includes('Left') ? 'left' : layoutState.align.includes('Right') ? 'right' : 'center') : 'center',
                whiteSpace: 'pre-wrap',
            }}
        >
            {displayLines.map((lineObj, i) => (
                <div 
                    key={i} 
                    className="w-full absolute"
                    style={{
                        opacity: lineObj.opacity !== undefined ? lineObj.opacity : 1.0,
                        transform: `scale(${lineObj.scale || 1.0}) translateY(${lineObj.offsetY || 0}px)`,
                        transition: 'none', 
                    }}
                >
                    {lineObj.words && lineObj.words.map((wordObj, j) => (
                        <span 
                            key={j} 
                            style={{
                                opacity: wordObj.opacity !== undefined ? wordObj.opacity : 1.0,
                                ...(wordObj.style || {}) // Word-level highlights (glow, color)
                            }}
                        >
                            {/* In V2, we might have Typewriter logic slicing characters */}
                            {visibleCharacters >= 0 
                                ? (/* A more robust typewriter would slice here, for now we render full word text if its visibleChars logic allowed it */ wordObj.text + ' ')
                                : wordObj.text + ' '
                            }
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
}
