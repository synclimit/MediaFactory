/**
 * Visualizer3Panel.jsx [Visualizer 3 Sidebar Control Panel]
 * React component rendering the Visualizer 3 UI control panel in M3 Studio.
 */

import React, { useState } from 'react';
import { Activity, ShieldCheck, Sparkles, CheckCircle2, RefreshCw, Zap, Cpu } from 'lucide-react';
import { VisualizerPipeline } from '../../../visualizers/v3/pipeline/VisualizerPipeline.js';
import { AudioAnalyzer } from '../../../visualizers/v3/pipeline/AudioAnalyzer.js';
import { ValidationEngine } from '../../../visualizers/v3/pipeline/ValidationEngine.js';

// Auto-register V3 plugins
import '../../../visualizers/v3/plugins/SpectrumBarsPlugin.js';
import '../../../visualizers/v3/plugins/CircularPulsePlugin.js';
import '../../../visualizers/v3/plugins/CyberpunkWaveformPlugin.js';
import '../../../visualizers/v3/plugins/ParticleOrbitPlugin.js';

export default function Visualizer3Panel({ addObject, m3Objects = [], m3BgPool = [] }) {
  const [selectedMode, setSelectedMode] = useState('spectrum-bars');
  const [colorLeft, setColorLeft] = useState('#AB55F7');
  const [colorRight, setColorRight] = useState('#F59E0B');
  const [colorMid, setColorMid] = useState('#06B6D4');
  const [colorMode, setColorMode] = useState('2 Gradient');
  const [frequencyOrder, setFrequencyOrder] = useState('Bass -> Treble');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);
  const [backendPreviewUrl, setBackendPreviewUrl] = useState(null);

  const presets = [
    { mode: 'spectrum-bars', label: 'Spectrum Bars V3', color: '#AB55F7', desc: 'Single Pipeline spectrum audio frequency bars' },
    { mode: 'circular-pulse', label: 'Circular Pulse V3', color: '#EC4899', desc: 'Deterministic pulsing ring & particle rays' },
    { mode: 'cyberpunk-waveform', label: 'Cyberpunk Waveform V3', color: '#00F0FF', desc: 'Neon oscilloscope waveform & perspective grid' },
    { mode: 'particle-orbit', label: 'Particle Orbit V3', color: '#8B5CF6', desc: 'Multi-layer orbiting particle galaxy system' },
  ];

  const handleAddVisualizer3 = (modeToUse) => {
    const targetMode = modeToUse || selectedMode;
    let defaultX = 960;
    let defaultY = 540;
    let defaultW = 600;
    let defaultH = 300;

    if (targetMode === 'circular-pulse') {
      defaultX = 500; defaultY = 400; defaultW = 450; defaultH = 450;
    } else if (targetMode === 'cyberpunk-waveform') {
      defaultX = 960; defaultY = 540; defaultW = 800; defaultH = 200;
    } else if (targetMode === 'spectrum-bars') {
      defaultX = 960; defaultY = 920; defaultW = 1000; defaultH = 250;
    } else if (targetMode === 'particle-orbit') {
      defaultX = 1420; defaultY = 400; defaultW = 450; defaultH = 450;
    }

    addObject({
      type: 'visualizer3',
      name: `Visualizer 3 (${targetMode})`,
      mode: targetMode,
      pluginId: targetMode,
      colorLeft,
      colorRight,
      colorMid,
      colorMode,
      frequencyOrder,
      x: defaultX,
      y: defaultY,
      width: defaultW,
      height: defaultH,
    });
  };

  const runPixelVerificationTest = async () => {
    setIsTesting(true);
    setVerificationResult(null);
    setBackendPreviewUrl(null);

    try {
      const targetW = 1920;
      const targetH = 1080;
      const canvasLive = document.createElement('canvas');
      canvasLive.width = targetW;
      canvasLive.height = targetH;
      const ctxLive = canvasLive.getContext('2d');

      // 1. Draw Live Stage Background
      const activeBg = m3BgPool && m3BgPool.length > 0 ? m3BgPool[0] : {};
      ctxLive.fillStyle = activeBg.color || '#000000';
      ctxLive.fillRect(0, 0, targetW, targetH);

      const analyzer = new AudioAnalyzer(60);
      analyzer.generateSyntheticTimeline(2.0);
      const mockAudioState = analyzer.getAudioDataAtTimestamp(1.0);

      // Helper for stage coordinate parsing
      const parseStageCoord = (val, stageDim, defaultVal) => {
        if (val === undefined || val === null || val === '') return defaultVal;
        const str = String(val).trim();
        if (str.endsWith('%')) {
          const pct = parseFloat(str);
          return isNaN(pct) ? defaultVal : (pct / 100) * stageDim;
        }
        const num = parseFloat(str);
        return isNaN(num) ? defaultVal : num;
      };

      // Draw all objects on Live Stage Canvas
      const validObjects = (m3Objects || []).filter(o => o && o.visible !== false);
      for (const ov of validObjects) {
        const isVis = ov.type === 'visualizer' || ov.type === 'visualizer2' || ov.type === 'visualizer3' || ov.type === 'spectrum' || ov.visualizerId;
        const rawW = parseStageCoord(ov.width, targetW, 600);
        const rawH = parseStageCoord(ov.height, targetH, 300);
        const rawCx = parseStageCoord(ov.x, targetW, 960);
        const rawCy = parseStageCoord(ov.y, targetH, 540);

        const w = Math.round(rawW);
        const h = Math.round(rawH);
        const cx = Math.round(rawCx);
        const cy = Math.round(rawCy);
        const topLeftX = Math.round(cx - (w / 2));
        const topLeftY = Math.round(cy - (h / 2));

        if (isVis) {
          const objCanvas = document.createElement('canvas');
          objCanvas.width = w;
          objCanvas.height = h;
          const pluginId = ov.mode || ov.pluginId || selectedMode;
          const config = { colorLeft, colorRight, colorMid, colorMode, frequencyOrder, ...ov, width: w, height: h };
          VisualizerPipeline.renderPipelineFrame(objCanvas, 1.0, mockAudioState, pluginId, config);
          ctxLive.drawImage(objCanvas, topLeftX, topLeftY);
        }
      }

      setLivePreviewUrl(canvasLive.toDataURL('image/png'));

      // 2. Fetch Full Stage Frame Composite from Node.js Backend Engine
      const m3Payload = {
        m3Objects: m3Objects || [],
        background: activeBg
      };

      const res = await fetch('http://localhost:18888/api/m3/verify-stage-parity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m3Payload, timestamp: 1.0 })
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

          // 3. Bitwise Compare Live Stage Canvas vs Node.js Backend Stage Canvas
          const result = ValidationEngine.compareCanvases(canvasLive, canvasExport);
          setVerificationResult(result);
          setIsTesting(false);
        };
        img.src = json.dataUrl;
      } else {
        throw new Error(json?.error || 'Failed to fetch backend stage verification frame');
      }
    } catch (err) {
      console.error('[Stage Parity Audit Error]:', err);
      setVerificationResult({ passed: false, error: err.message, matchPercentage: 0, mismatchedPixels: -1 });
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12131a] p-4 text-gray-200 overflow-y-auto custom-scrollbar">
      {/* Header Badge */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/40 mb-4 space-y-2 shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-emerald-400 text-[13px] tracking-wide">
            <Cpu size={18} className="text-emerald-400 animate-pulse" />
            <span>VISUALIZER 3 (SINGLE ENGINE)</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
            100% WYSIWYG
          </span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
          Arsitektur Single Source of Truth Engine yang menjamin tampilan di Live Editor dan hasil Output Video MP4 <strong>100% Identik (0 Mismatched Pixels)</strong>.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="space-y-2.5 mb-4">
        <label className="font-bold text-gray-400 tracking-wider text-[10px] uppercase flex items-center gap-1.5">
          <Zap size={12} className="text-emerald-400" />
          <span>Pilih Style Preset V3</span>
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
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-[#14161f] border-[#252836] hover:border-gray-600 text-gray-300'
                }`}
              >
                <div>
                  <div className="font-bold text-[12px] flex items-center gap-2" style={{ color: isSelected ? '#10b981' : p.color }}>
                    <Sparkles size={14} />
                    <span>{p.label}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{p.desc}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddVisualizer3(p.mode);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                >
                  + Add V3
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color & Spectrum Customization */}
      <div className="p-3.5 bg-[#14161f] border border-[#252836] rounded-xl space-y-3.5 mb-4">
        <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">Kustomisasi Parameter V3</span>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Left</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={colorLeft}
                onChange={(e) => setColorLeft(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[9px] text-gray-300">{colorLeft}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Right</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={colorRight}
                onChange={(e) => setColorRight(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[9px] text-gray-300">{colorRight}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Mid</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={colorMid}
                onChange={(e) => setColorMid(e.target.value)}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[9px] text-gray-300">{colorMid}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Color Mode</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
              className="w-full bg-[#0b0c10] border border-[#252836] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-emerald-500"
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
              className="w-full bg-[#0b0c10] border border-[#252836] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Bass -> Treble">Bass → Treble</option>
              <option value="Treble -> Bass">Treble → Bass</option>
              <option value="Center Bass">Center Bass</option>
              <option value="Split Mirror">Split Mirror</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Tester */}
      <div className="p-3.5 bg-[#0d0e14] border border-[#252836] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-200 text-[11px] flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Single Engine Parity Tester</span>
          </span>
          <button
            onClick={runPixelVerificationTest}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer transition-all"
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
                  {verificationResult.mismatchedPixels} Mismatched Pixels
                </div>
              </div>
            </div>

            {/* VISUAL SIDE-BY-SIDE COMPARISON PREVIEW */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="bg-[#14161f] p-2 rounded-lg border border-[#252836] text-center">
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Live Editor Preview</div>
                {livePreviewUrl ? (
                  <img src={livePreviewUrl} alt="Live Editor Stage" className="w-full h-auto rounded border border-gray-700 object-contain max-h-[120px] bg-black" />
                ) : (
                  <div className="h-[70px] bg-black/50 rounded flex items-center justify-center text-[9px] text-gray-500">No Image</div>
                )}
              </div>
              <div className="bg-[#14161f] p-2 rounded-lg border border-[#252836] text-center">
                <div className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Backend Output Frame</div>
                {backendPreviewUrl ? (
                  <img src={backendPreviewUrl} alt="Backend Export Stage" className="w-full h-auto rounded border border-emerald-500/40 object-contain max-h-[120px] bg-black" />
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
