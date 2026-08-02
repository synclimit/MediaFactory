import React, { useState, useEffect, useRef, useCallback } from 'react';
import { foundation, getBootstrapData } from '../../foundation/index.js';
import { m2CacheManager } from '../../services/m2/CacheManager.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getContext() {
  const bd = getBootstrapData();
  return {
    workspaceId: bd?.workspace?.id || '',
    userId: bd?.user?.id || '',
  };
}

function formatTime(seconds) {
	if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "00:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Animated Waveform ────────────────────────────────────────────────────────
const AnimatedWaveform = ({ isActive = false }) => {
  const [bars, setBars] = useState(() =>
    Array.from({ length: 64 }).map(() => Math.random() * 60 + 5)
  );

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setBars(prev =>
        prev.map(val => {
          const jump = (Math.random() - 0.5) * 45;
          return Math.max(3, Math.min(98, val + jump));
        })
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="h-full flex items-center justify-between gap-[1px] px-0.5">
      {bars.map((val, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-all duration-100 ease-out ${
            isActive
              ? 'bg-gradient-to-t from-orange-600 to-orange-400'
              : 'bg-gradient-to-t from-gray-700 to-gray-600'
          }`}
          style={{ height: `${isActive ? val : val * 0.3}%` }}
        />
      ))}
    </div>
  );
};

// ─── Mini Audio Engine ────────────────────────────────────────────────────────
class PlaybackEngine {
  constructor() {
    this.audioCtx = null;
    this.audioElement = null;
    this.mediaSourceNode = null;
    this.currentUri = null;
    this.isPlaying = false;
    this.duration = 0;
    this._onEndedCallback = null;
    this.pauseOffset = 0;
    
    // DSP Nodes
    this.hpfNode = null;
    this.eqNodes = [];
    this.compressorNode = null;
    this.bitcrushNode = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.flutterOsc = null;
    this.flutterGain = null;
    this.flutterDelay = null;
    this.noiseSource = null;
    this.noiseGain = null;
    this.masterGain = null;
    
    this.currentSettings = null;
  }

  _ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize the persistent audio element and media source node ONCE per engine
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.mediaSourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      
      this.audioElement.addEventListener('ended', () => {
        if (this.isPlaying) {
          this.isPlaying = false;
          this._onEndedCallback?.();
        }
      });
    }
  }
  
  // Helper for Bitcrusher WaveShaper curve
  _makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      // Step function approximation
      const step = Math.pow(0.5, amount / 10); // bit depth sim
      curve[i] = Math.round(x / step) * step;
    }
    return curve;
  }
  
  // Helper for Lofi Noise buffer
  _makePinkNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 2; // 2 seconds
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // gain adjustment
        b6 = white * 0.115926;
    }
    return buffer;
  }

  unlockAudio() {
    if (this.audioElement && (!this.audioElement.src || this.audioElement.src === window.location.href)) {
        this.audioElement.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.audioElement.play().catch(() => {});
    }
  }

  async loadTrack(uri, setStatus) {
    if (this.currentUri === uri) {
      if (setStatus) setStatus('ready');
      return;
    }
    
    if (!this.audioElement) {
      this._ensureContext();
    }
    this.unlockAudio();
    
    if (setStatus) setStatus('loading');
    
    try {
      const isYouTube = uri.includes('youtube.com') || uri.includes('youtu.be') || uri.startsWith('ytsearch:') || (!/^[a-zA-Z]:\\|\//.test(uri) && !uri.startsWith('Assets'));
      if (isYouTube) {
        await new Promise((resolve, reject) => {
          const es = new EventSource(`/api/m2/prepare-stream?uri=${encodeURIComponent(uri)}`);
          es.onmessage = (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.status === 'downloading') {
                const pct = Math.round(data.progress || 0);
                if (setStatus) setStatus(`downloading ${pct}%`);
              } else if (data.status === 'extracting') {
                if (setStatus) setStatus(`extracting...`);
              } else if (data.status === 'ready' || data.status === 'ready_cached') {
                if (setStatus) setStatus('ready');
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
      }

      const streamUrl = await m2CacheManager.resolveTrack(uri);
      
      // Load via HTMLMediaElement instead of buffering 100MB into RAM
      await new Promise((resolve, reject) => {
        this.audioElement.src = streamUrl;
        this.audioElement.onloadedmetadata = () => {
          this.duration = this.audioElement.duration;
          resolve();
        };
        this.audioElement.onerror = () => reject(new Error('Failed to load audio stream'));
      });
      
      this.currentUri = uri;
      if (setStatus) setStatus('ready');
    } catch (err) {
      console.error('[PlaybackEngine] loadTrack failed:', err);
      this.currentUri = null;
      if (setStatus) setStatus('error');
      throw err;
    }
  }

  _stopOscillators() {
    if (this.flutterOsc) {
        try { this.flutterOsc.stop(); } catch(e) {}
        this.flutterOsc = null;
    }
    if (this.noiseSource) {
        try { this.noiseSource.stop(); } catch(e) {}
        this.noiseSource = null;
    }
  }

  _buildDSPGraph() {
    const ctx = this.audioCtx;
    
    // Disconnect previous graph to prevent memory/CPU leaks
    if (this.mediaSourceNode) {
        this.mediaSourceNode.disconnect();
    }
    this._stopOscillators();

    let current = this.mediaSourceNode;

    // 1. Bitcrusher (WaveShaper)
    this.bitcrushNode = ctx.createWaveShaper();
    this.bitcrushNode.curve = this._makeDistortionCurve(16); // default 16-bit
    this.bitcrushNode.oversample = 'none';
    current.connect(this.bitcrushNode);
    current = this.bitcrushNode;

    // 2. Highpass Filter (Low Rumble)
    this.hpfNode = ctx.createBiquadFilter();
    this.hpfNode.type = 'highpass';
    this.hpfNode.frequency.value = 10; // essentially bypassed
    current.connect(this.hpfNode);
    current = this.hpfNode;

    // 3. 10-Band EQ
    const freqs = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.eqNodes = freqs.map(f => {
      const node = ctx.createBiquadFilter();
      node.type = 'peaking';
      node.frequency.value = f;
      node.Q.value = 1.41;
      return node;
    });
    this.eqNodes.forEach(node => {
      current.connect(node);
      current = node;
    });

    // 4. Reverb Simulation (Simple Delay/Feedback Network)
    this.delayNode = ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.05; // 50ms default room
    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = 0; // bypassed initially
    // Reverb loop
    current.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    // Mix dry and wet
    const dryNode = ctx.createGain();
    const wetNode = ctx.createGain();
    current.connect(dryNode);
    this.delayNode.connect(wetNode);
    
    const mixNode = ctx.createGain();
    dryNode.connect(mixNode);
    wetNode.connect(mixNode);
    current = mixNode;

    // Save refs for updateSettings
    this.dryNode = dryNode;
    this.wetNode = wetNode;

    // 5. Tape Flutter (Vibrato)
    this.flutterDelay = ctx.createDelay(0.1);
    this.flutterDelay.delayTime.value = 0.02; // 20ms base
    current.connect(this.flutterDelay);
    
    this.flutterOsc = ctx.createOscillator();
    this.flutterOsc.type = 'sine';
    this.flutterOsc.frequency.value = 5; // 5Hz wobble
    this.flutterGain = ctx.createGain();
    this.flutterGain.gain.value = 0; // bypassed
    this.flutterOsc.connect(this.flutterGain);
    this.flutterGain.connect(this.flutterDelay.delayTime);
    this.flutterOsc.start();
    
    current = this.flutterDelay;

    // 6. Compressor
    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = 0;
    this.compressorNode.ratio.value = 1;
    current.connect(this.compressorNode);
    current = this.compressorNode;

    // 7. Master Gain & Lofi Noise Mix
    this.masterGain = ctx.createGain();
    current.connect(this.masterGain);
    
    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = this._makePinkNoiseBuffer();
    this.noiseSource.loop = true;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0; // bypassed
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start();

    // Out
    this.masterGain.connect(ctx.destination);
  }

  updateSettings(settings) {
    this.currentSettings = settings;
    if (!settings || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // 1. Bitcrush
    if (this.bitcrushNode) {
      const depth = settings.bitcrush > 0 ? 16 - (settings.bitcrush / 100 * 12) : 16; // 16 to 4 bits
      this.bitcrushNode.curve = settings.bitcrush > 0 ? this._makeDistortionCurve(depth) : null;
    }

    // 2. HPF (Low Rumble)
    if (this.hpfNode) {
      this.hpfNode.frequency.setTargetAtTime(settings.removeLowRumble ? 80 : 10, now, 0.1);
    }

    // 3. EQ
    if (this.eqNodes.length === 10 && settings.eqBands) {
      settings.eqBands.forEach((val, i) => {
        this.eqNodes[i].gain.setTargetAtTime(val, now, 0.1);
      });
    }

    // 4. Reverb
    if (this.delayNode && this.feedbackGain && this.dryNode && this.wetNode) {
      const revPct = settings.reverb / 100;
      this.feedbackGain.gain.setTargetAtTime(revPct * 0.5, now, 0.1); // Decay
      this.wetNode.gain.setTargetAtTime(revPct * 0.8, now, 0.1); // Mix
      this.dryNode.gain.setTargetAtTime(1 - (revPct * 0.2), now, 0.1); // Duck dry slightly
    }

    // 5. Tape Flutter
    if (this.flutterGain) {
      const flutterPct = settings.tapeFlutter / 100;
      this.flutterGain.gain.setTargetAtTime(flutterPct * 0.005, now, 0.1); // Mod depth
    }

    // 6. Compressor
    if (this.compressorNode) {
      const threshold = settings.compressor ? -24 : 0;
      const ratio = settings.compressor ? 4 : 1;
      this.compressorNode.threshold.setTargetAtTime(threshold, now, 0.1);
      this.compressorNode.ratio.setTargetAtTime(ratio, now, 0.1);
    }

    // 7. Lofi Noise
    if (this.noiseGain) {
      // settings.lofiNoise is 0-100 (which maps to 0-15% in FFmpeg). Max gain in web audio ~ 0.15
      const noiseVol = (settings.lofiNoise / 100) * 0.15;
      this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.1);
    }

    // 8. Output Gain
    if (this.masterGain) {
      const gainDb = parseFloat(settings.outputGain) || 0;
      const linearGain = Math.pow(10, gainDb / 20);
      // If limiter is active, maybe restrict max gain, but native DynamicsCompressor helps.
      this.masterGain.gain.setTargetAtTime(linearGain, now, 0.1);
    }
  }

  _stopSource() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.masterGain?.disconnect();
  }

  play(offset = 0) {
    if (!this.audioCtx || !this.audioElement || !this.audioElement.src) return;
    this._stopSource();

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Build fresh graph
    this._buildDSPGraph();
    // Apply current UI settings immediately
    if (this.currentSettings) this.updateSettings(this.currentSettings);

    let safeOffset = 0;
    if (Number.isFinite(offset) && !isNaN(offset)) {
      safeOffset = offset;
    }
    
    if (Number.isFinite(this.duration) && !isNaN(this.duration) && this.duration > 0) {
      safeOffset = Math.max(0, Math.min(safeOffset, this.duration - 0.1));
    } else {
      safeOffset = Math.max(0, safeOffset);
    }
    
    try {
      this.audioElement.currentTime = safeOffset;
    } catch (e) {
      this.audioElement.currentTime = 0;
    }
    
    this.audioElement.play().catch(console.error);
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.audioElement) {
        this.pauseOffset = this.audioElement.currentTime;
    }
    this._stopSource();
    this.isPlaying = false;
  }

  currentPosition() {
    if (this.audioElement) {
        return this.audioElement.currentTime;
    }
    return 0;
  }

  destroy() {
    this._stopSource();
    try { this.audioCtx?.close(); } catch {}
    this.audioCtx = null;
  }

  onEnded(cb) { this._onEndedCallback = cb; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function M2PlaybackBar({ masteringSettings, addLog, addNotification }) {
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [status, setStatus] = useState('idle');

  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const wasPlayingRef = useRef(false);

  // Load sources (Poll to keep in sync with pool)
  useEffect(() => {
    const load = async () => {
      try {
        const all = await foundation.sourceService.getAll(getContext());
        const valid = all.filter(s => s.status !== 'invalid');
        setSources(prev => {
          const isDifferent = prev.length !== valid.length || prev.some((p, i) => 
              p.id !== valid[i].id || 
              p.metadataStatus !== valid[i].metadataStatus ||
              p.title !== valid[i].title ||
              p.status !== valid[i].status
          );
          return isDifferent ? valid : prev;
        });
        if (valid.length > 0 && !selectedSourceId) {
          setSelectedSourceId(valid[0].id);
        }
      } catch (e) {}
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [selectedSourceId]);

  // Init engine
  useEffect(() => {
    engineRef.current = new PlaybackEngine();
    engineRef.current.onEnded(() => { setIsPlaying(false); setPosition(0); });
    return () => { engineRef.current?.destroy(); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Animation frame
  const tick = useCallback(function tickFn() {
    if (engineRef.current?.isPlaying && !isSeeking) {
      setPosition(engineRef.current.currentPosition());
    }
    rafRef.current = requestAnimationFrame(tickFn);
  }, [isSeeking]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Push DSP settings in real-time
  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.updateSettings(masteringSettings);
    }
  }, [masteringSettings, isPlaying]);

  const selectedSource = sources.find(s => s.id === selectedSourceId);
  const displayTitle = selectedSource
    ? (selectedSource.cleanTitle || selectedSource.videoTitle || selectedSource.title || 'Unknown')
    : null;
  const progressPct = duration > 0 ? (position / duration) * 100 : 0;

  const handleSelectSource = async (id) => {
    if (engineRef.current?.isPlaying) { engineRef.current.stop(); setIsPlaying(false); }
    setSelectedSourceId(id);
    setPosition(0);
    const src = sources.find(s => s.id === id);
    const uri = src?.localPath || src?.youtubeUrl || src?.title;
    
    // Always set a fallback duration first so UI isn't stuck at 00:00
    let fallbackDuration = 0;
    if (src?.videoDuration) {
      const parsed = parseFloat(src.videoDuration);
      if (!isNaN(parsed)) fallbackDuration = parsed;
    }
    if (!fallbackDuration && src?.duration && typeof src.duration === 'string') {
      const match = src.duration.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/);
      if (match) {
        const h = parseInt(match[1] || '0') * 3600;
        const m = parseInt(match[2] || '0') * 60;
        const s = parseInt(match[3] || '0');
        fallbackDuration = h + m + s;
      }
    }
    setDuration(fallbackDuration);

    if (uri) {
        try {
          await engineRef.current.loadTrack(uri, setStatus);
          const loadedDur = engineRef.current.duration;
          setDuration((loadedDur && loadedDur > 1) ? loadedDur : (fallbackDuration || 0));
        } catch (err) { 
        console.error('loadTrack error:', err);
        setStatus('error'); 
      }
    }
  };

  const handlePlay = async () => {
    if (!selectedSourceId) return;
    
    // If not loaded yet, wait for it
    const src = selectedSource;
    const uri = src?.localPath || src?.youtubeUrl || src?.title;
    if (engineRef.current.currentUri !== uri) {
      setStatus('loading');
      if (uri) {
        try {
          await engineRef.current.loadTrack(uri, setStatus);
          let finalDur = engineRef.current.duration;
          if (!finalDur || finalDur < 1) {
              let parsed = parseFloat(src?.videoDuration);
              if (!isNaN(parsed) && parsed > 0) finalDur = parsed;
              else if (src?.duration && typeof src.duration === 'string') {
                  const match = src.duration.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/);
                  if (match) finalDur = (parseInt(match[1]||0)*3600) + (parseInt(match[2]||0)*60) + parseInt(match[3]||0);
              }
          }
          setDuration(finalDur || 0);
        } catch (err) {
          console.error('[handlePlay] Caught error from loadTrack:', err);
          return;
        }
      }
    }
    if (!engineRef.current.audioElement?.src) return;
    engineRef.current.play(position);
    setIsPlaying(true);
    addLog?.(`[Playback] ▶ ${displayTitle}`);
  };

  const handleStop = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    wasPlayingRef.current = !!engineRef.current?.isPlaying;
    if (engineRef.current?.isPlaying) { engineRef.current.stop(); setIsPlaying(false); }
  };

  const handleSeekChange = (e) => setPosition(Number(e.target.value));

  const handleSeekEnd = (e) => {
    const newPos = Number(e.target.value);
    setPosition(newPos);
    setIsSeeking(false);
    if (engineRef.current) engineRef.current.pauseOffset = newPos;
    if (wasPlayingRef.current) {
      engineRef.current?.play(newPos);
      setIsPlaying(true);
    }
  };

  // DSP Chain from mastering settings
  const getProcessingChain = () => {
    if (!masteringSettings) return ['bypass'];
    const chain = [];
    chain.push('loudnorm');
    if (masteringSettings.eqBands?.some(v => v !== 0)) chain.push('eq');
    if (masteringSettings.removeLowRumble) chain.push('hpf');
    if (masteringSettings.deEsser > 0) chain.push('de-esser');
    if (masteringSettings.compressor) chain.push('compressor');
    if (masteringSettings.glueDensity > 0) chain.push('glue');
    if (masteringSettings.spatial8D > 0) chain.push('spatial');
    if (masteringSettings.lofiNoise > 0) chain.push('noise');
    if (masteringSettings.reverb > 0) chain.push('reverb');
    if (masteringSettings.tapeFlutter > 0) chain.push('flutter');
    if (masteringSettings.bitcrush > 0) chain.push('bitcrush');
    if (masteringSettings.outputGain !== '0') chain.push('volume');
    if (masteringSettings.limiter) chain.push('limiter');
    return chain;
  };

  const chain = getProcessingChain();

  return (
    <div className="bg-transparent flex flex-col h-full overflow-hidden text-[12px] text-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-[#2a2c33] shrink-0">
        <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
          PLAYBACK MONITOR
        </h3>
        <div className="flex items-center gap-1.5">
          {isPlaying && (
            <div className="flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] text-emerald-400 uppercase font-bold tracking-wider">Playing</span>
            </div>
          )}
          <span className="text-[8px] text-gray-500 font-mono">{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Body: Ultra-Compact Transport Deck (2 Rows) */}
      <div className="p-2 min-h-0 overflow-hidden relative z-10 flex flex-col justify-end bg-gradient-to-b from-[#1a1d27]/80 to-[#11131a]/80">
        
        {/* Row 1: Info & Signal */}
        <div className="flex items-center justify-between gap-3 h-[30px] mb-2 px-1 w-full overflow-hidden">
          {/* Track Selection */}
          <div className="w-1/3 min-w-[120px] max-w-[250px] shrink-0 relative h-full">
            <select
              value={selectedSourceId || ''}
              onChange={(e) => handleSelectSource(e.target.value)}
              className="absolute inset-0 w-full bg-black/40 hover:bg-black/60 border border-[#2d3247] hover:border-orange-500/50 rounded pl-2 pr-6 text-[10px] text-white font-bold tracking-wide focus:outline-none transition-all appearance-none cursor-pointer shadow-inner truncate"
            >
              {sources.length === 0 && <option value="" className="italic text-gray-500">No sources available</option>}
              {sources.map(src => (
                <option key={src.id} value={src.id} className="bg-[#161822] text-gray-300">
                  {src.cleanTitle || src.videoTitle || src.title || 'Unknown'}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500/70 text-[8px] font-bold">▼</div>
          </div>

          {/* DSP Chain */}
          <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar mask-edges">
            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider shrink-0 mr-1">DSP:</span>
            {chain.map((node, i) => (
              <React.Fragment key={i}>
                <span className="text-[#3b82f6] px-1 py-[1px] rounded font-mono text-[7px] font-bold whitespace-nowrap bg-blue-900/20 border border-blue-500/20 shrink-0">
                  {node}
                </span>
                {i < chain.length - 1 && <span className="text-gray-700 text-[7px] shrink-0">›</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Waveform & VU (Mini) */}
          <div className="w-64 shrink-0 h-full flex items-center gap-1.5 bg-black/50 p-1 rounded border border-[#21232d] shadow-inner">
            <div className="flex-1 min-w-0 h-full relative border-r border-[#21232d] pr-1">
              <AnimatedWaveform isActive={isPlaying} />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-orange-500/20 pointer-events-none"></div>
            </div>
            <div className="w-3 shrink-0 h-full flex gap-[1px]">
              <div className="flex-1 bg-black/60 rounded-[1px] relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 right-0 rounded-b-[1px] transition-all duration-150 ${isPlaying ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500' : 'bg-[#1a1d27]'}`} style={{ height: isPlaying ? '72%' : '8%' }} />
              </div>
              <div className="flex-1 bg-black/60 rounded-[1px] relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 right-0 rounded-b-[1px] transition-all duration-150 ${isPlaying ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500' : 'bg-[#1a1d27]'}`} style={{ height: isPlaying ? '80%' : '8%', animationDelay: '80ms' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Play Controls & Seek Bar */}
        <div className="flex items-center gap-3 bg-[#0a0b0f]/80 p-1.5 rounded border border-[#2a2c33] shadow-inner">
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={!selectedSourceId || status === 'loading' || status.startsWith('downloading')}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
              isPlaying
                ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.8)] border border-orange-300 scale-95'
                : 'bg-orange-500 hover:bg-orange-400 text-white border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)] hover:shadow-[0_0_20px_rgba(249,115,22,0.9)]'
            } disabled:opacity-50 disabled:grayscale-[0.3] disabled:cursor-not-allowed`}
          >
            {status === 'loading' || status.startsWith('downloading')
              ? <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              : isPlaying
                ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white"><path d="M6 6h12v12H6z" /></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5 text-white"><path d="M8 5v14l11-7z" /></svg>
            }
          </button>

          <div className="flex-1 flex items-center gap-3 px-1">
            {status.startsWith('downloading') || status === 'loading' || status === 'extracting' || status === 'error' ? (
              <span className={`text-[10px] font-mono font-bold w-9 text-right ${status === 'error' ? 'text-red-500 animate-none' : 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] animate-pulse'}`}>
                {status.startsWith('downloading') ? status.split(' ')[1] : (status === 'loading' ? 'BUF' : status === 'error' ? 'ERR' : 'EXT')}
              </span>
            ) : (
              <span className={`text-[10px] font-mono font-bold w-9 text-right ${isPlaying ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'text-gray-500'}`}>
                {formatTime(position)}
              </span>
            )}
            
            <div className="flex-1 relative h-4 flex items-center group cursor-pointer">
              <div className="absolute inset-x-0 h-[4px] bg-[#1a1c26] rounded-full border border-[#2d3247] shadow-inner" />
              <div
                className="absolute left-0 h-[4px] bg-gradient-to-r from-orange-600 to-orange-400 rounded-full pointer-events-none shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
              <div 
                className="absolute h-2 w-2 bg-white rounded-full shadow-[0_0_5px_rgba(249,115,22,0.8)] pointer-events-none -translate-x-1/2 group-hover:scale-150"
                style={{ left: `${progressPct}%` }}
              />
              <input
                type="range"
                min={0} max={duration} step={0.1}
                value={position}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                disabled={!selectedSourceId}
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <span className="text-[10px] font-mono font-bold text-gray-600 w-9">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
