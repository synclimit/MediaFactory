import React, { useState, useEffect, useRef } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

if (typeof window !== 'undefined') {
    window.__renderFrameStore = renderFrameStore;
}

export default function BeatDebugOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 60 }); // FORCED initial safe position
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Display State
  const [beatState, setBeatState] = useState({});
  const [diagnostics, setDiagnostics] = useState({});
  const [beatDebug, setBeatDebug] = useState({});
  const [motionCamera, setMotionCamera] = useState({});
  const [motionZoom, setMotionZoom] = useState({});
  const [beatHistory, setBeatHistory] = useState(Array(15).fill(false)); // true = beat, false = no beat (history points)
  const [selectedBand, setSelectedBand] = useState('kick');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const recordedFramesRef = useRef([]);

  // Spectrum Canvas Ref
  const canvasRef = useRef(null);

  // Toggle Hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'b') {
        setIsVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restore Position - Disabled temporarily to force reset
  useEffect(() => {
    // We intentionally ignore localStorage here to force the panel to a safe Y=60 position
  }, []);

  // Dragging Logic
  const handlePointerDown = (e) => {
    // Ignore if clicking an interactive element
    if (e.target.closest('button, canvas, tr, input, select')) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    let newX = dragRef.current.initX + dx;
    let newY = dragRef.current.initY + dy;
    
    // Prevent dragging completely off screen, but allow full freedom
    if (newY < 0) newY = 0;
    if (newX < 0) newX = 0;
    
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch(err) {}
    }
  };

  // Frame Polling
  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastFpsTime = performance.now();
    let currentFps = 0;
    let historyAccumulator = [];
    let frameId;

    const loop = () => {
      frameId = requestAnimationFrame(loop);
      
      // Use formal renderFrameStore
      const frame = renderFrameStore.getFrame();
      const debugState = frame?.debug || {};
      const beat = debugState.beat || {};
      const motion = debugState.motion || {};

      setBeatState({ ...beat });
      
      // Read diagnostics indirectly (in reality, the pipeline should expose these, but for now we fallback)
      setDiagnostics({ fps: currentFps });

      const d = debugState.beat?.debug || {};
      setBeatDebug({
        energy:           d.energy,
        averageEnergy:    d.averageEnergy,
        flux:             d.flux,
        threshold:        d.threshold,
        historyAverage:   d.historyAverage,
        historyMin:       d.historyMin,
        historyMax:       d.historyMax,
        historySize:      d.historySize,
        historyNewest:    d.historyNewest,
        historyOldest:    d.historyOldest,
        cooldownRemaining: d.cooldownRemaining,
        lastBeatTime:     d.lastBeatTime,
        beatCount:        d.beatCount,
        blockedReason:    d.blockedReason,
        detected:         d.detected,
        fft: {
          sampleRate: d.fft?.sampleRate || 0,
          fftSize:    d.fft?.fftSize    || 0,
          binCount:   d.fft?.binCount   || 0,
          binWidth:   d.fft?.binWidth   || 0,
          nyquist:    d.fft?.nyquist    || 0,
        },
        bands: {
          kick:    { bins: d.bands?.kick?.bins    || [], value: d.bands?.kick?.value    || 0, delta: d.bands?.kick?.delta    || 0, envelope: d.bands?.kick?.envelope    || 0 },
          bass:    { bins: d.bands?.bass?.bins    || [], value: d.bands?.bass?.value    || 0, delta: d.bands?.bass?.delta    || 0, envelope: d.bands?.bass?.envelope    || 0 },
          lowMid:  { bins: d.bands?.lowMid?.bins  || [], value: d.bands?.lowMid?.value  || 0, delta: d.bands?.lowMid?.delta  || 0, envelope: d.bands?.lowMid?.envelope  || 0 },
          mid:     { bins: d.bands?.mid?.bins     || [], value: d.bands?.mid?.value     || 0, delta: d.bands?.mid?.delta     || 0, envelope: d.bands?.mid?.envelope     || 0 },
          highMid: { bins: d.bands?.highMid?.bins || [], value: d.bands?.highMid?.value || 0, delta: d.bands?.highMid?.delta || 0, envelope: d.bands?.highMid?.envelope || 0 },
          treble:  { bins: d.bands?.treble?.bins  || [], value: d.bands?.treble?.value  || 0, delta: d.bands?.treble?.delta  || 0, envelope: d.bands?.treble?.envelope  || 0 },
        },
      });
      
      const motionChannels = motion.transforms || {};
      const visualZoom = frame?.composition?.debug?.zoom || {};
      const zm = visualZoom.value !== undefined ? visualZoom : (motionChannels['zoom'] || motionChannels['zoom_1'] || {});
      
      setMotionCamera({
        x:       0,
        y:       0,
        impulse: 0,
        profile: 'none'
      });
      setMotionZoom({
        value:    zm?.value    || 0,
        velocity: zm?.velocity || 0,
        impulse:  zm?.impulse  || 0,
        state:    zm?.state    || 'IDLE',
      });

      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
      }

      if (isRecording) {
          recordedFramesRef.current.push({
              t:             now / 1000,
              frame:         frame?.metadata?.frameNumber || 0,
              energy:        d.energy,
              avgEnergy:     d.averageEnergy,
              flux:          d.flux,
              threshold:     d.threshold,
              blocked:       d.blockedReason,
              beat:          d.detected,
              beatCount:     d.beatCount,
              cooldown:      d.cooldownRemaining,
              kick:          d.bands?.kick?.value  || 0,
              bass:          d.bands?.bass?.value  || 0,
              zoomValue:     zm?.value    || 0,
              zoomImpulse:   zm?.impulse  || 0,
              zoomVelocity:  zm?.velocity || 0,
          });
      }

      if (d.detected) {
         historyAccumulator.push(now);
      }
      
      // Spectrum is not preserved in the pure domain frame currently, this is a known gap
      // but we will gracefully skip spectrum drawing for now rather than coupling to BeatEngine
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
    
    frameId = requestAnimationFrame(loop);

    const historyInterval = setInterval(() => {
      setBeatHistory(prev => {
        const next = [...prev];
        next.shift();
        next.push(historyAccumulator.length > 0);
        historyAccumulator = [];
        return next;
      });
    }, 100);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(historyInterval);
    };
  }, [isVisible, isRecording]);
  const toggleRecording = () => {
      if (isRecording) {
          setIsRecording(false);
      } else {
          recordedFramesRef.current = [];
          setIsRecording(true);
      }
  };

  const exportRecording = () => {
      if (recordedFramesRef.current.length === 0) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recordedFramesRef.current, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "zoom_calibration_" + Date.now() + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const ChainNode = ({ label, value, color = 'text-white' }) => (
      <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[8px] text-gray-500">{label}</span>
          <span className={`text-[10px] font-bold ${color}`}>{value}</span>
      </div>
  );
  
  const Arrow = () => <span className="text-gray-600 text-[10px] mx-0.5">↓</span>;

  // VISUAL HIDE (but keep component mounted for hotkeys)
  if (!isVisible) return null;

  return (
    <div 
      className="fixed flex flex-col bg-[#12141a]/95 backdrop-blur-md border border-[#2d3247] rounded-lg shadow-2xl text-white select-none z-[99999]"
      style={{ left: pos.x, top: pos.y, width: 340, pointerEvents: 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Title Bar */}
      <div 
        className="h-8 bg-[#1a1e2d] border-b border-[#2d3247] flex items-center justify-between px-3 rounded-t-lg cursor-move"
      >
        <div className="text-xs font-bold flex items-center gap-2 text-gray-300 pointer-events-none">
          🎵 Audio Pipeline Validation
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="text-gray-500 hover:text-white pointer-events-auto"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-2 flex flex-col gap-2 text-[10px] font-mono max-h-[60vh] h-[550px] overflow-y-auto hide-scrollbar">

        {/* QA STATUS BAR — most important metrics at a glance */}
        <div className={`rounded p-2 border ${beatDebug.detected ? 'border-emerald-500 bg-emerald-900/20' : 'border-[#2d3247] bg-black/20'}`}>
          <div className="flex justify-between items-center">
            <span className="text-yellow-400 font-bold">QA STATUS</span>
            <span className={`font-bold text-lg ${beatDebug.detected ? 'text-emerald-400' : 'text-gray-600'}`}>
              {beatDebug.detected ? '● BEAT' : '○ WAIT'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div className="bg-black/30 rounded p-1 text-center">
              <div className="text-gray-500">Beat #</div>
              <div className="text-blue-400 font-bold text-sm">{beatDebug.beatCount || 0}</div>
            </div>
            <div className="bg-black/30 rounded p-1 text-center">
              <div className="text-gray-500">BPM</div>
              <div className="text-blue-400 font-bold text-sm">{beatState.bpm || 0}</div>
            </div>
            <div className={`rounded p-1 text-center ${beatDebug.blockedReason === 'SUCCESS' ? 'bg-emerald-900/30' : 'bg-red-900/20'}`}>
              <div className="text-gray-500">Status</div>
              <div className={`font-bold text-[9px] ${beatDebug.blockedReason === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                {beatDebug.blockedReason || '…'}
              </div>
            </div>
          </div>
        </div>

        {/* FLUX vs THRESHOLD — the critical comparison */}
        <div className="border border-[#2d3247] rounded p-1.5 bg-black/20">
          <div className="text-yellow-400 font-bold mb-1">FLUX vs THRESHOLD</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-gray-500">Kick+Bass Energy</span>
            <span className="text-right">{(beatDebug.energy || 0).toFixed(3)}</span>
            <span className="text-gray-500">Avg Energy</span>
            <span className="text-right">{(beatDebug.averageEnergy || 0).toFixed(3)}</span>
            <span className="text-gray-500">Flux (delta)</span>
            <span className={`text-right font-bold ${(beatDebug.flux || 0) > (beatDebug.threshold || 0) ? 'text-emerald-400' : 'text-gray-300'}`}>
              {(beatDebug.flux || 0).toFixed(3)}
            </span>
            <span className="text-gray-500">Threshold</span>
            <span className="text-right">{(beatDebug.threshold || 0).toFixed(3)}</span>
            <span className="text-gray-500">Flux &gt; Threshold?</span>
            <span className={`text-right font-bold ${(beatDebug.flux || 0) > (beatDebug.threshold || 0) ? 'text-emerald-400' : 'text-red-400'}`}>
              {(beatDebug.flux || 0) > (beatDebug.threshold || 0) ? 'YES ✓' : 'NO ✗'}
            </span>
            <span className="text-gray-500">Cooldown</span>
            <span className={`text-right font-bold ${(beatDebug.cooldownRemaining || 0) <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              {(beatDebug.cooldownRemaining || 0) <= 0 ? 'READY' : `${Math.round(beatDebug.cooldownRemaining)}ms`}
            </span>
          </div>
        </div>

        {/* DECISION CHAIN */}
        <div className="border border-[#2d3247] rounded p-1.5 bg-black/20">
          <div className="text-yellow-400 font-bold mb-1">DECISION CHAIN</div>
          <div className="flex flex-wrap items-center gap-1 justify-center">
            <ChainNode label="FFT" value={beatDebug.fft?.sampleRate ? '✓' : '✗'} color={beatDebug.fft?.sampleRate ? 'text-emerald-400' : 'text-red-400'} />
            <Arrow />
            <ChainNode label="Kick" value={(beatDebug.bands?.kick?.value || 0).toFixed(2)} color={(beatDebug.bands?.kick?.value || 0) > 0.01 ? 'text-white' : 'text-gray-600'} />
            <Arrow />
            <ChainNode label="Flux" value={(beatDebug.flux || 0).toFixed(3)} color={(beatDebug.flux || 0) > (beatDebug.threshold || 0) ? 'text-emerald-400' : 'text-gray-400'} />
            <Arrow />
            <ChainNode label="Thr" value={(beatDebug.threshold || 0).toFixed(3)} />
            <Arrow />
            <ChainNode label="Beat" value={beatDebug.detected ? 'TRUE' : 'FALSE'} color={beatDebug.detected ? 'text-emerald-400' : 'text-gray-500'} />
            <Arrow />
            <ChainNode label="Zoom" value={(motionZoom.impulse > 0 || motionZoom.value > 0.001 || motionZoom.state !== 'IDLE') ? 'FIRED' : 'WAIT'} color={(motionZoom.impulse > 0 || motionZoom.value > 0.001 || motionZoom.state !== 'IDLE') ? 'text-blue-400' : 'text-gray-500'} />
          </div>
        </div>

        {/* ZOOM MOTION STATE */}
        <div className="border border-[#2d3247] rounded p-1.5 bg-black/20">
          <div className="text-purple-400 font-bold mb-1">ZOOM MOTION</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-gray-500">Value</span>
            <span className="text-right">{(motionZoom.value || 0).toFixed(4)}</span>
            <span className="text-gray-500">Velocity</span>
            <span className="text-right">{(motionZoom.velocity || 0).toFixed(4)}</span>
            <span className="text-gray-500">Impulse</span>
            <span className={`text-right font-bold ${(motionZoom.impulse || 0) > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
              {(motionZoom.impulse || 0).toFixed(4)}
            </span>
          </div>
          {/* Zoom level visual bar */}
          <div className="mt-1 h-1.5 bg-black/50 rounded overflow-hidden">
            <div className="h-full bg-purple-500 transition-none" style={{ width: `${Math.min((motionZoom.value || 0) * 500, 100)}%` }} />
          </div>
        </div>

        {/* BAND MAPPING */}
        <div className="border border-[#2d3247] rounded p-1.5 bg-black/20">
          <div className="text-yellow-400 font-bold mb-1">BAND MAPPING</div>
          <table className="w-full text-right">
            <thead>
              <tr className="text-gray-500 border-b border-[#2d3247]">
                <th className="text-left font-normal pb-1">Band</th>
                <th className="font-normal pb-1">Val</th>
                <th className="font-normal pb-1">Δ</th>
                <th className="font-normal pb-1">%</th>
              </tr>
            </thead>
            <tbody>
              {['kick', 'bass', 'lowMid', 'mid', 'highMid', 'treble'].map(b => {
                const band = beatDebug.bands?.[b] || {};
                const totalVal = Object.values(beatDebug.bands || {}).reduce((sum, bd) => sum + (bd.value || 0), 0) || 1;
                const pct = ((band.value || 0) / totalVal) * 100;
                return (
                  <tr key={b} className={`cursor-pointer hover:bg-white/5 ${selectedBand === b ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`} onClick={() => setSelectedBand(b)}>
                    <td className="text-left capitalize py-0.5">{b}</td>
                    <td>{(band.value || 0).toFixed(3)}</td>
                    <td className={band.delta > 0 ? 'text-emerald-400' : 'text-gray-600'}>{band.delta > 0 ? '+' : ''}{(band.delta || 0).toFixed(3)}</td>
                    <td className="text-orange-400">{pct.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SPECTRUM + BAND HIGHLIGHT */}
        <div className="border border-[#2d3247] rounded p-1.5 bg-black/20">
          <div className="text-yellow-400 font-bold mb-1 flex justify-between">
            <span>SPECTRUM — {selectedBand.toUpperCase()}</span>
            <span className="text-gray-500">FFT {beatDebug.fft?.fftSize || 0} / {beatDebug.fft?.sampleRate || 0}Hz</span>
          </div>
          <div className="h-12 bg-black/50 rounded overflow-hidden">
            <canvas ref={canvasRef} width="320" height="48" className="w-full h-full" />
          </div>
        </div>

        {/* RECORDER */}
        <div className="border-t border-[#2d3247] pt-2 flex gap-2 mt-auto">
          <button
            onClick={toggleRecording}
            className={`flex-1 py-1.5 rounded font-bold text-[10px] transition-colors ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2d3247] text-gray-300 hover:bg-[#3d4460]'}`}
          >
            {isRecording ? `● REC (${recordedFramesRef.current.length}f)` : 'REC JSON'}
          </button>
          <button
            onClick={exportRecording}
            disabled={isRecording || recordedFramesRef.current.length === 0}
            className={`flex-1 py-1.5 rounded font-bold text-[10px] transition-colors ${!isRecording && recordedFramesRef.current.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-[#1a1d27] text-gray-600 cursor-not-allowed'}`}
          >
            EXPORT ({recordedFramesRef.current.length})
          </button>
        </div>

      </div>
    </div>
  );
}

