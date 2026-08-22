import React, { useState, useEffect, useRef } from 'react';
import { renderFrameStore } from '../../services/pipeline/runtime/RenderFrameStore';
import Surface from '../ui/Surface';
import DisplayModeSelector from './widgets/DisplayModeSelector';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { emitRuntimeEvent } from '../../services/RuntimeClient';
import { fontLibrary } from '../../services/FontLibrary';
import PlaylistParser from '../../services/playlist/PlaylistParser';
import { TypographyThemes, getThemeById } from '../../services/typography/TypographyThemes';
import { ALL_EFFECTS } from './panels/EffectsPanel';
import { capabilityRegistry } from '../../services/pipeline/fastrender/registry/CapabilityRegistry.js';
import { fastRenderState } from '../../services/pipeline/fastrender/core/FastRenderState.js';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';


const LiveAudioMeter = ({ source }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(64);

    const render = () => {
      animId = requestAnimationFrame(render);
      
      // Use formal renderFrameStore
      const frame = renderFrameStore.getFrame();
      const state = frame?.debug?.beat || {};
      
      let level = 0;
      if (source === 'Bass') level = state.bass;
      else if (source === 'Mid') level = state.mid;
      else if (source === 'Treble') level = state.treble;
      else level = state.peak;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e2230';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(0, 0, canvas.width * level, canvas.height);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [source]);

  return (
    <div className="flex items-center gap-2 mt-1 mb-2">
      <span className="text-[10px] text-gray-400 uppercase w-10">{source}</span>
      <canvas ref={canvasRef} width="200" height="8" className="w-full h-2 rounded bg-[#1e2230] overflow-hidden" />
    </div>
  );
};

// --- Helpers ---
function SettingGroup({ title, children, headerClass="", headerAction=null }) {
  return (
    <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 mb-4 flex flex-col shrink-0 overflow-hidden group z-10">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className={`text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow ${headerClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            {title}
          </h3>
          {headerAction && <div className="flex items-center">{headerAction}</div>}
      </div>
      
      <div className="space-y-4 relative z-10">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }) {
  const isOn = !!checked;
  const handleClick = () => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { checked: !isOn } });
    }
  };
  return (
    <div 
      className={`flex items-center justify-between cursor-pointer text-[11px] transition-colors duration-300 group select-none ${disabled ? 'opacity-40 pointer-events-none' : 'text-gray-300 hover:text-white'}`}
      onClick={handleClick}
      role="switch"
      aria-checked={isOn}
    >
      <span className="font-bold tracking-wide">{label}</span>
      <div 
        className={`relative w-8 h-4 rounded-full border shadow-inner transition-all duration-300 ${isOn ? 'bg-orange-500 border-orange-500' : 'bg-[#161822] border-orange-500/20'}`}
      >
        <div className={`absolute top-[2px] left-[2px] w-3 h-3 rounded-full transition-all duration-300 ${isOn ? 'translate-x-full bg-white' : 'translate-x-0 bg-gray-400'}`} />
      </div>
    </div>
  );
}

function FastModeBadge({ label }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider my-1 shadow-[0_0_8px_rgba(0,243,255,0.15)]">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f3ff]"></span>
      <span>{label || '⚡ Fast Mode Adapted'}</span>
    </div>
  );
}

function ClassificationMetadataCard({ validationSummary }) {
  if (!validationSummary) return null;
  const { isFastWorkspace, classification, hasErrors, hasWarnings, errors, warnings, boundaryStatus, badge, reason } = validationSummary;
  if (!isFastWorkspace || !classification) return null;

  const getBadgeStyle = () => {
    if (hasErrors || classification.classification === 'Unsupported') return 'from-red-950/80 to-orange-950/80 border-red-500/40 text-red-300';
    if (hasWarnings) return 'from-amber-950/80 to-yellow-950/80 border-amber-500/40 text-amber-300';
    if (classification.classification === 'LoopNative') return 'from-emerald-950/80 to-teal-950/80 border-emerald-500/40 text-emerald-300';
    return 'from-cyan-950/80 to-blue-950/80 border-cyan-500/40 text-cyan-300';
  };

  return (
    <div className={`p-2.5 mb-3 rounded-xl border bg-gradient-to-r ${getBadgeStyle()} shadow-md text-[10px] space-y-1 select-none`}>
      <div className="flex items-center justify-between font-extrabold uppercase tracking-wider text-[10px]">
        <span>{badge || `⚡ Classification: ${classification.classification}`}</span>
        <span className="text-[9px] opacity-80">{classification.label}</span>
      </div>
      {classification.adaptationStrategy && (
        <div className="flex justify-between text-gray-300">
          <span className="opacity-70">Strategy:</span>
          <span className="font-mono font-bold text-amber-300">{classification.adaptationStrategy}</span>
        </div>
      )}
      {classification.loopContinuity && (
        <div className="flex justify-between text-gray-300">
          <span className="opacity-70">Loop Quality:</span>
          <span className="font-mono font-bold text-cyan-300">{classification.loopContinuity}</span>
        </div>
      )}
      {boundaryStatus && (
        <div className="flex justify-between text-gray-300 border-t border-cyan-500/20 pt-1">
          <span className="opacity-70">Boundary Status:</span>
          <span className={`font-mono font-bold ${boundaryStatus.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {boundaryStatus.passed ? '✓ PASSED' : `⚠️ DEV ${boundaryStatus.deviation}`}
          </span>
        </div>
      )}
      {reason && (
        <div className="text-red-300 font-medium pt-0.5 border-t border-red-500/20">
          Reason: {reason}
        </div>
      )}
      {warnings && warnings.length > 0 && (
        <div className="text-amber-300 text-[9px] pt-1">
          ⚠️ {warnings[0].message}
        </div>
      )}
    </div>
  );
}

function UnsupportedGuidanceCard({ title, message, onSwitchToNormal }) {
  return (
    <div className="my-3 p-3 bg-gradient-to-r from-red-950/90 via-[#2d1215] to-orange-950/80 border border-orange-500/40 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
      <div className="flex items-center gap-2 text-orange-400 font-black text-[11px] tracking-wider uppercase">
        <span className="text-amber-400 text-xs">⚠️</span>
        <span>{title || 'Normal Render Mode Required'}</span>
      </div>
      <p className="text-[10px] text-gray-300 leading-relaxed font-medium">
        {message || 'Feature ini memerlukan real-time frame rendering dan tidak kompatibel dengan Fast Render cache.'}
      </p>
      {onSwitchToNormal && (
        <button
          onClick={onSwitchToNormal}
          className="mt-1 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-extrabold text-[10px] py-1.5 px-3 rounded-lg shadow-[0_0_12px_rgba(249,115,22,0.4)] hover:shadow-[0_0_18px_rgba(249,115,22,0.6)] transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          <span>🎬</span> Pindah ke Normal Render Mode
        </button>
      )}
    </div>
  );
}


function SliderRow({ label, min = 0, max = 100, step, value = 50, onChange, disabled, checkbox }) {
  const [localValue, setLocalValue] = React.useState(value);
  const lastUpdateRef = React.useRef(0);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
      setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
      const val = e.target.value;
      setLocalValue(val);
      
      const now = performance.now();
      if (now - lastUpdateRef.current > 60) {
          lastUpdateRef.current = now;
          onChange({ target: { value: val } });
      } else {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
              lastUpdateRef.current = performance.now();
              onChange({ target: { value: val } });
          }, 60);
      }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${disabled && !checkbox ? 'opacity-40 pointer-events-none' : ''} group`}>
      <div className="flex justify-between items-center text-[11px] text-gray-300 font-bold tracking-wide transition-colors duration-300">
        <div className="flex items-center gap-2">
            {checkbox && (
                <div 
                    className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center cursor-pointer border transition-all duration-200 ${checkbox.checked ? 'bg-orange-500 border-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'bg-[#161822] border-gray-600 hover:border-gray-400'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        checkbox.onChange({ target: { checked: !checkbox.checked } });
                    }}
                >
                    {checkbox.checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            )}
            <span className="group-hover:text-white">{label}</span>
        </div>
        <span className="font-mono text-orange-400 bg-[#161822] px-2 py-0.5 rounded-lg border border-orange-500/20 shadow-inner text-[10px] transition-all focus-within:border-orange-500">{Number(localValue).toFixed(step && step < 1 ? 1 : 0)}</span>
      </div>
      <div className={`relative w-full flex items-center pt-1 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <input type="range" min={min} max={max} step={step} value={localValue} onChange={handleChange} disabled={disabled} className="w-full h-1 bg-[#161822] rounded-full appearance-none cursor-pointer border border-orange-500/20 shadow-inner focus:outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(249,115,22,0.6)] [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform" />
      </div>
    </div>
  );
}

function SelectRow({ label, options, value, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''} group`}>
      <span className="text-[11px] text-gray-300 font-bold tracking-wide group-hover:text-white transition-colors duration-300">{label}</span>
      <select className="bg-[#161822] border border-orange-500/20 rounded-lg px-2 h-[28px] text-[11px] text-white focus:outline-none focus:border-orange-500 appearance-none w-[115px] font-medium cursor-pointer hover:bg-[#1b1d28] transition-colors" value={value} onChange={onChange} disabled={disabled} style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23fb923c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5rem top 50%', backgroundSize: '.5rem auto' }}>
        {options.map((opt, idx) => {
          if (typeof opt === 'object' && opt !== null) {
            return <option key={idx} value={opt.value} className="bg-[#161822] text-white">{opt.label}</option>;
          }
          return <option key={idx} value={opt} className="bg-[#161822] text-white">{opt}</option>;
        })}
      </select>
    </div>
  );
}

function ColorRow({ label, value = '#ffffff', onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''} group`}>
      <span className="text-[11px] text-gray-300 font-bold tracking-wide group-hover:text-white transition-colors duration-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-orange-500/20 hover:border-orange-500 transition-colors cursor-pointer shadow-inner">
          <input type="color" value={value || '#ffffff'} onChange={onChange} disabled={disabled} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
        </div>
        <span className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-wider bg-[#161822] border border-orange-500/20 px-2 py-0.5 rounded-lg">{value}</span>
      </div>
    </div>
  );
}

function ButtonGroup({ label, options, active = options[0], onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-[11px] text-gray-300 font-bold tracking-wide">{label}</span>}
      <div className="flex flex-wrap gap-1 p-1 bg-[#161822] border border-orange-500/20 rounded-lg shadow-inner">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange && onChange(opt)} className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded transition-all duration-300 ${opt === active ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Pemicu options ---
const PEMICU_OPTIONS = [
    { value: 'metronom', label: 'Ikuti Ketukan (Metronom)' },
    { value: 'kick', label: 'Ikuti Low (kick)' },
    { value: 'mid', label: 'Ikuti Mid' },
    { value: 'treble', label: 'Ikuti High' },
    { value: 'energy', label: 'Ikuti Energy' },
    { value: 'none', label: 'Selalu tampil' },
];

// --- Mode options ---
const MODE_OPTIONS = ['Ringan — cepat (disarankan)', 'Kasar — lambat', 'Halus — bergelombang'];
const COLOR_MODE_OPTIONS = ['Warna kustom', 'Pelangi', 'Dinamis', 'Ikuti cover'];

// ============================================================
// Inline UI Components (BSPLabs Style)
// ============================================================

function FxSlider({ label, min = 0, max = 100, step, value, onChange, suffix = '%' }) {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef(null);
    const isDragging = React.useRef(false);

    React.useEffect(() => {
        if (!isDragging.current) {
            setLocalValue(value);
        }
    }, [value]);

    const displayVal = suffix === '×' ? Number(localValue).toFixed(2) : Math.round(localValue);

    const handleChange = (e) => {
        const val = suffix === '×' ? parseFloat(e.target.value) : parseInt(e.target.value);
        setLocalValue(val);
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (isDragging.current) return; // Wait for pointerup if still dragging
            onChange(val);
        }, 250);
    };

    const handlePointerDown = (e) => {
        isDragging.current = true;
        e.stopPropagation();
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        clearTimeout(timeoutRef.current);
        onChange(localValue);
    };

    return (
        <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-400 font-medium">{label}</span>
                <span className="text-[11px] text-orange-400 font-bold tabular-nums">{displayVal}{suffix}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step || (suffix === '×' ? 0.05 : 1)} value={localValue}
                onChange={handleChange}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={() => { if(isDragging.current) handlePointerUp(); }}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-2 bg-[#1e2035] rounded-full appearance-none cursor-pointer accent-orange-500
                    border border-[#2d3060] focus:outline-none focus:border-orange-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(249,115,22,0.8)]
                    [&::-webkit-slider-thumb]:hover:bg-orange-400 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-all"
            />
        </div>
    );
}

function FxSelect({ label, options, value, onChange }) {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef(null);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onChange(val);
        }, 50); // Fast commit
    };

    return (
        <div className="flex flex-col gap-1.5 mb-3">
            <span className="text-[11px] text-gray-400 font-medium">{label}</span>
            <select
                className="w-full bg-[#1a1c2e] border border-[#2d3060] rounded-md px-2.5 h-[32px] text-[11px] text-white
                    focus:outline-none focus:border-orange-500 appearance-none font-medium cursor-pointer
                    hover:border-orange-400/50 transition-colors"
                value={localValue} onChange={handleChange}
                onKeyDown={e => e.stopPropagation()}
                style={{
                    backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201L5%205L9%201%22%20stroke%3D%22%23f97316%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\")",
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5rem top 50%', backgroundSize: '.5rem auto'
                }}
            >
                {options.map((opt, idx) => {
                    if (typeof opt === 'object') return <option key={idx} value={opt.value} className="bg-[#1a1c2e]">{opt.label}</option>;
                    return <option key={idx} value={opt} className="bg-[#1a1c2e]">{opt}</option>;
                })}
            </select>
        </div>
    );
}

function FxColor({ label, value, onChange }) {
    const [localValue, setLocalValue] = React.useState(value || '#ffffff');
    const timeoutRef = React.useRef(null);

    React.useEffect(() => {
        setLocalValue(value || '#ffffff');
    }, [value]);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onChange(val);
        }, 150);
    };

    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[11px] text-gray-400 font-medium">{label}</span>
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-[#2d3060] hover:border-orange-500 transition-colors cursor-pointer">
                <input type="color" value={localValue} onChange={handleChange}
                    onKeyDown={e => e.stopPropagation()}
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-none" />
            </div>
        </div>
    );
}

// ============================================================
// Per-Effect Inline Inspector Renderers
// ============================================================

function InspectorGuncangKamera({ props, update }) {
    return (<>
        <FxSlider label="Kekuatan guncang" value={props.strength ?? 23} onChange={v => update('strength', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode" options={MODE_OPTIONS} value={props.mode ?? MODE_OPTIONS[0]} onChange={v => update('mode', v)} />
        <FxSelect label="Bentuk" options={['Semua arah', 'Horizontal', 'Vertikal']} value={props.shape ?? 'Semua arah'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 27} onChange={v => update('size', v)} />
    </>);
}

function InspectorZoomHentak({ props, update }) {
    return (<>
        <FxSlider label="Kedalaman zoom" value={props.depth ?? 50} onChange={v => update('depth', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode" options={MODE_OPTIONS} value={props.mode ?? MODE_OPTIONS[0]} onChange={v => update('mode', v)} />
        <FxSelect label="Bentuk" options={['Masuk', 'Keluar', 'Bolak-balik']} value={props.shape ?? 'Masuk'} onChange={v => update('shape', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorKilatStrobe({ props, update }) {
    return (<>
        <FxSlider label="Terang kilat" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />}
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorLampuDisko({ props, update }) {
    return (<>
        <FxSlider label="Kecerahan lampu" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Bulatan', 'Bulatan balik', 'Kerucut sorot', 'Beam vertikal', 'Batang']} value={props.shape ?? 'Kerucut sorot'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Jumlah" min={1} max={20} value={props.count ?? 4} onChange={v => update('count', v)} suffix="" />
    </>);
}

function InspectorNeonKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Kecerahan neon" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#00ffff'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Garis lurus', 'Gelombang', 'Zigzag']} value={props.shape ?? 'Garis lurus'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorLampuKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Sorot 2 lampu" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSlider label="Titik pisah (0% semua latar — 100% semua subjel)" value={props.split ?? 50} onChange={v => update('split', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && (
            <div style={{ display: 'flex', gap: '8px' }}>
                <FxColor label="utama" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />
                <FxColor label="kedua" value={props.color2 ?? '#00ffff'} onChange={v => update('color2', v)} />
            </div>
        )}
        <FxSelect label="Bentuk" options={['Panggung', 'Ikuti beat', 'Silih berganti']} value={props.shape ?? 'Ikuti beat'} onChange={v => update('shape', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorSinarKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Berkas cahaya" value={props.strength ?? 50} onChange={v => update('strength', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSlider label="Kedalaman (0% jauh — 100% depan)" value={props.depthLevel ?? 80} onChange={v => update('depthLevel', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ffaa55'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Atas', 'Kanan-atas', 'Kanan', 'Kanan-bawah', 'Bawah', 'Kiri-bawah', 'Kiri', 'Kiri-atas']} value={props.direction ?? 'Atas'} onChange={v => update('direction', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Jumlah" value={props.count ?? 50} onChange={v => update('count', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorBokehKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Cahaya melayang" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'energy'} onChange={v => update('source', v)} />
        <FxSlider label="Kedalaman (0% jauh — 100% depan)" value={props.depthLevel ?? 80} onChange={v => update('depthLevel', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Melayang', 'Naik pelan', 'Berdenyut']} value={props.shape ?? 'Melayang'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Jumlah" min={1} max={100} value={props.count ?? 30} onChange={v => update('count', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorPindaiKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Kecerahan pindai" value={props.brightness ?? 50} onChange={v => update('brightness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#00ff88'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Maju', 'Mundur', 'Pantul', 'Ikuti beat']} value={props.shape ?? 'Maju'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Jumlah" value={props.count ?? 50} onChange={v => update('count', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorKabutKedalaman({ props, update }) {
    return (<>
        <FxSlider label="Kepadatan kabut" value={props.density ?? 50} onChange={v => update('density', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'energy'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Tenang', 'Berarak', 'Berdenyut']} value={props.shape ?? 'Tenang'} onChange={v => update('shape', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
        <FxSlider label="Kedalaman" value={props.depthLevel ?? 80} onChange={v => update('depthLevel', v)} />
    </>);
}

function InspectorGlitch({ props, update }) {
    return (<>
        <FxSlider label="Intensitas glitch" value={props.intensity ?? 50} onChange={v => update('intensity', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['RGB Split', 'Block', 'Digital']} value={props.shape ?? 'RGB Split'} onChange={v => update('shape', v)} />
        <FxSlider label="Frekuensi" value={props.frequency ?? 50} onChange={v => update('frequency', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorDebuFilmTua({ props, update }) {
    return (<>
        <FxSlider label="Kepadatan debu" value={props.density ?? 50} onChange={v => update('density', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'energy'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['Ringan', 'Sedang', 'Berat']} value={props.shape ?? 'Ringan'} onChange={v => update('shape', v)} />
        <FxColor label="Warna" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorGarisKecepatan({ props, update }) {
    return (<>
        <FxSlider label="Intensitas garis" value={props.intensity ?? 50} onChange={v => update('intensity', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['Radial', 'Horizontal', 'Vertikal']} value={props.shape ?? 'Radial'} onChange={v => update('shape', v)} />
        <FxColor label="Warna" value={props.color ?? '#ffffff'} onChange={v => update('color', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Jumlah" min={10} max={200} value={props.count ?? 60} onChange={v => update('count', v)} suffix="" />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

function InspectorGrainFilm({ props, update }) {
    return (<>
        <FxSlider label="Intensitas grain" value={props.intensity ?? 50} onChange={v => update('intensity', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'none'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['Halus', 'Kasar', 'Film 8mm']} value={props.shape ?? 'Halus'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
    </>);
}

function InspectorVignette({ props, update }) {
    return (<>
        <FxSlider label="Gelap tepi" value={props.darkness ?? 50} onChange={v => update('darkness', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'none'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['Bulat', 'Kotak']} value={props.shape ?? 'Bulat'} onChange={v => update('shape', v)} />
        <FxColor label="Warna" value={props.color ?? '#000000'} onChange={v => update('color', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
    </>);
}

function InspectorLetterbox({ props, update }) {
    return (<>
        <FxSlider label="Tinggi bar" value={props.height ?? 50} onChange={v => update('height', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'none'} onChange={v => update('source', v)} />
        <FxColor label="Warna" value={props.color ?? '#000000'} onChange={v => update('color', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
    </>);
}

function InspectorScanline({ props, update }) {
    return (<>
        <FxSlider label="Kepekatan garis" value={props.density ?? 50} onChange={v => update('density', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Bentuk" options={['Turun', 'Naik', 'Statis']} value={props.shape ?? 'Turun'} onChange={v => update('shape', v)} />
        <FxColor label="Warna" value={props.color ?? '#000000'} onChange={v => update('color', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
    </>);
}

function InspectorLightLeak({ props, update }) {
    return (<>
        <FxSlider label="Kekuatan cahaya" value={props.strength ?? 50} onChange={v => update('strength', v)} />
        <FxSelect label="Pemicu" options={PEMICU_OPTIONS} value={props.source ?? 'kick'} onChange={v => update('source', v)} />
        <FxSelect label="Mode warna" options={COLOR_MODE_OPTIONS} value={props.colorMode ?? 'Warna kustom'} onChange={v => update('colorMode', v)} />
        {props.colorMode === 'Warna kustom' && <FxColor label="utama" value={props.color ?? '#ff8800'} onChange={v => update('color', v)} />}
        <FxSelect label="Bentuk" options={['Kanan-atas', 'Kiri-atas', 'Kiri-bawah', 'Kanan-bawah', 'Tengah']} value={props.shape ?? 'Kanan-atas'} onChange={v => update('shape', v)} />
        <FxSlider label="Ukuran" value={props.size ?? 50} onChange={v => update('size', v)} />
        <FxSlider label="Kecepatan" min={0.1} max={3.0} step={0.05} value={props.speed ?? 1.0} onChange={v => update('speed', v)} suffix="×" />
    </>);
}

// Map presetId → Inspector component
const INSPECTOR_MAP = {
    'camera-shake': InspectorGuncangKamera,
    'zoom-hentak': InspectorZoomHentak,
    'strobe-flash': InspectorKilatStrobe,
    'disco-light': InspectorLampuDisko,
    'neon-depth': InspectorNeonKedalaman,
    'deep-light': InspectorLampuKedalaman,
    'god-rays': InspectorSinarKedalaman,
    'depth-bokeh': InspectorBokehKedalaman,
    'depth-scan': InspectorPindaiKedalaman,
    'depth-fog': InspectorKabutKedalaman,
    'glitch-digital': InspectorGlitch,
    'old-film-dust': InspectorDebuFilmTua,
    'speed-lines': InspectorGarisKecepatan,
    'film-grain': InspectorGrainFilm,
    'vignette': InspectorVignette,
    'letterbox': InspectorLetterbox,
    'scanline': InspectorScanline,
    'light-leak': InspectorLightLeak,
};
export default function M3ObjectInspector({ m3Objects = [], setM3Objects, m3BgPool = [], setM3BgPool, m3SelectedObjectId, activeCategory, renderSettings = {}, setRenderSettings, renderMode = 'FAST', setRenderMode, isThumbnailMode = false, editorMode = 'Composer' }) {
  const [demoState, setDemoState] = React.useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const isSelectedObjInBg = m3SelectedObjectId && m3BgPool.some(bg => bg.id === m3SelectedObjectId);
  const isSelectedObjInFg = m3SelectedObjectId && m3Objects.some(o => o.id === m3SelectedObjectId);

  const isBgContext = isSelectedObjInBg || (!isSelectedObjInFg && (activeCategory === 'Background' || activeCategory === 'Backgrounds'));
  
  const targetBgId = isBgContext 
      ? (isSelectedObjInBg ? m3SelectedObjectId : (m3BgPool.length > 0 ? m3BgPool[0].id : null)) 
      : null;
      
  const effectiveId = isBgContext ? targetBgId : m3SelectedObjectId;

  const updateProp = (key, value) => {
    if (effectiveId) {
      if (isBgContext && setM3BgPool) {
        setM3BgPool(prev => prev.map(o => o.id === effectiveId ? { ...o, [key]: value, settings: { ...(o.settings || {}), [key]: value } } : o));
      } else if (setM3Objects) {
        setM3Objects(prev => prev.map(o => o.id === effectiveId ? { ...o, [key]: value } : o));
      }
    } else {
      setDemoState(prev => ({...prev, [key]: value}));
    }
  };

  const updateProps = (propsObj) => {
    if (effectiveId) {
      if (isBgContext && setM3BgPool) {
        setM3BgPool(prev => prev.map(o => o.id === effectiveId ? { ...o, ...propsObj, settings: { ...(o.settings || {}), ...propsObj } } : o));
      } else if (setM3Objects) {
        setM3Objects(prev => prev.map(o => o.id === effectiveId ? { ...o, ...propsObj } : o));
      }
    } else {
      setDemoState(prev => ({...prev, ...propsObj}));
    }
  };

  const getProp = (key, def) => {
    if (effectiveId) {
      if (isBgContext) {
         const obj = m3BgPool.find(o => o.id === effectiveId);
         return obj && obj[key] !== undefined ? obj[key] : (obj?.settings?.[key] !== undefined ? obj.settings[key] : def);
      }
      const obj = m3Objects.find(o => o.id === effectiveId);
      return obj && obj[key] !== undefined ? obj[key] : def;
    }
    return demoState[key] !== undefined ? demoState[key] : def;
  };

  const handlePresetChange = (val) => {
    let cfg = { danceStyle: val };
    if (val === 'Calm Pulse') {
        cfg = { ...cfg, motionValZoom: 2, motionEnZoom: true, motionValSwayX: 2, motionEnSwayX: true, motionValSwayY: 1, motionEnSwayY: true, motionValRotate: 0.5, motionEnRotate: true, motionValShake: 0, motionEnShake: false };
    } else if (val === 'Deep Kick') {
        cfg = { ...cfg, motionValZoom: 10, motionEnZoom: true, motionValSwayX: 0, motionEnSwayX: false, motionValSwayY: 0, motionEnSwayY: false, motionValRotate: 0, motionEnRotate: false, motionValShake: 0, motionEnShake: false };
    } else if (val === 'Rhythmic Float') {
        cfg = { ...cfg, motionValZoom: 1, motionEnZoom: true, motionValSwayX: 4, motionEnSwayX: true, motionValSwayY: 3, motionEnSwayY: true, motionValRotate: 2, motionEnRotate: true, motionValShake: 0, motionEnShake: false };
    } else if (val === 'Adrenaline') {
        cfg = { ...cfg, motionValZoom: 8, motionEnZoom: true, motionValSwayX: 3, motionEnSwayX: true, motionValSwayY: 3, motionEnSwayY: true, motionValRotate: 3, motionEnRotate: true, motionValShake: 6, motionEnShake: true };
    }
    updateProps(cfg);
  };

  const renderAudioReactivityParams = () => {
    return (
      <div className="mt-4 space-y-4 pt-2">
        <div className="space-y-3">
            <SelectRow 
                label="Animation Preset" 
                options={['Calm Pulse', 'Deep Kick', 'Rhythmic Float', 'Adrenaline', 'Custom (Advanced)']} 
                value={(() => {
                    const d = getProp('danceStyle', 'Calm Pulse');
                    if (d === 'Subtle Sway') return 'Calm Pulse';
                    if (d === 'Pulse') return 'Deep Kick';
                    if (d === 'Heartbeat') return 'Rhythmic Float';
                    if (d === 'Shake') return 'Adrenaline';
                    return d;
                })()} 
                onChange={e => handlePresetChange(e.target.value)} 
            />
            
            <SliderRow label="Overall Intensity" min={0} max={200} value={getProp('danceIntensity', 100)} onChange={e => updateProps({danceStyle: 'Custom (Advanced)', danceIntensity: Number(e.target.value)})} />
            <SliderRow label="React Level (bass)" min={0} max={100} value={getProp('danceReactLevel', 45)} onChange={e => updateProps({danceStyle: 'Custom (Advanced)', danceReactLevel: Number(e.target.value)})} />
            <SelectRow label="Reacts to" options={['Bass (Low)', 'Mid', 'Treble (High)', 'Whole song']} value={getProp('danceReactsTo', 'Bass (Low)')} onChange={e => updateProps({danceStyle: 'Custom (Advanced)', danceReactsTo: e.target.value})} />
            <SliderRow label="Smoothing" min={0} max={1} step={0.01} value={getProp('danceSmoothing', 0.40)} onChange={e => updateProps({danceStyle: 'Custom (Advanced)', danceSmoothing: Number(e.target.value)})} />
        </div>

        <div className="space-y-3 pt-3 border-t border-[#2d3247]/50">
            <SliderRow 
                label="Zoom" 
                min={0} max={20} step={0.5} 
                value={getProp('motionValZoom', 12)} 
                onChange={e => updateProps({danceStyle: 'Custom (Advanced)', motionValZoom: Number(e.target.value)})} 
                disabled={!getProp('motionEnZoom', true)}
                checkbox={{
                    checked: getProp('motionEnZoom', true),
                    onChange: e => updateProps({danceStyle: 'Custom (Advanced)', motionEnZoom: e.target.checked})
                }}
            />

            <SliderRow 
                label="Sway L/R" 
                min={0} max={20} step={0.5} 
                value={getProp('motionValSwayX', 2.0)} 
                onChange={e => updateProps({danceStyle: 'Custom (Advanced)', motionValSwayX: Number(e.target.value)})} 
                disabled={!getProp('motionEnSwayX', false)}
                checkbox={{
                    checked: getProp('motionEnSwayX', false),
                    onChange: e => updateProps({danceStyle: 'Custom (Advanced)', motionEnSwayX: e.target.checked})
                }}
            />

            <SliderRow 
                label="Sway Up/Down" 
                min={0} max={20} step={0.5} 
                value={getProp('motionValSwayY', 1.2)} 
                onChange={e => updateProps({danceStyle: 'Custom (Advanced)', motionValSwayY: Number(e.target.value)})} 
                disabled={!getProp('motionEnSwayY', false)}
                checkbox={{
                    checked: getProp('motionEnSwayY', false),
                    onChange: e => updateProps({danceStyle: 'Custom (Advanced)', motionEnSwayY: e.target.checked})
                }}
            />

            <SliderRow 
                label="Rotate" 
                min={0} max={20} step={0.5} 
                value={getProp('motionValRotate', 1.5)} 
                onChange={e => updateProps({danceStyle: 'Custom (Advanced)', motionValRotate: Number(e.target.value)})} 
                disabled={!getProp('motionEnRotate', false)}
                checkbox={{
                    checked: getProp('motionEnRotate', false),
                    onChange: e => updateProps({danceStyle: 'Custom (Advanced)', motionEnRotate: e.target.checked})
                }}
            />

            <SliderRow 
                label="Shake" 
                min={0} max={20} step={0.5} 
                value={getProp('motionValShake', 4)} 
                onChange={e => updateProps({danceStyle: 'Custom (Advanced)', motionValShake: Number(e.target.value)})} 
                disabled={!getProp('motionEnShake', false)}
                checkbox={{
                    checked: getProp('motionEnShake', false),
                    onChange: e => updateProps({danceStyle: 'Custom (Advanced)', motionEnShake: e.target.checked})
                }}
            />
        </div>
      </div>
    );
  };

  const renderBackgroundInspector = () => (
    <>
      <SettingGroup title="📸 Image Adjustments" headerClass="text-[#f97316] border-[#f97316]/30">
        <SliderRow label="Overlay darkness" min={0} max={100} value={getProp('overlayDarkness', 30)} onChange={e => updateProp('overlayDarkness', Number(e.target.value))} />
        <SliderRow label="Blur amount" min={0} max={100} value={getProp('blurAmount', 0)} onChange={e => updateProp('blurAmount', Number(e.target.value))} />
      </SettingGroup>

      <SettingGroup title="📐 Transform" headerClass="text-[#f97316] border-[#f97316]/30">
        <SelectRow label="Scale Mode" options={['Cover (Fill)', 'Contain (Fit)', 'Stretch']} value={getProp('scaleMode', 'Cover (Fill)')} onChange={e => updateProp('scaleMode', e.target.value)} />
        <SliderRow label="Background Zoom" min={0} max={100} value={getProp('backgroundZoom', 0)} onChange={e => updateProp('backgroundZoom', Number(e.target.value))} />
        <SliderRow label="Horizontal Position" min={-100} max={100} value={getProp('horizontalPosition', 0)} onChange={e => updateProp('horizontalPosition', Number(e.target.value))} />
        <SliderRow label="Vertical Position" min={-100} max={100} value={getProp('verticalPosition', 0)} onChange={e => updateProp('verticalPosition', Number(e.target.value))} />
      </SettingGroup>

      {!isThumbnailMode && editorMode !== 'Thumbnail' && (
        <SettingGroup title="🔊 Audio Reactivity" headerClass="text-[#10b981] border-[#10b981]/30">
          <ToggleRow label="Enable Audio Motion" checked={getProp('danceMode', 'Off') !== 'Off'} onChange={e => updateProp('danceMode', e.target.checked ? 'Performance Mode' : 'Off')} />
          
          {getProp('danceMode', 'Off') !== 'Off' && (
            <div className="mt-4 pt-2 border-t border-[#2d3247]/50">
              <SelectRow 
                  label="Engine Mode" 
                  options={['Performance Mode', 'Quality Mode']} 
                  value={(getProp('danceMode') === 'Ringan (Pixel) — cepat di CPU') ? 'Performance Mode' : (getProp('danceMode') === 'Penuh (Transform) — mulus di GPU' ? 'Quality Mode' : getProp('danceMode', 'Performance Mode'))} 
                  onChange={e => updateProp('danceMode', e.target.value)} 
              />
              {renderAudioReactivityParams()}
            </div>
          )}
        </SettingGroup>
      )}
    </>
  );

  const renderPlaylistInspector = () => {
    return (
    <>
      <SettingGroup title="Data Binding" headerClass="text-[#3b82f6] border-[#3b82f6]/30">
          <ToggleRow label="Bind to Audio Tracks" checked={getProp('bindToAudioTracks', true)} onChange={e => updateProp('bindToAudioTracks', e.target.checked)} />
          <p className="text-[9px] text-gray-500 mt-1.5 leading-tight bg-[#0f111a] p-2 rounded border border-[#2d3247]">
            Jika diaktifkan, teks akan otomatis terisi dengan daftar lagu dari panel M3AudioTracks.
          </p>
      </SettingGroup>

      <SettingGroup title="Playlist Properties" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex flex-col gap-3 mb-3">
            <SelectRow label="Font" options={['Segoe UI', 'Inter', 'Roboto', 'Outfit', 'monospace']} value={getProp('fontFamily', 'Segoe UI')} onChange={e => updateProp('fontFamily', e.target.value)} />
            <SelectRow label="Weight" options={['Light', 'Normal', 'Semi-Bold', 'Bold', 'Extra-Bold', 'Black']} value={getProp('fontWeight', 'Semi-Bold')} onChange={e => updateProp('fontWeight', e.target.value)} />
        </div>
        
        <div className="flex flex-col gap-3 mb-3">
            <SliderRow label="Font Size" min={10} max={100} value={getProp('fontSize', 28)} onChange={e => updateProp('fontSize', e.target.value)} />
            <SliderRow label="Item Spacing" min={0} max={10} step={0.1} value={getProp('lineHeight', 1.5)} onChange={e => updateProp('lineHeight', e.target.value)} />
        </div>
        
        <div className="flex flex-col gap-3 mb-3">
            <SelectRow label="Text Alignment" options={['Left', 'Center', 'Right', 'Space Between', 'Split (Mirrored)']} value={getProp('align', 'Left')} onChange={e => updateProp('align', e.target.value)} />
            <SelectRow label="Active Indicator" options={['Arrow (▶)', 'Dot (•)', 'Line (|)', 'None']} value={getProp('activeIndicator', 'Arrow (▶)')} onChange={e => updateProp('activeIndicator', e.target.value)} />
            <SelectRow label="Numbering" options={['Numbers (1.)', 'Roman (I.)', 'None']} value={getProp('numbering', 'Numbers (1.)')} onChange={e => updateProp('numbering', e.target.value)} />
            <SelectRow label="Columns" options={['1', '2', '3']} value={getProp('columns', 1).toString()} onChange={e => updateProp('columns', parseInt(e.target.value))} />
            {getProp('columns', 1) > 1 && (
                <SliderRow label="Column Gap" min={0} max={1000} value={getProp('columnGap', 100)} onChange={e => updateProp('columnGap', Number(e.target.value))} />
            )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-[#2d3247]">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-300 font-bold tracking-wide mb-1">Inactive</span>
                <input type="color" value={getProp('inactiveColor', '#a0a0a0')} onChange={e => updateProp('inactiveColor', e.target.value)} className="w-full h-8 bg-[#11131a] border border-[#2d3247] cursor-pointer p-1 rounded" />
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-300 font-bold tracking-wide mb-1">Active</span>
                <input type="color" value={getProp('activeColor', '#a855f7')} onChange={e => updateProp('activeColor', e.target.value)} className="w-full h-8 bg-[#11131a] border border-[#2d3247] cursor-pointer p-1 rounded" />
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-300 font-bold tracking-wide mb-1">Pointer</span>
                <input type="color" value={getProp('pointerColor', '#a855f7')} onChange={e => updateProp('pointerColor', e.target.value)} className="w-full h-8 bg-[#11131a] border border-[#2d3247] cursor-pointer p-1 rounded" />
            </div>
        </div>
        
        <div className="bg-[#11131a] border border-[#2d3247] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" checked={getProp('showBackdrop', true)} onChange={e => updateProp('showBackdrop', e.target.checked)} className="w-4 h-4 rounded bg-[#161822] border-orange-500/20 text-orange-500 focus:ring-0 cursor-pointer" />
                <span className="text-[11px] text-white font-bold tracking-wide">Show Backdrop Panel</span>
            </div>
            
            {getProp('showBackdrop', true) && (
                <>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 mb-1">Bg Color</span>
                            <input type="color" value={getProp('backdropColor', '#000000')} onChange={e => updateProp('backdropColor', e.target.value)} className="w-6 h-6 bg-transparent border-none cursor-pointer p-0" />
                        </div>
                        <div className="flex-1">
                            <SliderRow label="Opacity" min={0} max={1} step={0.01} value={getProp('backdropOpacity', 0.40)} onChange={e => updateProp('backdropOpacity', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <SliderRow label="Corner Radius" min={0} max={50} value={getProp('backdropRadius', 8)} onChange={e => updateProp('backdropRadius', e.target.value)} />
                        <SliderRow label="Padding" min={0} max={100} value={getProp('backdropPadding', 20)} onChange={e => updateProp('backdropPadding', e.target.value)} />
                    </div>
                </>
            )}
        </div>
      </SettingGroup>

      <SettingGroup title="3D Rotation" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex flex-col gap-3">
            <SliderRow label={`Tilt X (pitch): ${Math.round(getProp('tiltX', 0))}°`} min={-90} max={90} value={getProp('tiltX', 0)} onChange={e => updateProp('tiltX', Number(e.target.value))} />
            <SliderRow label={`Tilt Y (yaw): ${Math.round(getProp('tiltY', 0))}°`} min={-90} max={90} value={getProp('tiltY', 0)} onChange={e => updateProp('tiltY', Number(e.target.value))} />
            <SliderRow label={`Perspective: ${Math.round(getProp('perspective', 60))}%`} min={0} max={100} value={getProp('perspective', 60)} onChange={e => updateProp('perspective', Number(e.target.value))} />
            <SliderRow label={`Depth (3D body): ${Math.round(getProp('depth', 0))}%`} min={0} max={100} value={getProp('depth', 0)} onChange={e => updateProp('depth', Number(e.target.value))} />
        </div>
        <button onClick={() => {
            updateProp('tiltX', 0);
            updateProp('tiltY', 0);
            updateProp('perspective', 60);
            updateProp('depth', 0);
        }} className="mt-4 px-3 py-1.5 bg-[#1e2230] hover:bg-[#2a2f42] text-[10px] text-gray-300 rounded border border-[#2d3247] transition-colors max-w-max text-left">
            Reset 3D
        </button>
        <p className="text-[9px] text-gray-500 mt-2 italic flex items-start gap-1">
            <span className="text-yellow-500 text-[10px] leading-none">💡</span>
            Atau pakai handle: klik tombol "3D" di kanvas, lalu tarik ring (coral=X, teal=Y, ungu=Z).
        </p>
      </SettingGroup>

      <SettingGroup title="Depth" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <ToggleRow label="Insert into background depth" checked={getProp('insertDepth', false)} onChange={e => updateProp('insertDepth', e.target.checked)} />
      </SettingGroup>
      
      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Playlist</button>
      </div>
    </>
  )};

  const renderSubtitleInspector = () => (
    <>
      <SettingGroup title="Text Layout" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Typography Preset</span>
          <button 
            onClick={() => {
              updateProps({
                font: 'Segoe UI, sans-serif', fontWeight: 'Extra-Bold', lines: '1 Line', wordsPerLine: 8,
                autoShrink: true, keepInGaps: false, lineMovement: 'None', displayMode: 'Paragraph'
              });
            }}
            className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded transition-all"
          >
            Reset Preset
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <SelectRow label="Font Family" options={['Segoe UI, sans-serif', 'Inter, sans-serif', 'Roboto, sans-serif', 'Oswald, sans-serif', 'Montserrat, sans-serif', 'Dancing Script, cursive', 'Great Vibes, cursive', 'Courier New, monospace']} value={getProp('font', 'Segoe UI, sans-serif')} onChange={e => updateProp('font', e.target.value)} />
          <SelectRow label="Font Weight" options={['Extra-Bold', 'Bold', 'Semi-Bold', 'Normal', 'Light']} value={getProp('fontWeight', 'Extra-Bold')} onChange={e => updateProp('fontWeight', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 pt-2 border-t border-[#2d3247]">
          <SelectRow label="Lines" options={['1 Line', '2 Lines', '3 Lines', '4 Lines']} value={getProp('lines', '1 Line')} onChange={e => updateProp('lines', e.target.value)} />
          <div className="flex items-center justify-between text-[11px] text-gray-300">
            <span>Words / Line</span>
            <input 
              type="number" min={1} max={30} value={getProp('wordsPerLine', 8)} 
              onChange={e => updateProp('wordsPerLine', Number(e.target.value))}
              className="w-12 bg-[#11131a] border border-[#2d3247] rounded px-1.5 py-0.5 text-center text-white font-bold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-3 pt-2 border-t border-[#2d3247]">
          <ToggleRow label="Auto-shrink long lines" checked={getProp('autoShrink', true)} onChange={e => updateProp('autoShrink', e.target.checked)} />
          <ToggleRow label="Keep visible in gaps" checked={getProp('keepInGaps', false)} onChange={e => updateProp('keepInGaps', e.target.checked)} />
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#2d3247]">
          <SelectRow label="Line Movement (Scroll)" options={['None', 'Smooth Scroll', 'Pop Up', 'Fade & Slide', 'Typewriter', 'Bounce']} value={getProp('lineMovement', 'None')} onChange={e => updateProp('lineMovement', e.target.value)} />
          <div className="flex flex-col mb-1 w-full text-[11px]">
            <span className="text-gray-300 mb-1">Display Mode</span>
            <DisplayModeSelector 
               value={getProp('displayMode', 'Static')} 
               onChange={val => updateProp('displayMode', val)} 
            />
          </div>
        </div>
      </SettingGroup>

      <SettingGroup title="Text Style" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex justify-between items-center text-[11px] text-gray-300 mb-3">
          <span>Color & Alignment</span>
          <div className="flex items-center gap-2">
            <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
            <select value={getProp('align', 'Center')} onChange={e => updateProp('align', e.target.value)} className="bg-[#11131a] border border-[#2d3247] rounded px-2 py-0.5 text-[11px] text-white">
              <option value="Center">Center</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
            </select>
          </div>
        </div>

        <SliderRow label="Font Size" min={10} max={120} value={getProp('fontSize', 36)} onChange={e => updateProp('fontSize', Number(e.target.value))} />
        <SliderRow label="Line Height" min={0.5} max={3} step={0.1} value={getProp('lineHeight', 1.5)} onChange={e => updateProp('lineHeight', Number(e.target.value))} />

        <div className="mt-3 pt-3 border-t border-[#2d3247] flex flex-col gap-2">
          <ToggleRow label="Stroke Outline" checked={getProp('strokeEnabled', true)} onChange={e => updateProp('strokeEnabled', e.target.checked)} />
          {getProp('strokeEnabled', true) && (
            <div className="pl-3 border-l-2 border-[#2d3247] ml-1 flex flex-col gap-2.5 mt-1">
              <ColorRow label="Stroke Color" value={getProp('strokeColor', '#000000')} onChange={e => updateProp('strokeColor', e.target.value)} />
              <SliderRow label="Stroke Width" min={0} max={20} value={getProp('strokeWidth', 1)} onChange={e => updateProp('strokeWidth', Number(e.target.value))} />
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[#2d3247] flex flex-col gap-2">
          <ToggleRow label="Outer Glow" checked={getProp('glowEnabled', false)} onChange={e => updateProp('glowEnabled', e.target.checked)} />
          {getProp('glowEnabled', false) && (
            <div className="pl-3 border-l-2 border-[#2d3247] ml-1 flex flex-col gap-2.5 mt-1">
              <ColorRow label="Glow Color" value={getProp('glowColor', '#a855f7')} onChange={e => updateProp('glowColor', e.target.value)} />
              <SliderRow label="Glow Blur / Intensity" min={0} max={100} value={getProp('glowBlur', 18)} onChange={e => updateProp('glowBlur', Number(e.target.value))} />
            </div>
          )}
        </div>
      </SettingGroup>

      <SettingGroup title="Transform & Position">
        <SliderRow label="Position X" min={-1000} max={3000} value={getProp('transform', {}).x !== undefined ? getProp('transform', {}).x : 960} onChange={e => updateProp('transform', { ...(getProp('transform', {})), x: Number(e.target.value) })} />
        <SliderRow label="Position Y" min={-1000} max={2000} value={getProp('transform', {}).y !== undefined ? getProp('transform', {}).y : 850} onChange={e => updateProp('transform', { ...(getProp('transform', {})), y: Number(e.target.value) })} />
        <SliderRow label="Width" min={100} max={3840} value={getProp('width', 800)} onChange={e => updateProp('width', Number(e.target.value))} />
        <SliderRow label="Scale" min={0.1} max={3} step={0.1} value={getProp('transform', {}).scale !== undefined ? getProp('transform', {}).scale : 1} onChange={e => updateProp('transform', { ...(getProp('transform', {})), scale: Number(e.target.value) })} />
        <SliderRow label="Rotation" min={-180} max={180} value={getProp('transform', {}).rotation || 0} onChange={e => updateProp('transform', { ...(getProp('transform', {})), rotation: Number(e.target.value) })} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('transform', {}).opacity !== undefined ? getProp('transform', {}).opacity : 100} onChange={e => updateProp('transform', { ...(getProp('transform', {})), opacity: Number(e.target.value) })} />
      </SettingGroup>

      <SettingGroup title="State">
        <div className="flex gap-2 justify-between">
            <ToggleRow label="Visible" checked={getProp('transform', {}).visible !== false} onChange={e => updateProp('transform', { ...(getProp('transform', {})), visible: e.target.checked })} />
            <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
        </div>
      </SettingGroup>

      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Subtitle</button>
      </div>
    </>
  );

  const renderVisualizerInspector = () => {
    const mode = getProp('colorMode', 'Dynamic Color');
    return (
      <>
        <SettingGroup title="General Properties">
          <SelectRow label="Color Mode" options={['Solid', 'Dynamic Color', '2 Gradient', '3 Gradient', 'Rainbow', 'Neon']} value={mode} onChange={e => updateProp('colorMode', e.target.value)} />
          
          <div className="space-y-2 mt-3 pt-3 border-t border-[#21232d]">
            {(mode === 'Solid' || mode === 'Solid Color') && (
              <ColorRow label="Solid Color" value={getProp('colorLeft', getProp('color', '#AB55F7'))} onChange={e => updateProps({ colorLeft: e.target.value, color: e.target.value })} />
            )}
            {(mode === 'Dynamic Color' || mode === '2 Gradient' || mode === 'Gradient') && (
              <>
                <ColorRow label="Color 1 (Left)" value={getProp('colorLeft', getProp('color', '#AB55F7'))} onChange={e => updateProps({ colorLeft: e.target.value, color: e.target.value })} />
                <ColorRow label="Color 2 (Right)" value={getProp('colorRight', '#F59E0B')} onChange={e => updateProps({ colorRight: e.target.value })} />
              </>
            )}
            {mode === '3 Gradient' && (
              <>
                <ColorRow label="Color 1 (Left)" value={getProp('colorLeft', getProp('color', '#AB55F7'))} onChange={e => updateProps({ colorLeft: e.target.value, color: e.target.value })} />
                <ColorRow label="Color 2 (Middle)" value={getProp('colorMid', '#06B6D4')} onChange={e => updateProps({ colorMid: e.target.value })} />
                <ColorRow label="Color 3 (Right)" value={getProp('colorRight', '#F59E0B')} onChange={e => updateProps({ colorRight: e.target.value })} />
              </>
            )}
            {mode === 'Neon' && (
              <ColorRow label="Neon Glow Color" value={getProp('neonColor', '#00f3ff')} onChange={e => updateProp('neonColor', e.target.value)} />
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#21232d] space-y-3">
            <SelectRow label="Frequency Order" options={['Bass \u2192 Treble', 'Treble \u2192 Bass', 'Bass \u2192 Treble \u2192 Bass', 'Treble \u2192 Bass \u2192 Treble']} value={getProp('frequencyOrder', 'Bass \u2192 Treble')} onChange={e => updateProp('frequencyOrder', e.target.value)} />
            <SliderRow label="Bar Count" min={8} max={256} step={1} value={getProp('barCount', 64)} onChange={e => updateProp('barCount', Number(e.target.value))} />
            <SliderRow label="Bar Thickness" min={1} max={32} step={1} value={getProp('thickness', getProp('barWidth', 4))} onChange={e => { updateProp('thickness', Number(e.target.value)); updateProp('barWidth', Number(e.target.value)); }} />
            <SliderRow label="Sensitivity / Gain" min={10} max={200} step={5} value={getProp('fftGain', getProp('gain', 100))} onChange={e => { updateProp('fftGain', Number(e.target.value)); updateProp('gain', Number(e.target.value)); }} />
          </div>
          
          <div className="mt-4 space-y-1">
              <ToggleRow label="Glow / Bloom" checked={getProp('bloom', getProp('glowEnabled', false))} onChange={e => { updateProp('bloom', e.target.checked); updateProp('glowEnabled', e.target.checked); }} />
              <ToggleRow label="Beat Zoom" checked={getProp('beatZoom', getProp('beatZoomEnabled', false))} onChange={e => { updateProp('beatZoom', e.target.checked); updateProp('beatZoomEnabled', e.target.checked); }} />
          </div>
        </SettingGroup>

        <SettingGroup title="Neon Emphasis (edges)">
          <div className="space-y-1">
              <ToggleRow label="Fake neon (extra glow)" checked={getProp('fakeNeon', getProp('fakeNeonEnabled', true))} onChange={e => { updateProp('fakeNeon', e.target.checked); updateProp('fakeNeonEnabled', e.target.checked); }} />
              <ToggleRow label="Outer edge glow" checked={getProp('outerGlow', getProp('outerEdgeGlowEnabled', false))} onChange={e => { updateProp('outerGlow', e.target.checked); updateProp('outerEdgeGlowEnabled', e.target.checked); }} />
              <ToggleRow label="Inner ring (around cover)" checked={getProp('innerRing', getProp('innerRingEnabled', false))} onChange={e => { updateProp('innerRing', e.target.checked); updateProp('innerRingEnabled', e.target.checked); }} />
              <ToggleRow label="Show Visualizer" checked={getProp('transform', {}).visible !== false} onChange={e => updateProp('transform', { ...(getProp('transform', {})), visible: e.target.checked })} />
          </div>
          <div className="mt-4">
              <SliderRow label="Opacity (100%)" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
          </div>
        </SettingGroup>

        <SettingGroup title="3D Rotation">
          <div className="flex flex-col gap-3">
              <SliderRow label="Tilt X (pitch)" min={-90} max={90} value={getProp('tiltX', 0)} onChange={e => updateProp('tiltX', Number(e.target.value))} />
              <SliderRow label="Tilt Y (yaw)" min={-90} max={90} value={getProp('tiltY', 0)} onChange={e => updateProp('tiltY', Number(e.target.value))} />
              <SliderRow label="Perspective" min={0} max={100} value={getProp('perspective', 60)} onChange={e => updateProp('perspective', Number(e.target.value))} />
              <SliderRow label="Depth (3D body)" min={0} max={100} value={getProp('depth', 0)} onChange={e => updateProp('depth', Number(e.target.value))} />
          </div>
          <button onClick={() => {
              updateProp('tiltX', 0);
              updateProp('tiltY', 0);
              updateProp('perspective', 60);
              updateProp('depth', 0);
          }} className="mt-4 px-3 py-1.5 bg-[#1e2230] hover:bg-[#2a2f42] text-[10px] text-gray-300 rounded border border-[#2d3247] transition-colors w-full text-left">
              Reset 3D
          </button>
          <p className="text-[9px] text-gray-500 mt-2 italic flex items-start gap-1">
              <span className="text-yellow-500 text-[10px] leading-none">\u26a1</span>
              Atau pakai handle: klik tombol "3D" di kanvas, lalu tarik ring (coral=X, teal=Y, ungu=Z).
          </p>
        </SettingGroup>

        <SettingGroup title="Depth">
          <ToggleRow label="Insert into background depth" checked={getProp('insertDepth', false)} onChange={e => updateProp('insertDepth', e.target.checked)} />
        </SettingGroup>

        <SettingGroup title="Transform">
          <ToggleRow label="Uniform Scale" checked={getProp('uniformScale', true)} onChange={e => updateProp('uniformScale', e.target.checked)} />
          <div className="flex flex-col gap-3 mt-3">
              <SliderRow label="Scale X" min={0} max={200} value={getProp('scaleX', 100)} onChange={e => updateProp('scaleX', e.target.value)} />
              <SliderRow label="Scale Y" min={0} max={200} value={getProp('scaleY', 100)} onChange={e => updateProp('scaleY', e.target.value)} />
              <SliderRow label="X Position" min={0} max={100} value={getProp('xPos', 50)} onChange={e => updateProp('xPos', e.target.value)} />
              <SliderRow label="Y Position" min={0} max={100} value={getProp('yPos', 50)} onChange={e => updateProp('yPos', e.target.value)} />
          </div>
        </SettingGroup>
      </>
    );
  };


  const updateEffectProp = (key, value) => {
    if (m3SelectedObjectId && setM3Objects) {
      setM3Objects(prev => prev.map(o => o.id === m3SelectedObjectId ? { ...o, props: { ...o.props, [key]: Number(value) } } : o));
    }
  };

  const getEffectProp = (key, def) => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      return obj?.props?.[key] !== undefined ? obj.props[key] : def;
    }
    return def;
  };

  const updateAudioBinding = (index, key, value) => {
    if (m3SelectedObjectId && setM3Objects) {
      setM3Objects(prev => prev.map(o => {
        if (o.id === m3SelectedObjectId) {
          const newBindings = [...(o.audioBindings || [])];
          if (!newBindings[index]) {
             newBindings[index] = { enabled: true, parameter: Object.keys(o.props || {})[0] || '', source: 'Bass', sensitivity: 100, min: 0, max: 100, attack: 20, release: 180 };
          }
          newBindings[index] = { ...newBindings[index], [key]: key === 'parameter' || key === 'source' ? value : Number(value) };
          return { ...o, audioBindings: newBindings };
        }
        return o;
      }));
    }
  };

  const getAudioBinding = (index, key, def) => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      return obj?.audioBindings?.[index]?.[key] !== undefined ? obj.audioBindings[index][key] : def;
    }
    return def;
  };

  const getEffectIcon = (type) => {
    switch (type) {
      case 'camera': return '📷';
      case 'glow': return '🌟';
      case 'particles': return '✨';
      case 'color': return '🎨';
      case 'blur': return '💧';
      case 'distortion': return '🌀';
      case 'retro': return '📼';
      case 'reactive': return '🎵';
      default: return '⚙️';
    }
  };


  const renderVisualFXInspector = () => {
    const activeEffects = m3Objects.filter(obj => obj.type === 'effect' || obj.type === 'reactive');
    const isFast = renderMode === 'FAST' || fastRenderState.isFastMode();

    const handleDelete = (id) => {
        setM3Objects(prev => prev.filter(obj => obj.id !== id));
    };

    const handleSwitchToNormal = () => {
        fastRenderState.setMode('NORMAL');
        if (setRenderMode) setRenderMode('NORMAL');
    };

    return (
      <div className="flex flex-col gap-2 px-2">
        <div className="flex justify-between items-center mb-4 mt-2">
            <span className="text-[12px] text-gray-300 font-bold tracking-widest uppercase">Visual FX Layer</span>
            {isFast && <FastModeBadge label="⚡ Fast Mode Active" />}
        </div>

        {activeEffects.length === 0 ? (
            <div className="text-[10px] text-gray-500 italic text-center p-6 border border-dashed border-[#2d3060] rounded-lg">
                Belum ada efek yang diterapkan. Klik "+ Tambah Efek" atau gunakan Preset Genre.
            </div>
        ) : (
            activeEffects.map(obj => {
                const InspectorComp = INSPECTOR_MAP[obj.presetId];
                const rule = capabilityRegistry.getInspectorRule(obj.presetId);
                const isUnsupported = isFast && rule.supported === false;
                const isAdapted = isFast && rule.adapted === true;

                return (
                    <div key={obj.id} className="relative group">
                        <SettingGroup 
                            title={obj.name.toUpperCase()}
                            headerAction={
                                <button 
                                    onClick={() => handleDelete(obj.id)} 
                                    className="text-gray-500 hover:text-red-500 transition-colors bg-black/20 hover:bg-red-500/10 p-1.5 rounded flex items-center justify-center opacity-60 hover:opacity-100"
                                    title="Hapus Efek"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            }
                        >
                            {isAdapted && <FastModeBadge label={rule.adaptLabel || '⚡ Fast Mode Periodic Curve'} />}
                            
                            {isUnsupported ? (
                                <UnsupportedGuidanceCard 
                                    title={`${obj.name.toUpperCase()} — NORMAL RENDER MODE REQUIRED`}
                                    message={rule.reason || 'Preset ini memerlukan real-time frame rendering dan tidak kompatibel dengan Fast Render Mode.'}
                                    onSwitchToNormal={handleSwitchToNormal}
                                />
                            ) : (
                                <div className="mt-1">
                                    {InspectorComp ? (
                                        <InspectorComp 
                                            props={obj.props || {}} 
                                            update={(key, value) => {
                                                const updated = m3Objects.map(o => {
                                                    if (o.id === obj.id) {
                                                        return { ...o, props: { ...o.props, [key]: value } };
                                                    }
                                                    return o;
                                                });
                                                setM3Objects(updated);
                                            }}
                                        />
                                    ) : (
                                        <div className="text-[11px] text-gray-500 italic">No custom inspector for this effect.</div>
                                    )}
                                </div>
                            )}
                        </SettingGroup>
                    </div>
                );
            })
        )}
      </div>
    );
  };



  const handleLayerMove = (direction) => {
    if (!m3SelectedObjectId || !setM3Objects) return;
    setM3Objects(prev => {
        let updated = [...prev];
        const idx = updated.findIndex(o => o.id === m3SelectedObjectId);
        if (idx === -1) return prev;
        
        if (direction === 'up' && idx < updated.length - 1) {
            const temp = updated[idx].layer;
            updated[idx].layer = updated[idx+1].layer;
            updated[idx+1].layer = temp;
        } else if (direction === 'down' && idx > 0) {
            const temp = updated[idx].layer;
            updated[idx].layer = updated[idx-1].layer;
            updated[idx-1].layer = temp;
        } else if (direction === 'top') {
            const maxLayer = Math.max(...updated.map(o => o.layer || 0));
            updated[idx].layer = maxLayer + 1;
        } else if (direction === 'bottom') {
            const minLayer = Math.min(...updated.map(o => o.layer || 0));
            updated[idx].layer = minLayer - 1;
        }
        return updated.sort((a,b) => a.layer - b.layer);
    });
  };

  const handleReplaceMedia = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    if (!obj) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    if (obj.mediaType === 'image') input.accept = 'image/png, image/jpeg, image/jpg, image/webp, image/svg+xml';
    else if (obj.mediaType === 'video') input.accept = 'video/mp4, video/webm, video/quicktime';
    else if (obj.mediaType === 'gif') input.accept = 'image/gif';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        updateProp('source', objectUrl);
        updateProp('name', file.name);
        if (file.name.toLowerCase().endsWith('.mp4')) {
            updateProp('blend', 'Screen');
        }
    };
    input.click();
  };

  const renderImageInspector = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    const mediaType = obj?.mediaType || 'image';

    return (
    <>
      {obj?.type === 'social-widget' && obj?.widgetType === 'subscribe' && (
        <SettingGroup title="Subscribe Settings" headerClass="text-[#f43f5e] border-[#f43f5e]/30">
            <SelectRow 
               label="Appearance Interval" 
               options={[
                   {label: 'No Interval (Loop)', value: 0},
                   {label: 'Every 5 Minutes', value: 5},
                   {label: 'Every 10 Minutes', value: 10},
                   {label: 'Every 15 Minutes', value: 15},
                   {label: 'Every 20 Minutes', value: 20},
                   {label: 'Every 25 Minutes', value: 25},
                   {label: 'Every 30 Minutes', value: 30}
               ]} 
               value={getProp('intervalMinutes', 5)} 
               onChange={e => updateProp('intervalMinutes', Number(e.target.value))} 
            />
            <p className="text-[9px] text-gray-500 mt-2 leading-tight">
               Animasi subscribe akan muncul berulang sesuai interval waktu ini.
            </p>
        </SettingGroup>
      )}
      <SettingGroup title="📐 Transform & Shape" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <SelectRow label="Shape Mode" options={['Original', 'Circle', 'Rounded Rect']} value={getProp('shapeMode', 'Original')} onChange={e => updateProp('shapeMode', e.target.value)} />
        <div className="mt-2 mb-2">
           <ToggleRow label="Uniform Scale" checked={getProp('uniformScale', false)} onChange={e => updateProp('uniformScale', e.target.checked)} />
        </div>
        <SliderRow label="Width" min={10} max={3840} value={getProp('width', 400)} onChange={e => updateProp('width', Number(e.target.value))} />
        <SliderRow label="Height" min={10} max={2160} value={getProp('height', 400)} onChange={e => updateProp('height', Number(e.target.value))} />
        <SliderRow label="Manual Rotation" min={-180} max={180} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', Number(e.target.value))} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
      </SettingGroup>

      <SettingGroup title="📦 3D Rotation" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex flex-col gap-3">
            <SliderRow label={`Tilt X (pitch)`} min={-90} max={90} value={getProp('tiltX', 0)} onChange={e => updateProp('tiltX', Number(e.target.value))} />
            <SliderRow label={`Tilt Y (yaw)`} min={-90} max={90} value={getProp('tiltY', 0)} onChange={e => updateProp('tiltY', Number(e.target.value))} />
            <SliderRow label={`Perspective`} min={0} max={100} value={getProp('perspective', 60)} onChange={e => updateProp('perspective', Number(e.target.value))} />
            <SliderRow label={`Depth (Z-axis)`} min={-500} max={500} value={getProp('depth', 0)} onChange={e => updateProp('depth', Number(e.target.value))} />
        </div>
        <button onClick={() => {
            updateProp('tiltX', 0);
            updateProp('tiltY', 0);
            updateProp('perspective', 60);
            updateProp('depth', 0);
        }} className="mt-4 px-3 py-1.5 bg-[#1e2230] hover:bg-[#2a2f42] text-[10px] text-gray-300 rounded border border-[#2d3247] transition-colors max-w-max text-left">
            Reset 3D
        </button>
      </SettingGroup>

      <SettingGroup title="🎨 Appearance" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <ToggleRow label="Insert into background depth" checked={getProp('insertDepth', false)} onChange={e => updateProp('insertDepth', e.target.checked)} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-3 mb-2">
          <span>Background Color</span>
          <div className="flex items-center gap-2">
            <ToggleRow label="Transparent" checked={getProp('bgTransparent', true)} onChange={e => updateProp('bgTransparent', e.target.checked)} />
            {!getProp('bgTransparent', true) && (
                <input type="color" value={getProp('bgColor', '#000000')} onChange={e => updateProp('bgColor', e.target.value)} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
            )}
          </div>
        </div>
        <ToggleRow label="Outline / Border" checked={getProp('hasBorder', false)} onChange={e => updateProp('hasBorder', e.target.checked)} />
      </SettingGroup>

      {!isThumbnailMode && editorMode !== 'Thumbnail' && (
        <SettingGroup title="🔊 Audio Reactivity" headerClass="text-[#10b981] border-[#10b981]/30">
          <ToggleRow label="Enable Audio Motion" checked={getProp('beatZoom', false)} onChange={e => updateProp('beatZoom', e.target.checked)} />
          <ToggleRow label="Bass Pumping / Kempang-Kempis" checked={getProp('beatPump', false)} onChange={e => updateProp('beatPump', e.target.checked)} />
          {getProp('beatZoom', false) && renderAudioReactivityParams()}
        </SettingGroup>
      )}

      {(obj?.type === 'procedural-speaker' || obj?.mediaType === 'procedural') && (
        <SettingGroup title="🔊 Subwoofer Model & Style" headerClass="text-[#00ffcc] border-[#00ffcc]/30">
          <SelectRow label="Subwoofer Model" options={[
            '1. Studio Reference (Classic Dome)',
            '2. Inverted Concave & 8 Bolts (Charcoal)',
            '3. Hex Carbon Fiber & Rivets (Graphite)',
            '4. Dual-Surround Extreme Excursion (Deep Black)',
            '5. Flat-Piston Honeycomb Disc (Matte Black)',
            '6. Turbofan Spoked Heavy-Duty (Gunmetal)',
            '7. RGB LED Ring (Cyberpunk)',
            '8. Glowing White Neon (Clean & Bright)'
          ]} value={(() => {
            const m = getProp('model', 'studio');
            const map = {
              'studio': '1. Studio Reference (Classic Dome)',
              'inverted': '2. Inverted Concave & 8 Bolts (Charcoal)',
              'carbon': '3. Hex Carbon Fiber & Rivets (Graphite)',
              'dual': '4. Dual-Surround Extreme Excursion (Deep Black)',
              'flat': '5. Flat-Piston Honeycomb Disc (Matte Black)',
              'turbofan': '6. Turbofan Spoked Heavy-Duty (Gunmetal)',
              'rgb_ring': '7. RGB LED Ring (Cyberpunk)',
              'neon_white': '8. Glowing White Neon (Clean & Bright)'
            };
            return map[m] || '1. Studio Reference (Classic Dome)';
          })()} onChange={e => {
            const val = e.target.value;
            const revMap = {
              '1. Studio Reference (Classic Dome)': 'studio',
              '2. Inverted Concave & 8 Bolts (Charcoal)': 'inverted',
              '3. Hex Carbon Fiber & Rivets (Graphite)': 'carbon',
              '4. Dual-Surround Extreme Excursion (Deep Black)': 'dual',
              '5. Flat-Piston Honeycomb Disc (Matte Black)': 'flat',
              '6. Turbofan Spoked Heavy-Duty (Gunmetal)': 'turbofan',
              '7. RGB LED Ring (Cyberpunk)': 'rgb_ring',
              '8. Glowing White Neon (Clean & Bright)': 'neon_white'
            };
            updateProp('model', revMap[val] || 'studio');
          }} />
          <SliderRow label="Pumping Intensity (Kekuatan Getaran)" min={0.5} max={6.0} step={0.2} value={getProp('pumpIntensity', 2.5)} onChange={e => updateProp('pumpIntensity', Number(e.target.value))} />
          <div className="flex justify-between items-center text-[11px] text-gray-300 my-3">
            <span>Rim Accent / Light Color</span>
            <input type="color" value={getProp('color', '#00ffcc')} onChange={e => updateProp('color', e.target.value)} className="w-7 h-7 bg-transparent border border-[#2d3247] rounded cursor-pointer" />
          </div>
          <div className="mt-2">
            <ToggleRow label="Real-Time Audio Reactive" checked={getProp('audioReactive', true)} onChange={e => updateProp('audioReactive', e.target.checked)} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed bg-[#14151c] p-2 rounded border border-[#2d3247]/50">
            Semua model bernuansa Hitam/Abu-abu mekanikal (tanpa warna-warni aneh). Kerucut beneran mendenyut kempang-kempis mengikuti tendangan bass/kick drum! Anda juga bisa upload gambar PNG speaker sendiri dan aktifkan "Bass Pumping" di atas!
          </p>
        </SettingGroup>
      )}

      <SettingGroup title="Media & Layering">
        <button onClick={handleReplaceMedia} className="w-full bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[11px] py-2 rounded mb-3">Replace Media</button>
        <SelectRow label="Blend Mode" options={['Normal', 'Multiply', 'Screen', 'Overlay']} value={getProp('blend', 'Normal')} onChange={e => updateProp('blend', e.target.value)} />
        <div className="flex gap-2 justify-between mt-3">
            <ToggleRow label="Visible" checked={getProp('visible', true)} onChange={e => updateProp('visible', e.target.checked)} />
            <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => handleLayerMove('up')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring Forward</button>
            <button onClick={() => handleLayerMove('down')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send Backward</button>
            <button onClick={() => handleLayerMove('top')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring to Front</button>
            <button onClick={() => handleLayerMove('bottom')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send to Back</button>
        </div>
        {(mediaType === 'video' || mediaType === 'gif' || obj?.type === 'social-widget') && (
            <div className="mt-4 pt-3 border-t border-[#2d3247]/50">
                <div className="flex gap-2 justify-between mt-2">
                    <ToggleRow label="Loop" checked={getProp('loop', true)} onChange={e => updateProp('loop', e.target.checked)} />
                </div>
                <div className="mt-2">
                    <SliderRow label="Playback Speed" min={0.1} max={3} step={0.1} value={getProp('playbackRate', 1)} onChange={e => updateProp('playbackRate', Number(e.target.value))} />
                </div>
                <div className="mt-3">
                    <ToggleRow label="Enable Chroma Key" checked={getProp('chromaKey', false)} onChange={e => {
                        updateProp('chromaKey', e.target.checked);
                        updateProp('alphaMode', e.target.checked ? 'chroma' : 'alpha');
                    }} />
                    {getProp('chromaKey', false) && (
                        <div className="mt-3 pl-3 border-l-2 border-[#2d3247] flex flex-col gap-3">
                            <ColorRow label="Key Color" value={getProp('keyColor', '#00ff00')} onChange={e => updateProp('keyColor', e.target.value)} />
                            <SliderRow label="Similarity" min={0} max={1} step={0.01} value={getProp('similarity', 0.22)} onChange={e => updateProp('similarity', Number(e.target.value))} />
                            <SliderRow label="Smoothness" min={0} max={1} step={0.01} value={getProp('smoothness', 0.08)} onChange={e => updateProp('smoothness', Number(e.target.value))} />
                            <SliderRow label="Spill Reduction" min={0} max={1} step={0.01} value={getProp('spill', 0.15)} onChange={e => updateProp('spill', Number(e.target.value))} />
                        </div>
                    )}
                </div>
            </div>
        )}
      </SettingGroup>
      
      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded mb-10">Delete Object</button>
      </div>
    </>
  );
  };

  const renderTextInspector = () => {
    const isCustomText = getProp('name', '') !== '{current_track}' && !getProp('bindToCurrentTrack', false);
    return (
    <>
      <SettingGroup title="Data Binding" headerClass="text-[#3b82f6] border-[#3b82f6]/30">
        <ToggleRow label="Bind to Current Track Title" checked={getProp('bindToCurrentTrack', false) || getProp('name', '') === '{current_track}'} onChange={e => {
            updateProp('bindToCurrentTrack', e.target.checked);
            updateProp('textType', e.target.checked ? 'title' : 'custom');
            if (e.target.checked && getProp('name', '') === '{current_track}') {
                updateProp('name', 'Now Playing');
            }
        }} />
      </SettingGroup>
      
      {(getProp('bindToCurrentTrack', false) || getProp('name', '') === '{current_track}' || getProp('textType', '') === 'title') && (
        <SettingGroup title="Label Properties (CURRENT PLAYING)" headerClass="text-[#3b82f6] border-[#3b82f6]/30">
            <div className="flex flex-col gap-3">
                <ToggleRow label="Show Label" checked={getProp('showLabel', true)} onChange={e => updateProp('showLabel', e.target.checked)} />
                {getProp('showLabel', true) && (
                    <>
                        <SliderRow label="Label Size" min={0.1} max={2} step={0.05} value={getProp('labelSize', 0.4)} onChange={e => updateProp('labelSize', e.target.value)} />
                        <SelectRow label="Label Alignment" options={['Left', 'Center', 'Right']} value={getProp('labelAlign', 'Center')} onChange={e => updateProp('labelAlign', e.target.value)} />
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <ToggleRow label="Bold" checked={getProp('labelBold', true)} onChange={e => updateProp('labelBold', e.target.checked)} />
                            <ToggleRow label="Italic" checked={getProp('labelItalic', false)} onChange={e => updateProp('labelItalic', e.target.checked)} />
                        </div>
                        <ColorRow label="Label Color" value={getProp('labelColor', getProp('color', '#ffffff'))} onChange={e => updateProp('labelColor', e.target.value)} />
                    </>
                )}
            </div>
        </SettingGroup>
      )}
      {isCustomText && (
        <SettingGroup title="Text Content" headerClass="text-[#a855f7] border-[#a855f7]/30">
          <textarea 
            className="w-full bg-[#11131a] border border-[#2d3247] rounded p-2 text-xs text-gray-300 font-mono focus:border-purple-500 outline-none resize-y min-h-[60px]"
            value={getProp('name', 'Custom Text')}
            onChange={e => updateProp('name', e.target.value)}
            placeholder="Enter text here..."
          />
        </SettingGroup>
      )}
      
      <SettingGroup title="Text Properties" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex flex-col gap-3 mb-3">
            <SelectRow label="Font" options={['Segoe UI', 'Inter', 'Roboto', 'Outfit', 'monospace']} value={getProp('fontFamily', 'Segoe UI')} onChange={e => updateProp('fontFamily', e.target.value)} />
            <SelectRow label="Weight" options={['Light', 'Normal', 'Semi-Bold', 'Bold', 'Extra-Bold', 'Black']} value={getProp('fontWeight', 'Extra-Bold')} onChange={e => updateProp('fontWeight', e.target.value)} />
        </div>
        
        <div className="flex flex-col gap-3 mb-3">
            <SliderRow label="Font Size" min={10} max={200} value={getProp('fontSize', 40)} onChange={e => updateProp('fontSize', e.target.value)} />
            <SelectRow label="Alignment" options={['Left', 'Center', 'Right']} value={getProp('align', 'Center')} onChange={e => updateProp('align', e.target.value)} />
        </div>
        
        <div className="flex flex-col gap-3 mb-3 pt-3 border-t border-[#2d3247]">
            <SliderRow label="X Position" min={0} max={1} step={0.01} value={getProp('xPos', 0.50)} onChange={e => updateProp('xPos', e.target.value)} />
            <SliderRow label="Y Position" min={0} max={1} step={0.01} value={getProp('yPos', 0.80)} onChange={e => updateProp('yPos', e.target.value)} />
            <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
        </div>
        
        <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-[#2d3247]">
            <ColorRow label="Text Color" value={getProp('color', '#ff69b4')} onChange={e => updateProp('color', e.target.value)} />
            
            <div className="flex flex-col gap-2">
                <ToggleRow label="Stroke Outline" checked={getProp('strokeEnabled', false)} onChange={e => updateProp('strokeEnabled', e.target.checked)} />
                {getProp('strokeEnabled', false) && (
                    <div className="pl-4 border-l-2 border-[#2d3247] ml-1">
                        <SliderRow label="Stroke Thickness" min={0} max={20} value={getProp('stroke', 0)} onChange={e => updateProp('stroke', e.target.value)} />
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-2">
                <ToggleRow label="Outer Glow" checked={getProp('glowEnabled', true)} onChange={e => updateProp('glowEnabled', e.target.checked)} />
                {getProp('glowEnabled', true) && (
                    <div className="pl-4 border-l-2 border-[#2d3247] ml-1 flex flex-col gap-3">
                        <ColorRow label="Glow Color" value={getProp('glowColor', '#ff69b4')} onChange={e => updateProp('glowColor', e.target.value)} />
                        <SliderRow label="Glow Amount" min={0} max={100} value={getProp('glow', 15)} onChange={e => updateProp('glow', e.target.value)} />
                    </div>
                )}
            </div>
        </div>
      </SettingGroup>

      <SettingGroup title="3D Rotation" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <div className="flex flex-col gap-3">
            <SliderRow label={`Tilt X (pitch): ${Math.round(getProp('tiltX', 0))}°`} min={-90} max={90} value={getProp('tiltX', 0)} onChange={e => updateProp('tiltX', Number(e.target.value))} />
            <SliderRow label={`Tilt Y (yaw): ${Math.round(getProp('tiltY', 0))}°`} min={-90} max={90} value={getProp('tiltY', 0)} onChange={e => updateProp('tiltY', Number(e.target.value))} />
            <SliderRow label={`Perspective: ${Math.round(getProp('perspective', 60))}%`} min={0} max={100} value={getProp('perspective', 60)} onChange={e => updateProp('perspective', Number(e.target.value))} />
            <SliderRow label={`Depth (3D body): ${Math.round(getProp('depth', 0))}%`} min={0} max={100} value={getProp('depth', 0)} onChange={e => updateProp('depth', Number(e.target.value))} />
        </div>
        <button onClick={() => {
            updateProp('tiltX', 0);
            updateProp('tiltY', 0);
            updateProp('perspective', 60);
            updateProp('depth', 0);
        }} className="mt-4 px-3 py-1.5 bg-[#1e2230] hover:bg-[#2a2f42] text-[10px] text-gray-300 rounded border border-[#2d3247] transition-colors max-w-max text-left">
            Reset 3D
        </button>
        <p className="text-[9px] text-gray-500 mt-2 italic flex items-start gap-1">
            <span className="text-yellow-500 text-[10px] leading-none">💡</span>
            Atau pakai handle: klik tombol "3D" di kanvas, lalu tarik ring (coral=X, teal=Y, ungu=Z).
        </p>
      </SettingGroup>

      <SettingGroup title="Depth" headerClass="text-[#a855f7] border-[#a855f7]/30">
        <ToggleRow label="Insert into background depth" checked={getProp('insertDepth', false)} onChange={e => updateProp('insertDepth', e.target.checked)} />
      </SettingGroup>
      
      {isCustomText && (
        <SettingGroup title="Animations" headerClass="text-[#a855f7] border-[#a855f7]/30">
            <div className="bg-[#11131a] border border-[#2d3247] rounded p-2 mb-2 flex justify-between items-center text-[10px]">
                <span className="text-gray-300">Animation 1 - 0s - full song</span>
                <span className="text-red-400 cursor-pointer hover:text-red-300">Delete</span>
            </div>
            <button className="bg-[#1e2230] hover:bg-[#2a2f42] text-[10px] text-gray-300 rounded border border-[#2d3247] px-3 py-1.5 transition-colors max-w-max">Add Animation</button>
        </SettingGroup>
      )}
    </>
  )};

  const renderReactiveInspector = () => {
    const sensitivityMode = getProp('sensitivityMode', 'Normal');
    
    // Apply preset values when changing mode
    const handleSensitivityModeChange = (mode) => {
        updateProp('sensitivityMode', mode);
        if (mode === 'Low') {
            updateProp('amplitude', 50); updateProp('threshold', 60); updateProp('attack', 50); updateProp('release', 300); updateProp('smoothness', 80);
        } else if (mode === 'Normal') {
            updateProp('amplitude', 100); updateProp('threshold', 35); updateProp('attack', 15); updateProp('release', 180); updateProp('smoothness', 60);
        } else if (mode === 'High') {
            updateProp('amplitude', 150); updateProp('threshold', 10); updateProp('attack', 5); updateProp('release', 100); updateProp('smoothness', 30);
        }
    };

    return (
    <>
      <SettingGroup title="Source & Operation">
        <div className="mb-2">
            <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Source Channel</label>
            <select 
                className="w-full bg-[#11131a] border border-[#2d3247] text-white text-[11px] rounded p-1 outline-none focus:border-blue-500"
                value={getProp('source', 'energy')}
                onChange={e => updateProp('source', e.target.value)}
            >
                <optgroup label="Beat">
                    <option value="beat">Beat</option>
                    <option value="beatStrength">Beat Strength</option>
                </optgroup>
                <optgroup label="Energy">
                    <option value="master">Master</option>
                    <option value="energy">Energy</option>
                </optgroup>
                <optgroup label="Frequency">
                    <option value="kick">Kick</option>
                    <option value="bass">Bass</option>
                    <option value="lowMid">Low Mid</option>
                    <option value="mid">Mid</option>
                    <option value="highMid">High Mid</option>
                    <option value="treble">Treble</option>
                    <option value="vocal">Vocal</option>
                </optgroup>
                <optgroup label="Tempo">
                    <option value="bpm">BPM</option>
                    <option value="confidence">Confidence</option>
                </optgroup>
            </select>
        </div>
        <SelectRow label="Operation" options={['multiply', 'add', 'subtract', 'clamp', 'invert', 'remap']} value={getProp('operation', 'multiply')} onChange={e => updateProp('operation', e.target.value)} />
        <SelectRow label="Curve" options={['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'impulse']} value={getProp('curve', 'easeOut')} onChange={e => updateProp('curve', e.target.value)} />
      </SettingGroup>

      <SettingGroup title="Sensitivity">
        <SelectRow label="Mode" options={['Low', 'Normal', 'High', 'Custom']} value={sensitivityMode} onChange={e => handleSensitivityModeChange(e.target.value)} />
        
        {sensitivityMode === 'Custom' && (
            <div className="mt-3 space-y-2 border-t border-[#2d3247] pt-3">
                <SliderRow label="Amplitude" min={0} max={300} value={getProp('amplitude', 100)} onChange={e => updateProp('amplitude', e.target.value)} />
                <SliderRow label="Threshold" min={0} max={100} value={getProp('threshold', 35)} onChange={e => updateProp('threshold', e.target.value)} />
                <SliderRow label="Attack (ms)" min={1} max={500} value={getProp('attack', 15)} onChange={e => updateProp('attack', e.target.value)} />
                <SliderRow label="Release (ms)" min={10} max={1000} value={getProp('release', 180)} onChange={e => updateProp('release', e.target.value)} />
                <SliderRow label="Smoothness" min={0} max={100} value={getProp('smoothness', 60)} onChange={e => updateProp('smoothness', e.target.value)} />
            </div>
        )}
      </SettingGroup>
    </>
  );
  };

  const renderBrandingInspector = () => {
    const currentAnimation = getProp('animation', 'None');
    const isDynamicAnimation = ['Fade In', 'Paragraph Reveal', 'Text Reveal', 'Cinematic Fade', 'Cinematic Typing'].includes(currentAnimation);
    const paragraphCount = getProp('paragraphCount', 1);
    
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    const isIntroOrOutro = obj && (obj.name === 'Intro Sequence' || obj.name === 'Outro Sequence');

    return (
      <>
        {!isIntroOrOutro && (
          <>
            <SettingGroup title="Transform">
              <SelectRow label="Position" options={['Center', 'Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']} value={getProp('position', 'Center')} onChange={e => updateProp('position', e.target.value)} />
              <SliderRow label="Scale" min={10} max={200} value={getProp('scale', 100)} onChange={e => updateProp('scale', e.target.value)} />
            </SettingGroup>
            <SettingGroup title="Appearance">
              <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
              <SliderRow label="Shadow" min={0} max={100} value={getProp('shadow', 50)} onChange={e => updateProp('shadow', e.target.value)} />
              <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2">
                <span>Brand Color</span>
                <input type="color" value={getProp('brandColor', '#3b82f6')} onChange={e => updateProp('brandColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
              </div>
            </SettingGroup>
          </>
        )}
        <SettingGroup title={obj?.name === 'Outro Sequence' ? 'Outro Sequence Settings' : 'Intro Sequence Settings'}>
          <ToggleRow label={obj?.name === 'Outro Sequence' ? 'Enable Outro' : 'Enable Intro'} checked={getProp('visible', true)} onChange={e => updateProp('visible', e.target.checked)} />
          <SelectRow label="Intro Style" options={['Focus Pull (Blur)', 'Fade from Black', 'Fade from White', 'Cinematic Vignette', 'Effect Blur', 'Paragraph (Text)']} value={getProp('introStyle', 'Focus Pull (Blur)')} onChange={e => updateProp('introStyle', e.target.value)} />
          
          {getProp('introStyle', 'Focus Pull (Blur)') !== 'Paragraph (Text)' && (
              <SelectRow label="Intro Duration" options={['2s', '3s', '4s', '5s', '6s', '8s', '10s']} value={getProp('introDuration', '3s')} onChange={e => updateProp('introDuration', e.target.value)} />
          )}
          
          {getProp('introStyle', 'Focus Pull (Blur)') === 'Effect Blur' ? (
              <>
                  <SliderRow label="Blur Intensity" min={0} max={100} value={getProp('intensity', 40)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                  <SliderRow label="Dark Intensity" min={0} max={100} value={getProp('darkIntensity', 100)} onChange={e => updateProp('darkIntensity', Number(e.target.value))} />
              </>
          ) : getProp('introStyle', 'Focus Pull (Blur)') === 'Paragraph (Text)' ? (
              <>
                  <SliderRow label="Bg Dark Intensity" min={0} max={100} value={getProp('darkIntensity', 100)} onChange={e => updateProp('darkIntensity', Number(e.target.value))} />
                  <SliderRow label="Bg Blur Intensity" min={0} max={100} value={getProp('blurIntensity', 40)} onChange={e => updateProp('blurIntensity', Number(e.target.value))} />
                  
                  <SelectRow label="Text Transition" options={['Handwriting (Sweep)', 'Focus Pull (Text)', 'Cinematic Tracking', 'Fade In/Out', 'Typewriter', 'Slide Up', 'Zoom In']} value={getProp('textTransition', 'Fade In/Out')} onChange={e => updateProp('textTransition', e.target.value)} />
                  <SelectRow label="Main Video Transition" options={['Fade to Video', 'Flash White', 'Blur Reveal']} value={getProp('mainTransition', 'Fade to Video')} onChange={e => updateProp('mainTransition', e.target.value)} />

                  <SelectRow label="Total Paragraphs" options={['1', '2', '3']} value={getProp('paragraphCount', '1').toString()} onChange={e => {
                      const newCount = Number(e.target.value);
                      updateProps({
                          paragraphCount: newCount,
                          duration: newCount * parseInt(getProp('paragraphDuration', '5s'))
                      });
                  }} />
                  
                  <SelectRow label="Duration per Paragraph" options={['3s', '4s', '5s', '6s', '8s', '10s']} value={getProp('paragraphDuration', '5s')} onChange={e => {
                      const newDur = e.target.value;
                      updateProps({
                          paragraphDuration: newDur,
                          duration: getProp('paragraphCount', 1) * parseInt(newDur)
                      });
                  }} />

                  <div className="mt-4 mb-2 border-t border-white/[0.05] pt-2">
                    <span className="text-[10px] font-bold text-orange-500 mb-2 block tracking-wider uppercase">TEXT CONTENT</span>
                    
                    {[...Array(getProp('paragraphCount', 1))].map((_, i) => (
                        <textarea 
                          key={i}
                          className="w-full bg-[#16181d] border border-[#2a2c33] rounded-lg p-2.5 text-[12px] text-gray-300 resize-none h-[60px] focus:outline-none focus:border-orange-500 transition-colors mb-2"
                          placeholder={`Paragraf ${i + 1}...`}
                          value={getProp(`introText${i+1}`, '')}
                          onChange={e => updateProp(`introText${i+1}`, e.target.value)}
                        />
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-gray-300 mt-1 mb-2">
                    <span>Text Color</span>
                    <input type="color" value={getProp('introTextColor', '#ffffff')} onChange={e => updateProp('introTextColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                  </div>
                  <SelectRow label="Font Family" options={['Great Vibes', 'Dancing Script', 'Pacifico', 'Playball', 'Inter', 'Oswald', 'Bebas Neue']} value={getProp('introFontFamily', 'Inter')} onChange={e => updateProp('introFontFamily', e.target.value)} />
                  <SliderRow label="Font Size" min={10} max={100} value={getProp('introFontSize', 32)} onChange={e => updateProp('introFontSize', Number(e.target.value))} />
                  <SelectRow label="Text Align" options={['left', 'center', 'right']} value={getProp('introTextAlign', 'center')} onChange={e => updateProp('introTextAlign', e.target.value)} />
              </>
          ) : (
              <SliderRow label="Effect Intensity" min={0} max={100} value={getProp('intensity', 40)} onChange={e => updateProp('intensity', Number(e.target.value))} />
          )}
        </SettingGroup>
      </>
    );
  };

  const updateRenderSetting = (key, value) => {
    if (setRenderSettings) {
      setRenderSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOutputNameChange = (val) => {
    updateRenderSetting('outputName', val);
  };

  const handleOutputNameBlur = () => {
    if (renderSettings.outputName && !renderSettings.outputName.endsWith('.mp4')) {
      updateRenderSetting('outputName', renderSettings.outputName + '.mp4');
    }
  };

  const renderRenderInspector = () => {
    const isCustom = renderSettings.videoQuality === 'Custom';

    const handleVideoQualityChange = (q) => {
      updateRenderSetting('videoQuality', q);
    };

    const handleAudioQualityChange = (q) => {
      updateRenderSetting('audioQuality', q);
    };

    return (
      <>
        <SettingGroup title="Output Name">
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Filename" 
              value={renderSettings.outputName || ''} 
              onChange={e => handleOutputNameChange(e.target.value)}
              onBlur={handleOutputNameBlur}
              className="w-full bg-[#11131a] border border-[#2d3247] rounded px-3 py-2 text-[12px] text-white font-bold outline-none focus:border-blue-500 transition-colors" 
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Video">
          <SelectRow label="Resolution" options={['720p', '1080p', '1440p', '4K']} value={renderSettings.resolution || '1080p'} onChange={e => updateRenderSetting('resolution', e.target.value)} />
          <SelectRow label="FPS" options={['24', '30', '60']} value={renderSettings.fps || '60'} onChange={e => updateRenderSetting('fps', e.target.value)} />
          <SelectRow label="Quality" options={['Draft', 'Standard', 'High', 'Ultra', 'Custom']} value={renderSettings.videoQuality || 'High'} onChange={e => handleVideoQualityChange(e.target.value)} />
        </SettingGroup>
        
        <SettingGroup title="Audio">
          <SelectRow label="Quality" options={['Standard', 'High', 'Lossless']} value={renderSettings.audioQuality || 'High'} onChange={e => handleAudioQualityChange(e.target.value)} />
        </SettingGroup>

        <div className="px-2 pb-4 mt-2">
            <details className="group bg-[#1a1d27] border border-[#2d3247] rounded overflow-hidden">
                <summary className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#2d3247] transition-colors flex justify-between items-center outline-none">
                    <span>Advanced Encoder Settings</span>
                    <span className="text-gray-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-3 bg-[#11131a] border-t border-[#2d3247]">
                    <SettingGroup title="Encoder Profile">
                        {isCustom ? (
                          <>
                            <SelectRow label="Codec" options={['H264', 'H265', 'AV1']} value={renderSettings.codec || 'H264'} onChange={e => updateRenderSetting('codec', e.target.value)} />
                            <SliderRow label="Bitrate (Mbps)" min={1} max={100} value={renderSettings.bitrate || 15} onChange={e => updateRenderSetting('bitrate', e.target.value)} />
                            <SliderRow label="CRF" min={0} max={51} value={renderSettings.crf || 23} onChange={e => updateRenderSetting('crf', e.target.value)} />
                            <SelectRow label="Pixel Format" options={['yuv420p', 'yuv422p', 'yuv444p', 'yuv420p10le', 'yuv444p10le']} value={renderSettings.pixelFormat || 'yuv420p'} onChange={e => updateRenderSetting('pixelFormat', e.target.value)} />
                            <SelectRow label="Color Space" options={['bt709', 'bt2020']} value={renderSettings.colorSpace || 'bt709'} onChange={e => updateRenderSetting('colorSpace', e.target.value)} />
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Codec</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Bitrate</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>CRF</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Pixel Format</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Color Space</span><span>(auto)</span></div>
                          </div>
                        )}
                    </SettingGroup>
                    <SettingGroup title="Hardware & Engine">
                        <SliderRow label="Threads" min={1} max={32} value={renderSettings.threads || 8} onChange={e => updateRenderSetting('threads', e.target.value)} />
                        <SelectRow label="Priority" options={['Low', 'Normal', 'High']} value={renderSettings.priority || 'Normal'} onChange={e => updateRenderSetting('priority', e.target.value)} />
                        <ToggleRow label="Hardware Encode" checked={renderSettings.hardwareEncode !== false} onChange={e => updateRenderSetting('hardwareEncode', e.target.checked)} />
                        <ToggleRow label="Hardware Decode" checked={renderSettings.hardwareDecode !== false} onChange={e => updateRenderSetting('hardwareDecode', e.target.checked)} />
                    </SettingGroup>
                </div>
            </details>
        </div>
      </>
    );
  };



  const renderParticleInspector = () => {
    const isFast = renderMode === 'FAST' || fastRenderState.isFastMode();
    return (
    <>
      {isFast && (
        <div className="mb-2 px-1">
          <FastModeBadge label="⚡ Seeded PRNG Particles (Fast Mode)" />
        </div>
      )}
      <SettingGroup title="Particle Settings">
        <SelectRow label="Shape" options={['shape_circle', 'shape_square', 'shape_triangle', 'shape_diamond', 'shape_hexagon', 'shape_star', 'shape_heart', 'shape_music_note', 'shape_lightning', 'shape_flame', 'shape_snowflake', 'shape_leaf', 'shape_feather', 'shape_bubble', 'shape_droplet', 'shape_crystal', 'shape_pixel', 'shape_ring']} value={getProp('shape', 'shape_circle')} onChange={e => updateProp('shape', e.target.value)} />
        <SelectRow label="Flow" options={['flow_static', 'flow_drift', 'flow_float', 'flow_rain', 'flow_snow', 'flow_wind_left', 'flow_wind_right', 'flow_swirl', 'flow_spiral', 'flow_orbit', 'flow_explosion', 'flow_implosion', 'flow_starfield', 'flow_pulse', 'flow_wave', 'flow_fountain']} value={getProp('flow', 'flow_float')} onChange={e => updateProp('flow', e.target.value)} />
        <SelectRow label="Trail" options={['trail_none', 'trail_fade', 'trail_glow', 'trail_light', 'trail_smoke', 'trail_fire', 'trail_energy', 'trail_rainbow', 'trail_dotted', 'trail_pixel']} value={getProp('trail', 'trail_none')} onChange={e => updateProp('trail', e.target.value)} />
      </SettingGroup>
      
      <SettingGroup title="Appearance">
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2 mb-2">
          <span>Fill Color</span>
          <input type="color" value={getProp('fillColor', '#ffffff')} onChange={e => updateProp('fillColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2 mb-2">
          <span>Stroke Color</span>
          <input type="color" value={getProp('strokeColor', '#000000')} onChange={e => updateProp('strokeColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
        <SliderRow label="Stroke Width" min={0} max={10} value={getProp('strokeWidth', 0)} onChange={e => updateProp('strokeWidth', Number(e.target.value))} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
        <SelectRow label="Blend Mode" options={['Normal', 'Screen', 'Multiply', 'Add', 'Overlay']} value={getProp('blendMode', 'Screen')} onChange={e => updateProp('blendMode', e.target.value)} />
      </SettingGroup>

      <SettingGroup title="Transform & Physics">
        <SliderRow label="Count" min={1} max={500} value={getProp('count', 50)} onChange={e => updateProp('count', Number(e.target.value))} />
        <SliderRow label="Scale" min={0.1} max={5} step={0.1} value={getProp('scale', 1.0)} onChange={e => updateProp('scale', Number(e.target.value))} />
        <ToggleRow label="Random Scale" checked={getProp('randomScale', true)} onChange={e => updateProp('randomScale', e.target.checked)} />
        <SliderRow label="Rotation" min={0} max={360} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', Number(e.target.value))} />
        <ToggleRow label="Random Rotation" checked={getProp('randomRotation', true)} onChange={e => updateProp('randomRotation', e.target.checked)} />
        <SliderRow label="Speed" min={0.1} max={5} step={0.1} value={getProp('speedMultiplier', 1.0)} onChange={e => updateProp('speedMultiplier', Number(e.target.value))} />
      </SettingGroup>
      
      <SettingGroup title="Reactivity">
        <ToggleRow label="Beat Reactive" checked={getProp('beatReactive', false)} onChange={e => updateProp('beatReactive', e.target.checked)} />
        {getProp('beatReactive', false) && (
            <SliderRow label="React Level" min={0} max={100} value={getProp('beatReactLevel', 40)} onChange={e => updateProp('beatReactLevel', Number(e.target.value))} />
        )}
      </SettingGroup>

      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete System</button>
      </div>
    </>
    );
  };


  const getInspectorCategory = () => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      if (obj) {
        if (obj.type === 'text') return 'Text Objects';
        if (obj.type === 'visualizer' || obj.type === 'visualizer2' || obj.type === 'visualizer3' || obj.type === 'visualizer4' || obj.type === 'visualizer5') return 'Visualizer';
        if (obj.type === 'image' || obj.type === 'widget' || obj.type === 'logo') return 'Overlay';
        if (obj.type === 'social-widget') return 'Social Widget';
        if (obj.type === 'background') return 'Background';
        if (obj.type === 'playlist' || obj.type === 'track_list_column') return 'Text Objects';
        if (obj.type === 'effect') return 'Effects';
        if (obj.type === 'reactive') {
            if (ALL_EFFECTS.some(e => e.presetId === obj.presetId)) return 'Effects';
            return 'Audio Reactive';
        }
        if (obj.type === 'subtitle') return 'Subtitle';
        if (obj.type === 'particle') return 'Particle';
      }
    }
    if (activeCategory && (activeCategory.toLowerCase().includes('visualizer') || activeCategory.toLowerCase().includes('visualiz'))) return 'Visualizer';
    return activeCategory;
  };

  const renderAudioSettingsInspector = () => (
    <>
      <SettingGroup title="Master Audio Settings" headerClass="text-[#f97316] border-[#f97316]/30">
        <SliderRow label="Master Volume" min={0} max={200} value={renderSettings?.masterVolume !== undefined ? renderSettings.masterVolume : 100} onChange={e => updateRenderSetting('masterVolume', Number(e.target.value))} />
        <SliderRow label="Fade In (seconds)" min={0} max={10} step={0.5} value={renderSettings?.fadeIn !== undefined ? renderSettings.fadeIn : 2} onChange={e => updateRenderSetting('fadeIn', Number(e.target.value))} />
        <SliderRow label="Fade Out (seconds)" min={0} max={10} step={0.5} value={renderSettings?.fadeOut !== undefined ? renderSettings.fadeOut : 3} onChange={e => updateRenderSetting('fadeOut', Number(e.target.value))} />
      </SettingGroup>
      <SettingGroup title="Processing" headerClass="text-[#f97316] border-[#f97316]/30">
        <ToggleRow label="Audio Normalization" checked={renderSettings?.normalizeAudio !== false} onChange={e => updateRenderSetting('normalizeAudio', e.target.checked)} />
        <ToggleRow label="Remove Silence" checked={renderSettings?.removeSilence !== false} onChange={e => updateRenderSetting('removeSilence', e.target.checked)} />
        <SliderRow label="Pitch Adjustment" min={-12} max={12} step={1} value={renderSettings?.pitch !== undefined ? renderSettings.pitch : 0} onChange={e => updateRenderSetting('pitch', Number(e.target.value))} />
      </SettingGroup>
    </>
  );

  const renderContent = () => {
    const categoryToRender = getInspectorCategory();
    if (categoryToRender && (categoryToRender.toLowerCase().includes('visualizer') || categoryToRender.toLowerCase().includes('visualiz'))) {
      return renderVisualizerInspector();
    }
    switch (categoryToRender) {
      case 'Background': return renderBackgroundInspector();
      case 'Playlist Audio': {
        const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
        if (obj && (obj.type === 'playlist' || obj.type === 'track_list_column')) {
            return renderPlaylistInspector();
        }
        return renderAudioSettingsInspector();
      }
      case 'Visualizer V5':
      case 'Visualizer V4':
      case 'Visualizer': return renderVisualizerInspector();
      case 'Visualizer 2': return renderVisualizerInspector();
      case 'Visualizer 3': return renderVisualizerInspector();
      case 'Overlay': return renderImageInspector();
      case 'Social Widget': return renderImageInspector();
      case 'Text Objects': {
        const textObj = m3Objects.find(o => o.id === m3SelectedObjectId);
        if (textObj && (textObj.type === 'playlist' || textObj.type === 'track_list_column')) {
            return renderPlaylistInspector();
        }
        return renderTextInspector();
      }
      case 'Audio Reactive': return renderReactiveInspector();
      case 'Branding': return renderBrandingInspector();
      case 'Render': return renderRenderInspector();
      case 'Lyrics':
      case 'Subtitle': return renderSubtitleInspector();
      case 'Particle': return renderParticleInspector();
      case 'Visual FX': return renderVisualFXInspector();
      case 'Effects': return renderVisualFXInspector();
      default: return <div className="text-gray-500 text-[11px] p-4 italic text-center">Select a category to view properties.</div>;
    }
  };

  return (
    <Surface variant={BackgroundVariants.Inspector} className="w-[280px] shrink-0 border-r border-[#21232d] flex flex-col h-full overflow-hidden">
      <div className="bg-[#0f1117] border-b border-[#21232d] shadow-[0_4px_15px_rgba(0,0,0,0.5)] px-4 py-3.5 flex items-center justify-between shrink-0 relative z-20">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5"></div>
        <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[12px] font-black text-gray-200 tracking-widest uppercase">Inspector</span>
        </div>
        <span className="text-[10px] bg-[#1a1c23] text-gray-400 px-2 py-0.5 rounded border border-[#2d3247] font-bold max-w-[120px] truncate uppercase relative z-10">
          {getInspectorCategory() || 'Global'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="flex flex-col gap-1">
          {(() => {
            const selectedObj = isBgContext 
              ? m3BgPool.find(b => b.id === effectiveId) 
              : m3Objects.find(o => o.id === effectiveId);
            const renderingContext = fastWorkspaceManager.getRenderingContext({ m3Objects, m3BgPool });
            const valSummary = renderingContext.getInspectorValidationSummary(selectedObj);
            return <ClassificationMetadataCard validationSummary={valSummary} />;
          })()}
          {renderContent()}
        </div>
      </div>
    </Surface>
  );
}
