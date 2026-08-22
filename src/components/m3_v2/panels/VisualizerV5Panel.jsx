import React, { useState } from 'react';

export default function VisualizerV5Panel({ addObject, m3Objects, setM3Objects }) {
  const [activeMode, setActiveMode] = useState('normal'); // 'normal' | 'fast'

  const v5Presets = [
    { mode: 'spectrum-bars', label: 'Classic Spectrum', cat: 'Bars', tag: 'V5 ENGINE' },
    { mode: 'circular-pulse', label: 'Circular Pulse', cat: 'Radial', tag: 'V5 ENGINE' },
    { mode: 'cyberpunk-waveform', label: 'Cyber Waveform', cat: 'Waves', tag: 'V5 ENGINE' },
    { mode: 'particle-orbit', label: 'Particle Orbit', cat: 'Particles', tag: 'V5 ENGINE' },
    { mode: 'avee-spectrum', label: 'Avee Spectrum', cat: 'Avee', tag: 'V5 ENGINE' }
  ];

  const handleSelectStyle = (preset) => {
    const isCircle = preset.mode.includes('circle') || preset.mode.includes('pulse') || preset.mode.includes('orbit');
    const defaultW = isCircle ? 450 : (preset.mode.includes('wave') ? 850 : 960);
    const defaultH = isCircle ? 450 : (preset.mode.includes('wave') ? 220 : 180);

    if (addObject) {
      addObject({
        type: 'visualizer5',
        canvasMode: 'composer',
        name: `Visualizer V5 (${preset.label})`,
        mode: preset.mode,
        renderMode: activeMode, // 'normal' | 'fast'
        x: 960,
        y: 540,
        width: defaultW,
        height: defaultH,
        primaryColor: '#00F2FE',
        secondaryColor: '#4FACFE',
        accentColor: '#AB55F7',
        barCount: 64,
        thickness: 4,
        spacing: 4,
        cornerRadius: 4,
        opacity: 100,
        visible: true
      });
    }
  };

  const renderThumbnail = (mode) => {
    if (mode.includes('circle') || mode.includes('pulse')) {
      return (
        <div className="flex items-center justify-center h-full relative">
          <div className="w-9 h-9 rounded-full border-[2.5px] border-cyan-500/60 border-t-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)] group-hover:rotate-180 transition-all duration-700"></div>
        </div>
      );
    } else if (mode.includes('wave') || mode.includes('cyberpunk')) {
      return (
        <div className="flex items-center justify-center h-full relative px-2">
          <div className="w-full h-4 border-t-[2px] border-cyan-400/90 rounded-[40%] absolute shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
          <div className="w-full h-4 border-b-[1.5px] border-purple-400/70 rounded-[40%] absolute"></div>
        </div>
      );
    } else if (mode.includes('particle') || mode.includes('orbit')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></div>
          <div className="absolute ml-5 mb-3 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]"></div>
        </div>
      );
    } else if (mode.includes('avee')) {
      return (
        <div className="flex items-end justify-center gap-[2px] h-full pb-2 pt-3">
          <div className="w-1.5 h-[50%] bg-gradient-to-t from-cyan-600 to-cyan-300"></div>
          <div className="w-1.5 h-[80%] bg-gradient-to-t from-cyan-500 to-purple-400"></div>
          <div className="w-1.5 h-[60%] bg-gradient-to-t from-purple-600 to-cyan-400"></div>
        </div>
      );
    } else {
      return (
        <div className="flex items-end justify-center gap-[3px] h-full pb-2.5 pt-4">
          <div className="w-1.5 h-[45%] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm"></div>
          <div className="w-1.5 h-[75%] bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-sm"></div>
          <div className="w-1.5 h-[55%] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm"></div>
        </div>
      );
    }
  };

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    if (setM3Objects) {
      setM3Objects(prev => prev.map(obj => {
        if (obj && (obj.type === 'visualizer5' || obj.type === 'visualizer' || obj.type === 'visualizer4')) {
          return { ...obj, renderMode: mode };
        }
        return obj;
      }));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-6 select-none">
      {/* Mode Selector Switch: Normal vs Fast */}
      <div className="flex items-center bg-[#111216] p-1 rounded-xl border border-[#2a2c33]">
        <button
          onClick={() => handleModeChange('normal')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
            activeMode === 'normal'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Normal (Beat Engine)
        </button>
        <button
          onClick={() => handleModeChange('fast')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
            activeMode === 'fast'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Fast (Abstract Math)
        </button>
      </div>

      {/* Preset Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-2 gap-2">
          {v5Presets.map((preset) => (
            <button
              key={preset.mode}
              onClick={() => handleSelectStyle(preset)}
              className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-[#2a2c33] bg-gradient-to-br from-[#2a2c33]/80 to-[#111216] hover:bg-[#1a1c25] hover:border-cyan-500/60 shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-all duration-300 group text-center cursor-pointer transform hover:-translate-y-0.5"
            >
              {preset.tag && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-widest z-20">
                  {preset.tag}
                </span>
              )}
              <div className="w-full h-16 bg-black/50 rounded-lg border border-black/60 group-hover:border-cyan-500/50 overflow-hidden relative shadow-inner flex items-center justify-center">
                {renderThumbnail(preset.mode)}
              </div>
              <span className="text-[10px] font-bold text-gray-300 group-hover:text-white truncate w-full tracking-wide transition-colors">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
