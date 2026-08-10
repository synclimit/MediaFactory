import React from 'react';

export function SettingGroup({ title, children }) {
  return (
    <div className="m1-glass-card border border-white/5 bg-black/20 rounded-xl p-4 mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:border-white/10 backdrop-blur-md">
      <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2 m1-text-orange-glow">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,1)]"></div>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center justify-between cursor-pointer text-[11px] transition-colors group ${disabled ? 'opacity-50 pointer-events-none' : 'text-gray-300 hover:text-white'}`}>
      <span className="tracking-wide">{label}</span>
      <div className="relative flex items-center">
        <input type="checkbox" className="sr-only peer" checked={checked || false} onChange={onChange} disabled={disabled} />
        <div className="w-9 h-5 bg-black/40 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-500 peer-checked:after:bg-orange-500 after:border-transparent after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:border-orange-500/50 peer-checked:bg-orange-950/40 peer-checked:shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
      </div>
    </label>
  );
}

export function SliderRow({ label, min = 0, max = 100, step, value = 50, onChange, disabled }) {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : 'group'}`}>
      <div className="flex justify-between text-[10px] text-gray-400 group-hover:text-orange-300 transition-colors">
        <span className="tracking-wide uppercase text-[9px]">{label}</span>
        <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{Number(value).toFixed(step && step < 1 ? 1 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className="w-full accent-orange-500 h-1 bg-black/50 rounded-lg appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-orange-500/50" />
    </div>
  );
}

export function SelectRow({ label, options, value, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 pointer-events-none' : 'group'}`}>
      <span className="text-[11px] text-gray-300 group-hover:text-orange-300 transition-colors tracking-wide">{label}</span>
      <select className="m1-input-glass text-[10px] text-gray-200 rounded px-2 py-1.5 outline-none w-32 focus:border-orange-500 transition-colors cursor-pointer" value={value} onChange={onChange} disabled={disabled}>
        {options.map(opt => {
          if (typeof opt === 'object' && opt !== null) {
            return <option key={opt.value} value={opt.value} className="bg-[#11131a]">{opt.label}</option>;
          }
          return <option key={opt} value={opt} className="bg-[#11131a]">{opt}</option>;
        })}
      </select>
    </div>
  );
}

export function ButtonGroup({ label, options, active = options[0], onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange && onChange(opt)} className={`px-3 py-1.5 text-[10px] rounded-full transition-all duration-300 ${opt === active ? 'bg-orange-500 text-black font-bold shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-black/40 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
