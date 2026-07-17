import React, { useState, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

// Pure presentation: reads layout from the RenderPipeline frame
export default function PlaylistRenderer({ config, activeAudioTracks, onPointerDown, id }) {
    const [frame, setFrame] = useState(() => renderFrameStore.getFrame());

    useEffect(() => {
        const handleFrame = (newFrame) => {
            setFrame(newFrame);
        };
        renderFrameStore.subscribe(handleFrame);
        return () => renderFrameStore.unsubscribe(handleFrame);
    }, []);

    const state = frame?.playlist?.[id];

    if (!state) return null;

    const { layoutData, transformData, typographyData } = state;

    if (layoutData.metrics.total === 0) {
        return <div className="text-gray-500 italic opacity-50 font-mono text-center p-4">Empty Playlist</div>;
    }

    const renderTrack = (item) => {
        if (item.displayRight) {
            return (
                <div className="flex w-full items-baseline" style={{ textAlign: item.align }}>
                    <span>{item.displayTitle}</span>
                    <span className="flex-grow border-b-2 border-dotted border-current opacity-30 mx-2 relative -top-[6px]"></span>
                    <span>{item.displayRight}</span>
                </div>
            );
        }
        return (
            <div style={{ textAlign: item.align, width: '100%' }}>
                {item.displayTitle}
            </div>
        );
    };

    return (
        <div className="w-full h-full relative" style={{ pointerEvents: 'none' }}>
            {/* Title Render */}
            {config.showTitle && config.title && (
                <div 
                    className="absolute"
                    style={{
                        left: config.titleTransform?.x || 0,
                        top: config.titleTransform?.y || -50,
                        transform: `translate(-50%, -50%) scale(${config.titleTransform?.scale || 1}) rotate(${config.titleTransform?.rotation || 0}deg)`,
                        transformOrigin: 'center',
                        fontFamily: typographyData.fontFamily,
                        fontWeight: 'bold',
                        fontStyle: typographyData.fontStyle,
                        fontSize: typographyData.fontSize * 1.5 + 'px',
                        color: typographyData.color,
                        letterSpacing: typographyData.letterSpacing + 'px',
                        opacity: typographyData.opacity / 100
                    }}
                >
                    {config.title}
                </div>
            )}

            {/* Columns Render */}
            {[
                { obj: layoutData.leftColumn, transform: transformData.leftColumnTransform },
                { obj: layoutData.rightColumn, transform: transformData.rightColumnTransform }
            ].map(({ obj: colObject, transform }, colIndex) => {
                if (!colObject || !colObject.tracks || colObject.tracks.length === 0 || transform.visible === false) return null;
                
                return (
                    <div 
                        key={colIndex}
                        onPointerDown={(e) => {
                            if (onPointerDown) onPointerDown(e, id, `col_${colIndex}`);
                        }}
                        className="absolute flex flex-col cursor-move hover:ring-1 hover:ring-white/50 transition-shadow"
                        style={{
                            pointerEvents: 'auto',
                            left: transform.x,
                            top: transform.y,
                            opacity: transform.opacity !== undefined ? transform.opacity / 100 : 1,
                            width: layoutData.metrics.columnWidth + 'px',
                            transform: `translate(-50%, -50%) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                            transformOrigin: 'center',
                            fontFamily: typographyData.fontFamily,
                            fontSize: typographyData.fontSize + 'px',
                            fontWeight: typographyData.fontWeight,
                            fontStyle: typographyData.fontStyle,
                            color: typographyData.color,
                            lineHeight: typographyData.lineHeight,
                            letterSpacing: typographyData.letterSpacing + 'px',
                            gap: (config.gap || 0) + 'px'
                        }}
                    >
                        {colObject.tracks.map((item, i) => {
                            return (
                                <div key={i} className="whitespace-nowrap w-full">
                                    {renderTrack(item)}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
