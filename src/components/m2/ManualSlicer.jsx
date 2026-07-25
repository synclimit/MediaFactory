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
  
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const rafRef = useRef(null);

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
          setStatus('ready');
          if (audioRef.current) {
            audioRef.current.src = `/api/m2/stream?uri=${encodeURIComponent(uri)}`;
          }
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
    if (audioRef.current) {
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

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || status !== 'ready') return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    
    if (audioRef.current && Number.isFinite(newTime) && !isNaN(newTime)) {
      try {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      } catch (err) {}
    }
  };

  const addMarker = () => {
    if (currentTime > 0 && currentTime < audioDuration) {
      setMarkers(prev => {
        const updated = [...prev, currentTime].sort((a, b) => a - b);
        return updated;
      });
    }
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
        onLoadedMetadata={(e) => {
          // Only update if duration from props was 0, or if the new duration is valid
          if (duration === 0 && Number.isFinite(e.target.duration) && !isNaN(e.target.duration) && e.target.duration !== Infinity) {
            setAudioDuration(e.target.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Scrubber Area */}
      <div className="relative w-full h-24 bg-gray-900 rounded-lg border border-white/10 overflow-hidden cursor-crosshair group"
           ref={timelineRef}
           onClick={handleTimelineClick}>
        
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none transition-all duration-75"
          style={{ left: `${(currentTime / audioDuration) * 100}%` }}
        />

        {/* Markers */}
        {markers.map((markerTime, idx) => (
          <div 
            key={idx}
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 cursor-col-resize hover:bg-cyan-300 transition-colors group-hover:opacity-100"
            style={{ left: `${(markerTime / audioDuration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              // In a full implementation we'd support drag. For now, click to remove.
              removeMarker(idx);
            }}
          >
            <div className="absolute top-1 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-bold px-1 rounded">
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
