import React, { useState, useEffect, useRef } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';

export default function M3FloatingPlaybackOverlay({ m3AudioTracks, currentTimeSec = 0, setCurrentTimeSec }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [toastError, setToastError] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = React.useRef(null);
  const seekTargetRef = React.useRef(null);
  const timelineRef = React.useRef(null);
  
  const totalDurationSec = m3AudioTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0) || 1;

  // Debug Listeners
  useEffect(() => {
    const aud = audioRef.current;
    if (!aud) return;

    const logEvt = (msg) => {
      console.log(`[Audio Preview] ${msg}`);
      if (window.addLog) window.addLog(`[Audio Preview] ${msg}`);
    };

    const handleLoadStart = () => logEvt('Load Start');
    const handleLoadedMetadata = () => {
      logEvt(`Loaded Metadata. Duration: ${aud.duration}`);
      if (seekTargetRef.current !== null) {
        aud.currentTime = seekTargetRef.current;
        seekTargetRef.current = null;
      }
    };
    const handleLoadedData = () => logEvt('Loaded Data');
    const handleCanPlay = () => logEvt('Can Play');
    const handlePlay = () => logEvt('Play');
    const handlePause = () => logEvt('Pause');
    const handleEndedEvent = () => logEvt('Ended');
    const handleError = (e) => {
      const errCode = aud.error ? aud.error.code : 0;
      let errStr = 'UNKNOWN_ERROR';
      if (errCode === 1) errStr = 'MEDIA_ERR_ABORTED';
      if (errCode === 2) errStr = 'MEDIA_ERR_NETWORK';
      if (errCode === 3) errStr = 'MEDIA_ERR_DECODE';
      if (errCode === 4) errStr = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
      
      logEvt(`Error: ${errStr}`);
      setToastError(errStr);
      setIsPlaying(false);
    };

    aud.addEventListener('loadstart', handleLoadStart);
    aud.addEventListener('loadedmetadata', handleLoadedMetadata);
    aud.addEventListener('loadeddata', handleLoadedData);
    aud.addEventListener('canplay', handleCanPlay);
    aud.addEventListener('play', handlePlay);
    aud.addEventListener('pause', handlePause);
    aud.addEventListener('ended', handleEndedEvent);
    aud.addEventListener('error', handleError);

    return () => {
      aud.removeEventListener('loadstart', handleLoadStart);
      aud.removeEventListener('loadedmetadata', handleLoadedMetadata);
      aud.removeEventListener('loadeddata', handleLoadedData);
      aud.removeEventListener('canplay', handleCanPlay);
      aud.removeEventListener('play', handlePlay);
      aud.removeEventListener('pause', handlePause);
      aud.removeEventListener('ended', handleEndedEvent);
      aud.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (m3AudioTracks.length > 0) {
      const trk = m3AudioTracks[currentTrackIndex];
      if (trk && audioRef.current) {
        const targetSrc = trk.blobUrl || `/api/m2/stream?uri=${encodeURIComponent(trk.sourcePath.replace(/\\/g, '/'))}`;
        if (!audioRef.current.src.endsWith(targetSrc)) {
          audioRef.current.src = targetSrc;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.load();
        }
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Play error caught", e));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentTrackIndex, m3AudioTracks, playbackSpeed]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || isDragging) return;
    let cumulative = 0;
    for (let i = 0; i < currentTrackIndex; i++) {
      cumulative += (m3AudioTracks[i].durationSec || 0);
    }
    if (setCurrentTimeSec) setCurrentTimeSec(cumulative + audioRef.current.currentTime);
  };

  const handleEnded = () => {
    if (currentTrackIndex < m3AudioTracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      if (setCurrentTimeSec) setCurrentTimeSec(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const seekToTime = (targetTime) => {
    if (m3AudioTracks.length === 0) return;
    let cumulative = 0;
    let foundIdx = 0;
    let trackOffset = 0;
    for (let i = 0; i < m3AudioTracks.length; i++) {
       const dur = m3AudioTracks[i].durationSec || 0;
       if (targetTime >= cumulative && targetTime <= cumulative + dur) {
          foundIdx = i;
          trackOffset = targetTime - cumulative;
          break;
       }
       cumulative += dur;
    }
    
    if (targetTime >= totalDurationSec) {
       foundIdx = m3AudioTracks.length - 1;
       trackOffset = m3AudioTracks[foundIdx].durationSec || 0;
    }

    if (foundIdx !== currentTrackIndex) {
      setCurrentTrackIndex(foundIdx);
      seekTargetRef.current = trackOffset;
    } else {
      if (audioRef.current) audioRef.current.currentTime = trackOffset;
    }
    if (setCurrentTimeSec) setCurrentTimeSec(targetTime);
  };

  const seekFromMouseEvent = (e) => {
    if (!timelineRef.current || totalDurationSec <= 0 || m3AudioTracks.length === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    let fraction = x / width;
    if (fraction < 0) fraction = 0;
    if (fraction > 1) fraction = 1;
    seekToTime(fraction * totalDurationSec);
  };

  const handleTimelineMouseDown = (e) => {
    setIsDragging(true);
    seekFromMouseEvent(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) seekFromMouseEvent(e);
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, totalDurationSec, m3AudioTracks]);

  const onPreviewPlay = () => setIsPlaying(true);
  const onPreviewPause = () => setIsPlaying(false);
  const onPreviewStop = () => {
    setIsPlaying(false);
    setCurrentTrackIndex(0);
    if (setCurrentTimeSec) setCurrentTimeSec(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Surface 
      variant={BackgroundVariants.Inspector}
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 w-11/12 max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col p-2 gap-2 ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between w-full px-2">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1">
          <button onClick={onPreviewPlay} className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-white/10 text-emerald-400' : 'hover:bg-white/10 text-emerald-400'}`} title="Play">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg>
          </button>
          <button onClick={onPreviewPause} className="p-2 rounded-full hover:bg-white/10 transition-colors text-amber-400" title="Pause">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/></svg>
          </button>
          <button onClick={onPreviewStop} className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-400" title="Stop">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10"/></svg>
          </button>
        </div>

        {/* Center: Thin Seek Bar */}
        <div className="flex-1 mx-4 flex flex-col justify-center relative group">
          <div 
            ref={timelineRef}
            onMouseDown={handleTimelineMouseDown}
            className="h-[4px] bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
          >
            <div 
              className="absolute top-0 bottom-0 bg-emerald-400 pointer-events-none rounded-full"
              style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
            ></div>
          </div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {formatTime(currentTimeSec)} / {formatTime(totalDurationSec)}
          </div>
        </div>

        {/* Right: Volume & Speed */}
        <div className="flex items-center gap-3">
          <select 
            value={playbackSpeed} 
            onChange={(e) => {
              const speed = parseFloat(e.target.value);
              setPlaybackSpeed(speed);
              if (audioRef.current) audioRef.current.playbackRate = speed;
            }} 
            className="bg-transparent text-gray-300 text-[10px] font-bold outline-none cursor-pointer"
            title="Playback Speed"
          >
            <option value="0.5" className="bg-[#1e2230]">0.5x</option>
            <option value="0.75" className="bg-[#1e2230]">0.75x</option>
            <option value="1" className="bg-[#1e2230]">1.0x</option>
            <option value="1.25" className="bg-[#1e2230]">1.25x</option>
            <option value="1.5" className="bg-[#1e2230]">1.5x</option>
            <option value="2" className="bg-[#1e2230]">2.0x</option>
          </select>
          
          <div className="flex items-center gap-1 group/vol">
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/></svg>
            <input 
              type="range" min="0" max="1" step="0.05"
              onChange={(e) => { if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)); }}
              className="w-12 h-1 bg-white/20 rounded-full appearance-none outline-none accent-white opacity-0 group-hover/vol:opacity-100 transition-opacity" 
              title="Volume"
            />
          </div>
        </div>
      </div>

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />

      {/* Error Toast */}
      {toastError && (
        <div className="absolute top-12 right-0 bg-red-900 border border-red-500 text-white px-3 py-1 rounded shadow-lg z-50 text-[10px]">
          <span className="font-bold mr-2">Audio Error:</span> {toastError}
          <button onClick={() => setToastError(null)} className="ml-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
