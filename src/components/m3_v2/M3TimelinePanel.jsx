import React, { useState, useRef, useEffect export default React.memo(M3TimelinePanel); from 'react';
import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, Mic2, MicOff, Search, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { fastRenderState } from '../../services/pipeline/fastrender/core/FastRenderState.js';


export default function M3TimelinePanel({
  m3Objects, setM3Objects,
  m3AudioTracks,
  m3CurrentTimeSec, setM3CurrentTimeSec,
  m3TotalDurationSec,
  m3SelectedObjectId, setM3SelectedObjectId
}) {
  const [zoom, setZoom] = useState(1); // 1 = 50px per second
  const containerRef = useRef(null);
  const trackAreaRef = useRef(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const basePixelsPerSec = 50;
  const pixelsPerSec = basePixelsPerSec * zoom;
  const totalTimelineWidth = Math.max((m3TotalDurationSec || 60) * pixelsPerSec, 800);

  // Combine audio and objects into tracks
  // Order: Beat Track (placeholder), Audio, Background, Visualizer, Effects...
  const tracks = [
    { id: 'beat-track', name: 'Beat Track', type: 'beat', icon: '🎵', isPlaceholder: true },
    ...(m3AudioTracks || []).map((t, i) => ({
      id: `audio-${i}`, name: t.title || 'Audio Track', type: 'audio', icon: '🔊', locked: false, visible: true
    })),
    ...(m3Objects || []).map(obj => ({
      id: obj.id,
      name: obj.name || obj.type,
      type: obj.type,
      icon: getIconForType(obj.type),
      locked: obj.locked,
      visible: obj.visible !== false,
      objRef: obj
    }))
  ];

  function getIconForType(type) {
    switch(type) {
      case 'background': return '🖼️';
      case 'visualizer': return '📊';
      case 'text': return '📝';
      case 'effect': return '✨';
      case 'camera': return '🎥';
      case 'logo': return '🛡️';
      case 'widget': return '🧩';
      default: return '📦';
    }
  }

  // --- Playhead Dragging Logic ---
  const handleRulerPointerDown = (e) => {
    setIsDraggingPlayhead(true);
    updatePlayheadFromEvent(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingPlayhead) {
      updatePlayheadFromEvent(e);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingPlayhead(false);
  };

  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPlayhead]);

  const updatePlayheadFromEvent = (e) => {
    if (!trackAreaRef.current) return;
    const rect = trackAreaRef.current.getBoundingClientRect();
    const scrollLeft = trackAreaRef.current.scrollLeft;
    const x = Math.max(0, e.clientX - rect.left + scrollLeft);
    let time = x / pixelsPerSec;
    time = Math.max(0, Math.min(time, m3TotalDurationSec || 60));
    setM3CurrentTimeSec(time);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const toggleVisibility = (id) => {
    setM3Objects(prev => prev.map(obj => obj.id === id ? { ...obj, visible: obj.visible === false ? true : false } : obj));
  };

  const toggleLock = (id) => {
    setM3Objects(prev => prev.map(obj => obj.id === id ? { ...obj, locked: !obj.locked } : obj));
  };

  const handleSelectTrack = (id) => {
    if (!id.startsWith('beat') && !id.startsWith('audio')) {
      setM3SelectedObjectId(id);
    }
  };

  // Reordering (Drag and Drop simulation for standard order update)
  const moveTrackUp = (index) => {
    // Only moving actual objects (adjust index by subtracting non-object tracks)
    const nonObjCount = tracks.findIndex(t => t.objRef) !== -1 ? tracks.findIndex(t => t.objRef) : 0;
    if (index <= nonObjCount) return; // Can't move above audio/beat
    
    const objIndex = index - nonObjCount;
    if (objIndex <= 0) return;

    setM3Objects(prev => {
      const next = [...prev];
      const temp = next[objIndex];
      next[objIndex] = next[objIndex - 1];
      next[objIndex - 1] = temp;
      return next;
    });
  };

  const moveTrackDown = (index) => {
    const nonObjCount = tracks.findIndex(t => t.objRef) !== -1 ? tracks.findIndex(t => t.objRef) : 0;
    const objIndex = index - nonObjCount;
    if (objIndex < 0 || objIndex >= (m3Objects || []).length - 1) return;

    setM3Objects(prev => {
      const next = [...prev];
      const temp = next[objIndex];
      next[objIndex] = next[objIndex + 1];
      next[objIndex + 1] = temp;
      return next;
    });
  };

  // Generate ruler ticks
  const generateRulerTicks = () => {
    const ticks = [];
    const duration = m3TotalDurationSec || 60;
    
    // Determine tick interval based on zoom (e.g. 1 sec, 5 sec)
    let interval = 1;
    if (zoom < 0.5) interval = 5;
    if (zoom > 2) interval = 0.5;

    for (let i = 0; i <= duration; i += interval) {
      ticks.push(
        <div key={i} className="absolute h-full flex flex-col justify-end" style={{ left: `${i * pixelsPerSec}px` }}>
          <div className="text-[10px] text-gray-500 -ml-3 mb-1">{formatTime(i).split('.')[0]}</div>
          <div className="w-[1px] h-2 bg-gray-600"></div>
        </div>
      );
    }
    return ticks;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!m3SelectedObjectId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        setM3SelectedObjectId(null);
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setM3Objects(prev => {
          const target = prev.find(o => o.id === m3SelectedObjectId);
          if (!target) return prev;
          const clone = { ...target, id: target.id + '_copy_' + Date.now(), y: target.y + 20 };
          return [...prev, clone];
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [m3SelectedObjectId, setM3Objects, setM3SelectedObjectId]);

  return (
    <div className="flex flex-col h-64 bg-[#141824] border-t border-[#2d3247] shrink-0 text-white select-none">
      
      {/* Timeline Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d3247] bg-[#1a1e2d]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Layers size={14} className="text-purple-400" />
            TIMELINE
          </div>
          
          <div className="flex items-center gap-1 bg-[#0a0d14] rounded px-2 py-1 border border-[#2d3247]">
            <span className="text-[10px] text-gray-500 font-mono">{formatTime(m3CurrentTimeSec)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Search size={12} className="text-gray-500" />
            <input 
              type="range" 
              min="0.2" max="3" step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 h-1 bg-[#2d3247] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Track Headers (Left Pane) */}
        <div className="w-64 flex flex-col border-r border-[#2d3247] bg-[#1a1e2d] overflow-y-auto custom-scrollbar shrink-0">
          <div className="h-8 border-b border-[#2d3247] bg-[#1e2230] shrink-0 flex items-center px-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Layer Name
          </div>
          
          <div className="flex flex-col flex-1">
            {tracks.map((track, i) => (
              <div 
                key={track.id} 
                onClick={() => handleSelectTrack(track.id)}
                className={`h-10 border-b border-[#2d3247]/50 flex items-center px-2 gap-2 cursor-pointer transition-colors ${m3SelectedObjectId === track.id ? 'bg-purple-900/40 border-l-2 border-l-purple-500' : 'hover:bg-[#2d3247]/30 border-l-2 border-l-transparent'}`}
              >
                {/* Track Controls */}
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); if(track.objRef) toggleVisibility(track.id); }} className="p-1 hover:text-white" title="Visibility">
                    {track.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-400" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if(track.objRef) toggleLock(track.id); }} className="p-1 hover:text-white" title="Lock">
                    {track.locked ? <Lock size={12} className="text-red-400" /> : <Unlock size={12} />}
                  </button>
                </div>

                {/* Track Icon & Name */}
                <span className="text-sm w-5 text-center">{track.icon}</span>
                <span className="text-xs truncate flex-1 font-medium">{track.name}</span>
                
                {/* Reorder arrows (only for objects) */}
                {track.objRef && (
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveTrackUp(i); }} className="text-gray-500 hover:text-white leading-none">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moveTrackDown(i); }} className="text-gray-500 hover:text-white leading-none">▼</button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Future Stubs */}
            <div className="h-10 border-b border-[#2d3247]/50 flex items-center px-4 gap-2 opacity-30 pointer-events-none">
              <span className="text-sm">📌</span>
              <span className="text-xs italic">Keyframes (Future)</span>
            </div>
            <div className="h-10 border-b border-[#2d3247]/50 flex items-center px-4 gap-2 opacity-30 pointer-events-none">
              <span className="text-sm">✂️</span>
              <span className="text-xs italic">Transitions (Future)</span>
            </div>
          </div>
        </div>

        {/* Track Area (Right Pane) */}
        <div 
          ref={trackAreaRef}
          className="flex-1 overflow-auto relative custom-scrollbar bg-[#0a0d14]"
        >
          <div style={{ width: `${totalTimelineWidth}px`, minHeight: '100%' }} className="relative">
            
            {/* Ruler */}
            <div 
              className="sticky top-0 h-8 bg-[#1e2230] border-b border-[#2d3247] z-20 cursor-text"
              onPointerDown={handleRulerPointerDown}
            >
              {generateRulerTicks()}
            </div>

            {/* Dual-Ruler & Master Loop Overlay (Fast Render Mode) */}
            {fastRenderState.isFastMode() && (
              <>
                <div 
                  className="absolute top-0 h-8 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border-x border-cyan-400 z-25 pointer-events-none flex items-center justify-between px-2 shadow-[0_0_12px_rgba(0,243,255,0.25)]"
                  style={{ left: '0px', width: `${(fastRenderState.getMasterLoopDuration() || 10.0) * pixelsPerSec}px` }}
                >
                  <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>⚡ LOOP START</span>
                  </span>
                  <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                    <span>⚡ {(fastRenderState.getMasterLoopDuration() || 10.0).toFixed(1)}s LOOP END</span>
                  </span>
                </div>
                
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-35 pointer-events-none border-r border-cyan-300 shadow-[0_0_10px_#00f3ff]"
                  style={{ left: `${(fastRenderState.getMasterLoopDuration() || 10.0) * pixelsPerSec}px` }}
                />
              </>
            )}


            {/* Playhead Line */}
            <div 
              className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none"
              style={{ left: `${m3CurrentTimeSec * pixelsPerSec}px` }}
            >
              {/* Playhead Cap */}
              <div className="absolute top-0 -left-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-red-500"></div>
            </div>

            {/* Layer Blocks */}
            <div className="absolute top-8 left-0 right-0 bottom-0 flex flex-col">
              {tracks.map((track) => (
                <div key={track.id} className={`h-10 border-b border-[#2d3247]/30 flex items-center relative ${m3SelectedObjectId === track.id ? 'bg-purple-900/10' : ''}`}>
                  {track.isPlaceholder ? (
                    // Beat track placeholder
                    <div className="absolute top-2 bottom-2 left-0 right-0 bg-[#2d3247]/20 border border-[#2d3247] rounded flex items-center justify-center opacity-50 overflow-hidden">
                       <span className="text-[10px] text-gray-500">Beat markers will populate here</span>
                    </div>
                  ) : (
                    // Actual clip block spanning the object's duration
                    <div 
                      className={`absolute top-1.5 bottom-1.5 rounded-md border shadow-sm flex items-center px-2 truncate transition-colors cursor-pointer ${m3SelectedObjectId === track.id ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-[#1e2230] border-[#3f4556] text-gray-300 hover:bg-[#2d3247]'}`}
                      style={{ 
                        left: `${(track.objRef?.startTime || 0) * pixelsPerSec}px`, 
                        width: `${(track.objRef?.duration || m3TotalDurationSec || 60) * pixelsPerSec}px` 
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handleSelectTrack(track.id);
                        
                        // Basic Drag implementation for Move
                        const startX = e.clientX;
                        const initialStartTime = track.objRef?.startTime || 0;
                        
                        const handlePointerMove = (moveEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaSec = deltaX / pixelsPerSec;
                          setM3Objects(prev => prev.map(obj => 
                            obj.id === track.id 
                            ? { ...obj, startTime: Math.max(0, initialStartTime + deltaSec) } 
                            : obj
                          ));
                        };
                        
                        const handlePointerUp = () => {
                          window.removeEventListener('pointermove', handlePointerMove);
                          window.removeEventListener('pointerup', handlePointerUp);
                        };
                        
                        window.addEventListener('pointermove', handlePointerMove);
                        window.addEventListener('pointerup', handlePointerUp);
                      }}
                    >
                      <span className="text-[10px] font-medium truncate pointer-events-none">{track.name}</span>
                      
                      {/* Trim Handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"></div>
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
