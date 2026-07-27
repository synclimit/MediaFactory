import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Scissors, Check, Loader } from 'lucide-react';

const formatTime = (sec) => {
  if (sec === null || sec === undefined) return '...';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function ManualSlicer({ uri, titles = [], duration = 0, onExport }) {
  const [status, setStatus] = useState('init'); // init, downloading, ready, error
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration > 0 ? duration : 1);
  const [markers, setMarkers] = useState([]);
  const [customTitles, setCustomTitles] = useState(titles);
  
  // Dragging states
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [draggingMarkerIdx, setDraggingMarkerIdx] = useState(null);
  const wasPlayingRef = useRef(false);
  const markerClickStart = useRef({ x: 0, time: 0 });
  
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const rafRef = useRef(null);

  const [audioUrl, setAudioUrl] = useState('');
  
  // Initialize markers evenly spaced based on titles length
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

  // Download logic (similar to M2PlaybackBar)
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
          setAudioUrl(`/api/m2/stream?uri=${encodeURIComponent(uri)}`);
          setStatus('ready');
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

  const updateTime = () => {
    if (audioRef.current && !isDraggingTimeline) {
      setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(updateTime);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || status !== 'ready') return;
    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(rafRef.current);
    } else {
      audioRef.current.play().catch(e => console.error(e));
      rafRef.current = requestAnimationFrame(updateTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimelinePointerDown = (e) => {
    if (!timelineRef.current || status !== 'ready' || e.target.closest('.marker-element')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingTimeline(true);
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    setCurrentTime(newTime);
    
    if (audioRef.current && Number.isFinite(newTime) && !isNaN(newTime)) {
      try { audioRef.current.currentTime = newTime; } catch(err){}
    }
  };

  const handleTimelinePointerMove = (e) => {
    if (!isDraggingTimeline || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    setCurrentTime(newTime);
    
    if (audioRef.current && Number.isFinite(newTime) && !isNaN(newTime)) {
      try { audioRef.current.currentTime = newTime; } catch(err){}
    }
  };

  const handleTimelinePointerUp = (e) => {
    if (!isDraggingTimeline) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // Prevent the jump-back glitch by delaying the release of the drag state
    setTimeout(() => setIsDraggingTimeline(false), 100);
  };

  const handleMarkerPointerDown = (e, idx) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingMarkerIdx(idx);
    markerClickStart.current = { x: e.clientX, time: Date.now() };
  };

  const handleMarkerPointerMove = (e) => {
    if (draggingMarkerIdx === null || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    
    setMarkers(prev => {
      const updated = [...prev];
      updated[draggingMarkerIdx] = newTime;
      return updated;
    });
  };

  const handleMarkerPointerUp = (e) => {
    if (draggingMarkerIdx === null) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const isClick = Math.abs(e.clientX - markerClickStart.current.x) < 5 && (Date.now() - markerClickStart.current.time) < 300;
    
    if (isClick) {
      removeMarker(draggingMarkerIdx);
    } else {
      setMarkers(prev => [...prev].sort((a,b) => a - b));
    }
    
    setDraggingMarkerIdx(null);
  };

  const [isDetecting, setIsDetecting] = useState(false);

  const addMarker = () => {
    if (currentTime > 0 && currentTime < audioDuration) {
      setMarkers(prev => {
        const updated = [...prev, currentTime].sort((a, b) => a - b);
        return updated;
      });
    }
  };

  const autoDetectSilences = async () => {
    if (!uri) return;
    setIsDetecting(true);
    try {
      const res = await fetch(`/api/m2/splitter/detect-silence?uri=${encodeURIComponent(uri)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.markers && data.markers.length > 0) {
          setMarkers(data.markers);
        }
      }
    } catch (err) {
      console.error('Failed to auto-detect silences', err);
    }
    setIsDetecting(false);
  };

  const removeMarker = (index) => {
    setMarkers(prev => prev.filter((_, i) => i !== index));
  };

  const handleTitleChange = (index, newTitle) => {
    setCustomTitles(prev => {
      const updated = [...prev];
      updated[index] = newTitle;
      return updated;
    });
  };

  const handleExport = () => {
    const finalSongs = [];
    let lastTime = 0;
    
    // Create songs from markers
    for (let i = 0; i <= markers.length; i++) {
      const endTime = i === markers.length ? null : markers[i];
      const title = customTitles[i] || `Track ${i + 1}`;
      finalSongs.push({
        title: title,
        startTime: lastTime,
        endTime: endTime
      });
      if (endTime) lastTime = endTime;
    }
    
    onExport(finalSongs);
  };

  if (status !== 'ready') {
    return (
      <div className="w-full h-32 bg-black/40 rounded-lg flex flex-col items-center justify-center border border-white/5">
        <Loader className="w-6 h-6 text-white/50 animate-spin mb-2" />
        <span className="text-xs text-white/50 font-medium">
          {status === 'downloading' ? `Downloading Audio... ${progress.toFixed(1)}%` : 'Preparing Audio...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-black/40 rounded-lg border border-white/5 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-400" />
          Manual Waveform Slicer
        </h3>
        <span className="text-xs text-gray-500 font-mono">
          {titles.length} Titles &bull; {markers.length} Markers
        </span>
      </div>

      <audio 
        ref={audioRef} 
        src={audioUrl}
        onLoadedMetadata={(e) => {
          // Only update if duration from props was 0, or if the new duration is valid
          if (duration === 0 && Number.isFinite(e.target.duration) && !isNaN(e.target.duration) && e.target.duration !== Infinity) {
            setAudioDuration(e.target.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Scrubber Area */}
      <div className="relative w-full h-24 bg-gray-900 rounded-lg border border-white/10 overflow-hidden cursor-crosshair group select-none"
           style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 4px), #111827' }}
           ref={timelineRef}
           onPointerDown={handleTimelinePointerDown}
           onPointerMove={handleTimelinePointerMove}
           onPointerUp={handleTimelinePointerUp}>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: `${(currentTime / audioDuration) * 100}%` }}
        />

        {/* Markers */}
        {markers.map((markerTime, idx) => (
          <div 
            key={idx}
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 cursor-ew-resize hover:bg-cyan-300 transition-colors group-hover:opacity-100 marker-element touch-none"
            style={{ left: `${(markerTime / audioDuration) * 100}%` }}
            onPointerDown={(e) => handleMarkerPointerDown(e, idx)}
            onPointerMove={handleMarkerPointerMove}
            onPointerUp={handleMarkerPointerUp}
          >
            <div className="absolute top-1 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-bold px-1 rounded pointer-events-none">
              {idx + 1}
            </div>
          </div>
        ))}

        {/* Title Blocks visualization */}
        <div className="absolute bottom-0 left-0 right-0 h-5 flex opacity-75">
           {(() => {
             const blocks = [];
             let lastPct = 0;
             for (let i = 0; i <= markers.length; i++) {
               const mTime = i === markers.length ? audioDuration : markers[i];
               const pct = (mTime / audioDuration) * 100;
               const width = Math.max(0, pct - lastPct);
               blocks.push(
                 <div key={i} className="h-full border-r border-white/20 text-[9px] px-1 group/block"
                      style={{ width: `${width}%`, background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }}>
                   <input
                     type="text"
                     value={customTitles[i] || ''}
                     placeholder={`Track ${i+1}`}
                     onChange={(e) => handleTitleChange(i, e.target.value)}
                     onClick={(e) => e.stopPropagation()}
                     className="w-full bg-transparent text-white/90 border-none outline-none placeholder-white/30 truncate pointer-events-auto hover:bg-white/10 px-1 rounded transition-colors"
                   />
                 </div>
               );
               lastPct = pct;
             }
             return blocks;
           })()}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
          </button>
          
          <span className="text-xs font-mono text-gray-400">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </span>
          
          <button 
            onClick={addMarker}
            className="ml-2 px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-md transition-colors"
          >
            + Add Marker at Playhead
          </button>

          <button 
            onClick={autoDetectSilences}
            disabled={isDetecting}
            className={`ml-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
              isDetecting ? 'bg-amber-500/10 text-amber-500/50 cursor-not-allowed' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
            }`}
          >
            {isDetecting ? 'Detecting...' : '✨ Auto-Detect Silences'}
          </button>
        </div>

        <button 
          onClick={handleExport}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-md shadow-lg shadow-purple-900/50 flex items-center gap-2 transition-colors"
        >
          <Check className="w-4 h-4" />
          Confirm & Split
        </button>
      </div>
      
      <p className="text-[10px] text-gray-500 text-center">
        Tip: Click on the blue marker lines to remove them. Adjust your playhead and click "+ Add Marker" to place new splits.
      </p>
    </div>
  );
}
