import React, { useState, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

// Pure presentation: reads styleState from the RenderPipeline frame
export default function SubtitleRenderer({ config, id }) {
    const [frame, setFrame] = useState(() => renderFrameStore.getFrame());

    useEffect(() => {
        const handleFrame = (newFrame) => {
            setFrame(newFrame);
        };
        renderFrameStore.subscribe(handleFrame);
        return () => renderFrameStore.unsubscribe(handleFrame);
    }, []);

    const state = frame?.subtitle?.[id];
    
    if (!state || !state.activeSegment || !state.styleState || state.styleState.displayLines.length === 0) return null;

    const { layoutState, styleState } = state;
    const { globalOpacity, globalOffsetX, globalOffsetY, displayLines } = styleState;

    return (
        <div 
            id={`subtitle-renderer-${id}`}
            className="absolute flex flex-col pointer-events-none items-center justify-center"
            style={{
                left: layoutState.x,
                top: layoutState.y,
                width: layoutState.width > 0 ? layoutState.width + 'px' : 'auto',
                opacity: globalOpacity,
                transform: `translate(calc(-50% + ${globalOffsetX}px), calc(-50% + ${globalOffsetY}px))`,
                
                fontFamily: layoutState.fontFamily || 'Inter',
                fontSize: (layoutState.fontSize || 36) + 'px',
                fontWeight: layoutState.fontWeight || 'bold',
                color: layoutState.color || '#ffffff',
                textShadow: layoutState.shadow || '0px 2px 4px rgba(0,0,0,0.8)',
                textAlign: layoutState.align ? (layoutState.align.includes('Left') ? 'left' : layoutState.align.includes('Right') ? 'right' : 'center') : 'center',
                whiteSpace: 'pre-wrap',
                lineHeight: layoutState.lineHeight || 1.5,
                letterSpacing: layoutState.letterSpacing || 'normal',
                padding: layoutState.padding || 0,
                WebkitTextStroke: layoutState.outline || 'none'
            }}
        >
            {displayLines.map((lineObj, i) => (
                <div 
                    key={i} 
                    className="w-full absolute"
                    style={{
                        opacity: lineObj.opacity,
                        transform: `scale(${lineObj.scale}) translateY(${lineObj.offsetY}px)`,
                        transition: 'none', // Managed by engine
                        color: lineObj.isCurrent && layoutState.accentColor ? layoutState.accentColor : 'inherit'
                    }}
                >
                    {lineObj.line && lineObj.line.map((wordObj, j) => (
                        <span key={j}>{wordObj.word}{' '}</span>
                    ))}
                </div>
            ))}
        </div>
    );
}

