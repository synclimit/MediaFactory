import React, { useState, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

// Pure presentation: reads layout from the RenderPipeline frame
export default function PlaylistRenderer({ config, activeAudioTracks, id }) {
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
        const trackColor = item.isActive ? (config.activeColor || '#a855f7') : (config.inactiveColor || '#a0a0a0');

        if (item.displayRight) {
            return (
                <div className="flex w-full items-baseline" style={{ textAlign: item.align, color: trackColor }}>
                    <span className="flex-shrink whitespace-nowrap" style={{ minWidth: 0 }}>{item.displayTitle}</span>
                    <span className="flex-grow border-b-2 border-dotted border-current opacity-30 mx-2 relative -top-[6px]"></span>
                    <span className="flex-shrink-0 whitespace-nowrap">{item.displayRight}</span>
                </div>
            );
        }
        return (
            <div className="whitespace-nowrap" style={{ textAlign: item.align, width: '100%', color: trackColor }}>
                {item.displayTitle}
            </div>
        );
    };

    const backdropStyle = config.showBackdrop ? {
        backgroundColor: config.backdropColor || '#000000',
        opacity: config.backdropOpacity !== undefined ? config.backdropOpacity : 0.4,
        borderRadius: (config.backdropRadius || 8) + 'px',
        padding: (config.backdropPadding || 20) + 'px',
    } : {};

    const columnsCount = config.columns || 1;
    const columnGap = config.columnGap || 100;

    const columnStyle = {
        fontFamily: typographyData.fontFamily,
        fontSize: typographyData.fontSize + 'px',
        fontWeight: {'Light': 300, 'Normal': 400, 'Semi-Bold': 600, 'Bold': 700, 'Extra-Bold': 800, 'Black': 900}[typographyData.fontWeight] || typographyData.fontWeight || 'bold',
        fontStyle: typographyData.fontStyle,
        color: typographyData.color,
        lineHeight: typographyData.lineHeight,
        letterSpacing: typographyData.letterSpacing + 'px',
        gap: (config.gap || 0) + 'px',
    };

    // Render columns inline using flex layout
    const leftCol = layoutData.leftColumn;
    const rightCol = layoutData.rightColumn;

    return (
        <div style={{ display: 'flex', gap: columnGap + 'px', ...backdropStyle, backgroundColor: 'transparent' }}>
            {/* Left / Single Column */}
            {leftCol && leftCol.tracks && leftCol.tracks.length > 0 && (
                <div 
                    className="flex flex-col"
                    style={{
                        ...columnStyle,
                        flex: 1,
                        minWidth: 'max-content'
                    }}
                >
                    {leftCol.tracks.map((item, i) => (
                        <div key={i} className="w-full">
                            {renderTrack(item)}
                        </div>
                    ))}
                </div>
            )}

            {/* Right Column (only if multi-column) */}
            {columnsCount > 1 && rightCol && rightCol.tracks && rightCol.tracks.length > 0 && (
                <div 
                    className="flex flex-col"
                    style={{
                        ...columnStyle,
                        flex: 1,
                        minWidth: 'max-content'
                    }}
                >
                    {rightCol.tracks.map((item, i) => (
                        <div key={i} className="w-full">
                            {renderTrack(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
