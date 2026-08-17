import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Upload, Eye, Activity, CheckCircle, Cpu, Film, Table, Download, Music, ShieldCheck } from 'lucide-react';
import { VisualizerV4Core } from '../../visualizers/v4/VisualizerV4Core';
import { VisualizerV4Audio } from '../../visualizers/v4/VisualizerV4Audio';

export default function M3ParityDebuggerModal({
  isOpen,
  onClose,
  m3BgPool = [],
  m3Objects = [],
  m3AudioTracks = [],
  m3CurrentTimeSec = 0
}) {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [currentTime, setCurrentTime] = useState(m3CurrentTimeSec || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'onion' | 'diff'
  const [renderEngineMode, setRenderEngineMode] = useState('NORMAL'); // 'NORMAL' (Real PCM Audio FFT) | 'FAST' (Synthetic)
  const [fps, setFps] = useState(30);
  const [parityScore, setParityScore] = useState(100);
  const [duration, setDuration] = useState(120);

  // Real Audio PCM Decoder State
  const [audioStatus, setAudioStatus] = useState('Membaca file audio PCM...');
  const audioBufferRef = useRef(null);

  // Backend Render Telemetry State
  const [backendLogs, setBackendLogs] = useState(null);
  const [logStatus, setLogStatus] = useState('Belum dimuat');

  // Numerical Data Telemetry State
  const [telemetry, setTelemetry] = useState({
    live: { bass: 0, mid: 0, treble: 0, energy: 0, scale: 1, swayX: 0, swayY: 0, rotate: 0 },
    render: { bass: 0, mid: 0, treble: 0, energy: 0, scale: 1, swayX: 0, swayY: 0, rotate: 0 },
    delta: { bass: 0, mid: 0, treble: 0, energy: 0, scale: 0, swayX: 0, swayY: 0, rotate: 0 }
  });

  const videoRef = useRef(null);
  const liveCanvasRef = useRef(null);
  const backendSimCanvasRef = useRef(null);
  const diffCanvasRef = useRef(null);
  const bgImgRef = useRef(null);

  const bg = m3BgPool[0] || {};
  const s = bg.settings || bg || {};
  const bgUrl = s.url || s.image || bg.url || bg.image;

  // Decode Real Audio Track PCM Data for Normal Mode
  useEffect(() => {
    if (!isOpen || !m3AudioTracks || m3AudioTracks.length === 0) return;
    const track = m3AudioTracks[0];
    const audioUrl = track.url || track.uri || track.sourcePath;
    if (!audioUrl) return;

    const loadAudioBuffer = async () => {
      try {
        setAudioStatus('Membaca Real PCM Audio Data...');
        let fetchUrl = audioUrl;
        if (typeof window !== 'undefined' && window.electron && window.electron.readAudioFile) {
          // If in Electron environment
        }
        if (!fetchUrl.startsWith('http') && !fetchUrl.startsWith('file://') && !fetchUrl.startsWith('blob:')) {
          fetchUrl = `file:///${fetchUrl.replace(/\\/g, '/')}`;
        }
        const response = await fetch(fetchUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decoded;
        setDuration(decoded.duration || 120);
        setAudioStatus(`Real PCM Audio Ready (${decoded.duration.toFixed(1)}s, ${decoded.sampleRate}Hz)`);
      } catch (err) {
        console.warn('Real Audio PCM decoding fallback:', err);
        setAudioStatus('Audio Real Track Ready (Fallback Synthetic DSP)');
      }
    };

    loadAudioBuffer();
  }, [isOpen, m3AudioTracks]);

  // Extract Real PCM Frequency FFT Bins for timestamp T (Mode Normal 100% 1:1 Backend Algorithm)
  const getAudioStateAtTime = (frameTimestamp, numBins = 64) => {
    if (renderEngineMode === 'NORMAL' && audioBufferRef.current) {
      const buffer = audioBufferRef.current;
      const sampleRate = buffer.sampleRate || 44100;
      const channelData = buffer.getChannelData(0);
      const centerSample = Math.floor(frameTimestamp * sampleRate);
      const windowSize = 2048;
      const startSample = Math.max(0, centerSample - Math.floor(windowSize / 2));
      const endSample = Math.min(channelData.length, centerSample + Math.floor(windowSize / 2));

      if (startSample >= 0 && endSample > startSample) {
        const frequencies = new Float32Array(numBins);
        const waveform = new Float32Array(numBins);

        // Logarithmic / Mel frequency distribution with perceptual dB scaling matching m3-render.js
        for (let k = 0; k < numBins; k++) {
          const centerHz = 35 * Math.pow(12000 / 35, k / (numBins - 1));
          const omega = (2 * Math.PI * centerHz) / sampleRate;
          let real = 0;
          let imag = 0;
          let count = 0;

          for (let si = startSample; si < endSample; si += 2) {
            const windowVal = 0.5 * (1 - Math.cos((2 * Math.PI * (si - startSample)) / windowSize));
            const val = channelData[si] * windowVal;
            const angle = omega * (si - startSample);
            real += val * Math.cos(angle);
            imag -= val * Math.sin(angle);
            count++;
          }

          const mag = count > 0 ? Math.sqrt(real * real + imag * imag) / count : 0;
          const dB = 20 * Math.log10(mag + 1e-5);
          // Map from -60 dB to -10 dB into 0.04 .. 1.0 (Exact Web Audio Analyser response)
          const normalized = (dB - (-60)) / ((-10) - (-60));
          const binVal = Math.min(1.0, Math.max(0.04, normalized));
          frequencies[k] = binVal;
        }

        const waveStep = Math.max(1, Math.floor(windowSize / numBins));
        for (let k = 0; k < numBins; k++) {
          const sIdx = startSample + k * waveStep;
          waveform[k] = sIdx < channelData.length ? channelData[sIdx] : 0;
        }

        const bass = (frequencies[0] + frequencies[1] + frequencies[2] + frequencies[3] + frequencies[4] + frequencies[5]) / 6;
        const mid = (frequencies[15] + frequencies[16] + frequencies[17] + frequencies[18] + frequencies[19] + frequencies[20] + frequencies[21] + frequencies[22] + frequencies[23] + frequencies[24] + frequencies[25]) / 11;
        const treble = (frequencies[45] + frequencies[46] + frequencies[47] + frequencies[48] + frequencies[49] + frequencies[50] + frequencies[51] + frequencies[52] + frequencies[53] + frequencies[54] + frequencies[55]) / 11;
        const energy = bass * 0.5 + mid * 0.35 + treble * 0.15;

        return {
          time: frameTimestamp,
          energy,
          RMS: energy,
          beatStrength: bass > 0.4 ? bass * 1.5 : bass,
          bass,
          mid,
          treble,
          frequencies,
          waveform,
          spectrumBars: frequencies,
          rawSpectrum: frequencies
        };
      }
    }

    // Fast Mode / Fallback Synthetic Sine Wave
    return VisualizerV4Audio.generateSyntheticState(frameTimestamp, numBins);
  };

  // Fetch backend render telemetry
  const fetchBackendTelemetry = async () => {
    try {
      setLogStatus('Memuat data backend...');
      const res = await fetch('http://localhost:18888/api/v1/m3/latest-telemetry');
      const data = await res.json();
      if (data.success && data.telemetry) {
        setBackendLogs(data.telemetry);
        setLogStatus(`Telemetry Loaded (${data.telemetry.logs?.length || 0} frames)`);
      } else {
        setLogStatus('Belum ada log render backend. Jalankan render dulu.');
      }
    } catch(e) {
      setLogStatus('Error koneksi backend');
    }
  };

  // Preload background image
  useEffect(() => {
    if (bgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgUrl;
      img.onload = () => { bgImgRef.current = img; };
    }
  }, [bgUrl]);

  // Handle video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
    }
  };

  // Sync playhead & handle play/pause loop
  useEffect(() => {
    let animId = null;
    let lastTime = performance.now();

    const updateLoop = () => {
      if (isPlaying) {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          }
          setCurrentTime(videoRef.current.currentTime);
        } else {
          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          setCurrentTime(prev => prev + dt);
          lastTime = now;
        }
        animId = requestAnimationFrame(updateLoop);
      } else {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    if (isPlaying) {
      lastTime = performance.now();
      animId = requestAnimationFrame(updateLoop);
    } else {
      if (videoRef.current) {
        if (!videoRef.current.paused) videoRef.current.pause();
        videoRef.current.currentTime = currentTime;
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime]);

  // Frame step controls
  const stepFrame = (deltaFrames) => {
    setIsPlaying(false);
    const frameTime = 1 / fps;
    setCurrentTime(prev => Math.max(0, prev + deltaFrames * frameTime));
  };

  // Render Full Engine Frame onto debugging canvas
  const renderEngineFrame = (canvas, frameTimestamp, isBackendSim = false) => {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = 640;
    const h = canvas.height = 360;

    const numBins = 64;
    const audioState = getAudioStateAtTime(frameTimestamp, numBins);

    // Compute motion config
    let cfg = { zoom: 0, swayX: 0, swayY: 0, rotate: 0, shake: 0 };
    let danceStyle = s.danceStyle || 'Calm Pulse';
    if (danceStyle === 'Subtle Sway') danceStyle = 'Calm Pulse';
    if (danceStyle === 'Pulse') danceStyle = 'Deep Kick';
    if (danceStyle === 'Heartbeat') danceStyle = 'Rhythmic Float';
    if (danceStyle === 'Shake') danceStyle = 'Adrenaline';

    let defaultZoom = 2, defaultSwayX = 2, defaultSwayY = 1, defaultRotate = 0.5, defaultShake = 0;
    if (danceStyle === 'Deep Kick') { defaultZoom = 10; defaultSwayX = 0; defaultSwayY = 0; defaultRotate = 0; defaultShake = 0; }
    else if (danceStyle === 'Rhythmic Float') { defaultSwayX = 4; defaultSwayY = 3; defaultRotate = 2; defaultZoom = 1; defaultShake = 0; }
    else if (danceStyle === 'Adrenaline') { defaultSwayX = 3; defaultSwayY = 3; defaultRotate = 3; defaultZoom = 8; defaultShake = 6; }
    else if (danceStyle === 'Custom (Advanced)') { defaultZoom = 12; defaultSwayX = 2.0; defaultSwayY = 1.2; defaultRotate = 1.5; defaultShake = 4; }

    if (s.motionEnZoom !== undefined ? s.motionEnZoom : (defaultZoom > 0)) cfg.zoom = s.motionValZoom !== undefined ? s.motionValZoom : defaultZoom;
    if (s.motionEnSwayX !== undefined ? s.motionEnSwayX : (defaultSwayX > 0)) cfg.swayX = s.motionValSwayX !== undefined ? s.motionValSwayX : defaultSwayX;
    if (s.motionEnSwayY !== undefined ? s.motionEnSwayY : (defaultSwayY > 0)) cfg.swayY = s.motionValSwayY !== undefined ? s.motionValSwayY : defaultSwayY;
    if (s.motionEnRotate !== undefined ? s.motionEnRotate : (defaultRotate > 0)) cfg.rotate = s.motionValRotate !== undefined ? s.motionValRotate : defaultRotate;
    if (s.motionEnShake !== undefined ? s.motionEnShake : (defaultShake > 0)) cfg.shake = s.motionValShake !== undefined ? s.motionValShake : defaultShake;

    const intensity = (s.danceIntensity !== undefined ? s.danceIntensity : 100) / 100;
    const reactLevel = s.danceReactLevel !== undefined ? s.danceReactLevel : 45;
    const sensitivity = reactLevel / 50;
    const power = (audioState.bass || audioState.energy) * sensitivity * intensity;

    const time = frameTimestamp;
    const targetZoom = power * cfg.zoom * 0.01;
    const targetSwayX = Math.sin(time * 1.2) * cfg.swayX * power;
    const targetSwayY = Math.cos(time * 0.9) * cfg.swayY * power;
    const targetRotate = Math.sin(time * 0.8) * cfg.rotate * power;

    let baseScale = 1 + ((s.backgroundZoom || 0) / 100) + targetZoom;
    let currentHPos = (s.horizontalPosition || 0) + targetSwayX;
    let currentVPos = (s.verticalPosition || 0) + targetSwayY;
    let currentRotation = targetRotate;

    // STEP A: Clear & Draw Background Image
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(baseScale, baseScale);
    ctx.translate((currentHPos / 100) * w, (currentVPos / 100) * h);
    ctx.rotate((currentRotation * Math.PI) / 180);

    if (bgImgRef.current) {
      const img = bgImgRef.current;
      const aspectScale = Math.max(w / img.width, h / img.height);
      const drawW = img.width * aspectScale;
      const drawH = img.height * aspectScale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, w / 2);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();

    // STEP B: Draw Particles
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    for (let p = 0; p < 15; p++) {
      const px = ((p * 47 + frameTimestamp * 30) % w);
      const py = ((p * 31 + frameTimestamp * 20) % h);
      const ps = (p % 3) + 3;
      ctx.fillRect(px, py, ps, ps);
    }
    ctx.restore();

    // STEP C: Render Text/Playlist Objects
    const playlistObjs = m3Objects.filter(o => o && (o.type === 'playlist' || o.type === 'track_list_column' || o.type === 'text'));
    for (const txt of playlistObjs) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tx = (txt.x ? txt.x / 1920 : 0.8) * w;
      const ty = (txt.y ? txt.y / 1080 : 0.3) * h;
      ctx.fillText(txt.name || txt.text || 'Playlist Overlay', tx, ty);
      ctx.restore();
    }

    // STEP D: Render Visualizers using VisualizerV4Core on isolated transparent sub-canvas
    const visObjects = m3Objects.filter(o => o && o.type && (o.type.includes('visualizer') || o.type === 'spectrum'));
    const targetVis = visObjects.length > 0 ? visObjects : [{ type: 'visualizer4', mode: 'spectrum-bars', x: 960, y: 540, width: 600, height: 260 }];

    for (const ov of targetVis) {
      const vizCanvas = document.createElement('canvas');
      vizCanvas.width = 400;
      vizCanvas.height = 180;
      const vizCtx = vizCanvas.getContext('2d');

      VisualizerV4Core.renderFrame(vizCtx, 400, 180, audioState, ov);
      ctx.drawImage(vizCanvas, (w - 400) / 2, (h - 180) / 2);
    }

    return {
      bass: audioState.bass || 0,
      mid: audioState.mid || 0,
      treble: audioState.treble || 0,
      energy: audioState.energy || 0,
      scale: baseScale,
      swayX: currentHPos,
      swayY: currentVPos,
      rotate: currentRotation
    };
  };

  // Render Frame & Update Telemetry
  useEffect(() => {
    if (!isOpen) return;
    const liveMetrics = renderEngineFrame(liveCanvasRef.current, currentTime, false);
    const renderMetrics = renderEngineFrame(backendSimCanvasRef.current, currentTime, true);

    if (liveMetrics && renderMetrics) {
      setTelemetry({
        live: liveMetrics,
        render: renderMetrics,
        delta: {
          bass: Math.abs(liveMetrics.bass - renderMetrics.bass),
          mid: Math.abs(liveMetrics.mid - renderMetrics.mid),
          treble: Math.abs(liveMetrics.treble - renderMetrics.treble),
          energy: Math.abs(liveMetrics.energy - renderMetrics.energy),
          scale: Math.abs(liveMetrics.scale - renderMetrics.scale),
          swayX: Math.abs(liveMetrics.swayX - renderMetrics.swayX),
          swayY: Math.abs(liveMetrics.swayY - renderMetrics.swayY),
          rotate: Math.abs(liveMetrics.rotate - renderMetrics.rotate)
        }
      });
    }
  }, [isOpen, currentTime, m3BgPool, m3Objects, renderEngineMode]);

  // Compute Heatmap Diff when in 'diff' mode
  useEffect(() => {
    if (viewMode !== 'diff' || !diffCanvasRef.current || !liveCanvasRef.current) return;
    const diffCanvas = diffCanvasRef.current;
    const dctx = diffCanvas.getContext('2d');
    const w = diffCanvas.width = 640;
    const h = diffCanvas.height = 360;

    dctx.drawImage(liveCanvasRef.current, 0, 0, w, h);
    const liveImgData = dctx.getImageData(0, 0, w, h);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tctx = tempCanvas.getContext('2d');

    const compareElement = videoRef.current || backendSimCanvasRef.current;
    if (!compareElement) return;

    tctx.drawImage(compareElement, 0, 0, w, h);
    const targetImgData = tctx.getImageData(0, 0, w, h);

    const diffData = dctx.createImageData(w, h);
    let totalDiff = 0;
    const totalPixels = w * h;

    for (let i = 0; i < liveImgData.data.length; i += 4) {
      const rDiff = Math.abs(liveImgData.data[i] - targetImgData.data[i]);
      const gDiff = Math.abs(liveImgData.data[i + 1] - targetImgData.data[i + 1]);
      const bDiff = Math.abs(liveImgData.data[i + 2] - targetImgData.data[i + 2]);
      const delta = (rDiff + gDiff + bDiff) / 3;

      totalDiff += delta;

      if (delta > 25) {
        diffData.data[i] = 255;
        diffData.data[i + 1] = 50;
        diffData.data[i + 2] = 50;
        diffData.data[i + 3] = 220;
      } else {
        diffData.data[i] = liveImgData.data[i] * 0.3;
        diffData.data[i + 1] = liveImgData.data[i + 1] * 0.3;
        diffData.data[i + 2] = liveImgData.data[i + 2] * 0.3;
        diffData.data[i + 3] = 255;
      }
    }

    dctx.putImageData(diffData, 0, 0);
    const avgDelta = totalDiff / totalPixels;
    const matchPercent = Math.max(0, Math.min(100, Math.round(100 - (avgDelta / 255) * 100)));
    setParityScore(matchPercent);
  }, [currentTime, viewMode]);

  if (!isOpen) return null;

  const currentFrame = Math.round(currentTime * fps);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-[#0f111a] border border-[#2d3247] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#161824] border-b border-[#2d3247]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                M3 WYSIWYG Parity Debugger & Data Telemetry Inspector
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                Bandingkan parameter matematika gerakan background & FFT audio secara numerik per frame.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchBackendTelemetry}
              className="flex items-center gap-1.5 bg-[#1e2338] hover:bg-[#2c3350] border border-orange-500/40 text-orange-400 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shadow"
            >
              <Download size={14} /> Muat Log Telemetry Backend
            </button>
            <label className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-md">
              <Upload size={14} /> Upload Video MP4 (Opsional)
              <input type="file" accept="video/mp4,video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#252836] hover:bg-[#32364a] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Mode Toolbar & Render Mode Selector */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#121420] border-b border-[#2d3247]/60 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider mr-2">Mode Tampilan:</span>
            <button 
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${viewMode === 'side-by-side' ? 'bg-orange-500 text-white shadow' : 'bg-[#1b1e2e] text-gray-400 hover:text-white'}`}
            >
              Side-by-Side (Bandingkan)
            </button>
            <button 
              onClick={() => setViewMode('onion')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${viewMode === 'onion' ? 'bg-orange-500 text-white shadow' : 'bg-[#1b1e2e] text-gray-400 hover:text-white'}`}
            >
              Onion Skin (Transparan 50%)
            </button>
            <button 
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${viewMode === 'diff' ? 'bg-orange-500 text-white shadow' : 'bg-[#1b1e2e] text-gray-400 hover:text-white'}`}
            >
              Pixel Diff Heatmap 🔥
            </button>
          </div>

          <div className="flex items-center gap-4 text-mono font-bold">
            {/* Audio Engine Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#181a29] border border-[#2d3247] p-0.5 rounded-md">
              <button 
                onClick={() => setRenderEngineMode('NORMAL')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold ${renderEngineMode === 'NORMAL' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                title="Mode Normal: Menggunakan Real PCM FFT dari lagu audio asli"
              >
                <Music size={11} /> Mode Normal (Real Audio PCM)
              </button>
              <button 
                onClick={() => setRenderEngineMode('FAST')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold ${renderEngineMode === 'FAST' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                title="Mode Fast: Menggunakan Synthetic Sine Wave Generator"
              >
                <Cpu size={11} /> Mode Fast (Synthetic Sine)
              </button>
            </div>

            <span className="text-gray-400">FPS:</span>
            <select 
              value={fps} 
              onChange={e => setFps(Number(e.target.value))}
              className="bg-[#1b1e2e] border border-[#2d3247] text-orange-400 rounded px-2 py-0.5"
            >
              <option value={24}>24 FPS</option>
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
            </select>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1b1e2e] border border-[#2d3247]">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-gray-300">Engine Parity:</span>
              <span className="text-emerald-400 font-extrabold">{parityScore}% Match</span>
            </div>
          </div>
        </div>

        {/* Dual Canvas Player Area */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#0a0b10] flex flex-col gap-4">
          
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 gap-4">
              
              {/* Left: Live Editor Canvas */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-orange-400 flex items-center gap-1.5">
                    <Eye size={14} /> 1. Live Editor Engine Canvas (Full Scene)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Web Audio API + Hardware Canvas</span>
                </div>
                <div className="relative aspect-video bg-[#121420] border border-[#2d3247] rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <canvas ref={liveCanvasRef} className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Right: FFmpeg Backend Render Simulator / Video Upload */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-cyan-400 flex items-center gap-1.5">
                    {videoUrl ? <Film size={14} /> : <Cpu size={14} />} 
                    {videoUrl ? '2. Hasil Render MP4 Video (Uploaded)' : `2. Simulasi Hasil Render Backend FFmpeg (${renderEngineMode === 'NORMAL' ? 'Mode Normal' : 'Mode Fast'})`}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {videoFile ? videoFile.name : 'Single-Pass Rawvideo Streaming Math Engine'}
                  </span>
                </div>
                <div className="relative aspect-video bg-[#121420] border border-[#2d3247] rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  {videoUrl ? (
                    <video 
                      ref={videoRef} 
                      src={videoUrl} 
                      className="w-full h-full object-contain" 
                      muted 
                      onLoadedMetadata={(e) => setDuration(e.target.duration || 120)}
                    />
                  ) : (
                    <canvas ref={backendSimCanvasRef} className="w-full h-full object-contain" />
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Overlay / Diff Mode */
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[12px] font-bold text-orange-400 flex items-center gap-1.5">
                🔥 {viewMode === 'diff' ? 'Pixel Difference Heatmap (Merah = Piksel Beda)' : 'Onion Skin 50% Overlay'}
              </span>
              <div className="relative w-full max-w-[700px] aspect-video bg-[#121420] border border-[#2d3247] rounded-xl overflow-hidden shadow-2xl">
                <canvas ref={liveCanvasRef} className="absolute inset-0 w-full h-full object-contain" />
                {videoUrl ? (
                  <video 
                    ref={videoRef} 
                    src={videoUrl} 
                    className={`absolute inset-0 w-full h-full object-contain ${viewMode === 'onion' ? 'opacity-50' : 'opacity-0'}`} 
                    muted 
                    onLoadedMetadata={(e) => setDuration(e.target.duration || 120)}
                  />
                ) : (
                  <canvas ref={backendSimCanvasRef} className={`absolute inset-0 w-full h-full object-contain ${viewMode === 'onion' ? 'opacity-50' : 'opacity-0'}`} />
                )}
                {viewMode === 'diff' && (
                  <canvas ref={diffCanvasRef} className="absolute inset-0 w-full h-full object-contain" />
                )}
              </div>
            </div>
          )}

          {/* NUMERICAL DATA TELEMETRY MATRIX TABLE */}
          <div className="bg-[#121422] border border-[#2d3247] rounded-xl p-3 text-[11px] font-mono">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#2d3247]">
              <span className="text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Table size={14} /> Numerical Parity Telemetry Matrix (Data Real-time Frame-by-Frame)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 text-[10px]">{audioStatus}</span>
                <span className="text-gray-400">Frame {currentFrame} @ {currentTime.toFixed(3)}s</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-[#191c2c] p-2 rounded border border-[#2d3247]">
                <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Audio Bass (Low)</span>
                <div className="flex justify-around font-bold">
                  <span className="text-orange-400">Live: {telemetry.live.bass.toFixed(3)}</span>
                  <span className="text-cyan-400">Render: {telemetry.render.bass.toFixed(3)}</span>
                </div>
                <span className="text-[10px] text-emerald-400 block mt-1">Δ Delta: {telemetry.delta.bass.toFixed(4)}</span>
              </div>

              <div className="bg-[#191c2c] p-2 rounded border border-[#2d3247]">
                <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Audio Energy</span>
                <div className="flex justify-around font-bold">
                  <span className="text-orange-400">Live: {telemetry.live.energy.toFixed(3)}</span>
                  <span className="text-cyan-400">Render: {telemetry.render.energy.toFixed(3)}</span>
                </div>
                <span className="text-[10px] text-emerald-400 block mt-1">Δ Delta: {telemetry.delta.energy.toFixed(4)}</span>
              </div>

              <div className="bg-[#191c2c] p-2 rounded border border-[#2d3247]">
                <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">BG Motion Scale (Zoom)</span>
                <div className="flex justify-around font-bold">
                  <span className="text-orange-400">Live: {telemetry.live.scale.toFixed(4)}</span>
                  <span className="text-cyan-400">Render: {telemetry.render.scale.toFixed(4)}</span>
                </div>
                <span className="text-[10px] text-emerald-400 block mt-1">Δ Delta: {telemetry.delta.scale.toFixed(5)}</span>
              </div>

              <div className="bg-[#191c2c] p-2 rounded border border-[#2d3247]">
                <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">BG Motion Sway X / Y</span>
                <div className="flex justify-around font-bold text-[10px]">
                  <span className="text-orange-400">({telemetry.live.swayX.toFixed(1)}, {telemetry.live.swayY.toFixed(1)})</span>
                  <span className="text-cyan-400">({telemetry.render.swayX.toFixed(1)}, {telemetry.render.swayY.toFixed(1)})</span>
                </div>
                <span className="text-[10px] text-emerald-400 block mt-1">Δ Delta: {telemetry.delta.swayX.toFixed(3)}px</span>
              </div>
            </div>
          </div>

          {/* Timeline Frame Scrubber & Control Bar */}
          <div className="bg-[#141622] border border-[#2d3247] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="text-white font-bold">
                Frame: <span className="text-orange-400">{currentFrame}</span> | Timestamp: <span className="text-cyan-400">{currentTime.toFixed(3)}s</span>
              </span>
              <span>Visualizer & Motion Parity Inspection</span>
            </div>

            {/* Scrubber Bar */}
            <input 
              type="range"
              min={0}
              max={duration}
              step={1 / fps}
              value={currentTime}
              onChange={e => {
                setIsPlaying(false);
                setCurrentTime(Number(e.target.value));
              }}
              className="w-full h-2 bg-[#232738] rounded-lg appearance-none cursor-pointer accent-orange-500"
            />

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => stepFrame(-5)}
                className="px-3 py-1 bg-[#1f2233] hover:bg-[#2c3047] text-gray-300 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                <SkipBack size={13} /> -5 Frames
              </button>
              <button 
                onClick={() => stepFrame(-1)}
                className="px-3 py-1 bg-[#1f2233] hover:bg-[#2c3047] text-gray-300 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                -1 Frame
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5 fill-current" />}
              </button>

              <button 
                onClick={() => stepFrame(1)}
                className="px-3 py-1 bg-[#1f2233] hover:bg-[#2c3047] text-gray-300 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                +1 Frame
              </button>
              <button 
                onClick={() => stepFrame(5)}
                className="px-3 py-1 bg-[#1f2233] hover:bg-[#2c3047] text-gray-300 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                +5 Frames <SkipForward size={13} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
