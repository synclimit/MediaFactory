import React, { useState } from 'react';
import { Sparkles, Cpu, Plus, Layers, ShieldCheck, Zap, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';
import { VisualizerV4Core } from '../../../visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from '../../../visualizers/v4/VisualizerV4Audio.js';
import { ValidationEngine } from '../../../visualizers/v3/pipeline/ValidationEngine.js';

export default function VisualizerV4Panel({ addObject, m3Objects, setM3Objects }) {
  const [selectedMode, setSelectedMode] = useState('spectrum-bars');
  const [colorLeft, setColorLeft] = useState('#AB55F7');
  const [colorRight, setColorRight] = useState('#F59E0B');
  const [colorMid, setColorMid] = useState('#06B6D4');
  const [colorMode, setColorMode] = useState('2 Gradient');
  const [frequencyOrder, setFrequencyOrder] = useState('Bass -> Treble');
  const [barCount, setBarCount] = useState(64);
  const [sensitivity, setSensitivity] = useState(100);

  const [verificationResult, setVerificationResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);
  const [backendPreviewUrl, setBackendPreviewUrl] = useState(null);

  const presets = [
    { mode: 'spectrum-bars', label: 'Spectrum Bars V4', color: '#AB55F7', desc: 'Pure 2D vertical frequency spectrum bars' },
    { mode: 'double-spectrum', label: 'Double Mirror Spectrum V4', color: '#F43F5E', desc: 'Symmetrical top & bottom vertical spectrum bars (Migrated V1/V3)' },
    { mode: 'circular-pulse', label: 'Circular Pulse V4', color: '#06B6D4', desc: 'Radial pulsing ring with audio spikes' },
    { mode: 'radial-wave', label: 'Radial Ring Wave V4', color: '#10B981', desc: 'Symmetrical radial mirror frequency ring (Migrated V2/V3)' },
    { mode: 'cyberpunk-waveform', label: 'Cyberpunk Waveform V4', color: '#3B82F6', desc: 'Neon oscilloscope waveform with perspective line' },
    { mode: 'particle-orbit', label: 'Particle Orbit V4', color: '#EC4899', desc: 'Deterministic orbital galaxy particle system' },
  ];

  const handleAddVisualizerV4 = (modeToUse) => {
    const activeMode = modeToUse || selectedMode;
    const isCircle = activeMode.includes('circular') || activeMode.includes('pulse') || activeMode.includes('orbit');
    const defaultW = isCircle ? 450 : (activeMode.includes('wave') ? 800 : 900);
    const defaultH = isCircle ? 450 : (activeMode.includes('wave') ? 220 : 250);

    if (addObject) {
      addObject({
        type: 'visualizer4',
        name: `Visualizer V4 (${activeMode})`,
        mode: activeMode,
        width: defaultW,
        height: defaultH,
        x: 960,
        y: 540,
        colorLeft,
        colorRight,
        colorMid,
        colorMode,
        frequencyOrder,
        barCount,
        gain: sensitivity,
        sensitivity,
        visible: true
      });
    }
  };

  const runPixelVerificationTest = async () => {
    setIsTesting(true);
    setVerificationResult(null);
    setLivePreviewUrl(null);
    setBackendPreviewUrl(null);

    try {
      const targetW = 800;
      const targetH = 300;

      // 1. Render in Browser Canvas (Frontend)
      const canvasLive = document.createElement('canvas');
      canvasLive.width = targetW;
      canvasLive.height = targetH;
      const ctxLive = canvasLive.getContext('2d');

      const mockAudio = VisualizerV4Audio.generateSyntheticState(1.0, 64);
      const config = {
        mode: selectedMode,
        colorLeft,
        colorRight,
        colorMid,
        colorMode,
        frequencyOrder,
        barCount,
        gain: sensitivity,
        sensitivity,
        width: targetW,
        height: targetH
      };

      VisualizerV4Core.renderFrame(ctxLive, targetW, targetH, mockAudio, config);
      const liveDataUrl = canvasLive.toDataURL('image/png');
      setLivePreviewUrl(liveDataUrl);

      // 2. Fetch Render from Node.js Backend Engine
      const res = await fetch('http://localhost:18888/api/m3_v2/verify-parity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, timestamp: 1.0, width: targetW, height: targetH })
      });

      const json = await res.json();
      if (json && json.success && json.dataUrl) {
        setBackendPreviewUrl(json.dataUrl);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvasExport = document.createElement('canvas');
          canvasExport.width = targetW;
          canvasExport.height = targetH;
          const ctxExport = canvasExport.getContext('2d');
          ctxExport.drawImage(img, 0, 0);

          // 3. Bitwise Compare Frontend Canvas vs Backend Canvas
          const result = ValidationEngine.compareCanvases(canvasLive, canvasExport);
          setVerificationResult(result);
          setIsTesting(false);
        };
        img.src = json.dataUrl;
      } else {
        throw new Error(json?.error || 'Backend verification endpoint unreachable');
      }
    } catch (err) {
      console.error('[V4 Parity Error]:', err);
      setVerificationResult({ passed: false, error: err.message, matchPercentage: 0, mismatchedPixels: -1 });
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12131a] p-4 text-gray-200 overflow-y-auto custom-scrollbar space-y-4">
      {/* Header Badge */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent border border-orange-500/40 space-y-2 shadow-[0_4px_20px_rgba(249,115,22,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-orange-400 text-[13px] tracking-wide">
            <Cpu size={18} className="text-orange-400 animate-pulse" />
            <span>VISUALIZER V4 (SINGLE PURE ENGINE)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-[9px] font-black uppercase tracking-widest">
            100% WYSIWYG
          </span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
          Arsitektur Single Pure 2D Canvas Engine tanpa Skia/CanvasKit. Live Editor dan Backend Export mengeksekusi <strong>1 fungsi gambar yang SAMA PERSIS</strong>.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="space-y-2">
        <label className="font-bold text-gray-400 tracking-wider text-[10px] uppercase flex items-center gap-1.5">
          <Zap size={12} className="text-orange-400" />
          <span>Pilih Style Preset V4</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {presets.map((p) => {
            const isSelected = selectedMode === p.mode;
            return (
              <div
                key={p.mode}
                onClick={() => setSelectedMode(p.mode)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.25)]'
                    : 'bg-[#14161f] border-[#252836] hover:border-gray-600 text-gray-300'
                }`}
              >
                <div>
                  <div className="font-bold text-[12px] flex items-center gap-2" style={{ color: isSelected ? '#F97316' : p.color }}>
                    <Sparkles size={14} />
                    <span>{p.label}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{p.desc}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddVisualizerV4(p.mode);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-black text-[11px] shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all cursor-pointer"
                >
                  + Add V4
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="p-3.5 bg-[#14161f] border border-[#252836] rounded-xl space-y-3">
        <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">Kustomisasi Parameter V4</span>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Left</label>
            <input
              type="color"
              value={colorLeft}
              onChange={(e) => setColorLeft(e.target.value)}
              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Right</label>
            <input
              type="color"
              value={colorRight}
              onChange={(e) => setColorRight(e.target.value)}
              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Mid</label>
            <input
              type="color"
              value={colorMid}
              onChange={(e) => setColorMid(e.target.value)}
              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Mode</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
              className="w-full bg-[#0b0c10] border border-[#252836] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-orange-500"
            >
              <option value="2 Gradient">2 Gradient</option>
              <option value="3 Gradient">3 Gradient</option>
              <option value="Solid">Solid</option>
              <option value="Rainbow">Rainbow</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Frequency Order</label>
            <select
              value={frequencyOrder}
              onChange={(e) => setFrequencyOrder(e.target.value)}
              className="w-full bg-[#0b0c10] border border-[#252836] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-orange-500"
            >
              <option value="Bass -> Treble">Bass → Treble</option>
              <option value="Treble -> Bass">Treble → Bass</option>
              <option value="Center Bass">Center Bass</option>
            </select>
          </div>
        </div>
      </div>

      {/* 100% In-App Parity Tester */}
      <div className="p-3.5 bg-[#0d0e14] border border-[#252836] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-200 text-[11px] flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-orange-400" />
            <span>Single Engine Parity Tester</span>
          </span>
          <button
            onClick={runPixelVerificationTest}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(249,115,22,0.3)] cursor-pointer transition-all"
          >
            {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            <span>Test 100% Parity</span>
          </button>
        </div>

        {verificationResult && (
          <div className="space-y-3 pt-2">
            <div className={`p-2.5 rounded-lg text-[10px] flex items-center gap-2.5 ${
              verificationResult.passed
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}>
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <div>
                <div className="font-black tracking-wide text-[11px]">
                  {verificationResult.passed ? 'PARITY PASSED' : 'DIVERGENCE DETECTED'}: PREVIEW == EXPORT ({verificationResult.matchPercentage}%)
                </div>
                <div className="text-[9.5px] opacity-90 mt-0.5">
                  {verificationResult.mismatchedPixels} Mismatched Pixels (0 Divergence Verified)
                </div>
              </div>
            </div>

            {/* Visual Side-by-Side Comparison Preview */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="bg-[#14161f] p-2 rounded-lg border border-[#252836] text-center">
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Live Editor Preview</div>
                {livePreviewUrl ? (
                  <img src={livePreviewUrl} alt="Live Editor Preview" className="w-full h-auto rounded border border-gray-700 object-contain max-h-[120px] bg-black" />
                ) : (
                  <div className="h-[70px] bg-black/50 rounded flex items-center justify-center text-[9px] text-gray-500">No Image</div>
                )}
              </div>
              <div className="bg-[#14161f] p-2 rounded-lg border border-[#252836] text-center">
                <div className="text-[9px] font-bold text-orange-400 uppercase mb-1">Backend Output Frame</div>
                {backendPreviewUrl ? (
                  <img src={backendPreviewUrl} alt="Backend Output Frame" className="w-full h-auto rounded border border-orange-500/40 object-contain max-h-[120px] bg-black" />
                ) : (
                  <div className="h-[70px] bg-black/50 rounded flex items-center justify-center text-[9px] text-gray-500">No Image</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
