import React, { useState, useEffect, useRef } from 'react';
import { beatEngine } from '../../services/audio/BeatEngine';
import { motionEngine } from '../../services/audio/MotionEngine';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3Statistics from './M3Statistics.jsx';
import RealtimeEffectRenderer from './renderers/RealtimeEffectRenderer';
import PreviewRoot from './renderers/PreviewRoot';
import SocialWidgetRenderer from './widgets/SocialWidgetRenderer.jsx';
import PlaylistRenderer from './widgets/PlaylistRenderer';
import SubtitleRenderer from './widgets/SubtitleRenderer';
import { fontLibrary } from '../../services/FontLibrary';
import { reactiveEngine } from '../../services/audio/ReactiveEngine';
import { reactiveObjectProcessor } from '../../services/audio/ReactiveObjectProcessor';
import { renderFrameStore } from '../../services/pipeline/runtime/RenderFrameStore';
import { subtitleReactiveAdapter } from '../../services/subtitle/SubtitleReactiveAdapter';
import { subtitleEffectEngine } from '../../services/subtitle/SubtitleEffectEngine';
import { subtitlePlaybackEngine } from '../../services/subtitle/SubtitlePlaybackEngine';
import { subtitleAnimationEngine } from '../../services/subtitle/animation/SubtitleAnimationEngine';
import { requestFrame } from '../../services/pipeline/scheduler/RenderScheduler.js';
import ProductionQAToolkit from './ProductionQAToolkit.jsx';
import MediaFactoryRenderer from '../../services/pipeline/renderer/MediaFactoryRenderer';
import ReferencePreviewCanvas from './ReferencePreviewCanvas.jsx';

import { emitRuntimeEvent } from '../../services/RuntimeClient';

import { bootstrapPipeline } from '../../services/pipeline/PipelineBootstrap';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../services/pipeline/fastrender/core/FastRenderState.js';


// New FX Engines
import FilmFXEngine from './engines/FilmFXEngine';
import AtmosphereEngine from './engines/AtmosphereEngine';
import LightPulseEngine from './engines/LightPulseEngine';
import StageLightEngine from './engines/StageLightEngine';
import LaserEngine from './engines/LaserEngine';
import { createScheduler } from '../../services/pipeline/scheduler/RenderScheduler.js';
import { DeterministicMotionEngine } from '../../services/audio/DeterministicMotionEngine.js';

export const previewScheduler = createScheduler({ fps: 30, frameCount: 300, width: 1920, height: 1080 });

const CanvasKitPreviewAdapter = ({
  config,
  currentTimeSec = 0,
  fps = 30,
  frameCount = 300,
  width = 1920,
  height = 1080
}) => {
  const canvasRef = useRef(null);
  const imageDataRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let animationId;
    let isRendering = false;

    const renderLoop = async () => {
      if (isRendering) return;
      isRendering = true;

      try {
        const frameWidth = width || canvas.width || 1920;
        const frameHeight = height || canvas.height || 1080;

        // Frame index supplied strictly by playback clock prop
        const frameIndex = Math.floor((currentTimeSec || 0) * fps);

        // Request frame exclusively through instance-based previewScheduler
        const res = await previewScheduler.requestFrame(frameIndex, {
          frameCount,
          width: frameWidth,
          height: frameHeight,
          visualizerConfig: config
        });

        if (res && res.rgbaBuffer) {
          // Reuse persistent ImageData buffer to eliminate V8 GC allocation pressure
          if (!imageDataRef.current || imageDataRef.current.width !== frameWidth || imageDataRef.current.height !== frameHeight) {
            imageDataRef.current = ctx.createImageData(frameWidth, frameHeight);
          }

          imageDataRef.current.data.set(res.rgbaBuffer);
          ctx.putImageData(imageDataRef.current, 0, 0);
        }
      } catch (err) {
        console.error('[CanvasKitPreviewAdapter Error]', err);
      } finally {
        isRendering = false;
        animationId = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [config, currentTimeSec, fps, frameCount, width, height]);

  return (
    <div className="w-full h-full pointer-events-none">
      <canvas ref={canvasRef} width={width} height={height} className="w-full h-full block" />
    </div>
  );
};

export default function M3PreviewCanvas({ m3BgPool, m3AudioTracks = [], m3CurrentTrackIndex = 0, m3Objects, setM3Objects, m3SelectedObjectId, setM3SelectedObjectId, canvasMode = 'composer', m3CurrentTimeSec = 0, m3TotalDurationSec = 1, setM3CurrentTimeSec, m3EstRenderTimeSec, m3EstStorageMb, analyser, children }) {
  const containerRef = useRef(null);
  const effectTargetRef = useRef(null);
  const [canvasStyle, setCanvasStyle] = useState({ width: 800, height: 450 });
  const [dragState, setDragState] = useState({ isDragging: false, action: 'drag', handle: '', id: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0, subTarget: null });
  const bgMediaRef = useRef(null);
  const latestBgPoolRef = useRef(m3BgPool);

  useEffect(() => {
    fontLibrary.initialize();
  }, []);

  useEffect(() => {
    const src = analyser || (typeof window !== 'undefined' ? window.m3Analyser : null);
    if (src) {
      beatEngine.setSource(src);
    }
  }, [analyser]);

  // Extract FX Engine Configs
  const getEngineConfig = (type) => m3Objects.find(o => o.type === type)?.config || { enabled: false };
  const cg = getEngineConfig('engine-colorgrading');
  const colorGradingStyle = cg.enabled ? {
    filter: `brightness(${cg.brightness || 100}%) contrast(${cg.contrast || 100}%) saturate(${cg.saturation || 100}%) hue-rotate(${cg.hueRotate || 0}deg) sepia(${cg.sepia || 0}%)`
  } : {};

    const latestObjectsRef = useRef(m3Objects);
    useEffect(() => {
        latestObjectsRef.current = m3Objects;
    }, [m3Objects]);

    useEffect(() => {
        latestBgPoolRef.current = m3BgPool;
    }, [m3BgPool]);

    const currentTimeSecRef = useRef(m3CurrentTimeSec);
    useEffect(() => { currentTimeSecRef.current = m3CurrentTimeSec; }, [m3CurrentTimeSec]);

    const totalDurationSecRef = useRef(m3TotalDurationSec);
    useEffect(() => { totalDurationSecRef.current = m3TotalDurationSec; }, [m3TotalDurationSec]);

    const audioTracksRef = useRef(m3AudioTracks);
    useEffect(() => { audioTracksRef.current = m3AudioTracks; }, [m3AudioTracks]);

    const currentTrackIndexRef = useRef(m3CurrentTrackIndex);
    useEffect(() => { currentTrackIndexRef.current = m3CurrentTrackIndex; }, [m3CurrentTrackIndex]);

    useEffect(() => {
        window.m3Diagnostics = window.m3Diagnostics || {};
        let animId;
        let lastTime = performance.now();
        let smoothedMotion = { zoom: 0, swayX: 0, swayY: 0, rotate: 0 };
        let shakeTimeX = Math.random() * 1000;
        let shakeTimeY = Math.random() * 1000;
        
        // --- Pipeline Bootstrap ---
        const { pipeline, timeline, frameInput } = bootstrapPipeline();

        subtitleReactiveAdapter.connect();

        motionEngine.setChannelConfig('zoom', {
            profileKey: 'zoom_pulse',
            maxScale: 0.12,
        });

        const loop = () => {
            animId = requestAnimationFrame(loop);
            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            // Ensure beatEngine has live Analyser source
            if (!beatEngine.analyser && (analyser || (typeof window !== 'undefined' && window.m3Analyser))) {
                beatEngine.setSource(analyser || window.m3Analyser);
            }

            // --- Render Pipeline & Audio DSP Runtime ---
            beatEngine.update(Boolean(window.m3IsPlaying));
            frameInput.setInputs(latestObjectsRef.current || [], { 
                canvasMode, 
                currentTimeSec: currentTimeSecRef.current, 
                totalDurationSec: totalDurationSecRef.current,
                m3AudioTracks: audioTracksRef.current,
                m3CurrentTrackIndex: currentTrackIndexRef.current
            });

            if (window.m3IsPlaying && !timeline.clock.isPlaying) timeline.play();
            if (!window.m3IsPlaying && timeline.clock.isPlaying) timeline.pause();
            timeline.tick();


            pipeline.update();
            const frame = pipeline.getFrame();
            
            // --- BG Dance (Hardware Accelerated) ---
            if (bgMediaRef.current && latestBgPoolRef.current && latestBgPoolRef.current.length > 0) {
                const bg = latestBgPoolRef.current[0];
                const s = bg.settings || {};
                const danceMode = s.danceMode || 'Off';
                const intensity = (s.danceIntensity !== undefined ? s.danceIntensity : 100) / 100;
                
                let baseScale = 1 + ((s.backgroundZoom || 0) / 100);
                let currentHPos = s.horizontalPosition || 0;
                let currentVPos = s.verticalPosition || 0;
                let currentRotation = 0;

                if (canvasMode === 'thumbnail') {
                    bgMediaRef.current.style.transform = `scale(${baseScale}) translate(${currentHPos}%, ${currentVPos}%) rotate(0deg)`;
                } else {
                    const renderingContext = fastWorkspaceManager.getRenderingContext({
                        m3BgPool: latestBgPoolRef.current,
                        m3AudioTracks: audioTracksRef.current,
                        m3Objects: latestObjectsRef.current
                    }, currentTimeSecRef.current);

                    if (renderingContext.isFastWorkspace) {
                        const adaptedBg = renderingContext.adaptObject(bg, currentTimeSecRef.current);
                        const shake = adaptedBg.adaptedObject?._shake || { x: 0, y: 0, rotation: 0 };
                        baseScale += (adaptedBg.adaptedObject?._pulseScale || 0);
                        currentHPos += shake.x;
                        currentVPos += shake.y;
                        currentRotation += shake.rotation;
                    } else if (danceMode !== 'Off') {
                        const bs = beatEngine.getState() || {};
                        const tf = DeterministicMotionEngine.calculateBackgroundTransform(currentTimeSecRef.current, s, bs);
                        bgMediaRef.current.style.transform = `scale(${tf.scale}) translate(${tf.hPos}%, ${tf.vPos}%) rotate(${tf.rotation}deg)`;
                    }
            }
            }
            // -----------------------------

            window.m3Diagnostics.frameTime = timeline.deltaTime * 1000;
            window.m3Diagnostics.fps = timeline.deltaTime > 0 ? 1 / timeline.deltaTime : 0;
            window.m3Diagnostics.frameNumber = frame.metadata.frameNumber;
        };
        loop();
        return () => {
            cancelAnimationFrame(animId);
            subtitleReactiveAdapter.disconnect();
            pipeline.shutdown();
            timeline.shutdown();
        };
    }, []);


  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e, id, subTarget = null) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setM3SelectedObjectId(id);
    const obj = m3Objects.find(o => o.id === id);
    if (obj && !obj.locked) {
      const startX = e.clientX;
      const startY = e.clientY;
      let origX = obj.x;
      let origY = obj.y;
      
      // If it's a playlist sub-target (like 'col_0')
      if (subTarget && subTarget.startsWith('col_')) {
        const colIndex = parseInt(subTarget.split('_')[1], 10);
        const transformProp = colIndex === 0 ? 'leftTransform' : 'rightTransform';
        const transform = obj[transformProp] || { x: 0, y: 0 };
        origX = transform.x;
        origY = transform.y;
      }
      
      if (typeof origX === 'string' && origX.includes('%')) origX = (parseFloat(origX) / 100) * 1920;
      if (typeof origY === 'string' && origY.includes('%')) origY = (parseFloat(origY) / 100) * 1080;
      
      let origW = obj.width || 100;
      let origH = obj.height || 100;
      if (typeof origW === 'string' && origW.includes('%')) origW = (parseFloat(origW) / 100) * 1920;
      if (typeof origH === 'string' && origH.includes('%')) origH = (parseFloat(origH) / 100) * 1080;

      setDragState({ 
          isDragging: true, 
          action: 'drag', 
          handle: '', 
          id, 
          subTarget,
          startX, 
          startY, 
          origX, 
          origY, 
          origW, 
          origH 
      });
    }
  };

  const handleHandleDown = (e, id, handle) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setM3SelectedObjectId(id);
    const obj = m3Objects.find(o => o.id === id);
    if (obj && !obj.locked) {
      let trueW = obj.width;
      let trueH = obj.height;
      if (typeof trueW === 'string' && trueW.includes('%')) trueW = (parseFloat(trueW) / 100) * 1920;
      if (typeof trueH === 'string' && trueH.includes('%')) trueH = (parseFloat(trueH) / 100) * 1080;

      if (obj.type === 'text' || obj.type === 'playlist') {
        const domNode = document.getElementById(`canvas-obj-${id}`);
        if (domNode) {
            const rect = domNode.getBoundingClientRect();
            const scale = canvasStyle.width / 1920;
            trueW = rect.width / scale;
            trueH = rect.height / scale;
        }
      }
      let origX = obj.x;
      let origY = obj.y;
      if (typeof origX === 'string' && origX.includes('%')) origX = (parseFloat(origX) / 100) * 1920;
      if (typeof origY === 'string' && origY.includes('%')) origY = (parseFloat(origY) / 100) * 1080;

      setDragState({ isDragging: true, action: 'resize', handle, id, startX: e.clientX, startY: e.clientY, origX, origY, origW: trueW || 100, origH: trueH || 100, origFontSize: obj.fontSize || 64, origScale: obj.scale || 1, origPlaylistWidth: trueW || 800 });
    }
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging || !dragState.id) return;
    const scale = canvasStyle.width / 1920;
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;
    
    setM3Objects(prev => prev.map(o => {
      if (o.id !== dragState.id) return o;
      if (dragState.action === 'drag') {
        const pOrigX = parseFloat(dragState.origX) || 0;
        const pOrigY = parseFloat(dragState.origY) || 0;
        
        if (dragState.subTarget && dragState.subTarget.startsWith('col_')) {
            const colIndex = parseInt(dragState.subTarget.split('_')[1], 10);
            const transformProp = colIndex === 0 ? 'leftTransform' : 'rightTransform';
            const currentTransform = o[transformProp] || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100 };
            
            return { 
                ...o, 
                [transformProp]: {
                    ...currentTransform,
                    x: pOrigX + dx,
                    y: pOrigY + dy
                }
            };
        } else {
            return { ...o, x: pOrigX + dx, y: pOrigY + dy };
        }
      } else if (dragState.action === 'resize') {
        let { origX, origY, origW, origH, handle } = dragState;
        origX = parseFloat(origX) || 0;
        origY = parseFloat(origY) || 0;
        origW = parseFloat(origW) || 100;
        origH = parseFloat(origH) || 100;
        
        let nx = origX, ny = origY, nw = origW, nh = origH;
        
        // Top-left anchored math (assuming x, y are center coordinates)
        if (handle.includes('e')) {
            nw = Math.max(10, origW + dx);
        }
        if (handle.includes('w')) {
            nw = Math.max(10, origW - dx);
        }
        if (handle.includes('s')) {
            nh = Math.max(10, origH + dy);
        }
        if (handle.includes('n')) {
            nh = Math.max(10, origH - dy);
        }
        
        // Enforce aspect ratio for corner handles using professional vector projection
        if (handle.length === 2 && origW > 0 && origH > 0) {
            // Project mouse position onto the aspect ratio diagonal
            const scale = (nw * origW + nh * origH) / (origW * origW + origH * origH);
            nw = Math.max(10, origW * scale);
            nh = Math.max(10, origH * scale);
        }

        // Adjust center coordinates (x,y) to anchor the opposite edge
        if (handle.includes('e')) {
            nx = origX + (nw - origW) / 2;
        } else if (handle.includes('w')) {
            nx = origX - (nw - origW) / 2;
        }
        
        if (handle.includes('s')) {
            ny = origY + (nh - origH) / 2;
        } else if (handle.includes('n')) {
            ny = origY - (nh - origH) / 2;
        }
        
        const scaleRatio = origW > 0 ? nw / origW : 1;
        let newProps = { ...o, x: nx, y: ny, width: nw, height: nh };
        
        // Only scale contents if dragged from a corner handle
        if (handle.length === 2 && (o.type === 'text' || o.type === 'playlist')) {
            newProps.fontSize = Math.max(8, Math.round(dragState.origFontSize * scaleRatio));
            if (o.type === 'playlist') {
                newProps.width = Math.max(100, Math.round(dragState.origPlaylistWidth * scaleRatio));
            }
        }
        
        return newProps;
      }
      return o;
    }));
  };

  const handlePointerUp = (e) => {
    if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
    }
    if (dragState.isDragging && dragState.id) {
        emitRuntimeEvent(`Canvas.Object${dragState.action === 'resize' ? 'Resized' : 'Moved'}`, { id: dragState.id });
    }
    setDragState({ isDragging: false, action: 'drag', handle: '', id: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setM3SelectedObjectId(null);
      } else if (e.key === 'Delete' && m3SelectedObjectId) {
        setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        setM3SelectedObjectId(null);
        emitRuntimeEvent('Canvas.ObjectDeleted', { id: m3SelectedObjectId });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && m3SelectedObjectId) {
        e.preventDefault();
        setM3Objects(prev => {
          const obj = prev.find(o => o.id === m3SelectedObjectId);
          if (!obj) return prev;
          const newObj = { ...obj, id: obj.type + '-' + Date.now(), x: obj.x + 20, y: obj.y + 20, layer: prev.length };
          setM3SelectedObjectId(newObj.id);
          emitRuntimeEvent('Canvas.ObjectDuplicated', { id: newObj.id });
          return [...prev, newObj];
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && m3SelectedObjectId) {
        e.preventDefault();
        setM3Objects(prev => {
           let updated = [...prev];
           const idx = updated.findIndex(o => o.id === m3SelectedObjectId);
           if (idx < updated.length - 1) {
              const temp = updated[idx].layer;
              updated[idx].layer = updated[idx+1].layer;
              updated[idx+1].layer = temp;
           }
           emitRuntimeEvent('Canvas.ObjectBringForward', { id: m3SelectedObjectId });
           return updated.sort((a,b) => a.layer - b.layer);
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && m3SelectedObjectId) {
        e.preventDefault();
        setM3Objects(prev => {
           let updated = [...prev];
           const idx = updated.findIndex(o => o.id === m3SelectedObjectId);
           if (idx > 0) {
              const temp = updated[idx].layer;
              updated[idx].layer = updated[idx-1].layer;
              updated[idx-1].layer = temp;
           }
           emitRuntimeEvent('Canvas.ObjectSendBackward', { id: m3SelectedObjectId });
           return updated.sort((a,b) => a.layer - b.layer);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setM3SelectedObjectId, m3SelectedObjectId, setM3Objects]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        // contentRect excludes padding if box-sizing is border-box, but to be safe let's use bounding client rect
        const rect = container.getBoundingClientRect();
        const availableW = rect.width;
        const availableH = rect.height;

        const aspect = 16 / 9; // Hardcoded to 16:9 for now, can be dynamic
        let newW = availableW;
        let newH = newW / aspect;

        if (newH > availableH) {
          newH = availableH;
          newW = newH * aspect;
        }

        setCanvasStyle({ width: newW, height: newH });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const showGuides = true;

  return (
    <Surface 
      variant={BackgroundVariants.Preview}
      className="flex-1 min-w-0 min-h-0 flex items-center justify-center overflow-hidden select-none" 
      ref={containerRef}
      onPointerDown={() => setM3SelectedObjectId(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        ref={effectTargetRef}
        style={{ width: canvasStyle.width + 'px', height: canvasStyle.height + 'px', position: 'relative' }}
      >
        <div 
          id={canvasMode === 'thumbnail' ? 'm3-thumbnail-canvas' : 'm3-composer-canvas'}
          className="bg-[#12131a] absolute top-0 left-0 border border-[#2d3247] shadow-2xl overflow-hidden ring-1 ring-black"
          style={{
            width: '1920px',
            height: '1080px',
            transform: `scale(${canvasStyle.width / 1920})`,
            transformOrigin: 'top left',
            backgroundImage: m3BgPool && m3BgPool.length > 0 ? 'linear-gradient(45deg, #1e2230 25%, transparent 25%), linear-gradient(-45deg, #1e2230 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e2230 75%), linear-gradient(-45deg, transparent 75%, #1e2230 75%)' : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        >
          {/* Guides */}
          {showGuides && canvasMode === 'composer' && (
            <>
              <div className="absolute inset-x-0 top-[10%] bottom-[10%] border-y border-red-500/30 pointer-events-none z-50 flex items-center justify-center">
                <span className="absolute bottom-1 right-2 text-[8px] text-red-500/50 uppercase font-bold">Letterbox Area</span>
              </div>
              <div className="absolute inset-[5%] border border-emerald-500/30 pointer-events-none z-50">
                <span className="absolute bottom-1 right-2 text-[8px] text-emerald-500/50 uppercase font-bold">Safe Area</span>
              </div>
              <div className="absolute inset-[10%] border border-blue-500/30 pointer-events-none z-50">
                <span className="absolute bottom-1 right-2 text-[8px] text-blue-500/50 uppercase font-bold">Safe Title</span>
              </div>
            </>
          )}

        {/* ReferencePreviewCanvas removed completely for clean canvas */}


        {/* Fast Render Preview Mode Badge Overlay */}
        {fastRenderState.isFastMode() && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-[#090b10]/85 border border-cyan-500/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,243,255,0.3)] pointer-events-none select-none">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f3ff]"></span>
            <span className="text-[10px] font-black tracking-widest text-cyan-300 uppercase">⚡ FAST RENDER PREVIEW ({fastRenderState.getMasterLoopDuration().toFixed(1)}s MASTER LOOP)</span>
          </div>
        )}


        {/* Global Effect Engine Overlay */}
        <RealtimeEffectRenderer 
            effects={m3Objects.filter(o => (o.type === 'effect' || o.type === 'reactive') && o.enabled !== false)} 
            targetRef={effectTargetRef} 
        />

        {/* Empty State / Welcome Screen */}
        {m3Objects.length === 0 && (!m3BgPool || m3BgPool.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold font-mono tracking-widest text-white uppercase mb-2">Welcome to MediaFactory</h2>
            <p className="text-xs text-gray-400 max-w-sm text-center">Your canvas is empty. Start by adding a <b>Background</b>, dropping an <b>Audio Track</b>, and adding <b>Effects</b> from the Library.</p>
          </div>
        )}

        <PreviewRoot>
          {/* Real Background Source */}
          {m3BgPool && m3BgPool.length > 0 && (() => {
            const bg = m3BgPool[0];
            const s = bg.settings || {};
            
            // Transform settings
            const zoom = s.backgroundZoom || 0;
            const scale = 1 + (zoom / 100);
            const hPos = s.horizontalPosition || 0;
            const vPos = s.verticalPosition || 0;
            const blur = s.blurAmount || 0;
            const darkness = s.overlayDarkness !== undefined ? s.overlayDarkness : 30;
            
            let objectFitClass = "object-cover";
            if (s.scaleMode === 'Contain (Fit)') objectFitClass = "object-contain";
            if (s.scaleMode === 'Stretch') objectFitClass = "object-fill";
            
            const mediaStyle = {
                transform: `scale(${scale}) translate(${hPos}%, ${vPos}%)`,
                filter: `blur(${blur}px)`,
                // Removed CSS transition for transform so the manual JS updates are instant/fluid (no jello effect)
                transition: 'filter 0.1s ease-out' 
            };

            return (
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center bg-black" style={colorGradingStyle}>
                {bg.type === 'video' ? (
                  <video ref={bgMediaRef} src={bg.blobUrl || bg.preview || bg.url || bg.sourcePath} autoPlay loop muted className={`w-full h-full ${objectFitClass} will-change-transform`} style={mediaStyle} />
                ) : (
                  <img ref={bgMediaRef} src={bg.blobUrl || bg.preview || bg.url || bg.sourcePath} alt="bg" className={`w-full h-full ${objectFitClass} will-change-transform`} style={mediaStyle} />
                )}
                <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundColor: `rgba(0,0,0,${darkness / 100})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 mix-blend-overlay opacity-50"></div>
                <span className="absolute bottom-2 left-2 text-white/20 text-[10px] font-mono font-bold tracking-wider z-0 drop-shadow-md">
                  [SRC] {bg.filename}
                </span>
              </div>
            );
          })()}

          {/* New Visual FX Engines */}
          <AtmosphereEngine config={getEngineConfig('engine-atmosphere')} />
          <LightPulseEngine config={getEngineConfig('engine-lightpulse')} />
          <StageLightEngine config={getEngineConfig('engine-stagelight')} />
          <LaserEngine config={getEngineConfig('engine-laser')} />
          <FilmFXEngine config={getEngineConfig('engine-filmfx')} />

          {/* Unified Render Pipeline */}
          <MediaFactoryRenderer 
              renderMode={canvasMode} 
              targetRef={effectTargetRef}
              onPointerDown={handlePointerDown}
              handleHandleDown={handleHandleDown}
              m3SelectedObjectId={m3SelectedObjectId}
          />
        </PreviewRoot>

        {/* Preview Time Indicator */}
        {canvasMode === 'composer' && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-50 pointer-events-none select-none">
            <div className="bg-black/80 px-2.5 py-1 rounded text-[10px] text-gray-300 font-mono border border-white/10 shadow-md">
              {formatTime(m3CurrentTimeSec)} / {formatTime(m3TotalDurationSec)}
            </div>
            {fastRenderState.isFastMode() && (
              <div className="bg-[#00f3ff]/15 border border-[#00f3ff]/50 px-2.5 py-1 rounded text-[10px] font-bold text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.3)] flex items-center gap-1.5">
                <span>⚡ FAST RENDER PREVIEW</span>
                <span className="opacity-80 font-mono font-semibold">({(m3CurrentTimeSec % 10.0).toFixed(1)}s / 10.0s MASTER LOOP)</span>
              </div>
            )}
          </div>
        )}

      </div>
      </div>
      
      {/* Playback Bar & Export Settings positioned directly under the canvas */}
      {children && (
        <div style={{ width: canvasStyle.width + 'px' }} className="flex-shrink-0">
          {children}
        </div>
      )}
    </Surface>
  );
}
