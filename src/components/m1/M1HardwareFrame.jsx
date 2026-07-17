import React from 'react';

export default function M1HardwareFrame({ children }) {
  return (
    <div className="relative w-full max-w-[1600px] flex-1 flex flex-col mx-auto z-10 px-2 py-1 min-h-0">
      
      {/* ─── HUD CYBERNETIC VECTOR FRAME (REMOVED) ─── */}

      {/* ─── EXPANDED CONTENT AREA ─── */}
      <div className="relative z-10 flex-1 flex flex-col p-1 min-h-0 overflow-hidden">
        {children}
      </div>

    </div>
  );
}
