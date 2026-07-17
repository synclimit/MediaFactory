import React from 'react';

export default function M4Toolbar({ mode, setMode, m4ThumbnailSaved = false, addNotification }) {
  return (
    <div className="bg-[#12131a] border-b border-[#21232d] p-2 flex justify-between items-center shrink-0">
      <div className="flex gap-4 items-center">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-2 border-r border-[#21232d] pr-4">Ambient Studio</span>
        
        {/* Validation Badges */}
        <div className="flex gap-3 text-[9px] font-bold">
          <span className="text-emerald-400">🟢 Bg Ready</span>
          <span className="text-emerald-400">🟢 Audio Ready</span>
          <span className={m4ThumbnailSaved ? 'text-emerald-400' : 'text-amber-400'}>{m4ThumbnailSaved ? '🟢' : '🟡'} Thumb Ready</span>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* Mode Switcher */}
        <div className="flex bg-[#0c0d12] rounded border border-[#2d3247] overflow-hidden mr-4">
          <button 
            onClick={() => setMode('Composer')}
            className={`px-4 py-1 text-[11px] font-medium transition-colors ${mode === 'Composer' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c23]'}`}
          >
            Composer
          </button>
          <button 
            onClick={() => setMode('Thumbnail')}
            className={`px-4 py-1 text-[11px] font-medium transition-colors ${mode === 'Thumbnail' ? 'bg-[#2563eb] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c23]'}`}
          >
            Thumbnail
          </button>
        </div>

        <div className="flex items-center gap-2 border-r border-[#2d3247] pr-2 mr-1">
          <button onClick={() => { if(addNotification) addNotification('Template Saved', 'Template has been saved.') }} className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 text-[11px] rounded border border-[#2d3247] transition-colors mr-2">
            💾 Save Template
          </button>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Template</span>
          <select className="bg-[#0c0d12] border border-[#2d3247] rounded px-2 py-0.5 text-[10px] text-gray-300">
            <option>Default Ambient</option>
            <option>Rainy Window</option>
            <option>Cozy Cabin</option>
            <option>Neon City</option>
          </select>
          <button onClick={() => { if(addNotification) addNotification('Template Applied', `${mode} layout has been updated.`) }} className="px-2 py-0.5 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 text-[10px] rounded border border-[#2d3247] transition-colors">Apply</button>
        </div>

        <select className="bg-[#181922] border border-[#2d3247] rounded p-1 text-[11px] text-gray-300 focus:outline-none">
          <option>Preview: Fit</option>
          <option>Preview: 25%</option>
          <option>Preview: 50%</option>
          <option>Preview: 100%</option>
        </select>
      </div>
    </div>
  );
}
