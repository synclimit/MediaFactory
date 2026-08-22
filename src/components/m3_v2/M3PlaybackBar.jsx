import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Rewind, FastForward, Volume2 } from 'lucide-react';
import { emitRuntimeEvent } from '../../services/RuntimeClient';
import { beatEngine } from '../../services/audio/BeatEngine';
import { getApiUrl } from '../../utils/apiUrl';

function M3PlaybackBar({ m3AudioTracks = [], currentTimeSec = 0, setCurrentTimeSec, currentTrackIndex = 0, setCurrentTrackIndex, onAnalyserReady }) {
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

  const getAudioSource = (trk) => {
    if (!trk) return '';
    if (trk.blobUrl && trk.blobUrl.startsWith('blob:')) {
      return trk.blobUrl;
    }
    const sp = trk.sourcePath || trk.path || trk.uri || trk.title || '';
    const cleanSp = sp.replace(/\\/g, '/');
    return getApiUrl(`/api/m2/stream?uri=${encodeURIComponent(cleanSp)}`);
  };

  useEffect(() => {
    if (m3AudioTracks.length > 0) {
      const trk = m3AudioTracks[activeTrackIndex];
      if (trk && audioRef.current) {
        const targetSrc = getAudioSource(trk);
        if (audioRef.current.getAttribute('src') !== targetSrc) {
          audioRef.current.setAttribute('src', targetSrc);
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.load();
        }
        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.warn("[Audio Preview] Primary play error, trying stream fallback:", e);
              // Fallback if blobUrl failed
              const streamSrc = getAudioSource({ ...trk, blobUrl: null });
              if (audioRef.current.getAttribute('src') !== streamSrc) {
                audioRef.current.setAttribute('src', streamSrc);
                audioRef.current.load();
                audioRef.current.play().catch(err => console.error("[Audio Preview] Stream fallback error:", err));
              }
            });
          }
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
      
      analyser.getFrequencyData = function() {
        if (!this._freqBuffer || this._freqBuffer.length !== this.frequencyBinCount) {
          this._freqBuffer = new Uint8Array(this.frequencyBinCount);
        }
        this.getByteFrequencyData(this._freqBuffer);
        return this._freqBuffer;
      };

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      window.m3Analyser = analyser;
      try { beatEngine.setSource(analyser); } catch(e) {}

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
      if (analyserRef.current || window.m3Analyser) {
          try { beatEngine.setSource(analyserRef.current || window.m3Analyser); } catch(e) {}
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
    <div className="flex flex-col w-full bg-[#0a0a0a] relative group">
      
      {/* Top Edge Seek Bar */}
      <div 
        ref={timelineRef}
        onMouseDown={handleTimelineMouseDown}
        className="absolute top-0 left-0 right-0 h-[2px] bg-[#1a1b26] cursor-pointer hover:h-1 transition-all z-10"
      >
        <div 
          className="absolute top-0 bottom-0 bg-blue-600/30 pointer-events-none"
          style={{ width: `${(currentTimeSec / totalDurationSec) * 100}%` }}
        ></div>
        <div 
          className="absolute top-0 bottom-0 w-1 bg-[#f97316] shadow-[0_0_8px_#f97316] pointer-events-none -ml-0.5 transition-all"
          style={{ left: `${(currentTimeSec / totalDurationSec) * 100}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between px-4 py-1 mt-1">
        
        {/* Left: Time Display */}
        <div className="text-[11px] font-mono font-medium text-gray-500 w-32 flex items-center gap-1">
          <span className="text-gray-300">{formatTime(currentTimeSec)}</span> <span className="opacity-40">/</span> <span>{formatTime(totalDurationSec)}</span>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          <button onClick={onPreviewPrev} className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all"><Rewind size={14} fill="currentColor" /></button>
          
          {isPlaying ? (
            <button onClick={onPreviewPause} className="p-1.5 rounded bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] transition-all"><Pause size={16} fill="currentColor" /></button>
          ) : (
            <button onClick={onPreviewPlay} className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-all"><Play size={16} fill="currentColor" className="ml-0.5" /></button>
          )}
          
          <button onClick={onPreviewStop} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"><Square size={12} fill="currentColor" /></button>
          <button onClick={onPreviewNext} className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all"><FastForward size={14} fill="currentColor" /></button>
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-4 w-32 justify-end">
          {/* Speed */}
          <select 
            value={playbackSpeed} 
            onChange={(e) => {
              const speed = parseFloat(e.target.value);
              setPlaybackSpeed(speed);
              if (audioRef.current) audioRef.current.playbackRate = speed;
            }} 
            className="bg-transparent text-gray-500 hover:text-gray-300 text-[10px] font-bold outline-none cursor-pointer appearance-none"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
          
          {/* Vol */}
          <div className="flex items-center gap-1.5 group/vol">
            <Volume2 size={12} className="text-gray-500 group-hover/vol:text-gray-300 transition-colors" />
            <input 
              type="range" min="0" max="1" step="0.05" defaultValue="0.5"
              onChange={(e) => { if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)); }}
              className="w-12 h-[2px] accent-[#f97316] opacity-30 group-hover/vol:opacity-100 transition-opacity cursor-pointer bg-gray-800" 
            />
          </div>
        </div>
      </div>

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} className="hidden" />

      {/* Error Toast */}
      {toastError && (
        <div className="absolute bottom-full mb-2 right-4 bg-red-900/90 backdrop-blur-md border border-red-500 text-white px-3 py-1.5 rounded shadow flex items-center gap-2">
          <div className="text-[10px]">Cannot Preview Audio: <span className="font-mono opacity-70">{toastError}</span></div>
          <button onClick={() => setToastError(null)} className="text-red-300 hover:text-white ml-2 text-[10px]">✕</button>
        </div>
      )}
    </div>
  );
}

export default M3PlaybackBar;
