import React, { useState, useRef, useEffect } from 'react';

export default function M1Select({ label, value, onChange, options, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col shrink-0 ${className}`} ref={ref}>
      {label && (
        <label className="font-['Rajdhani'] font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-2">
          <span className="w-1 h-1 bg-gray-600 rounded-sm"></span>
          {label}
        </label>
      )}
      <div className="relative w-full">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-[var(--m1-height-control)] bg-[var(--m1-bg-input)] border rounded-[var(--m1-radius-control)] px-3 text-xs font-['Inter'] text-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex justify-between items-center transition-all focus:outline-none ${isOpen ? 'border-[var(--m1-border-focus)] shadow-[0_0_15px_rgba(249,115,22,0.2),inset_0_2px_10px_rgba(0,0,0,0.9)] bg-[#07090c]' : 'border-[var(--m1-border-primary)] hover:border-orange-500/30'}`}
        >
          <span className="truncate pr-2">{options.find(o => o.value === value)?.label || value}</span>
          
          {/* Mechanical Chevron */}
          <div className="w-5 h-5 flex items-center justify-center bg-[#1a1b23] rounded-sm border border-[#2d3247] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
            <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--m1-accent-orange)]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-[var(--m1-bg-panel)] border border-[var(--m1-border-interactive)] rounded-[var(--m1-radius-control)] shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 font-['Inter'] text-xs transition-colors border-l-2 ${value === opt.value ? 'bg-[#1a0b05] text-[var(--m1-accent-orange)] font-bold border-[var(--m1-border-focus)]' : 'text-gray-300 hover:bg-[var(--m1-bg-surface)] hover:text-white border-transparent'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
