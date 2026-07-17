import React, { useState, useEffect, useRef } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { emitRuntimeEvent } from '../../services/RuntimeClient';

export default function M3PlaybackBar({ m3AudioTracks = [], currentTimeSec = 0, setCurrentTimeSec, currentTrackIndex = 0, setCurrentTrackIndex, onAnalyserReady }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalTrackIndex, setInternalTrackIndex] = useState(0);
  const [toastError, setToastError] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = React.useRef(null);
  const seekTargetRef = React.useRef(null);
  const timelineRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);
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

  // Unified track index state
  const activeTrackIndex = setCurrentTrackIndex ? currentTrackIndex : internalTrackIndex;
  const updateTrackIndex = (idx) => {
      if (setCurrentTrackIndex) setCurrentTrackIndex(idx);
      else setInternalTrackIndex(idx);
  };

  useEffect(() => {
    if (m3AudioTracks.length > 0) {
      const trk = m3AudioTracks[activeTrackIndex];
      if (trk && audioRef.current) {
        const targetSrc = trk.blobUrl || `/api/m2/stream?uri=${encodeURIComponent(trk.sourcePath.replace(/\\/g, '/'))}`;
        if (audioRef.current.getAttribute('src') !== targetSrc) {
          audioRef.current.setAttribute('src', targetSrc);
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
    window.m3IsPlaying = isPlaying;
  }, [isPlaying, activeTrackIndex, m3AudioTracks, playbackSpeed]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || isDragging) return;
    let cumulative = 0;
    for (let i = 0; i < activeTrackIndex; i++) {
      cumulative += (m3AudioTracks[i].durationSec || 0);
    }
    setCurrentTimeSec(cumulative + audioRef.current.currentTime);
  };

  const handleEnded = () => {
    if (activeTrackIndex < m3AudioTracks.length - 1) {
      updateTrackIndex(activeTrackIndex + 1);
    } else {
      setIsPlaying(false);
      updateTrackIndex(0);
      setCurrentTimeSec(0);
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

    if (foundIdx !== activeTrackIndex) {
      updateTrackIndex(foundIdx);
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

  const analyserRef = React.useRef(null);

  const initAudioContext = () => {
    if (!audioRef.current) return;

    // If AudioContext already exists, just re-fire onAnalyserReady with existing analyser.
    // This handles HMR reloads where the same <audio> element cannot get a new MediaElementSource.
    if (audioCtxRef.current) {
      if (analyserRef.current && onAnalyserReady) {
        // Patch smoothingTimeConstant in case it was changed since last init
        analyserRef.current.smoothingTimeConstant = 0.0;
        onAnalyserReady(analyserRef.current);
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.0; // RAW data — no smoothing so kick transients are sharp single-frame spikes
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;



      if (onAnalyserReady) onAnalyserReady(analyser);
    } catch(e) {
      console.error("AudioContext init failed:", e);

    }
  };

  const onPreviewPlay = () => { 
      window.m3IsPlaying = true;
      setIsPlaying(true); 
      initAudioContext();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }
      emitRuntimeEvent('Playlist.Play'); 
  };
  const onPreviewPause = () => { 
      window.m3IsPlaying = false;
      setIsPlaying(false); 
      emitRuntimeEvent('Playlist.Pause'); 
  };
  const onPreviewStop = () => {
    window.m3IsPlaying = false;
    setIsPlaying(false);
    updateTrackIndex(0);
    setCurrentTimeSec(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    emitRuntimeEvent('Playlist.Stop');
  };
  const onPreviewNext = () => {
      if (activeTrackIndex < m3AudioTracks.length - 1) {
          updateTrackIndex(activeTrackIndex + 1);
          setCurrentTimeSec(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
          emitRuntimeEvent('Playlist.Next');
      }
  };
  const onPreviewPrev = () => {
      if (activeTrackIndex > 0) {
          updateTrackIndex(activeTrackIndex - 1);
          setCurrentTimeSec(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
          emitRuntimeEvent('Playlist.Prev');
      }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Surface variant={BackgroundVariants.Queue} className="flex flex-col border-t border-b border-[#21232d] p-2 space-y-2 shrink-0">
      
      {/* Top Row: Playback Controls & Info */}
      <div className="flex justify-between items-center">
        {/* Playback Controls */}
        <div className="flex bg-[#12131a] border border-[#2d3247] rounded overflow-hidden shadow-md items-center">
          <button onClick={onPreviewPrev} className="px-3 py-1.5 hover:bg-[#2d3247] transition-colors text-[11px] text-gray-400 font-bold border-r border-[#2d3247]">⏮</button>
          <button onClick={onPreviewPlay} className={`px-4 py-1.5 hover:bg-[#2d3247] transition-colors text-[11px] font-bold border-r border-[#2d3247] ${isPlaying ? 'bg-[#2d3247] text-emerald-300' : 'text-emerald-400'}`}>▶ Play</button>
          <button onClick={onPreviewPause} className="px-4 py-1.5 hover:bg-[#2d3247] transition-colors text-[11px] text-amber-400 font-bold border-r border-[#2d3247]">⏸ Pause</button>
          <button onClick={onPreviewStop} className="px-4 py-1.5 hover:bg-[#2d3247] transition-colors text-[11px] text-red-400 font-bold border-r border-[#2d3247]">⏹ Stop</button>
          <button onClick={onPreviewNext} className="px-3 py-1.5 hover:bg-[#2d3247] transition-colors text-[11px] text-gray-400 font-bold border-r border-[#2d3247]">⏭</button>
          
          <div className="flex items-center gap-2 border-r border-[#2d3247] px-3 h-full">
            <span className="text-[9px] text-gray-500 font-bold">SPEED</span>
            <select 
              value={playbackSpeed} 
              onChange={(e) => {
                const speed = parseFloat(e.target.value);
                setPlaybackSpeed(speed);
                if (audioRef.current) audioRef.current.playbackRate = speed;
              }} 
              className="bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-3">
            <span className="text-[9px] text-gray-500 font-bold">VOL</span>
            <input 
              type="range" min="0" max="1" step="0.05" defaultValue="0.5"
              onChange={(e) => { if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)); }}
              className="w-16 accent-[#2563eb]" 
            />
          </div>
        </div>

        {/* Time Display */}
        <div className="text-[14px] font-mono font-bold text-gray-300 bg-[#12131a] border border-[#2d3247] px-3 py-1 rounded shadow-inner">
          <span className="text-emerald-400">{formatTime(currentTimeSec)}</span> <span className="text-gray-500">/</span> {formatTime(totalDurationSec)}
        </div>
      </div>

      {/* Bottom Row: Preview Seek Bar */}
      <div 
        ref={timelineRef}
        onMouseDown={handleTimelineMouseDown}
        className="h-4 bg-[#181922] border border-[#2d3247] rounded cursor-pointer relative overflow-hidden group"
      >
        <div 
          className="absolute top-0 bottom-0 bg-blue-600/30 group-hover:bg-blue-600/50 transition-colors pointer-events-none"
          style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
        ></div>
        <div 
          className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_8px_#34d399] pointer-events-none -ml-0.5"
          style={{ left: `${(currentTimeSec / totalDurationSec) * 100}%` }}
        ></div>
      </div>

      <audio ref={audioRef} crossOrigin="anonymous" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />

      {/* Error Toast */}
      {toastError && (
        <div className="absolute bottom-16 right-4 bg-red-900 border border-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          <div className="font-bold text-[11px] mb-1">Cannot Preview Audio</div>
          <div className="text-[10px] font-mono">Reason: {toastError}</div>
          <button onClick={() => setToastError(null)} className="absolute top-1 right-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}
    </Surface>
  );
}
