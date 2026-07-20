import React, { useState, useEffect, useRef } from 'react';
import { beatEngine } from '../../services/audio/BeatEngine';
import { motionEngine } from '../../services/audio/MotionEngine';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3PlaybackBar from './M3PlaybackBar.jsx';
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
import ProductionQAToolkit from './ProductionQAToolkit.jsx';
import MediaFactoryRenderer from '../../services/pipeline/renderer/MediaFactoryRenderer';

import { emitRuntimeEvent } from '../../services/RuntimeClient';
import { bootstrapPipeline } from '../../services/pipeline/PipelineBootstrap';

// New FX Engines
import FilmFXEngine from './engines/FilmFXEngine';
import AtmosphereEngine from './engines/AtmosphereEngine';
import LightPulseEngine from './engines/LightPulseEngine';
import StageLightEngine from './engines/StageLightEngine';
import LaserEngine from './engines/LaserEngine';

const RealtimeVisualizer = ({ config }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    resizeObserver.observe(canvas.parentElement);

    const geometry = {
      shape: config?.shape ?? config?.geometry?.shape ?? 'bar',
      thickness: config?.thickness ?? config?.geometry?.thickness ?? 4,
      spacing: config?.spacing ?? config?.geometry?.spacing ?? 2,
      rounded: config?.rounded ?? config?.geometry?.rounded ?? false,
      center: config?.center ?? config?.geometry?.center ?? false,
      mirror: config?.mirror ?? config?.geometry?.mirror ?? false,
      radius: config?.radius ?? config?.geometry?.radius ?? 100,
      particles: config?.particles ?? config?.geometry?.particles ?? false
    };
    const appearance = {
      color: config?.color ?? config?.appearance?.color ?? '#ffffff',
      glow: config?.glow ?? config?.appearance?.glow ?? 50,
      glassmorphism: config?.glassmorphism ?? config?.appearance?.glassmorphism ?? false,
      gradient: config?.gradient ?? config?.appearance?.gradient ?? 'None',
      fill: config?.fill ?? config?.appearance?.fill ?? false,
      innerCover: config?.innerCover ?? config?.appearance?.innerCover ?? false
    };
    const audioConf = {
      fftGain: config?.fftGain ?? config?.audio?.fftGain ?? 100
    };

    // audio systems handled in loop

    let animationId;
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      const cx = width / 2;
      const cy = height / 2;

      const time = performance.now() / 1000;
      let baseColor = appearance.color || '#fff';
      
      if (appearance.gradient === 'Linear') {
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, appearance.color || '#00d2ff');
          grad.addColorStop(1, '#3a7bd5');
          baseColor = grad;
      } else if (appearance.gradient === 'Aurora') {
          const grad = ctx.createLinearGradient(0, height, width, 0);
          const phase = Math.sin(time) * 0.5 + 0.5;
          grad.addColorStop(0, '#c471ed');
          grad.addColorStop(phase, '#f64f59');
          grad.addColorStop(1, '#12c2e9');
          baseColor = grad;
      }

      ctx.shadowBlur = appearance.glow || 0;
      ctx.shadowColor = typeof baseColor === 'string' ? baseColor : '#c471ed';
      ctx.fillStyle = baseColor;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = geometry.thickness || 2;
      ctx.lineCap = geometry.rounded ? 'round' : 'butt';

      if (appearance.glassmorphism) {
          ctx.globalCompositeOperation = 'screen';
      } else {
          ctx.globalCompositeOperation = 'source-over';
      }

      let dataArray = beatEngine.getSpectrum();

      const gain = (audioConf.fftGain || 100) / 100;

      if (geometry.shape === 'bar') {
        const barWidth = geometry.thickness || 4;
        const spacing = geometry.spacing || 2;
        const step = barWidth + spacing;
        const totalWidth = dataArray.length * step;
        
        let startX = geometry.center ? (width - totalWidth) / 2 : 0;
        if (geometry.mirror) {
           startX = cx - totalWidth;
        }

        for (let i = 0; i < dataArray.length; i++) {
          const h = Math.max(2, (dataArray[i] / 255) * height * gain);
          const x = startX + i * step;
          
          if (geometry.center) {
              const y = cy - h / 2;
              if (geometry.rounded) {
                  ctx.beginPath(); ctx.roundRect(x, y, barWidth, h, barWidth/2); ctx.fill();
              } else {
                  ctx.fillRect(x, y, barWidth, h);
              }
              if (geometry.mirror) {
                  const mx = width - (x - cx) - barWidth;
                  if (geometry.rounded) {
                      ctx.beginPath(); ctx.roundRect(mx, y, barWidth, h, barWidth/2); ctx.fill();
                  } else {
                      ctx.fillRect(mx, y, barWidth, h);
                  }
              }
          } else {
              const y = height - h;
              if (geometry.rounded) {
                  ctx.beginPath(); ctx.roundRect(x, y, barWidth, h, [barWidth/2, barWidth/2, 0, 0]); ctx.fill();
              } else {
                  ctx.fillRect(x, y, barWidth, h);
              }
              if (geometry.mirror) {
                  const mx = width - x - barWidth;
                  if (geometry.rounded) {
                      ctx.beginPath(); ctx.roundRect(mx, y, barWidth, h, [barWidth/2, barWidth/2, 0, 0]); ctx.fill();
                  } else {
                      ctx.fillRect(mx, y, barWidth, h);
                  }
              }
          }
        }
      } else if (geometry.shape === 'circle' || geometry.shape === 'double-ring') {
        const radius = geometry.radius || Math.min(cx, cy) - 50;
        const bars = dataArray.length;
        const angleStep = (Math.PI * 2) / bars;
        
        const drawRing = (r, mirrorInner) => {
            for (let i = 0; i < bars; i++) {
              const h = Math.max(2, (dataArray[i] / 255) * (height / 3) * gain);
              const angle = i * angleStep;
              const x1 = cx + Math.cos(angle) * r;
              const y1 = cy + Math.sin(angle) * r;
              const x2 = cx + Math.cos(angle) * (r + (mirrorInner ? -h : h));
              const y2 = cy + Math.sin(angle) * (r + (mirrorInner ? -h : h));
              
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
        };

        drawRing(radius, false);
        if (geometry.shape === 'double-ring') {
            drawRing(radius - (geometry.spacing || 10) * 5, true);
        }
      } else if (geometry.shape === 'line' || geometry.shape === 'spline' || geometry.shape === 'ribbon') {
         const step = width / (dataArray.length - 1);
         const points = [];
         for (let i = 0; i < dataArray.length; i++) {
            const h = (dataArray[i] / 255) * height * gain;
            const x = i * step;
            const y = geometry.center ? cy - h/2 : height - h;
            points.push({x, y, h});
         }

         ctx.beginPath();
         ctx.moveTo(points[0].x, points[0].y);

         if (geometry.shape === 'spline' || geometry.shape === 'ribbon') {
             for (let i = 0; i < points.length - 1; i++) {
                 const xMid = (points[i].x + points[i + 1].x) / 2;
                 const yMid = (points[i].y + points[i + 1].y) / 2;
                 const cpX1 = (xMid + points[i].x) / 2;
                 const cpX2 = (xMid + points[i + 1].x) / 2;
                 ctx.quadraticCurveTo(points[i].x, points[i].y, xMid, yMid);
             }
             ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
         } else {
             for (let i = 1; i < points.length; i++) {
                 ctx.lineTo(points[i].x, points[i].y);
             }
         }

         if (appearance.fill && geometry.shape !== 'ribbon') {
             ctx.lineTo(width, height);
             ctx.lineTo(0, height);
             ctx.closePath();
             ctx.fill();
         } else {
             ctx.stroke();
         }

         if (geometry.shape === 'ribbon') {
             // Draw a secondary overlapping path for ribbon 3D effect
             ctx.beginPath();
             ctx.moveTo(points[0].x, points[0].y + 10);
             for (let i = 0; i < points.length - 1; i++) {
                 const xMid = (points[i].x + points[i + 1].x) / 2;
                 const yMid = ((points[i].y + points[i + 1].y) / 2) + Math.sin(time * 2 + i) * 10;
                 ctx.quadraticCurveTo(points[i].x, points[i].y + 10, xMid, yMid);
             }
             ctx.strokeStyle = '#ff9a9e';
             ctx.stroke();
         }

         if (geometry.mirror && geometry.center) {
             ctx.beginPath();
             ctx.moveTo(points[0].x, cy + points[0].h/2);
             for (let i = 0; i < points.length - 1; i++) {
                 const xMid = (points[i].x + points[i + 1].x) / 2;
                 const yMid = cy + ((points[i].h + points[i+1].h) / 4);
                 ctx.quadraticCurveTo(points[i].x, cy + points[i].h/2, xMid, yMid);
             }
             ctx.stroke();
         }
      } else if (geometry.shape === 'grid') {
         const cols = Math.floor(width / (geometry.spacing || 10));
         const rows = Math.floor(height / (geometry.spacing || 10));
         for (let i = 0; i < dataArray.length; i++) {
             const h = Math.floor((dataArray[i] / 255) * rows * gain);
             const x = i * (geometry.spacing || 10);
             for (let j = 0; j < h; j++) {
                 const y = height - j * (geometry.spacing || 10);
                 ctx.fillRect(x, y, geometry.thickness || 2, geometry.thickness || 2);
             }
         }
      }
      
      if (geometry.particles) {
          // Fake particles overlay
          const pCount = Math.floor(dataArray[0] / 10); // Reacts to bass
          ctx.fillStyle = appearance.color || '#fff';
          for(let i=0; i<pCount; i++) {
              ctx.beginPath();
              ctx.arc(cx + (Math.random()-0.5)*width, cy + (Math.random()-0.5)*height, Math.random()*3, 0, Math.PI*2);
              ctx.fill();
          }
      }
      
      if (appearance.innerCover) {
          ctx.beginPath();
          ctx.arc(cx, cy, (geometry.radius || 100) - 10, 0, Math.PI*2);
          ctx.fillStyle = '#111';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#333';
          ctx.stroke();
      }
    };
    
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [config]);

  return (
    <div className="w-full h-full pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default function M3PreviewCanvas({ m3BgPool, m3AudioTracks = [], m3Objects, setM3Objects, m3SelectedObjectId, setM3SelectedObjectId, canvasMode = 'composer', m3CurrentTimeSec = 0, m3TotalDurationSec = 1, setM3CurrentTimeSec, m3EstRenderTimeSec, m3EstStorageMb }) {
  const [dragState, setDragState] = useState({ isDragging: false, action: 'drag', handle: '', id: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 });
  const containerRef = useRef(null);
  const [canvasStyle, setCanvasStyle] = useState({ width: 800, height: 450 });
  const [analyser, setAnalyser] = useState(null);

  useEffect(() => {
    fontLibrary.initialize();
  }, []);

  useEffect(() => {
    beatEngine.setSource(analyser);
    return () => beatEngine.setSource(null);
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
        window.m3Diagnostics = window.m3Diagnostics || {};
        let animId;
        let lastTime = performance.now();
        
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

            // --- Render Pipeline Runtime ---
            frameInput.setInputs(latestObjectsRef.current || [], { 
                canvasMode, 
                currentTimeSec: m3CurrentTimeSec, 
                totalDurationSec: m3TotalDurationSec 
            });

            if (window.m3IsPlaying && !timeline.clock.isPlaying) timeline.play();
            if (!window.m3IsPlaying && timeline.clock.isPlaying) timeline.pause();
            timeline.tick();


            pipeline.update();
            const frame = pipeline.getFrame();
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
          origW: obj.width || 100, 
          origH: obj.height || 100 
      });
    }
  };

  const handleHandleDown = (e, id, handle) => {
    e.stopPropagation();
    setM3SelectedObjectId(id);
    const obj = m3Objects.find(o => o.id === id);
    if (obj && !obj.locked) {
      setDragState({ isDragging: true, action: 'resize', handle, id, startX: e.clientX, startY: e.clientY, origX: obj.x, origY: obj.y, origW: obj.width || 100, origH: obj.height || 100 });
    }
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging || !dragState.id) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    setM3Objects(prev => prev.map(o => {
      if (o.id !== dragState.id) return o;
      if (dragState.action === 'drag') {
        if (dragState.subTarget && dragState.subTarget.startsWith('col_')) {
            const colIndex = parseInt(dragState.subTarget.split('_')[1], 10);
            const transformProp = colIndex === 0 ? 'leftTransform' : 'rightTransform';
            const currentTransform = o[transformProp] || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100 };
            
            return { 
                ...o, 
                [transformProp]: {
                    ...currentTransform,
                    x: dragState.origX + dx,
                    y: dragState.origY + dy
                }
            };
        } else {
            return { ...o, x: dragState.origX + dx, y: dragState.origY + dy };
        }
      } else if (dragState.action === 'resize') {
        let { origX, origY, origW, origH, handle } = dragState;
        let nx = origX, ny = origY, nw = origW, nh = origH;
        
        if (handle.includes('e')) nw = origW + dx;
        if (handle.includes('w')) { nw = origW - dx; nx = origX + dx; }
        if (handle.includes('s')) nh = origH + dy;
        if (handle.includes('n')) { nh = origH - dy; ny = origY + dy; }
        
        if (nw < 10) nw = 10;
        if (nh < 10) nh = 10;
        return { ...o, x: nx, y: ny, width: nw, height: nh };
      }
      return o;
    }));
  };

  const handlePointerUp = () => {
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
      className="flex-1 min-w-0 min-h-0 flex items-start justify-center overflow-hidden select-none" 
      ref={containerRef}
      onPointerDown={() => setM3SelectedObjectId(null)}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      <div 
        id={canvasMode === 'thumbnail' ? 'm3-thumbnail-canvas' : 'm3-composer-canvas'}
        className="bg-[#12131a] relative border border-[#2d3247] shadow-2xl overflow-hidden ring-1 ring-black"
        style={{
          width: canvasStyle.width + 'px',
          height: canvasStyle.height + 'px',
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

        <ProductionQAToolkit />

        {/* Global Effect Engine Overlay */}
        <RealtimeEffectRenderer 
            effects={m3Objects.filter(o => (o.type === 'effect' || o.type === 'reactive') && o.enabled !== false)} 
            targetRef={containerRef} 
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
          {m3BgPool && m3BgPool.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center bg-black" style={colorGradingStyle}>
              {m3BgPool[0].type === 'image' ? (
                <img src={m3BgPool[0].preview} alt="bg" className="w-full h-full object-cover opacity-60" />
              ) : m3BgPool[0].type === 'video' ? (
                <video src={m3BgPool[0].preview} autoPlay loop muted className="w-full h-full object-cover opacity-60" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 mix-blend-overlay"></div>
              <span className="absolute bottom-2 left-2 text-white/20 text-[10px] font-mono font-bold tracking-wider z-0 drop-shadow-md">
                [SRC] {m3BgPool[0].filename}
              </span>
            </div>
          )}

          {/* New Visual FX Engines */}
          <AtmosphereEngine config={getEngineConfig('engine-atmosphere')} />
          <LightPulseEngine config={getEngineConfig('engine-lightpulse')} />
          <StageLightEngine config={getEngineConfig('engine-stagelight')} />
          <LaserEngine config={getEngineConfig('engine-laser')} />
          <FilmFXEngine config={getEngineConfig('engine-filmfx')} />

          {/* Unified Render Pipeline */}
          <MediaFactoryRenderer 
              renderMode={canvasMode} 
              targetRef={containerRef}
              onPointerDown={handlePointerDown}
              handleHandleDown={handleHandleDown}
              m3SelectedObjectId={m3SelectedObjectId}
          />
        </PreviewRoot>

        {/* Preview Time Indicator */}
        {canvasMode === 'composer' && (
          <div className="absolute bottom-4 left-4 bg-black/80 px-2 py-1 rounded text-[10px] text-gray-300 font-mono border border-white/10 shadow-md select-none pointer-events-none z-50">
            {formatTime(m3CurrentTimeSec)} / {formatTime(m3TotalDurationSec)}
          </div>
        )}

        {/* Playback & Tools Bar (Floating at bottom inside preview) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl z-50">
          <M3PlaybackBar
            m3AudioTracks={m3AudioTracks}
            currentTimeSec={m3CurrentTimeSec}
            setCurrentTimeSec={setM3CurrentTimeSec}
            onAnalyserReady={setAnalyser}
          />
        </div>
      </div>
    </Surface>
  );
}
