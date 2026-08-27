import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Play, Pause, Scissors, Check, Loader, ZoomIn, ZoomOut, 
  Trash2, Clock, Sparkles, Plus, Edit2, Volume2
} from 'lucide-react';

const formatTime = (sec, showFraction = false) => {
  if (sec === null || sec === undefined || isNaN(sec)) return '00:00';
  const totalSec = Math.max(0, sec);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const ms = Math.floor((totalSec % 1) * 10);
  
  const base = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  return showFraction ? `${base}.${ms}` : base;
};

const formatDurationHuman = (sec) => {
  if (!sec || isNaN(sec) || sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function ManualSlicer({ uri, titles = [], duration = 0, onExport }) {
  const [status, setStatus] = useState('init'); // init, downloading, ready, error
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration > 0 ? duration : 1);
  const [markers, setMarkers] = useState([]);
  const [customTitles, setCustomTitles] = useState(titles);
  
  // Zoom state
  const [zoom, setZoom] = useState(1); // 1 = 100% (fit), up to 16x
  const [isDetecting, setIsDetecting] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');

  // Waveform Peaks Data
  const [peaks, setPeaks] = useState([]);

  // DOM Refs for 60/120 FPS Direct Manipulation (Zero Re-render Lag)
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const playheadRef = useRef(null);
  const playheadBadgeRef = useRef(null);
  const hoverGuideRef = useRef(null);
  const hoverBadgeRef = useRef(null);
  const dragTooltipRef = useRef(null);
  const markerRefs = useRef([]);
  const markerBadgeRefs = useRef([]);

  // Mutable Dragging & Scrubbing State
  const dragRef = useRef({
    isDraggingTimeline: false,
    draggingMarkerIdx: null,
    currentMarkerTime: null,
    startX: 0,
    startTime: 0,
    hasMoved: false
  });

  const previewSliceEndRef = useRef(null);
  const rafTimeRef = useRef(null);
  const rafAudioSeekRef = useRef(null);

  // Initialize markers evenly spaced based on titles length if not set
  useEffect(() => {
    if (titles.length > 0 && audioDuration > 0 && markers.length === 0) {
      const initialMarkers = [];
      const chunk = audioDuration / titles.length;
      for (let i = 1; i < titles.length; i++) {
        initialMarkers.push(i * chunk);
      }
      setMarkers(initialMarkers);
    }
  }, [titles, audioDuration]);

  // Keep customTitles in sync if initial titles prop changes
  useEffect(() => {
    if (titles && titles.length > 0) {
      setCustomTitles(prev => {
        const merged = [...titles];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i]) merged[i] = prev[i];
        }
        return merged;
      });
    }
  }, [titles]);

  // Prepare & Download audio stream
  useEffect(() => {
    let es = null;
    let mounted = true;
    
    const prepareAudio = async () => {
      setStatus('downloading');
      try {
        await new Promise((resolve, reject) => {
          es = new EventSource(`/api/m2/prepare-stream?uri=${encodeURIComponent(uri)}`);
          es.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.status === 'downloading') {
                if (mounted) setProgress(parseFloat(data.progress) || 0);
              } else if (data.status === 'ready' || data.status === 'ready_cached') {
                es.close();
                resolve();
              } else if (data.status === 'error') {
                es.close();
                reject(new Error('Prepare failed'));
              }
            } catch {}
          };
          es.onerror = () => { es.close(); reject(new Error('SSE Error')); };
        });
        
        if (mounted) {
          const streamUrl = `/api/m2/stream?uri=${encodeURIComponent(uri)}`;
          setAudioUrl(streamUrl);
          setStatus('ready');
          
          generateFallbackPeaks();
          loadAudioPeaks(streamUrl);
        }
      } catch (err) {
        if (mounted) setStatus('error');
      }
    };
    
    prepareAudio();
    return () => {
      mounted = false;
      if (es) es.close();
    };
  }, [uri]);

  // Procedural peak generator for instantaneous visual feedback
  const generateFallbackPeaks = () => {
    const totalBars = 400;
    const generated = [];
    let prev = 0.5;
    for (let i = 0; i < totalBars; i++) {
      const variation = (Math.random() - 0.5) * 0.35;
      prev = Math.max(0.15, Math.min(0.95, prev + variation));
      generated.push(prev);
    }
    setPeaks(generated);
  };

  // Decode real audio peaks via Web Audio API
  const loadAudioPeaks = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
      
      const channelData = decodedData.getChannelData(0);
      const totalBars = 800;
      const blockSize = Math.floor(channelData.length / totalBars);
      const realPeaks = [];
      
      for (let i = 0; i < totalBars; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j] || 0);
        }
        const avg = sum / blockSize;
        realPeaks.push(Math.min(1, Math.max(0.08, avg * 3.8)));
      }
      setPeaks(realPeaks);
      audioCtx.close();
    } catch (e) {
      console.warn('Fallback procedural waveform active:', e);
    }
  };

  // Render High-Performance Hardware-Accelerated Canvas Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    const height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, width, height);

    const playedPct = (currentTime / audioDuration);
    const totalBars = peaks.length;
    const barWidth = width / totalBars;
    const gap = Math.max(1, barWidth * 0.25);
    const effectiveBarWidth = Math.max(1, barWidth - gap);

    for (let i = 0; i < totalBars; i++) {
      const barPct = i / totalBars;
      const isPassed = barPct <= playedPct;
      const barHeight = Math.max(6, peaks[i] * (height * 0.85));
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      if (isPassed) {
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#fdba74'); // amber-300
        grad.addColorStop(0.5, '#f97316'); // orange-500
        grad.addColorStop(1, '#c2410c'); // orange-700
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#475569'); // slate-600
        grad.addColorStop(0.5, '#334155'); // slate-700
        grad.addColorStop(1, '#1e293b'); // slate-800
        ctx.fillStyle = grad;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, effectiveBarWidth, barHeight, 2);
      ctx.fill();
    }
  }, [peaks, currentTime, audioDuration, zoom]);

  // Direct DOM Playhead update for 120 FPS buttery-smooth playback
  const updatePlayheadDOM = useCallback((time) => {
    if (!audioDuration || audioDuration <= 0) return;
    const pct = Math.max(0, Math.min(100, (time / audioDuration) * 100));
    if (playheadRef.current) {
      playheadRef.current.style.left = `${pct}%`;
    }
    if (playheadBadgeRef.current) {
      playheadBadgeRef.current.innerText = `▶ ${formatTime(time)}`;
    }
  }, [audioDuration]);

  // Sync RAF Audio Time
  const syncAudioLoop = useCallback(() => {
    if (audioRef.current && !dragRef.current.isDraggingTimeline) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      updatePlayheadDOM(curr);
      
      // Stop preview when slice ends
      if (previewSliceEndRef.current !== null && curr >= previewSliceEndRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        previewSliceEndRef.current = null;
        return;
      }
      
      rafTimeRef.current = requestAnimationFrame(syncAudioLoop);
    }
  }, [updatePlayheadDOM]);

  const togglePlay = () => {
    if (!audioRef.current || status !== 'ready') return;
    previewSliceEndRef.current = null;
    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(rafTimeRef.current);
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error(e));
      rafTimeRef.current = requestAnimationFrame(syncAudioLoop);
      setIsPlaying(true);
    }
  };

  const seekToTime = (newTime) => {
    if (!Number.isFinite(newTime) || isNaN(newTime)) return;
    const clamped = Math.max(0, Math.min(audioDuration, newTime));
    setCurrentTime(clamped);
    updatePlayheadDOM(clamped);
    if (audioRef.current) {
      try { audioRef.current.currentTime = clamped; } catch (e) {}
    }
  };

  const playSlice = (startTime, endTime) => {
    if (!audioRef.current || status !== 'ready') return;
    previewSliceEndRef.current = endTime || audioDuration;
    seekToTime(startTime);
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      rafTimeRef.current = requestAnimationFrame(syncAudioLoop);
    }).catch(e => console.error(e));
  };

  // Convert Client Coordinate to Audio Timestamp
  const getTimeFromPointer = useCallback((clientX) => {
    if (!timelineRef.current || audioDuration <= 0) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * audioDuration;
  }, [audioDuration]);

  // ─── 120 FPS High-Performance Timeline Seeking (Zero Lag) ───────────────────
  const handleTimelinePointerDown = (e) => {
    if (!timelineRef.current || status !== 'ready') return;
    if (e.target.closest('.marker-element') || e.target.closest('.no-seek-zone')) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current.isDraggingTimeline = true;
    previewSliceEndRef.current = null;
    
    const newTime = getTimeFromPointer(e.clientX);
    seekToTime(newTime);
  };

  const handleTimelinePointerMove = (e) => {
    if (!timelineRef.current) return;
    const newTime = getTimeFromPointer(e.clientX);
    const pct = (newTime / audioDuration) * 100;

    // Fast direct DOM Hover Line Update (No React state re-render!)
    if (hoverGuideRef.current) {
      hoverGuideRef.current.style.display = 'flex';
      hoverGuideRef.current.style.left = `${pct}%`;
      if (hoverBadgeRef.current) {
        hoverBadgeRef.current.innerText = `⏱ ${formatTime(newTime, true)}`;
      }
    }

    if (!dragRef.current.isDraggingTimeline) return;
    
    // Direct DOM Playhead Update during active drag
    updatePlayheadDOM(newTime);
    
    // Throttled Audio Seek
    if (!rafAudioSeekRef.current) {
      rafAudioSeekRef.current = requestAnimationFrame(() => {
        if (audioRef.current) {
          try { audioRef.current.currentTime = newTime; } catch (err) {}
        }
        rafAudioSeekRef.current = null;
      });
    }
  };

  const handleTimelinePointerUp = (e) => {
    if (!dragRef.current.isDraggingTimeline) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    dragRef.current.isDraggingTimeline = false;
    const finalTime = getTimeFromPointer(e.clientX);
    seekToTime(finalTime);
  };

  const handleTimelinePointerLeave = () => {
    if (hoverGuideRef.current && !dragRef.current.isDraggingTimeline) {
      hoverGuideRef.current.style.display = 'none';
    }
  };

  // ─── 120 FPS High-Performance Marker Dragging (Direct DOM manipulation) ─────
  const handleMarkerPointerDown = (e, idx) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    
    dragRef.current.draggingMarkerIdx = idx;
    dragRef.current.currentMarkerTime = markers[idx];
    dragRef.current.startX = e.clientX;
    dragRef.current.startTime = Date.now();
    dragRef.current.hasMoved = false;

    // Show floating drag tooltip
    if (dragTooltipRef.current) {
      dragTooltipRef.current.style.display = 'block';
      dragTooltipRef.current.innerText = `Split #${idx + 1}: ${formatTime(markers[idx], true)}`;
    }
  };

  const handleMarkerPointerMove = (e) => {
    const { draggingMarkerIdx, startX } = dragRef.current;
    if (draggingMarkerIdx === null || !timelineRef.current) return;
    e.stopPropagation();
    
    if (Math.abs(e.clientX - startX) > 3) {
      dragRef.current.hasMoved = true;
    }

    const newTime = getTimeFromPointer(e.clientX);
    dragRef.current.currentMarkerTime = newTime;
    const pct = Math.max(0, Math.min(100, (newTime / audioDuration) * 100));

    // DIRECT DOM UPDATE: No React State Re-render while moving mouse!
    const markerEl = markerRefs.current[draggingMarkerIdx];
    if (markerEl) {
      markerEl.style.left = `${pct}%`;
    }
    
    const badgeEl = markerBadgeRefs.current[draggingMarkerIdx];
    if (badgeEl) {
      badgeEl.innerText = `${draggingMarkerIdx + 1} • ${formatTime(newTime, true)}`;
    }

    if (dragTooltipRef.current) {
      dragTooltipRef.current.style.left = `${pct}%`;
      dragTooltipRef.current.innerText = `Split #${draggingMarkerIdx + 1}: ${formatTime(newTime, true)}`;
    }
  };

  const handleMarkerPointerUp = (e) => {
    const { draggingMarkerIdx, currentMarkerTime, hasMoved } = dragRef.current;
    if (draggingMarkerIdx === null) return;
    e.stopPropagation();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}

    // Hide drag tooltip
    if (dragTooltipRef.current) {
      dragTooltipRef.current.style.display = 'none';
    }

    const isClick = !hasMoved && (Date.now() - dragRef.current.startTime) < 250;
    
    if (isClick) {
      // Click on marker removes it
      removeMarker(draggingMarkerIdx);
    } else if (currentMarkerTime !== null) {
      // Commit final marker position to React state ONCE
      setMarkers(prev => {
        const updated = [...prev];
        updated[draggingMarkerIdx] = currentMarkerTime;
        return updated.sort((a, b) => a - b);
      });
    }

    dragRef.current.draggingMarkerIdx = null;
    dragRef.current.currentMarkerTime = null;
    dragRef.current.hasMoved = false;
  };

  // Zoom handlers (supports Wheel, Pinch, Ctrl+Scroll, and Buttons)
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.3 : -0.3;
      setZoom(prev => Math.min(16, Math.max(1, +(prev + delta * prev).toFixed(2))));
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(16, +(prev * 1.5).toFixed(2)));
  const zoomOut = () => setZoom(prev => Math.max(1, +(prev / 1.5).toFixed(2)));
  const resetZoom = () => setZoom(1);

  // Marker Management
  const addMarker = () => {
    if (currentTime > 0 && currentTime < audioDuration) {
      setMarkers(prev => {
        if (prev.some(m => Math.abs(m - currentTime) < 0.5)) return prev;
        return [...prev, currentTime].sort((a, b) => a - b);
      });
    }
  };

  const removeMarker = (index) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
  };

  const autoDetectSilences = async () => {
    if (!uri) return;
    setIsDetecting(true);
    try {
      const res = await fetch(`/api/m2/splitter/detect-silence?uri=${encodeURIComponent(uri)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.markers && data.markers.length > 0) {
          setMarkers(data.markers.sort((a, b) => a - b));
        }
      }
    } catch (err) {
      console.error('Failed to auto-detect silences', err);
    }
    setIsDetecting(false);
  };

  const handleTitleChange = (index, newTitle) => {
    setCustomTitles(prev => {
      const updated = [...prev];
      updated[index] = newTitle;
      return updated;
    });
  };

  // Compile slice segments list
  const sliceSegments = useMemo(() => {
    const segments = [];
    let lastTime = 0;
    const sorted = [...markers].sort((a, b) => a - b);
    
    for (let i = 0; i <= sorted.length; i++) {
      const endTime = i === sorted.length ? audioDuration : sorted[i];
      const title = customTitles[i] || (titles[i] ? titles[i] : `Track ${i + 1}`);
      const segDuration = Math.max(0, endTime - lastTime);
      segments.push({
        index: i,
        title,
        startTime: lastTime,
        endTime: i === sorted.length ? null : endTime,
        rawEndTime: endTime,
        duration: segDuration
      });
      lastTime = endTime;
    }
    return segments;
  }, [markers, customTitles, titles, audioDuration]);

  const handleExport = () => {
    const finalSongs = sliceSegments.map(s => ({
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime
    }));
    onExport(finalSongs);
  };

  // Calculate dynamic tick intervals for Time Ruler based on Zoom
  const timeRulerTicks = useMemo(() => {
    if (audioDuration <= 0) return [];
    
    let interval = 60; // default 1 min
    if (zoom >= 8) interval = 5;       // every 5 sec
    else if (zoom >= 4) interval = 10; // every 10 sec
    else if (zoom >= 2) interval = 30; // every 30 sec
    else if (audioDuration > 3600) interval = 300; // 5 mins
    else if (audioDuration > 1200) interval = 120; // 2 mins

    const ticks = [];
    for (let t = 0; t <= audioDuration; t += interval) {
      ticks.push({ time: t, pct: (t / audioDuration) * 100 });
    }
    return ticks;
  }, [audioDuration, zoom]);

  // Loading State
  if (status !== 'ready') {
    return (
      <div className="w-full h-40 bg-[#0c0d14] rounded-xl flex flex-col items-center justify-center border border-white/10 shadow-inner">
        <div className="relative mb-3">
          <Loader className="w-8 h-8 text-orange-400 animate-spin" />
          <div className="absolute inset-0 blur-md bg-orange-500/20 rounded-full animate-pulse" />
        </div>
        <span className="text-xs text-gray-300 font-semibold tracking-wide">
          {status === 'downloading' ? `Downloading Audio Stream... ${progress.toFixed(1)}%` : 'Initializing Waveform Engine...'}
        </span>
        <div className="w-48 bg-gray-800 h-1.5 rounded-full overflow-hidden mt-3 border border-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0c0d14] rounded-xl border border-[#272b3b] p-4 flex flex-col gap-4 shadow-2xl">
      
      {/* ── Header: Title, Marker Stats & Zoom Controls ─────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-2">
              Manual Waveform Slicer
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                120 FPS ULTRA-SMOOTH
              </span>
            </h3>
            <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
              <span>{sliceSegments.length} Output Tracks</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">{markers.length} Markers</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">Total: {formatTime(audioDuration)}</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#141722] p-1 rounded-lg border border-[#272b3b]">
          <button 
            onClick={zoomOut}
            disabled={zoom <= 1}
            title="Zoom Out (Ctrl + Scroll Down)"
            className="p-1.5 rounded bg-[#1c202e] hover:bg-[#252a3d] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          
          <span className="text-[10px] font-mono font-bold text-orange-400 px-2 min-w-[50px] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button 
            onClick={zoomIn}
            disabled={zoom >= 16}
            title="Zoom In (Ctrl + Scroll Up)"
            className="p-1.5 rounded bg-[#1c202e] hover:bg-[#252a3d] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn size={13} />
          </button>

          {zoom > 1 && (
            <button 
              onClick={resetZoom}
              title="Reset Zoom to Fit"
              className="ml-1 px-2 py-1 text-[9px] font-bold rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition-colors"
            >
              Fit
            </button>
          )}
        </div>
      </div>

      {/* Hidden Audio Player */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.target.duration) && !isNaN(e.target.duration) && e.target.duration > 0) {
            setAudioDuration(e.target.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* ── Interactive Waveform & Scrubber Area ────────────────────────────── */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="relative w-full bg-[#10121a] rounded-lg border border-[#272b3b] overflow-x-auto overflow-y-hidden select-none custom-scrollbar"
        style={{ minHeight: '160px' }}
      >
        <div 
          ref={timelineRef}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerUp}
          onPointerLeave={handleTimelinePointerLeave}
          className="relative h-40 cursor-crosshair group touch-none"
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
        >
          {/* 1. Time Ruler Top */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-[#0a0b10] border-b border-[#212534] flex items-center pointer-events-none z-10">
            {timeRulerTicks.map((tick, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 border-l border-[#30374e] flex flex-col justify-between pl-1"
                style={{ left: `${tick.pct}%` }}
              >
                <span className="text-[8px] font-mono text-gray-400 font-bold leading-none select-none">
                  {formatTime(tick.time)}
                </span>
                <div className="h-1.5 w-[1px] bg-gray-500/40" />
              </div>
            ))}
          </div>

          {/* 2. Hardware Accelerated Canvas Waveform (Zero DOM lag) */}
          <canvas
            ref={canvasRef}
            className="absolute top-6 bottom-7 left-0 right-0 w-full h-[calc(100%-52px)] pointer-events-none"
          />

          {/* 3. Slice Segment Shading & Visual Bands */}
          <div className="absolute top-6 bottom-7 left-0 right-0 pointer-events-none flex">
            {sliceSegments.map((seg, i) => {
              const startPct = (seg.startTime / audioDuration) * 100;
              const endPct = (seg.rawEndTime / audioDuration) * 100;
              const widthPct = Math.max(0, endPct - startPct);
              return (
                <div
                  key={i}
                  className="h-full border-r border-cyan-500/20 flex items-end justify-center pb-1"
                  style={{
                    width: `${widthPct}%`,
                    background: i % 2 === 0 ? 'rgba(56, 189, 248, 0.02)' : 'rgba(249, 115, 22, 0.02)'
                  }}
                >
                  <span className="text-[9px] font-bold text-gray-400 truncate max-w-[90%] px-1.5 py-0.5 bg-black/50 rounded border border-white/5 backdrop-blur-sm shadow-md">
                    #{i + 1} {seg.title} ({formatDurationHuman(seg.duration)})
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. Real-Time Fast Hover Guide Line & Badge (Direct DOM) */}
          <div 
            ref={hoverGuideRef}
            className="absolute top-0 bottom-0 pointer-events-none z-30 flex-col items-center hidden"
            style={{ left: '0%' }}
          >
            <div className="w-[1px] h-full bg-amber-400/90 border-l border-dashed border-amber-300" />
            <div 
              ref={hoverBadgeRef}
              className="absolute top-7 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black font-mono shadow-xl whitespace-nowrap transform -translate-x-1/2"
            >
              ⏱ 00:00.0
            </div>
          </div>

          {/* 5. Direct DOM Red Playhead Line with Current Time Badge */}
          <div 
            ref={playheadRef}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.9)]"
            style={{ left: `${(currentTime / audioDuration) * 100}%` }}
          >
            <div 
              ref={playheadBadgeRef}
              className="absolute top-0 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black font-mono px-1 py-0.2 rounded-b shadow-lg"
            >
              ▶ {formatTime(currentTime)}
            </div>
          </div>

          {/* 6. Cyan Split Markers (Pure Direct DOM dragging for 120 FPS) */}
          {markers.map((markerTime, idx) => {
            const pct = (markerTime / audioDuration) * 100;
            return (
              <div 
                key={idx}
                ref={el => markerRefs.current[idx] = el}
                className="absolute top-0 bottom-0 w-1 z-30 cursor-ew-resize bg-cyan-400 hover:bg-cyan-300 marker-element touch-none active:bg-cyan-200"
                style={{ left: `${pct}%` }}
                onPointerDown={(e) => handleMarkerPointerDown(e, idx)}
                onPointerMove={handleMarkerPointerMove}
                onPointerUp={handleMarkerPointerUp}
              >
                {/* Marker Top Badge */}
                <div 
                  ref={el => markerBadgeRefs.current[idx] = el}
                  className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold font-mono flex items-center gap-1 shadow-2xl bg-cyan-500 hover:bg-cyan-400 text-black select-none pointer-events-none"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black/30 flex items-center justify-center text-[8px] text-white font-black">
                    {idx + 1}
                  </span>
                  <span>{formatTime(markerTime, true)}</span>
                </div>
              </div>
            );
          })}

          {/* Floating Dragging Tooltip */}
          <div 
            ref={dragTooltipRef}
            className="absolute -top-7 -translate-x-1/2 bg-black/95 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-2xl whitespace-nowrap pointer-events-none z-50 hidden"
          >
            Split: 00:00.0
          </div>

          {/* 7. Bottom Title Chips Bar (ISOLATED FROM PLAYHEAD CLICKS) */}
          <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#0a0b10] border-t border-[#212534] flex opacity-90 z-20">
            {sliceSegments.map((seg, i) => {
              const startPct = (seg.startTime / audioDuration) * 100;
              const endPct = (seg.rawEndTime / audioDuration) * 100;
              const widthPct = Math.max(0, endPct - startPct);
              return (
                <div 
                  key={i} 
                  className="h-full border-r border-[#30374e] text-[9px] px-1 flex items-center no-seek-zone group/chip overflow-hidden"
                  style={{ width: `${widthPct}%`, background: i % 2 === 0 ? '#12151f' : '#161925' }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-bold text-orange-400 shrink-0 mr-1 select-none">#{i + 1}</span>
                  <input
                    type="text"
                    value={customTitles[i] || ''}
                    placeholder={`Track ${i + 1}`}
                    onChange={(e) => handleTitleChange(i, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-gray-200 border-none outline-none placeholder-gray-600 truncate font-semibold text-[9px] hover:bg-white/5 focus:bg-[#1a1e2e] focus:ring-1 focus:ring-orange-500 px-1 rounded transition-all"
                  />
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Main Audio Transport Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#10121a] p-3 rounded-lg border border-[#212534]">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-950/50 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>
          
          {/* Exact Time Counter */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Playhead Position</span>
            <span className="text-sm font-mono font-black text-white tracking-wide">
              {formatTime(currentTime, true)} <span className="text-gray-500 font-normal text-xs">/ {formatTime(audioDuration)}</span>
            </span>
          </div>
          
          <div className="h-6 w-[1px] bg-gray-800 mx-1 hidden sm:block" />

          {/* Add Marker at Playhead */}
          <button 
            onClick={addMarker}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg shadow-md active:scale-95 transition-all"
          >
            <Plus size={14} />
            Add Marker at Playhead ({formatTime(currentTime)})
          </button>

          {/* Auto-Detect Silences */}
          <button 
            onClick={autoDetectSilences}
            disabled={isDetecting}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
              isDetecting 
                ? 'bg-amber-500/10 text-amber-500/50 border-amber-500/20 cursor-not-allowed' 
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 active:scale-95'
            }`}
          >
            <Sparkles size={14} className={isDetecting ? 'animate-spin' : ''} />
            {isDetecting ? 'Detecting Silences...' : 'Auto-Detect Silences'}
          </button>
        </div>

        {/* Confirm & Split Export Button */}
        <button 
          onClick={handleExport}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-xl shadow-purple-950/60 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          Confirm & Split ({sliceSegments.length} Songs)
        </button>
      </div>

      {/* ── Dedicated Track Slices Table / Editor ───────────────────────────── */}
      <div className="bg-[#10121a] rounded-lg border border-[#212534] p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 border-b border-white/5 pb-2">
          <span className="flex items-center gap-2">
            <Clock size={13} className="text-orange-400" />
            Song Slices Table (Click title to rename, Click time badge to jump playhead)
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {sliceSegments.length} Tracks Configured
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {sliceSegments.map((seg, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 bg-[#161925] hover:bg-[#1b1f2e] p-2 rounded-lg border border-[#272b3b] transition-all group"
            >
              {/* Track Number Badge */}
              <div className="w-6 h-6 rounded-md bg-orange-500/20 border border-orange-500/40 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0 select-none">
                #{i + 1}
              </div>

              {/* Play Segment Button */}
              <button 
                onClick={() => playSlice(seg.startTime, seg.rawEndTime)}
                title={`Preview Slice #${i + 1} (${formatTime(seg.startTime)} - ${formatTime(seg.rawEndTime)})`}
                className="w-7 h-7 rounded-md bg-white/10 hover:bg-orange-500 text-gray-300 hover:text-white flex items-center justify-center shrink-0 transition-colors"
              >
                <Play size={12} className="ml-0.5 fill-current" />
              </button>

              {/* Track Title Editor */}
              <div className="flex-1 min-w-[140px] flex items-center gap-1.5 bg-[#0a0b10] px-2 py-1 rounded border border-[#2c3247] focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                <Edit2 size={11} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={customTitles[i] || ''}
                  placeholder={`Track ${i + 1} Title`}
                  onChange={(e) => handleTitleChange(i, e.target.value)}
                  className="w-full bg-transparent text-white font-semibold text-xs border-none outline-none placeholder-gray-600"
                />
              </div>

              {/* Time Range Badges (Clickable to Seek) */}
              <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                <button
                  onClick={() => seekToTime(seg.startTime)}
                  title="Jump to Start Time"
                  className="px-2 py-1 rounded bg-[#0a0b10] hover:bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-bold transition-colors"
                >
                  {formatTime(seg.startTime)}
                </button>
                <span className="text-gray-600">➔</span>
                <button
                  onClick={() => seekToTime(seg.rawEndTime)}
                  title="Jump to End Time"
                  className="px-2 py-1 rounded bg-[#0a0b10] hover:bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-bold transition-colors"
                >
                  {seg.endTime ? formatTime(seg.endTime) : 'END'}
                </button>
                <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-bold ml-1">
                  {formatDurationHuman(seg.duration)}
                </span>
              </div>

              {/* Delete Marker Button (Only for slices that have a following marker) */}
              {i < markers.length ? (
                <button
                  onClick={() => removeMarker(i)}
                  title={`Remove Marker #${i + 1} (Merge with next song)`}
                  className="w-7 h-7 rounded-md bg-red-950/30 hover:bg-red-600 border border-red-800/40 text-red-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              ) : (
                <div className="w-7 h-7 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Tips Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
        <span>💡 <b>Zoom Tip:</b> Gunakan <b>Ctrl + Scroll Mouse</b> atau tombol <b>+ / -</b> untuk zoom in detail waveform.</span>
        <span>💡 <b>Marker Tip:</b> Geser garis biru dengan mouse (120 FPS ultra smooth). Klik garis biru untuk menghapus marker.</span>
      </div>

    </div>
  );
}
