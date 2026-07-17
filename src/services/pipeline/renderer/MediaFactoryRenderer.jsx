import React, { useState, useEffect } from 'react';
import PlaylistRenderer from '../../../components/m3/widgets/PlaylistRenderer';
import SubtitleRenderer from '../../../components/m3/widgets/SubtitleRenderer';
import SocialWidgetRenderer from '../../../components/m3/widgets/SocialWidgetRenderer.jsx';
import RealtimeEffectRenderer from '../../../components/m3/renderers/RealtimeEffectRenderer';
import { renderFrameStore } from '../runtime/RenderFrameStore';

export default function MediaFactoryRenderer({ 
    frame: propFrame, 
    renderMode = 'Preview', 
    targetRef,
    onPointerDown,
    handleHandleDown,
    m3SelectedObjectId
}) {
    const [localFrame, setLocalFrame] = useState(() => renderFrameStore.getFrame());

    useEffect(() => {
        if (propFrame) return; // If parent provides frame, do not subscribe

        
        const handleFrame = (newFrame) => {
            setLocalFrame(newFrame);
        };
        renderFrameStore.subscribe(handleFrame);
        return () => renderFrameStore.unsubscribe(handleFrame);
    }, [propFrame]);

    const frame = propFrame || localFrame;
    if (!frame) return null;

    const { subtitle, visual, beat, objects } = frame.engineStates || {};
    const meta = frame.metadata || {};

    // No longer applying global transform (zoom/camera) here.
    // MediaFactoryRenderer focuses purely on object positioning.
    const globalStyle = {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden'
    };

    return (
        <div className="mediafactory-renderer" style={globalStyle}>
            {objects && objects.sort((a,b) => a.layer - b.layer).map(el => {
                if (!el.visible && renderMode !== 'Export') return null;
                if (!el.visible) return null;
                
                const start = el.startTime || 0;
                const end = start + (el.duration || 999999);
                if (currentTime < start || currentTime > end) return null;

                if (el.type === 'playlist' || el.type === 'track_list_column') {
                    return (
                        <div key={el.id} className="absolute inset-0 pointer-events-none z-30" style={{ left: '50%', top: '50%' }}>
                            <PlaylistRenderer config={el} id={el.id} />
                        </div>
                    );
                }

                if (el.type === 'subtitle') {
                    return (
                        <div key={el.id} className="absolute inset-0 pointer-events-none z-40" style={{ left: '50%', top: '50%' }}>
                            <SubtitleRenderer config={el} id={el.id} />
                        </div>
                    );
                }

                return (
                    <div
                        key={el.id}
                        onPointerDown={onPointerDown ? (e) => onPointerDown(e, el.id) : undefined}
                        className={`absolute pointer-events-auto transition-shadow ${el.locked ? 'cursor-default' : 'cursor-move'} ${m3SelectedObjectId === el.id ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent z-40' : 'hover:ring-1 hover:ring-white/50 z-30'}`}
                        style={{
                            left: el.x + 'px',
                            top: el.y + 'px',
                            width: el.width ? el.width + 'px' : 'auto',
                            height: el.height ? el.height + 'px' : 'auto',
                            opacity: (el.opacity !== undefined ? el.opacity : 100) / 100,
                            transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg) scale(${el.scale !== undefined ? el.scale : 1})`,
                            transformOrigin: 'center',
                            marginLeft: (el.width ? el.width / 2 : 0) + 'px',
                            marginTop: (el.height ? el.height / 2 : 0) + 'px',
                            backgroundColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        {el.type === 'text' && (
                            <span style={{ 
                                fontFamily: el.fontFamily || 'Inter',
                                fontSize: (el.fontSize || 64) + 'px', 
                                fontWeight: el.fontWeight || 'bold',
                                color: el.color || '#ffffff',
                                textAlign: el.align ? el.align.toLowerCase() : 'left'
                            }}>{el.name}</span>
                        )}
                        {el.type === 'image' && (
                            <div className="w-full h-full relative" style={{ mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase() }}>
                                {el.source ? <img src={el.source} alt={el.name} className="w-full h-full object-contain pointer-events-none" /> : null}
                            </div>
                        )}
                        {el.type === 'social-widget' && <SocialWidgetRenderer config={el} />}

                        {/* Selection Handles & Anchor */}
                        {m3SelectedObjectId === el.id && !el.locked && handleHandleDown && (
                            <>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nwse-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'n')} className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ns-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nesw-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'e')} className="absolute top-1/2 -right-1.5 -mt-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ew-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nwse-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 's')} className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ns-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nesw-resize"></div>
                                <div onPointerDown={(e) => handleHandleDown(e, el.id, 'w')} className="absolute top-1/2 -left-1.5 -mt-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ew-resize"></div>
                                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                            </>
                        )}
                    </div>
                );
            })}

            {/* Global Effect Overlay */}
            <RealtimeEffectRenderer 
                effects={objects ? objects.filter(o => (o.type === 'effect' || o.type === 'reactive') && o.enabled !== false) : []} 
                targetRef={targetRef} 
            />
        </div>
    );
}
