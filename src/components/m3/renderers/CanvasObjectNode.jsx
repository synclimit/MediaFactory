import React from 'react';
import PlaylistRenderer from '../widgets/PlaylistRenderer';
import SubtitleRenderer from '../widgets/SubtitleRenderer';
import SocialWidgetRenderer from '../widgets/SocialWidgetRenderer.jsx';
import VisualizerRenderer from '../widgets/VisualizerRenderer.jsx';
import Visualizer2Renderer from '../widgets/Visualizer2Renderer.jsx';
import ChromaKeyImage from '../widgets/ChromaKeyImage';
import ChromaKeyVideo from '../widgets/ChromaKeyVideo';
import ProceduralSpeaker from '../overlays/ProceduralSpeaker';
import { reactiveObjectProcessor } from '../../../services/audio/ReactiveObjectProcessor';
import { interactionStore, useInteractionStore } from '../../../services/interaction/InteractionStore';

// SmartVideoRenderer handles both regular and chroma key videos, with support for display intervals
const SmartVideoRenderer = ({ el }) => {
    const [visible, setVisible] = React.useState(true);
    const videoRef = React.useRef(null);
    const timeoutRef = React.useRef(null);

    React.useEffect(() => {
        if (!el.useInterval) {
            setVisible(true);
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setVisible(false);
            const delay = (el.intervalSeconds || 60) * 1000;
            timeoutRef.current = setTimeout(() => {
                setVisible(true);
                if (video) {
                    video.currentTime = 0;
                    video.play().catch(e => console.log('Autoplay prevented', e));
                }
            }, delay);
        };

        video.addEventListener('ended', handleEnded);
        return () => {
            video.removeEventListener('ended', handleEnded);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [el.useInterval, el.intervalSeconds]);

    // Attach ref to child video elements
    const handleVideoRef = (node) => {
        if (!node) return;
        // If the node is a video (standard video)
        if (node.tagName === 'VIDEO') {
            videoRef.current = node;
        } 
        // If the node is a wrapper (ChromaKeyVideo), find the video inside it
        else if (node.querySelector) {
            const innerVideo = node.querySelector('video');
            if (innerVideo) {
                videoRef.current = innerVideo;
            }
        }
    };

    if (!el.source) return null;

    const isChromaKey = el.chromaKey !== undefined ? el.chromaKey : (el.chromaKeyEnable !== undefined ? el.chromaKeyEnable : (el.blend === 'Screen' || (el.source || '').toLowerCase().endsWith('.mp4') || (el.source || '').toLowerCase().endsWith('.mov')));
    const chromaColor = el.chromaKeyColor || el.keyColor || '#000000';
    const chromaTol = el.chromaKeyTolerance !== undefined ? el.chromaKeyTolerance : (el.similarity !== undefined ? el.similarity * 100 : 35);

    return (
        <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', width: '100%', height: '100%' }} ref={handleVideoRef}>
            {isChromaKey ? (
                <ChromaKeyVideo src={el.source} keyColor={chromaColor} tolerance={chromaTol} className="w-full h-full object-contain pointer-events-none" />
            ) : (
                <video src={el.source} autoPlay loop={!el.useInterval} muted className="w-full h-full object-contain pointer-events-none" />
            )}
        </div>
    );
};

const IntroSequenceRenderer = ({ el, currentTime }) => {
    const animation = el.animation || 'None';
    if (animation === 'None') return null;

    const paragraphCount = el.paragraphCount === undefined ? 1 : el.paragraphCount;
    let paragraphs = [];
    let cumulativeTime = 0;

    if (paragraphCount === 0) {
        const durStr = el.introDuration || '3s';
        cumulativeTime = parseFloat(durStr) || 3;
    } else {
        for (let i = 1; i <= paragraphCount; i++) {
            const text = el[`paragraph${i}Text`] || '';
            const durStr = el[`paragraph${i}Duration`] || '3s';
            const dur = parseFloat(durStr) || 3;
            paragraphs.push({ text, duration: dur, start: cumulativeTime, end: cumulativeTime + dur });
            cumulativeTime += dur;
        }
    }

    const totalDuration = cumulativeTime;
    const isFinished = currentTime > totalDuration;

    const blurAmount = el.blurAmount || 0;
    const overlayDarkness = (el.overlayDarkness || 0) / 100;
    const screenTransition = el.screenTransition || 'None';

    // Handle screen transition (fade out the entire intro sequence at the end)
    let globalOpacity = 1;
    if (isFinished) {
        return null;
    }
    
    // Screen transition applied near the end of the total duration
    const timeLeft = totalDuration - currentTime;
    if (timeLeft < 1 && (screenTransition === 'Fade to Black' || screenTransition === 'Fade to White' || screenTransition === 'Dissolve' || screenTransition === 'Crossfade')) {
        globalOpacity = timeLeft; // Fades out the intro sequence overlay over the last 1 second
    }

    // Find active paragraph
    const activeIndex = paragraphs.findIndex(p => currentTime >= p.start && currentTime < p.end);
    const activeParagraph = activeIndex >= 0 ? paragraphs[activeIndex] : null;

    let textElement = null;

    if (activeParagraph && activeParagraph.text) {
        const pLocalTime = currentTime - activeParagraph.start;
        const progress = Math.min(1, pLocalTime / activeParagraph.duration);

        // Typing effect
        let renderText = activeParagraph.text;
        if (animation === 'Cinematic Typing' || animation === 'Text Reveal') {
            const charCount = Math.floor(progress * renderText.length * 2); // 2x speed so it finishes typing before end
            renderText = renderText.substring(0, charCount);
        }

        let textOpacity = 1;
        if (animation === 'Fade In' || animation === 'Cinematic Fade' || animation === 'Paragraph Reveal') {
            if (pLocalTime < 1) textOpacity = pLocalTime;
            else if (activeParagraph.duration - pLocalTime < 1) textOpacity = activeParagraph.duration - pLocalTime;
        }

        textElement = (
            <div style={{
                fontFamily: el.fontFamily || 'Segoe UI',
                color: el.textColor || '#ffffff',
                textAlign: (el.textAlign || 'center').toLowerCase(),
                fontSize: '4vw',
                opacity: textOpacity,
                whiteSpace: 'pre-wrap',
                textShadow: '0 4px 10px rgba(0,0,0,0.8)',
                zIndex: 2,
                transform: animation === 'Slide Up' || animation === 'Pop' ? `translateY(${Math.max(0, 20 * (1 - pLocalTime))}px)` : 'none'
            }}>
                {renderText}
            </div>
        );
    }

    // Background transition color based on screen transition
    let bgColor = `rgba(0,0,0,${overlayDarkness})`;
    if (timeLeft < 1) {
        if (screenTransition === 'Fade to Black') bgColor = `rgba(0,0,0,${Math.min(1, overlayDarkness + (1 - timeLeft))})`;
        if (screenTransition === 'Fade to White') bgColor = `rgba(255,255,255,${1 - timeLeft})`;
    }

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            WebkitBackdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            backgroundColor: bgColor,
            opacity: globalOpacity,
            transition: 'background-color 0.1s linear, opacity 0.1s linear',
            pointerEvents: 'none',
            zIndex: 9999
        }}>
            {textElement}
        </div>
    );
};


const CanvasObjectNode = React.memo(({
    rawConfig,
    frame,
    renderMode,
    currentTime,
    isDuringIntro,
    m3SelectedObjectId,
    onPointerDown,
    handleHandleDown
}) => {
    // Subscribe to transient interaction state exclusively at the leaf level
    useInteractionStore();
    
    // Resolve the transform coordinates based on current drag state
    const el = interactionStore.resolveTransform(rawConfig);

    if (!el.visible && renderMode !== 'Export') return null;
    if (!el.visible) return null;
    
    const start = el.startTime || 0;
    const end = start + (el.duration || 999999);
    if (currentTime < start || currentTime > end) return null;

    if (isDuringIntro) {
        const isBrandingEl = el.isBranding || ['branding_intro', 'branding_outro'].includes(el.id);
        if (!isBrandingEl) return null;
    }



    if (el.type === 'subtitle') {
        return (
            <div className="absolute inset-0 pointer-events-none z-40" style={{ left: '50%', top: '50%' }}>
                <SubtitleRenderer config={el} id={el.id} frame={frame} onPointerDown={onPointerDown} />
            </div>
        );
    }

    let baseScaleX = el.scale !== undefined ? el.scale / 100 : (el.transform?.scale !== undefined ? el.transform.scale / 100 : 1);
    let baseScaleY = el.scaleY !== undefined ? el.scaleY / 100 : baseScaleX;
    
    let effectiveScaleX = baseScaleX;
    let effectiveScaleY = baseScaleY;
    
    if (el.isBranding && el.animationType && el.animationType !== 'None') {
        const intensity = (el.animationIntensity !== undefined ? el.animationIntensity : 100) / 100;
        const reactiveVal = reactiveObjectProcessor.getValue(el.id);
        
        let addition = 0;
        if (el.animationType === 'Zoom Pulse') {
            addition = reactiveVal * 0.6 * intensity;
        } else if (el.animationType === 'Jedag Jedug') {
            addition = reactiveVal * 1.5 * intensity;
        } else {
            addition = reactiveVal * intensity;
        }

        const maxZ = el.maxZoom !== undefined ? el.maxZoom / 100 : 1.5;
        addition = Math.min(addition, Math.max(0, maxZ - 1));
        
        effectiveScaleX = baseScaleX * (1 + addition);
        effectiveScaleY = baseScaleY * (1 + addition);
    }

    const perspectiveVal = el.perspective !== undefined ? Math.max(100, (200 - el.perspective) * 10) : 1000;

    let renderX = el.x;
    let renderY = el.y;
    let renderW = (el.type === 'text' || el.type === 'playlist' || el.type === 'track_list_column') ? null : (el.width || 150);
    let renderH = (el.type === 'text' || el.type === 'playlist' || el.type === 'track_list_column') ? null : (el.height || 150);
    if (el.isBranding) {
        if (typeof renderX === 'number' && (renderX > 600 || renderY > 350 || renderX < 10 || renderY < 10)) {
            renderX = 400;
            renderY = 225;
        }
        if (typeof renderW === 'number' && renderW > 400) {
            renderW = 320;
            renderH = 180;
        }
    }

    const formatSize = (val) => {
        if (!val) return 'max-content';
        return String(val).includes('%') ? val : `${val}px`;
    };

    const isIntroOutro = el.name === 'Intro Sequence' || el.name === 'Outro Sequence';

    return (
        <div
            id={`canvas-obj-${el.id}`}
            onPointerDown={onPointerDown && !isIntroOutro ? (e) => onPointerDown(e, el.id) : undefined}
            className={`absolute pointer-events-auto transition-shadow ${el.locked || isIntroOutro ? 'cursor-default' : 'cursor-move'} ${m3SelectedObjectId === el.id && !isIntroOutro ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent z-40' : (isIntroOutro ? 'z-[9999]' : 'hover:ring-1 hover:ring-white/50 z-30')}`}
            style={isIntroOutro ? {
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                opacity: 1,
                transform: 'none',
                backgroundColor: 'transparent',
                display: 'block',
                zIndex: 9999
            } : {
                left: formatSize(renderX),
                top: formatSize(renderY),
                width: formatSize(renderW),
                height: formatSize(renderH),
                opacity: (el.opacity !== undefined ? el.opacity : 100) / 100,
                transform: `translate(-50%, -50%) perspective(${perspectiveVal}px) rotate(${el.rotation || 0}deg) scale(${effectiveScaleX}, ${effectiveScaleY}) rotateX(${el.tiltX || 0}deg) rotateY(${el.tiltY || 0}deg) rotateZ(${el.tiltZ || 0}deg) translateZ(${el.depth || 0}px)`,
                transformOrigin: 'center',
                marginLeft: el.isBranding ? '0px' : ((renderW ? renderW / 2 : 0) + 'px'),
                marginTop: el.isBranding ? '0px' : ((renderH ? renderH / 2 : 0) + 'px'),
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
                filter: el.shadow ? `drop-shadow(0px 10px ${el.shadow}px rgba(0,0,0,0.5))` : undefined
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
                    borderRadius: el.shapeMode === 'Circle' ? '50%' : (el.shapeMode === 'Rounded Rect' ? '20px' : '0'),
                    overflow: 'hidden',
                    border: el.stroke ? '2px solid white' : 'none'
                }}>
                    {el.source ? (
                        (el.chromaKeyEnable || el.chromaKey) ? (
                            <ChromaKeyImage src={el.source} keyColor={el.chromaKeyColor || el.keyColor || '#00ff00'} tolerance={el.chromaKeyTolerance || (el.similarity !== undefined ? el.similarity * 100 : 15)} className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                            <img src={el.source} alt={el.name} className="w-full h-full object-cover pointer-events-none" />
                        )
                    ) : null}
                </div>
            )}
            {el.type === 'video' && (
                <div className="w-full h-full relative" style={isIntroOutro ? {} : { 
                    mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase(),
                    borderRadius: el.shapeMode === 'Circle' ? '50%' : (el.shapeMode === 'Rounded Rect' ? '20px' : '0'),
                    overflow: 'hidden',
                    border: el.stroke ? '2px solid white' : 'none'
                }}>
                    {isIntroOutro ? (
                        <IntroSequenceRenderer el={el} currentTime={currentTime} />
                    ) : (
                        <SmartVideoRenderer el={el} />
                    )}
                </div>
            )}
            {el.type === 'social-widget' && <SocialWidgetRenderer config={el} currentTime={currentTime} />}
            {el.type === 'visualizer' && <VisualizerRenderer config={el} currentTime={currentTime} audioState={frame?.states?.audioState} />}
            {el.type === 'visualizer2' && <Visualizer2Renderer config={el} id={el.id} currentTime={currentTime} audioState={frame?.states?.audioState} />}
            {el.type === 'playlist' && <PlaylistRenderer config={el} id={el.id} frame={frame} />}
            {(el.type === 'procedural-speaker' || el.mediaType === 'procedural') && (
                <div className="w-full h-full relative" style={{ mixBlendMode: el.blend === 'Normal' ? 'normal' : el.blend?.toLowerCase() }}>
                    <ProceduralSpeaker 
                        opacity={(el.opacity !== undefined ? el.opacity : 100) / 100} 
                        speed={el.playbackRate !== undefined ? el.playbackRate : (el.speed !== undefined ? el.speed : 1.0)} 
                        color={el.color || '#00ffcc'} 
                        rings={0} 
                        model={el.model || 'studio'}
                        audioReactive={el.audioReactive !== false} 
                        width={el.width || 700}
                        height={el.height || 700}
                    />
                </div>
            )}

            {m3SelectedObjectId === el.id && !el.locked && !isIntroOutro && handleHandleDown && (
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
}, (prev, next) => {
    // Only re-render if rawConfig reference changed or other primitive props changed
    // Since we isolated the InteractionStore subscription to this component,
    // the parent won't trigger re-renders on drag.
    return prev.rawConfig === next.rawConfig &&
           prev.currentTime === next.currentTime &&
           prev.isDuringIntro === next.isDuringIntro &&
           prev.m3SelectedObjectId === next.m3SelectedObjectId &&
           prev.frame === next.frame; // Important: frame identity should be stable when just playing
});

export default CanvasObjectNode;
