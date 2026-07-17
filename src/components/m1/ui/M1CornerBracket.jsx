import React from 'react';

export default function M1CornerBracket({ position }) {
  const posClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 scale-x-[-1]',
    'bottom-left': 'bottom-0 left-0 scale-y-[-1]',
    'bottom-right': 'bottom-0 right-0 scale-x-[-1] scale-y-[-1]'
  }[position];

  return (
    <div className={`absolute w-12 h-12 pointer-events-none z-20 ${posClasses}`}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {/* Chamfer body */}
        <path d="M0 16 L16 0 L32 0 L32 2 L17 2 L2 17 L2 32 L0 32 Z" fill="#2d3247" />
        {/* Subtle highlights */}
        <path d="M16 0 L32 0 L32 1 L16.5 1 Z" fill="#f97316" />
        <path d="M0 16 L0 32 L1 32 L1 16.5 Z" fill="#f97316" />
        {/* Bolt detail */}
        <circle cx="10" cy="10" r="1.5" fill="#f97316" opacity="0.8" />
        {/* Engraved joint */}
        <path d="M10 2 L10 7" stroke="#1a1b23" strokeWidth="1" />
        <path d="M2 10 L7 10" stroke="#1a1b23" strokeWidth="1" />
      </svg>
    </div>
  );
}
