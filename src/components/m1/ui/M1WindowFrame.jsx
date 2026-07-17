import React from 'react';
import M1CornerBracket from './M1CornerBracket';

export default function M1WindowFrame({ children, className = '' }) {
  const clip = 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)';
  
  return (
    <div className={`relative ${className} drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]`}>
      
      {/* Outer Border Layer (Clipped) */}
      <div className="absolute inset-0 pointer-events-none z-0" 
           style={{ background: 'linear-gradient(135deg, #3a3f58 0%, #1a1b23 100%)', clipPath: clip }}>
      </div>

      {/* Inner Housing Background (Clipped, slightly inset to create border) */}
      <div className="absolute inset-[1.5px] bg-[#07090c] pointer-events-none z-0" 
           style={{ clipPath: clip }}>
        
        {/* Brushed Metal Texture */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
             style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }}></div>
        
        {/* Orange Rim Light at the top */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/80 to-transparent"></div>
      </div>

      {/* Corner Brackets (Unclipped! Hovering over the chamfer) */}
      <M1CornerBracket position="top-left" />
      <M1CornerBracket position="top-right" />
      <M1CornerBracket position="bottom-left" />
      <M1CornerBracket position="bottom-right" />

      {/* Structural Content Area (Clipped to prevent content overflowing the chamfer) */}
      <div className="relative z-10 flex flex-col w-full h-full rounded-lg overflow-hidden" style={{ clipPath: clip }}>
        {children}
      </div>
    </div>
  );
}
