import React from 'react';

export default function M1MechanicalPanel({ children, className = '' }) {
  return (
    <div className={`relative bg-[#0a0c10] border border-[#1a1b23] shadow-[inset_0_5px_20px_rgba(0,0,0,0.5)] ${className}`}>
      {/* Engraved decorative corner marks */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#2d3247] pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#2d3247] pointer-events-none"></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#2d3247] pointer-events-none"></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#2d3247] pointer-events-none"></div>
      
      {/* Subtle Inner Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.02] pointer-events-none"></div>

      {/* Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
