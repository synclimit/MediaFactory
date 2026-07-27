import React, { useEffect, useState, useRef } from 'react';
import { MASTERING_PROFILES } from '../../entities/m2/MasteringProfileEntity.js';
// HMR FORCE UPDATE - Remove Purple Emojis

const AnimatedWaveform = () => {
  const [bars, setBars] = useState([]);
  
  useEffect(() => {
    const newBars = Array.from({ length: 50 }).map(() => Math.random() * 80 + 10);
    setBars(newBars);
    
    const interval = setInterval(() => {
      setBars(prev => prev.map(val => {
        const jump = (Math.random() - 0.5) * 40;
        return Math.max(5, Math.min(95, val + jump));
      }));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-10 bg-[#0a0b0f] rounded-lg border border-orange-500/20 p-1.5 flex items-center justify-between gap-3 overflow-hidden relative group cursor-crosshair">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(249,115,22,0.05)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Waveform */}
      <div className="flex-1 h-full flex items-center justify-between gap-[1px]">
        {bars.map((val, i) => (
          <div key={i} className="w-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full transition-all duration-150 ease-in-out" style={{ height: `${val}%` }}></div>
        ))}
      </div>
      
      {/* VU Meter */}
      <div className="w-6 shrink-0 h-full flex flex-col justify-end relative">
        <div className="absolute -top-1.5 left-0 right-0 flex justify-between text-[5px] text-gray-500 font-mono">
          <span>L</span>
          <span>R</span>
        </div>
        <div className="flex justify-between h-[75%] items-end mt-auto">
          <div className="w-2 h-full bg-[#1a1d27] rounded-[1px] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-[1px] animate-pulse" style={{ height: '75%' }}></div>
          </div>
          <div className="w-2 h-full bg-[#1a1d27] rounded-[1px] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-[1px] animate-pulse" style={{ height: '82%', animationDelay: '100ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const sliderThumbClasses = "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#f97316] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(249,115,22,0.8)] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#f97316] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full";

const EnhancerSlider = ({ label, field, min = 0, max = 100, step = 1, unit = '%', masteringSettings, setSetting }) => {
  const propVal = masteringSettings[field] ?? 0;
  const [localVal, setLocalVal] = React.useState(propVal);
  
  React.useEffect(() => { setLocalVal(propVal); }, [propVal]);

  return (
    <div className="flex items-center gap-2 mb-2 last:mb-0">
      <span className="text-[10px] font-medium text-gray-300 w-28 truncate shrink-0" title={label}>{label}</span>
      <input 
        type="range" min={min} max={max} step={step} value={localVal} 
        onChange={(e) => setLocalVal(parseFloat(e.target.value))}
        onPointerUp={() => setSetting(field, localVal)}
        className={`flex-1 min-w-0 h-1.5 bg-[#1a1d27] rounded-full appearance-none cursor-pointer outline-none ${sliderThumbClasses}`}
      />
      <span className="text-[9px] text-orange-400 font-mono w-8 text-right shrink-0">{localVal}{unit}</span>
    </div>
  );
};

const CleanUpToggle = ({ label, field, masteringSettings, setSetting }) => (
  <div className="flex justify-between items-center bg-[#161822]/80 px-2 py-1.5 rounded border border-orange-500/20 hover:border-orange-500/50 shadow-inner transition-colors cursor-pointer group" onClick={() => setSetting(field, !masteringSettings[field])}>
    <span className={`text-[9px] font-medium select-none truncate transition-colors ${masteringSettings[field] ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-300'}`} title={label}>{label}</span>
    <div className={`w-3 h-3 rounded-[2px] flex items-center justify-center transition-all shrink-0 ml-1 ${masteringSettings[field] ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-[#1a1d27] border border-[#2d3247]'}`}>
      {masteringSettings[field] && (
        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </div>
);

const GraphicEQEditor = ({ eqBands = Array(10).fill(0), onChange }) => {
  const [localBands, setLocalBands] = useState(eqBands);
  const [activeBand, setActiveBand] = useState(null);
  const draggingRef = useRef({ index: null, lastEmit: 0, bands: eqBands });
  const containerRef = useRef(null);

  useEffect(() => {
    if (draggingRef.current.index === null) {
      setLocalBands(eqBands);
      draggingRef.current.bands = eqBands;
    }
  }, [eqBands]);

  const handlePointerDown = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current.index = index;
    setActiveBand(index);
    updateBandFromEvent(index, e, true);

    const onMove = (ev) => {
      if (draggingRef.current.index !== null) {
        updateBandFromEvent(draggingRef.current.index, ev, false);
      }
    };

    const onUp = (ev) => {
      if (draggingRef.current.index !== null) {
        updateBandFromEvent(draggingRef.current.index, ev, true);
        draggingRef.current.index = null;
        setActiveBand(null);
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const updateBandFromEvent = (index, e, forceEmit = false) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newVal = Math.round((12 - (pct * 24)) * 2) / 2;

    const currentBands = [...draggingRef.current.bands];
    if (currentBands[index] !== newVal) {
      currentBands[index] = newVal;
      draggingRef.current.bands = currentBands;
      setLocalBands(currentBands);

      const now = Date.now();
      if (forceEmit || now - draggingRef.current.lastEmit > 50) {
        draggingRef.current.lastEmit = now;
        onChange(currentBands);
      }
    } else if (forceEmit) {
      onChange(currentBands);
    }
  };

  const eqFreqs = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

  return (
    <div className="flex flex-col flex-1 min-h-0 relative z-20">
      {/* Top labels (Values) */}
      <div className="flex justify-between w-full shrink-0 mb-1">
        {localBands.map((val, i) => (
          <div key={`val-${i}`} className="flex-1 flex justify-center">
            <span className={`text-[9px] font-bold font-mono leading-none transition-colors ${val !== 0 ? 'text-[#f97316] drop-shadow-[0_0_3px_rgba(249,115,22,0.8)]' : 'text-gray-500'}`}>
              {(val > 0 ? '+' + val : val)}
            </span>
          </div>
        ))}
      </div>

      {/* Slider Area (Middle) */}
      <div ref={containerRef} className="flex-1 w-full relative flex my-2 select-none touch-none">
        {/* SVG Background (Paths & Dots) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Fill */}
            <path
              d={`M 0,100 L 0,${100 - ((localBands[0] + 12) / 24 * 100)} L ${localBands.map((val, i) => `${(i * 10) + 5},${100 - ((val + 12) / 24 * 100)}`).join(' L ')} L 100,${100 - ((localBands[9] + 12) / 24 * 100)} L 100,100 Z`}
              fill="url(#eqGradient)"
              className={activeBand !== null ? "transition-none" : "transition-all duration-150 ease-out"}
            />

            {/* Stroke */}
            <path
              d={`M ${localBands.map((val, i) => `${(i * 10) + 5},${100 - ((val + 12) / 24 * 100)}`).join(' L ')}`}
              fill="none" stroke="#f97316" strokeWidth="1.5"
              className={`drop-shadow-[0_0_4px_rgba(249,115,22,0.6)] ${activeBand !== null ? "transition-none" : "transition-all duration-150 ease-out"}`}
            />

            {/* Dots (Handles) */}
            {localBands.map((val, i) => (
              <circle
                key={`dot-${i}`}
                cx={(i * 10) + 5}
                cy={100 - ((val + 12) / 24 * 100)}
                r={activeBand === i ? "6" : "4"}
                fill="#f97316"
                stroke="#13151f"
                strokeWidth="1.5"
                className={`drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] ${activeBand !== null ? "transition-none" : "transition-all duration-150 ease-out"}`}
              />
            ))}
          </svg>
        </div>

        {/* Custom Interactive Hitboxes */}
        {localBands.map((val, i) => (
          <div
            key={`hitbox-${i}`}
            className="flex-1 h-full relative cursor-ns-resize touch-none z-10 group"
            onPointerDown={(e) => handlePointerDown(i, e)}
          >
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 transition-colors rounded-full ${activeBand === i ? 'bg-orange-500/15 border border-orange-500/30' : 'bg-white/0 group-hover:bg-orange-500/5'}`} />
          </div>
        ))}
      </div>

      {/* Bottom labels (Freqs) */}
      <div className="flex justify-between w-full shrink-0 mt-1">
        {eqFreqs.map((freq, i) => (
          <div key={`freq-${i}`} className="flex-1 flex justify-center">
            <span className="text-[8px] text-gray-500 font-bold font-mono leading-none">{freq}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MasteringPanel({ masteringSettings, setMasteringSettings }) {
  
  const handleProfileChange = (e) => {
    const profileId = e.target.value;
    const profile = MASTERING_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setMasteringSettings({ ...profile });
    }
  };

  const setSetting = (key, val) => setMasteringSettings({ ...masteringSettings, [key]: val });

  const getProcessingChain = () => {
    const chain = [];
    chain.push('loudnorm');
    if (masteringSettings?.eqBands?.some(v => v !== 0)) chain.push('eq');
    if (masteringSettings?.removeLowRumble) chain.push('hpf');
    if (masteringSettings?.deEsser > 0) chain.push('de-esser');
    if (masteringSettings?.compressor) chain.push('compressor');
    if (masteringSettings?.glueDensity > 0) chain.push('glue');
    if (masteringSettings?.spatial8D > 0) chain.push('spatial');
    if (masteringSettings?.lofiNoise > 0) chain.push('noise');
    if (masteringSettings?.reverb > 0) chain.push('reverb');
    if (masteringSettings?.tapeFlutter > 0) chain.push('flutter');
    if (masteringSettings?.bitcrush > 0) chain.push('bitcrush');
    if (masteringSettings?.outputGain !== '0') chain.push('volume');
    if (masteringSettings?.limiter) chain.push('limiter');
    return chain.join(' -> ');
  };

  if (!masteringSettings) return null;

  return (
    <div className="bg-transparent flex flex-col h-full overflow-hidden text-[12px] text-gray-300">
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10">
        <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
          AUDIO MASTERING
        </h3>
        <div className="flex items-center gap-1.5 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[8px] text-emerald-400 uppercase font-bold tracking-wider">Live Processing</span>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-row gap-3 overflow-hidden relative z-10">
        
        {/* LEFT INTERNAL COLUMN */}
        <div className="flex-[1.1] flex flex-col gap-3 min-w-0 h-full overflow-hidden">
          
          {/* Section 1: Basic Target */}
          <div className="grid grid-cols-3 gap-3 shrink-0 bg-[#161822]/80 p-3 rounded-xl border border-orange-500/20 shadow-inner">
            <div className="col-span-1">
              <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-1">Preset Profile</label>
              <select
                value={masteringSettings.id}
                onChange={handleProfileChange}
                className="w-full bg-[#0a0b0f] border border-orange-500/20 rounded p-1.5 text-gray-200 focus:outline-none focus:border-orange-500 text-[10px] transition-colors"
              >
                {MASTERING_PROFILES.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target LUFS</label>
              <input
                type="number"
                value={masteringSettings.targetLufs}
                onChange={(e) => setSetting('targetLufs', parseFloat(e.target.value))}
                className="w-full bg-[#0a0b0f] border border-orange-500/20 rounded p-1.5 text-[10px] text-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[8px] font-bold text-gray-500 uppercase tracking-wider mb-1">Gain (dB)</label>
              <input
                type="number" step="0.1"
                value={masteringSettings.outputGain}
                onChange={(e) => setSetting('outputGain', e.target.value)}
                className="w-full bg-[#0a0b0f] border border-orange-500/20 rounded p-1.5 text-[10px] text-gray-200 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Graphic EQ & Waveform */}
          <div className="bg-[#161822]/80 p-3 rounded-xl border border-orange-500/20 shadow-inner flex flex-col flex-1 min-h-[140px] relative overflow-hidden">
            <div className="flex justify-between items-center shrink-0 mb-3 relative z-20">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-500 text-[12px]">≡</span>
                <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider m5-white-glow">Graphic EQ</span>
              </div>
              <button onClick={() => setSetting('eqBands', [0,0,0,0,0,0,0,0,0,0])} className="text-[8px] font-bold text-gray-400 hover:text-orange-500 transition-colors bg-[#1a1d27] border border-orange-500/20 hover:border-orange-500/50 px-2 py-1 rounded uppercase">Reset EQ</button>
            </div>
            <GraphicEQEditor 
              eqBands={masteringSettings.eqBands || Array(10).fill(0)} 
              onChange={(newBands) => setSetting('eqBands', newBands)} 
            />
          </div>
        </div>

        {/* RIGHT INTERNAL COLUMN */}
        <div className="flex-[1.2] flex flex-col gap-3 min-w-0 h-full">
          
          {/* Section 4: Sound Enhancers */}
          <div className="bg-[#161822]/80 p-3 rounded-xl border border-orange-500/20 shadow-inner flex-1 flex flex-col min-h-0">
            <div className="text-[10px] font-bold text-white m5-white-glow uppercase tracking-wider mb-3 flex items-center gap-1.5 shrink-0">
              <span className="text-orange-500">★</span> SOUND ENHANCERS
            </div>
            <div className="flex flex-col flex-1 py-1 pr-1 overflow-y-auto custom-scrollbar">
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Loudness (Drive)" field="loudnessDrive" max={10} step={0.1} unit=" dB" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Stereo Width" field="stereoWidth" max={200} />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Headphone Comfort" field="headphoneComfort" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="L/R Balance" field="lrBalance" min={-100} max={100} unit="" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Clarity" field="clarity" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Warmth" field="warmth" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Punch" field="punch" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="De-Esser (Hiss)" field="deEsser" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Glue (Density)" field="glueDensity" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="8D Spatial Orbit" field="spatial8D" />
              
              {/* ── New Mastering FX ── */}
              <div className="mt-2 pt-2 border-t border-orange-500/10">
                <div className="text-[8px] text-orange-500/70 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-orange-400">♫</span> TEXTURE & CHARACTER
                </div>
              </div>
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Lofi Noise (Vinyl)" field="lofiNoise" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Reverb (Room)" field="reverb" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Tape Flutter (Wobble)" field="tapeFlutter" />
              <EnhancerSlider masteringSettings={masteringSettings} setSetting={setSetting} label="Bitcrusher (Retro)" field="bitcrush" />
            </div>
          </div>

          {/* Clean Up & Legacy Toggles */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <CleanUpToggle masteringSettings={masteringSettings} setSetting={setSetting} label="Low Rumble" field="removeLowRumble" />
            <CleanUpToggle masteringSettings={masteringSettings} setSetting={setSetting} label="Elec. Hum" field="removeHum" />
            <CleanUpToggle masteringSettings={masteringSettings} setSetting={setSetting} label="Tighten Bass" field="tightenBass" />
            <CleanUpToggle masteringSettings={masteringSettings} setSetting={setSetting} label="Back Hiss" field="removeHiss" />
            
             <div className="flex justify-between items-center bg-[#161822]/80 px-2 py-1.5 rounded border border-orange-500/20 hover:border-orange-500/50 shadow-inner transition-colors cursor-pointer group" onClick={() => setSetting('compressor', !masteringSettings.compressor)}>
              <span className={`text-[9px] font-medium truncate transition-colors ${masteringSettings.compressor ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-300'}`}>Compressor</span>
              <div className={`w-3 h-3 rounded-[2px] flex items-center justify-center transition-all shrink-0 ml-1 ${masteringSettings.compressor ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-[#1a1d27] border border-[#2d3247]'}`}>
                {masteringSettings.compressor && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#161822]/80 px-2 py-1.5 rounded border border-orange-500/20 hover:border-orange-500/50 shadow-inner transition-colors cursor-pointer group" onClick={() => setSetting('limiter', !masteringSettings.limiter)}>
              <span className={`text-[9px] font-medium truncate transition-colors ${masteringSettings.limiter ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-300'}`}>Peak Limiter</span>
              <div className={`w-3 h-3 rounded-[2px] flex items-center justify-center transition-all shrink-0 ml-1 ${masteringSettings.limiter ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-[#1a1d27] border border-[#2d3247]'}`}>
                {masteringSettings.limiter && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
