import React, { useState, useEffect } from 'react';
import PlaylistRenderer from '../../../components/m3/widgets/PlaylistRenderer';
import SubtitleRenderer from '../../../components/m3/widgets/SubtitleRenderer';
import SocialWidgetRenderer from '../../../components/m3/widgets/SocialWidgetRenderer.jsx';
import RealtimeEffectRenderer from '../../../components/m3/renderers/RealtimeEffectRenderer';
import VisualizerRenderer from '../../../components/m3/widgets/VisualizerRenderer';
import Visualizer2Renderer from '../../../components/m3/widgets/Visualizer2Renderer';
import Visualizer3Renderer from '../../../components/m3/widgets/Visualizer3Renderer';
import VisualizerV4Renderer from '../../../components/m3_v2/widgets/VisualizerV4Renderer';
import VisualizerV5Renderer from '../../../components/m3_v2/widgets/VisualizerV5Renderer';
import ParticleRenderer from '../../../components/m3/widgets/ParticleRenderer';
import IntroSequenceRenderer from '../../../components/m3/widgets/IntroSequenceRenderer';
import ProceduralSpeaker from '../../../components/m3/overlays/ProceduralSpeaker';
import { renderFrameStore } from '../runtime/RenderFrameStore';
import { beatEngine } from '../../audio/BeatEngine';
import { fastWorkspaceManager } from '../fastrender/workspace/FastWorkspaceManager.js';
import { seededNoiseAdapter } from '../fastrender/core/SeededNoiseAdapter.js';
import { DeterministicMotionEngine } from '../../audio/DeterministicMotionEngine.js';

import { RenderContextAdapter } from '../../../engine/adapters/RenderContextAdapter.js';
import { AudioStateAdapter } from '../../../engine/adapters/AudioStateAdapter.js';
import { pipelineRouter } from '../../../engine/pipeline/PipelineRouter.js';
import { experimentalCanvasLayer } from '../../../engine/pipeline/ExperimentalCanvasLayer.js';
import { referencePreviewDriver } from '../../../engine/pipeline/ReferencePreviewDriver.js';

export default function MediaFactoryRenderer({ 
    frame: propFrame, 
    renderContext: propRenderContext,
    renderMode = 'Preview', 
    workspaceRenderMode,
    targetRef,
    onPointerDown,
    handleHandleDown,
    m3SelectedObjectId
}) {
    const isThumbnailMode = renderMode === 'thumbnail' || renderMode === 'Thumbnail';
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

    // Passive Standby AudioState & RenderContext for Sprint 14 (PASS-THROUGH ONLY)
    const activeAudioState = frame?.states?.audioState || AudioStateAdapter.createFromFrame(frame?.states);
    const activeRenderContext = propRenderContext || frame?.states?.renderContext || RenderContextAdapter.createFromFrame(frame);

    // Sprint 14 Official Preview Swap Driver Hook (Default: LEGACY_ACTIVE when useReferenceEngine = false)
    const driverResult = referencePreviewDriver.renderPreviewFrame(activeRenderContext, null);
    const _g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
    if (!_g._sprint14Logged) {
        _g._sprint14Logged = true;
        console.log(`================================================================================`);
        console.log(`[Sprint 14 Official Preview Swap Driver] Driver Mode: ${driverResult.driverMode}`);
        console.log(`  -> Reference Engine Active = ${driverResult.isReferenceActive}`);
        console.log(`  -> Legacy Driver Active    = ${driverResult.useLegacyDriver}`);
        console.log(`  -> Instant Rollback Status = READY (Zero App Restart Required)`);
        console.log(`================================================================================`);
    }

    // Experimental Offscreen Canvas Execution (Standby Inspection)
    const activeRoute = pipelineRouter.resolveActivePipeline(activeRenderContext);
    if (activeRoute.pipeline && activeRoute.pipeline.status === 'READY') {
        activeRoute.pipeline.renderExperimental(experimentalCanvasLayer);
    }





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

                const isThumbnailMode = renderMode === 'thumbnail' || renderMode === 'Thumbnail';
                if (isThumbnailMode) {
                    const isDynamicType = el.type === 'visualizer' || el.type === 'visualizer2' || el.type === 'visualizer3' || el.type === 'visualizer4' || el.type === 'visualizer5' || el.type === 'particle' || el.type === 'effect' || el.type === 'procedural-speaker' || el.mediaType === 'procedural';
                    if (isDynamicType) return null;
                }
                
                // Hide non-branding elements during Intro
                if (isIntroPlaying) {
                    const isBranding = el.name === 'Brand Logo' || el.name === 'Watermark' || el.name === 'Subscribe Animation' || el.type === 'social-widget';
                    if (!isBranding) return null;
                }
                
                const start = el.startTime || 0;
                const end = start + (el.duration || 999999);
                if (currentTime < start || currentTime > end) return null;

                if (el.type === 'subtitle') {
                    if (isThumbnailMode) return null;
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
                if (!isThumbnailMode && (el.beatZoom || el.beatPump) && el.type !== 'procedural-speaker' && el.mediaType !== 'procedural') {
                    const b = beatEngine.getState() || { bass: 0, mid: 0, treble: 0, energy: 0 };
                    const objTf = DeterministicMotionEngine.calculateObjectTransform(currentTime, el, b);
                    mScale = objTf.finalScale - (el.scale !== undefined ? el.scale : 1);
                    mSwayX = objTf.swayX;
                    mSwayY = objTf.swayY;
                    mRotate = objTf.finalRotation - (el.rotation || 0);
                }

                const finalScale = (el.scale !== undefined ? el.scale : 1) + mScale;
                const finalRotate = (el.rotation || 0) + mRotate;

                const isParticle = el.type === 'particle';
                const isParticleOrEffect = isParticle || el.type === 'effect' || el.pointerEvents === 'none';
                const isSelected = m3SelectedObjectId === el.id;
                const isInteractive = !isParticleOrEffect && !el.locked;

                const isVisualizerObj = el.type === 'visualizer' || el.type === 'visualizer2' || el.type === 'visualizer3';
                const computedLeft = isVisualizerObj && (el.x === 0 || !el.x || el.x === '0' || el.x === '0px')
                    ? '50%'
                    : (typeof el.x === 'string' && el.x.includes('%') ? el.x : (el.x || 0) + 'px');

                return (
                    <React.Fragment key={el.id}>
                        <div
                            id={`canvas-obj-${el.id}`}
                            onPointerDown={isInteractive && onPointerDown ? (e) => onPointerDown(e, el.id) : undefined}
                            className={`absolute pointer-events-none ${isInteractive ? 'cursor-move' : 'cursor-default'} transition-shadow ${isSelected && !isParticle ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent z-40' : (isInteractive ? 'hover:ring-1 hover:ring-white/50 z-30' : 'z-10')}`}
                            style={{
                                left: computedLeft,
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
                                zIndex: el.layer || (el.type === 'particle' ? 2 : 10),
                                pointerEvents: isInteractive ? 'auto' : 'none'
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
                                    <VisualizerRenderer config={el} id={el.id} currentTime={currentTime} audioState={activeAudioState} />
                                </div>
                            )}
                            {el.type === 'visualizer2' && (
                                <div className="w-full h-full">
                                    <Visualizer2Renderer config={el} id={el.id} currentTime={currentTime} audioState={activeAudioState} />
                                </div>
                            )}
                            {el.type === 'visualizer3' && (
                                <div className="w-full h-full">
                                    <Visualizer3Renderer config={el} id={el.id} currentTime={currentTime} audioState={activeAudioState} />
                                </div>
                            )}
                            {el.type === 'visualizer4' && (
                                <div className="w-full h-full">
                                    <VisualizerV4Renderer object={{ ...el, renderMode: (workspaceRenderMode ? workspaceRenderMode.toLowerCase() : (el.renderMode || 'normal')) }} currentTimeSec={currentTime} width={el.width} height={el.height} />
                                </div>
                            )}
                            {el.type === 'visualizer5' && (
                                <div className="w-full h-full">
                                    <VisualizerV5Renderer object={{ ...el, renderMode: (workspaceRenderMode ? workspaceRenderMode.toLowerCase() : (el.renderMode || 'normal')) }} currentTimeSec={currentTime} width={el.width} height={el.height} />
                                </div>
                            )}
                            {el.type === 'particle' && (
                                <div className="w-full h-full">
                                    <ParticleRenderer config={el} id={el.id} />
                                </div>
                            )}
                            {(el.type === 'procedural-speaker' || el.mediaType === 'procedural') && (
                                <div className="w-full h-full relative" style={{ mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase() }}>
                                    <ProceduralSpeaker 
                                        opacity={(el.opacity !== undefined ? el.opacity : 100) / 100} 
                                        speed={el.playbackRate !== undefined ? el.playbackRate : (el.speed !== undefined ? el.speed : 1.0)} 
                                        color={el.color || '#00ffcc'} 
                                        rings={0} 
                                        model={el.model || 'studio'}
                                        pumpIntensity={el.pumpIntensity !== undefined ? el.pumpIntensity : 2.5}
                                        audioReactive={el.audioReactive !== false} 
                                        width={el.width || 700}
                                        height={el.height || 700}
                                    />
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

