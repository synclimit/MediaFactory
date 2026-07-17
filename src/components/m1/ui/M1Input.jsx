import React from 'react';

export default function M1Input({ label, value, onChange, placeholder, type = "text", readOnly = false, className = '' }) {
  return (
    <div className={`flex flex-col shrink-0 ${className}`}>
      {label && (
        <label className="font-['Rajdhani'] font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-2">
          <span className="w-1 h-1 bg-gray-600 rounded-sm"></span>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full h-[var(--m1-height-control)] bg-[var(--m1-bg-input)] border border-[var(--m1-border-primary)] rounded-[var(--m1-radius-control)] px-3 text-xs font-['Inter'] text-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] transition-all focus:outline-none focus:border-[var(--m1-border-focus)] focus:bg-[#07090c] ${readOnly ? 'opacity-80' : ''}`}
        />
        {/* Decorative corner cut illusion */}
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--m1-border-primary)] rounded-br-[var(--m1-radius-control)] pointer-events-none opacity-50"></div>
      </div>
    </div>
  );
}
