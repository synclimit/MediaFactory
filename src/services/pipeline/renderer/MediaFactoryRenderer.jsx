import React, { useState, useEffect } from 'react';
import PlaylistRenderer from '../../../components/m3/widgets/PlaylistRenderer';
import SubtitleRenderer from '../../../components/m3/widgets/SubtitleRenderer';
import SocialWidgetRenderer from '../../../components/m3/widgets/SocialWidgetRenderer.jsx';
import RealtimeEffectRenderer from '../../../components/m3/renderers/RealtimeEffectRenderer';
import VisualizerRenderer from '../../../components/m3/widgets/VisualizerRenderer';
import ParticleRenderer from '../../../components/m3/widgets/ParticleRenderer';
import IntroSequenceRenderer from '../../../components/m3/widgets/IntroSequenceRenderer';
import { renderFrameStore } from '../runtime/RenderFrameStore';
import { beatEngine } from '../../audio/BeatEngine';

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

    const motionState = React.useRef({});
    
    const frame = propFrame || localFrame;
    if (!frame) return null;

    const { subtitle, visual, beat, objects } = frame.engineStates || frame.states || {};
    const meta = frame.metadata || {};
    const currentTime = meta.currentTime || 0;

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

    const introSequences = objects ? objects.filter(el => el.name === 'Intro Sequence') : [];
    const activeIntro = introSequences.length > 0 ? introSequences[introSequences.length - 1] : null;
    const isIntroPlaying = activeIntro && activeIntro.visible !== false && currentTime >= (activeIntro.startTime || 0) && currentTime <= ((activeIntro.startTime || 0) + (activeIntro.duration || 999999));

    return (
        <div className="mediafactory-renderer" style={globalStyle}>
            {objects && objects.filter(el => el.name !== 'Intro Sequence' && el.name !== 'Outro Sequence').sort((a,b) => a.layer - b.layer).map(el => {
                if (!el.visible && renderMode !== 'Export') return null;
                if (!el.visible) return null;
                
                // Hide non-branding elements during Intro
                if (isIntroPlaying) {
                    const isBranding = el.name === 'Brand Logo' || el.name === 'Watermark' || el.name === 'Subscribe Animation' || el.type === 'social-widget';
                    if (!isBranding) return null;
                }
                
                const start = el.startTime || 0;
                const end = start + (el.duration || 999999);
                if (currentTime < start || currentTime > end) return null;

                if (el.type === 'subtitle') {
                    return (
                        <div key={el.id} className="absolute inset-0 pointer-events-none z-40" style={{ left: '50%', top: '50%' }}>
                            <SubtitleRenderer config={el} id={el.id} />
                        </div>
                    );
                }
                


                const currentBorderRadius = el.borderRadius ? el.borderRadius + 'px' : '0px';
                const currentBorder = el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#ffffff'}` : 'none';
                const currentBgColor = el.backgroundColor || 'transparent';

                // --- Audio Reactivity Math ---
                let mScale = 0, mSwayX = 0, mSwayY = 0, mRotate = 0;
                if (el.beatZoom) {
                    const b = beatEngine.getState() || { bass: 0, mid: 0, treble: 0, energy: 0 };
                    let danceStyle = el.danceStyle || 'Calm Pulse';
                    if (danceStyle === 'Subtle Sway') danceStyle = 'Calm Pulse';
                    if (danceStyle === 'Pulse') danceStyle = 'Deep Kick';
                    if (danceStyle === 'Heartbeat') danceStyle = 'Rhythmic Float';
                    if (danceStyle === 'Shake') danceStyle = 'Adrenaline';
                    
                    const reactLevel = el.danceReactLevel !== undefined ? el.danceReactLevel : 45;
                    const smoothing = el.danceSmoothing !== undefined ? el.danceSmoothing : 0.70;
                    const intensity = (el.danceIntensity !== undefined ? el.danceIntensity : 100) / 100;
                    const reactsTo = el.danceReactsTo || 'Bass (Low)';
                    
                    const rawVal = reactsTo === 'Bass (Low)' ? b.bass :
                                   reactsTo === 'Mid' ? b.mid :
                                   reactsTo === 'Treble (High)' ? b.treble :
                                   b.energy;
                    
                    const power = (rawVal || 0) * (reactLevel / 50) * intensity;
                    let cfg = { zoom: 0, swayX: 0, swayY: 0, rotate: 0, shake: 0 };
                    
                    if (danceStyle === 'Custom (Advanced)') {
                        if (el.motionEnZoom !== false) cfg.zoom = el.motionValZoom !== undefined ? el.motionValZoom : 12;
                        if (el.motionEnSwayX) cfg.swayX = el.motionValSwayX !== undefined ? el.motionValSwayX : 2.0;
                        if (el.motionEnSwayY) cfg.swayY = el.motionValSwayY !== undefined ? el.motionValSwayY : 1.2;
                        if (el.motionEnRotate) cfg.rotate = el.motionValRotate !== undefined ? el.motionValRotate : 1.5;
                        if (el.motionEnShake) cfg.shake = el.motionValShake !== undefined ? el.motionValShake : 4;
                    } else if (danceStyle === 'Deep Kick') {
                        cfg.zoom = 10;
                    } else if (danceStyle === 'Rhythmic Float') {
                        cfg.swayX = 4; cfg.swayY = 3; cfg.rotate = 2; cfg.zoom = 1;
                    } else if (danceStyle === 'Adrenaline') {
                        cfg.swayX = 3; cfg.swayY = 3; cfg.rotate = 3; cfg.zoom = 8; cfg.shake = 6;
                    } else {
                        cfg.swayX = 2; cfg.swayY = 1; cfg.zoom = 2; cfg.rotate = 0.5;
                    }
                    
                    const time = currentTime;
                    // Amplify motion for overlays (since they use px instead of % like background)
                    const zoomBoost = 3.0; // 3x stronger zoom for small elements
                    const panBoost = 20.0; // 20x stronger pan (converts roughly 1 unit to 20px)
                    
                    const targetZoom = power * cfg.zoom * 0.01 * zoomBoost;
                    const targetSwayX = Math.sin(time * 1.2) * cfg.swayX * power * panBoost;
                    const targetSwayY = Math.cos(time * 0.9) * cfg.swayY * power * panBoost;
                    const targetRotate = Math.sin(time * 0.8) * cfg.rotate * power * 2.0; // 2x stronger rotation
                    const targetShakeX = (Math.sin(time * 3.1) * 0.5 + Math.cos(time * 2.3) * 0.5) * cfg.shake * power * panBoost;
                    const targetShakeY = (Math.cos(time * 2.7) * 0.5 + Math.sin(time * 3.4) * 0.5) * cfg.shake * power * panBoost;
                    
                    if (!motionState.current[el.id]) motionState.current[el.id] = { zoom: 0, swayX: 0, swayY: 0, rotate: 0 };
                    const state = motionState.current[el.id];
                    const lerpFactor = 1.0 - (smoothing * 0.95);
                    
                    state.zoom += (targetZoom - state.zoom) * lerpFactor;
                    state.swayX += (targetSwayX - state.swayX) * lerpFactor;
                    state.swayY += (targetSwayY - state.swayY) * lerpFactor;
                    state.rotate += (targetRotate - state.rotate) * lerpFactor;
                    
                    mScale = state.zoom;
                    mSwayX = state.swayX + targetShakeX;
                    mSwayY = state.swayY + targetShakeY;
                    mRotate = state.rotate;
                }
                
                const finalScale = (el.scale !== undefined ? el.scale : 1) + mScale;
                const finalRotate = (el.rotation || 0) + mRotate;

                return (
                    <React.Fragment key={el.id}>
                        <div
                            id={`canvas-obj-${el.id}`}
                            onPointerDown={onPointerDown ? (e) => onPointerDown(e, el.id) : undefined}
                            className={`absolute pointer-events-auto transition-shadow ${el.locked ? 'cursor-default' : 'cursor-move'} ${m3SelectedObjectId === el.id ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent z-40' : 'hover:ring-1 hover:ring-white/50 z-30'}`}
                            style={{
                                left: typeof el.x === 'string' && el.x.includes('%') ? el.x : (el.x || 0) + 'px',
                                top: typeof el.y === 'string' && el.y.includes('%') ? el.y : (el.y || 0) + 'px',
                                width: (el.type === 'text' || el.type === 'playlist' || el.type === 'track_list_column') ? 'max-content' : (el.width ? (typeof el.width === 'string' && el.width.includes('%') ? el.width : el.width + 'px') : 'auto'),
                                height: (el.type === 'text' || el.type === 'playlist' || el.type === 'track_list_column') ? 'max-content' : (el.height ? (typeof el.height === 'string' && el.height.includes('%') ? el.height : el.height + 'px') : 'auto'),
                                opacity: (el.opacity !== undefined ? el.opacity : 100) / 100,
                                transform: `translate(calc(-50% + ${mSwayX}px), calc(-50% + ${mSwayY}px)) rotate(${finalRotate}deg) scale(${finalScale})`,
                                transformOrigin: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                zIndex: el.layer || 10
                            }}
                        >
                            {el.type === 'text' && (() => {
                                const weightMap = { 'Light': 300, 'Normal': 400, 'Semi-Bold': 600, 'Bold': 700, 'Extra-Bold': 800 };
                                return (
                                    <span style={{ 
                                        fontFamily: el.fontFamily || 'Inter',
                                        fontSize: (el.fontSize || 64) + 'px', 
                                        fontWeight: el.isBold ? 700 : (weightMap[el.fontWeight] || el.fontWeight || 'bold'),
                                        fontStyle: el.isItalic ? 'italic' : 'normal',
                                        textDecoration: el.isUnderline ? 'underline' : 'none',
                                        color: el.color || '#ffffff',
                                        textAlign: el.align ? el.align.toLowerCase() : 'left',
                                        WebkitTextStroke: el.stroke > 0 ? `${el.stroke}px ${el.strokeColor || '#000000'}` : undefined,
                                        textShadow: el.glow > 0 ? `0 0 ${el.glow}px ${el.glowColor || el.color || '#ffffff'}, 0 0 ${el.glow * 2}px ${el.glowColor || el.color || '#ffffff'}` : undefined,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: (el.align || 'Center').toLowerCase() === 'left' ? 'flex-start' : ((el.align || 'Center').toLowerCase() === 'right' ? 'flex-end' : 'center')
                                    }}>
                                        {(el.textType === 'title' || el.bindToCurrentTrack || el.name === '{current_track}') && el.showLabel !== false && (
                                            <span style={{ 
                                                fontSize: (el.labelSize || 0.4) + 'em', 
                                                opacity: 0.7, 
                                                marginBottom: '0.2em', 
                                                WebkitTextStroke: '0',
                                                fontWeight: el.labelBold !== false ? 'bold' : 'normal',
                                                fontStyle: el.labelItalic ? 'italic' : 'normal',
                                                textDecoration: el.labelUnderline ? 'underline' : 'none',
                                                color: el.labelColor || el.color || '#ffffff',
                                                alignSelf: (el.labelAlign || 'Center') === 'Left' ? 'flex-start' : ((el.labelAlign || 'Center') === 'Right' ? 'flex-end' : 'center')
                                            }}>
                                                CURRENT PLAYING
                                            </span>
                                        )}
                                        <span>{(el.textType === 'title' || el.bindToCurrentTrack || el.name === '{current_track}') ? (frame.playlist?.globalPlaylistInfo?.activeTrackTitle || el.name) : el.name}</span>
                                    </span>
                                );
                            })()}
                            {el.type === 'image' && (
                                <div className="w-full h-full relative" style={{ 
                                    mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase(),
                                    borderRadius: currentBorderRadius,
                                    backgroundColor: currentBgColor,
                                    border: currentBorder,
                                    overflow: 'hidden',
                                    transform: 'translateZ(0)'
                                }}>
                                    {el.source ? <img src={el.source} alt={el.name} className={`w-full h-full ${el.shapeMode === 'Original' || !el.shapeMode ? 'object-contain' : 'object-cover'}`} draggable="false" /> : null}
                                </div>
                            )}
                            {el.type === 'video' && (
                                <div className="w-full h-full relative" style={{ 
                                    mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase(),
                                    borderRadius: currentBorderRadius,
                                    backgroundColor: currentBgColor,
                                    border: currentBorder,
                                    overflow: 'hidden',
                                    transform: 'translateZ(0)'
                                }}>
                                    {el.source ? (
                                        <video src={el.source} autoPlay loop muted className={`w-full h-full ${el.shapeMode === 'Original' || !el.shapeMode ? 'object-contain' : 'object-cover'}`} />
                                    ) : null}
                                </div>
                            )}
                            {el.type === 'social-widget' && (
                                <div className="w-full h-full relative" style={{
                                    borderRadius: currentBorderRadius,
                                    backgroundColor: currentBgColor,
                                    border: currentBorder,
                                    overflow: 'hidden',
                                    transform: 'translateZ(0)'
                                }}>
                                    <SocialWidgetRenderer config={el} currentTime={currentTime} />
                                </div>
                            )}
                            {el.type === 'visualizer' && (
                                <div className="w-full h-full">
                                    <VisualizerRenderer config={el} id={el.id} />
                                </div>
                            )}
                            {el.type === 'particle' && (
                                <div className="w-full h-full">
                                    <ParticleRenderer config={el} id={el.id} />
                                </div>
                            )}
                            {(el.type === 'playlist' || el.type === 'track_list_column') && (
                                <div className="w-full h-full flex justify-center items-center pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <PlaylistRenderer config={el} id={el.id} />
                                    </div>
                                </div>
                            )}

                            {/* Selection Handles & Anchor */}
                            {m3SelectedObjectId === el.id && !el.locked && handleHandleDown && (
                                <>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nwse-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'n')} className="absolute -top-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ns-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nesw-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'e')} className="absolute top-1/2 -right-1.5 -mt-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ew-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nwse-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 's')} className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ns-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 cursor-nesw-resize pointer-events-auto"></div>
                                    <div onPointerDown={(e) => handleHandleDown(e, el.id, 'w')} className="absolute top-1/2 -left-1.5 -mt-1.5 w-3 h-3 bg-white border border-blue-500 cursor-ew-resize pointer-events-auto"></div>
                                    <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                                </>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Global Effect Overlay */}
            <RealtimeEffectRenderer 
                effects={objects ? objects.filter(o => (o.type === 'effect' || o.type === 'reactive') && o.enabled !== false) : []} 
                targetRef={targetRef} 
            />

            {/* Cinematic Intro / Outro Overlays (Always Full Screen, No Bounding Boxes) */}
            {(() => {
                const introSequences = objects ? objects.filter(el => el.name === 'Intro Sequence') : [];
                const lastIntro = introSequences.length > 0 ? introSequences[introSequences.length - 1] : null;
                return lastIntro && lastIntro.visible !== false && (
                    <div key={lastIntro.id} className="absolute inset-0 pointer-events-none z-[9999]" style={{ display: currentTime >= (lastIntro.startTime || 0) && currentTime <= ((lastIntro.startTime || 0) + (lastIntro.duration || 999999)) ? 'block' : 'none' }}>
                        <IntroSequenceRenderer el={lastIntro} currentTime={currentTime} />
                    </div>
                );
            })()}
            
            {(() => {
                const outroSequences = objects ? objects.filter(el => el.name === 'Outro Sequence') : [];
                const lastOutro = outroSequences.length > 0 ? outroSequences[outroSequences.length - 1] : null;
                return lastOutro && lastOutro.visible !== false && (
                    <div key={lastOutro.id} className="absolute inset-0 pointer-events-none z-[9999]" style={{ display: currentTime >= (lastOutro.startTime || 0) && currentTime <= ((lastOutro.startTime || 0) + (lastOutro.duration || 999999)) ? 'block' : 'none' }}>
                        <IntroSequenceRenderer el={lastOutro} currentTime={currentTime} isOutro={true} />
                    </div>
                );
            })()}
        </div>
    );
}

