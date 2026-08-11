import React, { useState } from 'react';

export default function VisualizerV4Panel({ addObject, m3Objects, setM3Objects }) {
  const v4Presets = [
    { mode: 'spectrum-bars', label: 'Classic Vert...', cat: 'Bars' },
    { mode: 'staggered-bars', label: 'Staggered ...', cat: 'Bars' },
    { mode: 'double-spectrum', label: 'Mirror Bars', cat: 'Bars' },
    { mode: 'split-spectrum', label: 'Split Dual ...', cat: 'Bars' },
    { mode: 'rounded-pills', label: 'Rounded P...', cat: 'Bars' },
    { mode: 'horizontal-bars', label: 'Horizontal ...', cat: 'Bars' },
    { mode: 'dot-matrix', label: 'Dot Matrix...', cat: 'Bars' },
    { mode: 'waterfall', label: 'Waterfall / ...', cat: 'Bars' },
    { mode: 'cyberpunk-waveform', label: 'Cyberpunk Wave', cat: 'Waves' },
    { mode: 'circular-pulse', label: 'Circular Pulse', cat: 'Radial' },
    { mode: 'radial-wave', label: 'Radial Wave', cat: 'Radial' },
    { mode: 'particle-orbit', label: 'Particle Orbit', cat: 'Particles' },
    { mode: 'neon-liquid-wave', label: 'Neon Liquid Wave', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'kinetic-pulse-ring', label: 'Kinetic Pulse Ring', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'headphone-ring', label: 'Neon Headphone', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'ecg-heartbeat', label: 'ECG Heartbeat', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'rgb-glitch-badge', label: 'RGB Glitch Badge', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: '3d-neon-tunnel', label: '3D Cyber Tunnel', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'sawtooth-polygon', label: 'Sawtooth Polygon', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'flame-ring', label: 'Fiery Flame Ring', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'crosshair-dots', label: 'Crosshair Dots', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'capsule-pills', label: 'Capsule Pills', cat: 'Modern', tag: 'KEKINIAN' },
    { mode: 'dust-fountain-bottom-bar', label: 'Side Dust Fountain', cat: 'Modern', tag: 'KEKINIAN' },
  ];

  const handleSelectStyle = (preset) => {
    const isCircle = preset.mode.includes('circle') || preset.mode.includes('pulse') || preset.mode.includes('orbit') || preset.mode.includes('radial') || preset.mode.includes('kinetic');
    const defaultW = isCircle ? 450 : (preset.mode.includes('wave') || preset.mode.includes('liquid') ? 850 : 960);
    const defaultH = isCircle ? 450 : (preset.mode.includes('wave') || preset.mode.includes('liquid') ? 220 : 180);

    if (addObject) {
      addObject({
        type: 'visualizer4',
        canvasMode: 'composer',
        name: `Visualizer (${preset.label})`,
        mode: preset.mode,
        x: 960,
        y: 540,
        width: defaultW,
        height: defaultH,
        colorMode: '2 Gradient',
        colorLeft: '#AB55F7',
        colorRight: '#F59E0B',
        colorMid: '#06B6D4',
        frequencyOrder: 'Bass -> Treble',
        barCount: 64,
        thickness: 4,
        gain: 100,
        sensitivity: 100,
        bloom: true,
        beatZoom: false,
        visible: true
      });
    }
  };

  const renderThumbnail = (mode) => {
    if (mode.includes('horizontal')) {
      return (
        <div className="flex flex-col items-start justify-center gap-[3px] w-full h-full px-3 py-1">
          <div className="h-1.5 w-[45%] bg-gradient-to-r from-orange-600 to-orange-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:w-[65%] transition-all duration-300"></div>
          <div className="h-1.5 w-[75%] bg-gradient-to-r from-orange-500 to-yellow-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:w-[95%] transition-all duration-300 delay-75"></div>
          <div className="h-1.5 w-[55%] bg-gradient-to-r from-orange-600 to-orange-400 rounded-r-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:w-[75%] transition-all duration-300 delay-150"></div>
        </div>
      );
    } else if (mode.includes('double') || mode.includes('mirror') || mode.includes('split')) {
      return (
        <div className="flex items-center justify-center gap-[3px] h-full">
          <div className="w-1.5 h-[35%] bg-orange-600 rounded-sm group-hover:h-[55%] transition-all duration-300"></div>
          <div className="w-1.5 h-[65%] bg-orange-500 rounded-sm group-hover:h-[85%] transition-all duration-300 delay-75"></div>
          <div className="w-1.5 h-[45%] bg-yellow-400 rounded-sm group-hover:h-[65%] transition-all duration-300 delay-150"></div>
          <div className="w-1 h-[85%] bg-orange-300 rounded-sm group-hover:h-[100%] transition-all duration-300 delay-75 mx-[1px]"></div>
          <div className="w-1.5 h-[45%] bg-yellow-400 rounded-sm group-hover:h-[65%] transition-all duration-300 delay-150"></div>
          <div className="w-1.5 h-[65%] bg-orange-500 rounded-sm group-hover:h-[85%] transition-all duration-300 delay-75"></div>
          <div className="w-1.5 h-[35%] bg-orange-600 rounded-sm group-hover:h-[55%] transition-all duration-300"></div>
        </div>
      );
    } else if (mode.includes('rounded') || mode.includes('pills')) {
      return (
        <div className="flex items-end justify-center gap-[4px] h-full pb-2 pt-3">
          <div className="w-2.5 h-[45%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[65%] transition-all duration-300"></div>
          <div className="w-2.5 h-[75%] bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[95%] transition-all duration-300 delay-75"></div>
          <div className="w-2.5 h-[55%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[75%] transition-all duration-300 delay-150"></div>
        </div>
      );
    } else if (mode.includes('dot') || mode.includes('matrix')) {
      return (
        <div className="flex flex-col items-center justify-center gap-[3px] h-full">
          <div className="flex gap-[3px]"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div></div>
          <div className="flex gap-[3px]"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform"></div><div className="w-1.5 h-1.5 bg-orange-400 rounded-full group-hover:scale-125 transition-transform delay-75"></div><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div></div>
          <div className="flex gap-[3px]"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:scale-125 transition-transform delay-150"></div><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform"></div><div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div></div>
        </div>
      );
    } else if (mode.includes('liquid') || mode.includes('fluid')) {
      return (
        <div className="flex items-center justify-center h-full overflow-hidden relative">
          <div className="w-[120%] h-7 border-t-[3px] border-orange-500/80 rounded-[50%] absolute top-1/2 -translate-y-1/2 shadow-[0_-2px_12px_rgba(249,115,22,0.6)] group-hover:scale-y-[1.8] group-hover:border-orange-400 transition-all duration-500 bg-gradient-to-t from-orange-500/30 to-transparent"></div>
        </div>
      );
    } else if (mode.includes('circle') || mode.includes('pulse') || mode.includes('radial') || mode.includes('kinetic')) {
      return (
        <div className="flex items-center justify-center h-full relative">
          <div className="w-9 h-9 rounded-full border-[2.5px] border-orange-500/50 border-t-yellow-400 shadow-[0_0_12px_rgba(249,115,22,0.5)] group-hover:rotate-180 transition-all duration-700 group-hover:border-orange-400"></div>
          {mode.includes('kinetic') && (
            <div className="w-12 h-12 rounded-full border border-orange-400/30 absolute group-hover:scale-125 transition-transform duration-500"></div>
          )}
        </div>
      );
    } else if (mode.includes('wave') || mode.includes('cyberpunk')) {
      return (
        <div className="flex items-center justify-center h-full overflow-hidden relative px-2">
          <div className="w-full h-4 border-t-[2px] border-cyan-400/80 rounded-[40%] absolute shadow-[0_0_10px_rgba(6,182,212,0.6)] group-hover:scale-y-[1.5] transition-all duration-300"></div>
          <div className="w-full h-4 border-b-[1.5px] border-orange-400/60 rounded-[40%] absolute shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
        </div>
      );
    } else if (mode.includes('particle') || mode.includes('orbit')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)] group-hover:-translate-y-2 group-hover:translate-x-1 transition-transform duration-500"></div>
          <div className="absolute ml-6 mb-4 w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)] group-hover:-translate-y-3 group-hover:-translate-x-2 transition-transform duration-500 delay-75"></div>
          <div className="absolute mr-5 mt-3 w-1.5 h-1.5 rounded-full bg-orange-300 shadow-[0_0_6px_rgba(249,115,22,0.9)] group-hover:translate-y-2 group-hover:translate-x-3 transition-transform duration-500 delay-150"></div>
        </div>
      );
    } else {
      return (
        <div className="flex items-end justify-center gap-[3px] h-full pb-2.5 pt-4">
          <div className="w-1.5 h-[45%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[65%] transition-all duration-300"></div>
          <div className="w-1.5 h-[75%] bg-gradient-to-t from-orange-500 to-yellow-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[95%] transition-all duration-300 delay-75"></div>
          <div className="w-1.5 h-[55%] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] group-hover:h-[75%] transition-all duration-300 delay-150"></div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-6 select-none">
      {/* 3-Column Visualizer Preset Grid (Matches Visualizer 1 Screenshot UI) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-3 gap-2">
          {v4Presets.map((preset) => (
            <button
              key={preset.mode}
              onClick={() => handleSelectStyle(preset)}
              className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl border border-[#2a2c33] bg-gradient-to-br from-[#2a2c33]/80 to-[#111216] hover:bg-[#1a1c25] hover:border-orange-500/60 shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-all duration-300 group text-center cursor-pointer transform hover:-translate-y-0.5"
            >
              {preset.tag && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-widest shadow-[0_0_8px_rgba(249,115,22,0.6)] z-20">
                  {preset.tag}
                </span>
              )}
              <div className="w-full h-14 bg-black/50 rounded-lg border border-black/60 group-hover:border-orange-500/50 overflow-hidden relative shadow-inner flex items-center justify-center">
                {renderThumbnail(preset.mode)}
              </div>
              <span className="text-[9.5px] font-bold text-gray-300 group-hover:text-white truncate w-full tracking-wide transition-colors">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
