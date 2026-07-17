import React, { useState, useEffect } from 'react';
import M5CreateView from './M5CreateView.jsx';

export default function M5StudioPanel({ m5Queue = [], setM5Queue = () => {}, activeWorkspace = 'default' }) {
  // Fetch and SSE logic moved to App.jsx to ensure global persistence

  return (
    <div className="h-full w-full flex flex-col flex-1 min-h-0 bg-transparent text-[#c9d1d9] font-sans antialiased px-1 pb-0 pt-0 relative overflow-hidden">
      {/* Background Radial Glow (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-900/10 blur-[120px] pointer-events-none rounded-full z-0"></div>

      {/* Content Area - Only Create View */}
      <div className="flex-1 overflow-hidden relative">
         <M5CreateView m5Queue={m5Queue} setM5Queue={setM5Queue} activeWorkspace={activeWorkspace} />
      </div>
    </div>
  );
}
