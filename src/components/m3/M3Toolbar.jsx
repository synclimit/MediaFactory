import React from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';

export default function M3Toolbar({ mode, setMode, m3BgPool = [], m3AudioTracks = [], m3ThumbnailSaved = false, m3Objects = [], addNotification }) {
  const isBgReady = m3BgPool.length > 0;
  const isPlaylistReady = m3AudioTracks.length > 0;
  const isComposerReady = m3Objects.length > 0;

  return (
    <Surface variant={BackgroundVariants.Toolbar} className="border-b border-[#21232d] p-2 flex justify-between items-center shrink-0">
      <div className="flex gap-4 items-center">
        {/* Intentionally left blank to push the right menu */}
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
      </div>
    </Surface>
  );
}
