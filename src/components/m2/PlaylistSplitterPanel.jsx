import React from 'react';
import SplitterWorkspace from './SplitterWorkspace.jsx';

export default function PlaylistSplitterPanel({ isDevMode, addLog, addNotification }) {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-hidden bg-[#111318] z-10 relative">
      {/* Panel A (Left) */}
      <SplitterWorkspace 
        panelId="A" 
        isDevMode={isDevMode} 
        addLog={addLog} 
        addNotification={addNotification} 
      />
      
      {/* Panel B (Right) */}
      <SplitterWorkspace 
        panelId="B" 
        isDevMode={isDevMode} 
        addLog={addLog} 
        addNotification={addNotification} 
      />
    </div>
  );
}
