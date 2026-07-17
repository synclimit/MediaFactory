import React from 'react';

export default function M1Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const baseClasses = "relative h-[var(--m1-height-control)] flex items-center justify-center gap-2 px-6 font-['Rajdhani'] font-bold text-[11px] uppercase tracking-[0.2em] rounded-[var(--m1-radius-control)] transition-all overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-gradient-to-b from-[#1a0b05] to-[#120703] hover:from-[#2a1308] hover:to-[#1a0b05] text-[var(--m1-accent-orange)] border border-[var(--m1-border-interactive)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_0_15px_rgba(249,115,22,0.15)]",
    secondary: "bg-gradient-to-b from-[#1a1b23] to-[#0c0d12] hover:from-[#2d3247] hover:to-[#1a1b23] text-gray-300 border border-[#2d3247] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_5px_10px_rgba(0,0,0,0.5)]",
    success: "bg-gradient-to-b from-emerald-950 to-[#0c0d12] hover:from-emerald-900 hover:to-emerald-950 text-emerald-400 border border-emerald-500/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_0_15px_rgba(16,185,129,0.15)]"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
      
      {/* Glossy top bevel */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-10 pointer-events-none"></div>
    </button>
  );
}
