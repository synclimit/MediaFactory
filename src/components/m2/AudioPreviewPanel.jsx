import React, { useState, useEffect, useRef, useCallback } from 'react';
import { foundation } from '../../foundation/index.js';
import { audioProcessingProfileRepo } from '../../repositories/m2/AudioProcessingProfileRepository.js';
import { AUDIO_PRESETS, AUDIO_CONTROLS } from '../../entities/m2/AudioProcessingProfile.js';
import { AudioPresetLibrary } from '../../entities/m2/AudioPresetLibrary.js';
import { m2CacheManager } from '../../services/m2/CacheManager.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1.5 cursor-pointer">
      <span className="text-[8px] text-gray-500 bg-[#21232d] hover:bg-[#2d3247] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-40 -translate-x-1/2 rounded bg-[#0f111a] border border-[#2d3247] p-1.5 text-[9px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#0f111a] border-r border-b border-[#2d3247]"></div>
      </div>
    </div>
  );
}

// ─── Audio Engine ─────────────────────────────────────────────────────────────
// Browser-native Web Audio API engine.
// Architecture note: this adapter layer is designed to be replaced with a
// real FFmpeg/processing engine at a later stage without UI changes.

class PreviewAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.bassFilter = null;
    this.trebleFilter = null;
    this.audioBuffer = null;
    this.currentUri = null;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.isPlaying = false;
    this.duration = 0;
    this._onEndedCallback = null;
  }

  _ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  _buildGraph(profile) {
    this._ensureContext();
    const ctx = this.audioCtx;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = profile?.normalize ? 0.85 : 1.0;

    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 200;
    this.bassFilter.gain.value = profile?.bass ?? 0;

    this.trebleFilter = ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 4000;
    this.trebleFilter.gain.value = profile?.treble ?? 0;

    // Chain: gain → bass → treble → destination
    this.gainNode.connect(this.bassFilter);
    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(ctx.destination);
  }

  async loadTrack(uri, setStatus) {
    console.log('[loadTrack] ENTERED', uri);
    if (this.currentUri === uri && this.audioBuffer) {
      console.log('[loadTrack] SUCCESS: Using cached buffer');
      if (setStatus) setStatus('Preview Ready (Cached)');
      return;
    }
    
    this._ensureContext();
    if (setStatus) setStatus('Downloading Audio...');
    
    try {
      const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be');
      console.log('[loadTrack] isYouTube:', isYouTube);
      if (isYouTube) {
        console.log('[loadTrack] ENTERED SSE prepare-stream');
        await new Promise((resolve, reject) => {
          const esUrl = `/api/m2/prepare-stream?uri=${encodeURIComponent(uri)}`;
          console.log('[loadTrack] Opening EventSource:', esUrl);
          const es = new EventSource(esUrl);
          es.onmessage = (e) => {
            console.log('[loadTrack] SSE Message:', e.data);
            try {
              const data = JSON.parse(e.data);
              if (data.status === 'downloading') {
                if (setStatus) setStatus(`Downloading Audio... ${data.progress || 0}%`);
              } else if (data.status === 'extracting') {
                if (setStatus) setStatus('Extracting Audio...');
              } else if (data.status === 'ready' || data.status === 'ready_cached') {
                if (data.status === 'ready_cached' && setStatus) {
                  setStatus('Preview Ready (Cached)');
                }
                console.log('[loadTrack] SSE SUCCESS');
                es.close();
                resolve();
              } else if (data.status === 'error') {
                console.log('[loadTrack] SSE FAILURE: Backend emitted error');
                es.close();
                reject(new Error('Prepare failed'));
              }
            } catch(err) {
              console.log('[loadTrack] SSE JSON Parse error', err);
            }
          };
          es.onerror = (err) => {
            console.log('[loadTrack] SSE FAILURE: EventSource onerror triggered. Possibly 404 or connection refused.', err);
            es.close();
            reject(new Error('SSE Error'));
          };
        });
      }

      console.log('[loadTrack] ENTERED stream endpoint fetch()');
      const streamUrl = await m2CacheManager.resolveTrack(uri);
      console.log('[loadTrack] streamUrl:', streamUrl);
      
      // If we didn't just get 'Preview Ready (Cached)' from the event source:
      if (setStatus) setStatus(prev => prev === 'Preview Ready (Cached)' ? prev : 'Preparing Preview...');

      const response = await fetch(streamUrl);
      console.log('[loadTrack] fetch response ok:', response.ok);
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      
      console.log('[loadTrack] ENTERED AudioContext.decodeAudioData()');
      const arrayBuffer = await response.arrayBuffer();
      console.log('[loadTrack] ArrayBuffer byteLength:', arrayBuffer.byteLength);
      this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      console.log('[loadTrack] decodeAudioData SUCCESS');
      this.duration = this.audioBuffer.duration;
      this.currentUri = uri;
      
      if (setStatus) setStatus(prev => prev === 'Preview Ready (Cached)' ? prev : 'Preview Ready');
    } catch (err) {
      console.error('[PreviewAudioEngine] loadTrack error:', err.message, err.stack);
      this.audioBuffer = null;
      this.currentUri = null;
      if (setStatus) setStatus('error');
      // Re-throw to caller to trace if needed
      throw err;
    }
  }

  play(offset = 0, profile = null) {
    if (!this.audioCtx || !this.audioBuffer) return;
    this._stopSource();
    this._buildGraph(profile);

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    // Apply tempo via playbackRate
    const tempo = profile?.tempo ?? 1.0;
    this.sourceNode.playbackRate.value = Math.max(0.5, Math.min(2.0, tempo));
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this._onEndedCallback?.();
      }
    };

    const safeOffset = Math.max(0, Math.min(offset, this.duration - 0.1));
    this.startTime = this.audioCtx.currentTime - safeOffset;
    this.pauseOffset = safeOffset;
    this.sourceNode.start(0, safeOffset);
    this.isPlaying = true;
  }

  _stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.onended = null;
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.gainNode) { try { this.gainNode.disconnect(); } catch {} }
    if (this.bassFilter) { try { this.bassFilter.disconnect(); } catch {} }
    if (this.trebleFilter) { try { this.trebleFilter.disconnect(); } catch {} }
  }

  stop() {
    const elapsed = this.isPlaying ? (this.audioCtx.currentTime - this.startTime) : this.pauseOffset;
    this.pauseOffset = elapsed;
    this._stopSource();
    this.isPlaying = false;
  }

  seek(positionSec, profile = null) {
    const wasPlaying = this.isPlaying;
    this._stopSource();
    this.isPlaying = false;
    this.pauseOffset = positionSec;
    if (wasPlaying) {
      this.play(positionSec, profile);
    }
  }

  applyProfile(profile) {
    if (!this.isPlaying) return;
    const offset = this.currentPosition();
    this._stopSource();
    this.isPlaying = false;
    this.play(offset, profile);
  }

  currentPosition() {
    if (!this.audioCtx) return 0;
    if (this.isPlaying) {
      const elapsed = this.audioCtx.currentTime - this.startTime;
      return Math.min(elapsed, this.duration);
    }
    return this.pauseOffset;
  }

  destroy() {
    this._stopSource();
    try { this.audioCtx?.close(); } catch {}
    this.audioCtx = null;
  }

  onEnded(cb) {
    this._onEndedCallback = cb;
  }
}

// ─── Slider Row ───────────────────────────────────────────────────────────────

function SliderRow({ label, tooltip, value, displayValue, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <span className="text-[9px] font-mono text-purple-300 font-bold tabular-nums">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={onChange}
        className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
      />
      <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Unified Audio Preview & Settings Panel ───────────────────────────────────

export default function AudioPreviewPanel({ isDevMode = false, addLog, addNotification }) {

  // ── Sources ────────────────────────────────────────────────────────────────
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  // ── Playback ───────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewMode, setPreviewMode] = useState('processed'); // 'original' | 'processed'
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [sourceStatus, setSourceStatus] = useState('ready'); // loading, ready, error

  // ── Profile (global, owned by this panel) ──────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const profileRef = useRef(null);
  const sliderTimeoutRef = useRef(null);
  const wasPlayingRef = useRef(false);

  // ─── Load sources and profile ──────────────────────────────────────────────
  useEffect(() => {
    // Load sources
    const loadSources = async () => {
      try {
        const all = await foundation.sourceService.getAll();
        const valid = all.filter(s => s.status !== 'invalid');
        setSources(valid);
        if (valid.length > 0) {
          setSelectedSourceId(valid[0].id);
        }
      } catch (err) {
        console.error('[AudioPreviewPanel] loadSources error:', err);
      }
    };

    // Load profile
    const loadProfile = async () => {
      setIsProfileLoading(true);
      try {
        const p = await audioProcessingProfileRepo.getGlobalProfile();
        setProfile(p);
        profileRef.current = p;
      } catch (err) {
        console.error('[AudioPreviewPanel] loadProfile error:', err);
      }
      setIsProfileLoading(false);
    };

    loadSources();
    loadProfile();

    // Init engine
    engineRef.current = new PreviewAudioEngine();
    engineRef.current.onEnded(() => {
      setIsPlaying(false);
      setPosition(0);
    });

    return () => {
      engineRef.current?.destroy();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Periodically refresh sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        const all = await foundation.sourceService.getAll();
        const valid = all.filter(s => s.status !== 'invalid');
        setSources(valid);
      } catch {}
    };
    foundation.sourceService.addEventListener('sources_updated', loadSources);
    return () => foundation.sourceService.removeEventListener('sources_updated', loadSources);
  }, []);

  // ─── Animation frame for position tracking ─────────────────────────────────
  const tickPosition = useCallback(function tickFn() {
    if (engineRef.current?.isPlaying && !isSeeking) {
      setPosition(engineRef.current.currentPosition());
    }
    rafRef.current = requestAnimationFrame(tickFn);
  }, [isSeeking]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tickPosition);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tickPosition]);

  // ─── Profile update helper ─────────────────────────────────────────────────
  const determinePresetName = (newProfile) => {
    const allPresets = AudioPresetLibrary.getAllPresets();
    for (const preset of allPresets) {
      if (
        newProfile.pitch === preset.pitch &&
        newProfile.tempo === preset.tempo &&
        newProfile.bass === preset.bass &&
        newProfile.treble === preset.treble &&
        newProfile.stereoWidth === preset.stereoWidth &&
        newProfile.normalize === preset.normalize
      ) {
        return preset.name;
      }
    }
    return 'Custom';
  };

  const updateProfile = async (changes, logMessage = null) => {
    const updated = await audioProcessingProfileRepo.updateGlobalProfile(changes);
    setProfile(updated);
    profileRef.current = updated;
    if (logMessage && addLog) addLog(logMessage);
    // Live-apply to playing engine when in processed mode
    if (engineRef.current?.isPlaying && previewMode === 'processed') {
      engineRef.current.applyProfile(updated);
    }
  };

  // ─── Profile handlers ──────────────────────────────────────────────────────
  const handlePresetSelect = (presetName) => {
    const presetObj = AudioPresetLibrary.getPresetByName(presetName);
    if (presetObj && presetName !== 'Custom') {
      const presetValues = {
        pitch: presetObj.pitch,
        tempo: presetObj.tempo,
        bass: presetObj.bass,
        treble: presetObj.treble,
        stereoWidth: presetObj.stereoWidth,
        normalize: presetObj.normalize
      };
      const oldPreset = profile?.presetName || 'Custom';
      updateProfile({ ...presetValues, presetName }, `[M2] Audio Profile Updated: ${oldPreset} -> ${presetName}`);
      if (oldPreset !== presetName) {
        addNotification?.('Audio Profile Updated', `${oldPreset} -> ${presetName}`);
      }
    }
  };

  const handleSliderChange = (field, value) => {
    if (!profile) return;
    const numValue = parseFloat(value);
    const newProfile = { ...profile, [field]: numValue };
    const matchingPreset = determinePresetName(newProfile);
    updateProfile(
      { [field]: numValue, presetName: matchingPreset },
      `Audio Setting: ${field} → ${numValue}`
    );
    
    if (sliderTimeoutRef.current) clearTimeout(sliderTimeoutRef.current);
    sliderTimeoutRef.current = setTimeout(() => {
      addNotification?.('Profile Updated');
    }, 600);
  };

  const handleNormalizeToggle = () => {
    if (!profile) return;
    const newValue = !profile.normalize;
    const newProfile = { ...profile, normalize: newValue };
    const matchingPreset = determinePresetName(newProfile);
    updateProfile(
      { normalize: newValue, presetName: matchingPreset },
      `Normalize: ${newValue ? 'ON' : 'OFF'}`
    );
    addNotification?.('Profile Updated');
  };

  // ─── Derived values ────────────────────────────────────────────────────────
  const selectedSource = sources.find(s => s.id === selectedSourceId);
  const displayTitle = selectedSource
    ? (selectedSource.cleanTitle || selectedSource.videoTitle || selectedSource.title || 'Unknown Track')
    : null;
  const sourceDuration = selectedSource?.videoDuration || 180;
  const progressPct = duration > 0 ? (position / duration) * 100 : 0;

  // ─── Playback handlers ─────────────────────────────────────────────────────
  const handleSelectSource = async (id) => {
    const wasPlaying = engineRef.current?.isPlaying;
    if (wasPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
    }
    setSelectedSourceId(id);
    setPosition(0);
    setEngineReady(false);

    const src = sources.find(s => s.id === id);
    const uri = src?.localPath || src?.youtubeUrl || src?.title;
    
    const sourceTitle = src?.cleanTitle || src?.videoTitle || src?.title || 'Unknown';
    addLog?.(`[Preview] Track selected: ${sourceTitle}`);

    if (uri) {
      await engineRef.current.loadTrack(uri, setSourceStatus);
      setDuration(engineRef.current.duration || src?.videoDuration || 0);
      setEngineReady(true);
    }
  };

  const handlePlay = async () => {
    if (!selectedSourceId) return;
    if (!engineReady || !sourceStatus.includes('Ready')) {
      const src = selectedSource;
      const uri = src?.localPath || src?.youtubeUrl || src?.title;
      if (uri) {
        await engineRef.current.loadTrack(uri, setSourceStatus);
        setDuration(engineRef.current.duration || src?.videoDuration || 0);
        setEngineReady(true);
      }
    }
    
    // We must re-check sourceStatus after the await, because the state variable isn't updated in this closure
    // But we know loadTrack will throw or set buffer
    if (!engineRef.current.audioBuffer) {
       addNotification?.('Preview Error', 'Failed to load audio stream.');
       return;
    }
    
    const activeProfile = previewMode === 'processed' ? profileRef.current : null;
    engineRef.current.play(position, activeProfile);
    setIsPlaying(true);
    addLog?.(`[Preview] Playback started — mode: ${previewMode}, track: "${displayTitle}", position: ${formatTime(position)}`);
  };

  const handleStop = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    wasPlayingRef.current = !!engineRef.current?.isPlaying;
    if (engineRef.current?.isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleSeekChange = (e) => {
    setPosition(Number(e.target.value));
  };

  const handleSeekEnd = (e) => {
    const newPos = Number(e.target.value);
    setPosition(newPos);
    setIsSeeking(false);
    
    // Set internal engine pause position so playback starts from here
    if (engineRef.current) {
       engineRef.current.pauseOffset = newPos;
    }
    
    if (wasPlayingRef.current) {
      const activeProfile = previewMode === 'processed' ? profileRef.current : null;
      engineRef.current?.play(newPos, activeProfile);
      setIsPlaying(true);
    }
    addLog?.(`[Preview] Seek → ${formatTime(newPos)}`);
  };

  const handleModeToggle = (mode) => {
    setPreviewMode(mode);
    if (engineRef.current?.isPlaying) {
      const activeProfile = mode === 'processed' ? profileRef.current : null;
      const offset = engineRef.current.currentPosition();
      engineRef.current.stop();
      engineRef.current.play(offset, activeProfile);
      setIsPlaying(true);
    }
    addLog?.(`[Preview] Mode: ${mode}`);
  };

  // ─── Summary rows ──────────────────────────────────────────────────────────
  const summaryRows = profile ? [
    { key: 'Pitch',   val: `${profile.pitch > 0 ? '+' : ''}${profile.pitch.toFixed(1)}` },
    { key: 'Tempo',   val: `${profile.tempo.toFixed(2)}x` },
    { key: 'Bass',    val: `${profile.bass > 0 ? '+' : ''}${profile.bass}` },
    { key: 'Treble',  val: `${profile.treble > 0 ? '+' : ''}${profile.treble}` },
    { key: 'Stereo',  val: `${profile.stereoWidth}%` },
    { key: 'Norm',    val: profile.normalize ? 'ON' : 'OFF' },
  ] : [];

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (sources.length === 0) {
    return (
      <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full">
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-[14px] text-purple-400 mr-2 leading-none">③</span>
              <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">AUDIO PREVIEW & SETTINGS</span>
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">Preview audio and adjust global processing profile.</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-2xl mb-2 opacity-30">🎧</div>
            <div className="text-[10px] text-gray-500">No audio sources available for preview.</div>
            <div className="text-[9px] text-gray-600 mt-1">Import sources in the Source Pool panel above.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-purple-400 mr-2 leading-none">③</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              AUDIO PREVIEW & SETTINGS
            </span>
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            Preview audio and adjust global processing profile.
          </div>
        </div>

        {/* Current Preset Badge */}
        {profile && (
          <div className="text-right shrink-0">
            <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wide mb-0.5">Current Preset</div>
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block ${
              profile.presetName === 'Custom'
                ? 'bg-amber-900/30 text-amber-400 border-amber-700/40'
                : 'bg-purple-900/30 text-purple-300 border-purple-700/30'
            }`}>
              {profile.presetName}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col lg:flex-row gap-4">
        
        {/* ── LEFT COLUMN ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Playback Controls */}
          <div className="flex flex-col gap-2">
            {/* Track selector + duration */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[8px] text-gray-600 uppercase font-bold tracking-wide block mb-1">
                  Preview Track
                </label>
                <select
                  id="m2-preview-track-select"
                  value={selectedSourceId || ''}
                  onChange={(e) => handleSelectSource(e.target.value)}
                  className="w-full bg-[#0f1018] border border-[#21232d] rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-[#3d4157] font-mono truncate"
                >
                  {sources.map(src => (
                    <option key={src.id} value={src.id}>
                      {src.cleanTitle || src.videoTitle || src.title || 'Unknown Track'}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSource && (
                <div className="shrink-0 text-right">
                  <div className="text-[8px] text-gray-600 uppercase font-bold tracking-wide mb-1">Duration</div>
                  <div className="text-[10px] font-mono text-gray-400">
                    {selectedSource.videoDuration ? formatTime(selectedSource.videoDuration) : '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Play bar */}
            <div className="bg-[#080910] border border-[#21232d] rounded px-2.5 py-1.5">
              <div className="flex items-center gap-3">
                {/* Play/Stop button */}
                <button
                  id="m2-preview-play-btn"
                  onClick={isPlaying ? handleStop : handlePlay}
                  disabled={!selectedSourceId}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isPlaying
                      ? 'bg-purple-700 hover:bg-purple-600 text-white'
                      : 'bg-[#1a1e2e] hover:bg-[#252a40] border border-purple-700/40 hover:border-purple-600/70 text-purple-300'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                  title={isPlaying ? 'Stop preview' : 'Play preview'}
                >
                  {isPlaying
                    ? <span className="text-[12px]">■</span>
                    : <span className="text-[13px] ml-0.5">▶</span>}
                </button>

                {/* Seek + time */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-gray-600">
                    <span className={isPlaying ? 'text-purple-400' : ''}>{formatTime(position)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="relative h-3 flex items-center group">
                    <div className="absolute inset-0 rounded-full bg-[#21232d] h-1 top-1/2 -translate-y-1/2" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-purple-600 pointer-events-none transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                    <input
                      id="m2-preview-seek-bar"
                      type="range"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={position}
                      onMouseDown={handleSeekStart}
                      onTouchStart={handleSeekStart}
                      onChange={handleSeekChange}
                      onMouseUp={handleSeekEnd}
                      onTouchEnd={handleSeekEnd}
                      disabled={!selectedSourceId}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Original / Processed toggle + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#0f1018] border border-[#21232d] rounded p-0.5">
                <button
                  id="m2-preview-mode-original"
                  onClick={() => handleModeToggle('original')}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-all ${
                    previewMode === 'original'
                      ? 'bg-[#21232d] text-gray-200'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  Original
                </button>
                <button
                  id="m2-preview-mode-processed"
                  onClick={() => handleModeToggle('processed')}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wide transition-all ${
                    previewMode === 'processed'
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700/40'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  Processed
                </button>
              </div>
              <div className="text-[9px] text-gray-600">
                {sourceStatus === 'error' && <span className="text-red-400 font-bold">✗ Audio Error</span>}
                
                {sourceStatus !== 'error' && !sourceStatus.includes('Ready') && (
                  <span className="text-blue-400 font-bold animate-pulse">⟳ {sourceStatus}</span>
                )}

                {sourceStatus.includes('Ready') && isPlaying && (
                  <span className="text-purple-400 font-medium">▶ Playing — {previewMode === 'processed' ? 'Processed' : 'Original'}</span>
                )}
                
                {sourceStatus.includes('Ready') && !isPlaying && (
                  <span>{sourceStatus} · {sources.length} source{sources.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-[#21232d] my-1" />

          {/* Audio Controls */}
          {isProfileLoading ? (
            <div className="text-[9px] text-gray-500">Loading audio profile…</div>
          ) : profile && (
            <div>
              <div className="text-[8px] text-gray-600 uppercase font-bold tracking-wide mb-2.5">Audio Controls</div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                <SliderRow
                  label="Pitch"
                  tooltip="Changes how high or low the song sounds."
                  value={profile.pitch}
                  displayValue={`${profile.pitch > 0 ? '+' : ''}${profile.pitch.toFixed(1)}`}
                  min={AUDIO_CONTROLS.PITCH.min}
                  max={AUDIO_CONTROLS.PITCH.max}
                  step={AUDIO_CONTROLS.PITCH.step}
                  onChange={(e) => handleSliderChange('pitch', e.target.value)}
                />
                <SliderRow
                  label="Tempo"
                  tooltip="Changes playback speed without affecting pitch."
                  value={profile.tempo}
                  displayValue={`${profile.tempo.toFixed(2)}x`}
                  min={AUDIO_CONTROLS.TEMPO.min}
                  max={AUDIO_CONTROLS.TEMPO.max}
                  step={AUDIO_CONTROLS.TEMPO.step}
                  onChange={(e) => handleSliderChange('tempo', e.target.value)}
                />
                <SliderRow
                  label="Bass"
                  tooltip="Adds or reduces low-frequency punch."
                  value={profile.bass}
                  displayValue={`${profile.bass > 0 ? '+' : ''}${profile.bass}`}
                  min={AUDIO_CONTROLS.BASS.min}
                  max={AUDIO_CONTROLS.BASS.max}
                  step={AUDIO_CONTROLS.BASS.step}
                  onChange={(e) => handleSliderChange('bass', e.target.value)}
                />
                <SliderRow
                  label="Treble"
                  tooltip="Adds or reduces high-frequency clarity."
                  value={profile.treble}
                  displayValue={`${profile.treble > 0 ? '+' : ''}${profile.treble}`}
                  min={AUDIO_CONTROLS.TREBLE.min}
                  max={AUDIO_CONTROLS.TREBLE.max}
                  step={AUDIO_CONTROLS.TREBLE.step}
                  onChange={(e) => handleSliderChange('treble', e.target.value)}
                />
                <SliderRow
                  label="Stereo Width"
                  tooltip="Controls how wide the sound feels between left and right speakers."
                  value={profile.stereoWidth}
                  displayValue={`${profile.stereoWidth}%`}
                  min={AUDIO_CONTROLS.STEREO_WIDTH.min}
                  max={AUDIO_CONTROLS.STEREO_WIDTH.max}
                  step={AUDIO_CONTROLS.STEREO_WIDTH.step}
                  onChange={(e) => handleSliderChange('stereoWidth', e.target.value)}
                />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center justify-between bg-[#13141a] px-3 py-2 rounded border border-[#2d3247] mt-1.5">
                    <div className="flex items-center">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mr-1.5">Normalize</label>
                      <Tooltip text="Automatically balances volume levels." />
                    </div>
                    <button
                      id="m2-normalize-toggle"
                      onClick={handleNormalizeToggle}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${profile.normalize ? 'bg-purple-600' : 'bg-[#21232d]'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${profile.normalize ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: AUDIO PROFILE SETTINGS ─────────────────────────── */}
        <div className="w-full lg:w-52 flex flex-col gap-3 shrink-0">
          {isProfileLoading ? null : profile && (
            <>
              {/* Quick Presets */}
              <div className="bg-[#0a0a0e] rounded p-2 border border-[#21232d]">
                <h3 className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-2">Preset Library</h3>
                
                <select
                  id="m2-preset-dropdown"
                  value={profile.presetName}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full bg-[#15161d] border border-[#2d3247] hover:border-[#3d4157] rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none font-bold"
                >
                  <option value="Custom" disabled className="text-amber-400">Custom (Modified)</option>
                  
                  {Object.entries(AudioPresetLibrary.getPresetsByCategory()).map(([category, presets]) => (
                    <optgroup key={category} label={category} className="text-gray-500 font-bold bg-[#0f111a]">
                      {presets.map(p => (
                        <option key={p.name} value={p.name} className="text-gray-300 bg-[#15161d]">
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {profile.presetName === 'Custom' && (
                  <div className="text-[8px] text-amber-500/70 mt-1.5 ml-0.5">
                    * Values differ from saved preset
                  </div>
                )}
              </div>

              {/* Profile Summary */}
              <div className="bg-[#0a0a0e] rounded p-2.5 border border-[#21232d] flex-1">
                <h3 className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-2">Profile Summary</h3>
                <div className="bg-[#0f111a] rounded border border-[#21232d] px-2.5 py-2 h-full flex flex-col justify-center gap-1">
                  {summaryRows.map(({ key, val }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-600 font-mono">{key}</span>
                      <span className={`text-[9px] font-mono font-bold ${
                        key === 'Norm'
                          ? (profile.normalize ? 'text-emerald-400' : 'text-gray-500')
                          : 'text-purple-300'
                      }`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Dev Mode ───────────────────────────────────────────────────────────── */}
      {isDevMode && (
        <div className="border-t border-red-900/30 bg-[#0a0005] px-3 py-2">
          <div className="text-[8px] font-bold text-red-400 uppercase tracking-wide mb-1 flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
            Dev Stats — Audio Preview & Settings (Task 05 Merged)
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] font-mono">
            <div><span className="text-gray-600">Track:</span> <span className="text-gray-300 truncate">{displayTitle || '—'}</span></div>
            <div><span className="text-gray-600">Mode:</span> <span className="text-purple-400">{previewMode}</span></div>
            <div><span className="text-gray-600">Position:</span> <span className="text-amber-400">{formatTime(position)}</span></div>
            <div><span className="text-gray-600">Duration:</span> <span className="text-gray-400">{formatTime(duration)}</span></div>
            <div><span className="text-gray-600">Playing:</span> <span className={isPlaying ? 'text-emerald-400' : 'text-gray-600'}>{isPlaying ? 'YES' : 'NO'}</span></div>
            <div><span className="text-gray-600">Preset:</span> <span className="text-amber-400">{profile?.presetName ?? '—'}</span></div>
            <div className="col-span-2"><span className="text-gray-600">Profile JSON:</span> <span className="text-gray-500 truncate">{profile ? JSON.stringify({ pitch: profile.pitch, tempo: profile.tempo, bass: profile.bass, treble: profile.treble, stereoWidth: profile.stereoWidth, normalize: profile.normalize }) : '—'}</span></div>
            <div><span className="text-gray-600">Hash:</span> <span className="text-blue-400">{profile?.generateHash() ?? '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
