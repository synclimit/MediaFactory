import React, { useState } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3PreviewCanvas from './M3PreviewCanvas.jsx';

export default function M3ThumbnailEditor({ m3BgPool, m3AudioTracks, m3ThumbnailSaved, setM3ThumbnailSaved, addNotification, m3Objects, setM3Objects, m3SelectedObjectId, setM3SelectedObjectId }) {
  const onSaveTemplate = () => {
    if (addNotification) addNotification('Template Saved', 'Template berhasil disimpan.');
  };

  const onSaveThumbnail = () => {
    setM3ThumbnailSaved(true);
    if (addNotification) addNotification('Thumbnail Saved', 'Thumbnail berhasil disimpan.');
  };
  return (
    <Surface variant={BackgroundVariants.ThumbnailEditor} className="flex-1 flex flex-col relative overflow-hidden">
      
      {/* Secondary Toolbar for Thumbnail */}
      <div className="bg-[#12131a] border-b border-[#21232d] p-2 flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          <button onClick={() => setM3ThumbnailSaved(false)} className="px-3 py-1 bg-[#2563eb] hover:bg-[#3b82f6] text-white text-[11px] rounded shadow transition-colors">
            🖼️ Generate Layout
          </button>
          <button onClick={() => setM3ThumbnailSaved(false)} className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 text-[11px] rounded border border-[#2d3247] transition-colors">
            📥 Import Image
          </button>
        </div>
        <div className="flex gap-2">

          <button title="Saves layout, font, position, style (Excludes Thumbnail/Playlist/Audio)" onClick={onSaveTemplate} className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 text-[11px] rounded border border-[#2d3247] transition-colors">
            💾 Save Template
          </button>
          <button onClick={onSaveThumbnail} className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold rounded shadow transition-colors">
            💾 Save Thumbnail
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <M3PreviewCanvas 
        m3BgPool={m3BgPool} 
        m3AudioTracks={m3AudioTracks}
        m3Objects={m3Objects}
        setM3Objects={setM3Objects}
        m3SelectedObjectId={m3SelectedObjectId}
        setM3SelectedObjectId={setM3SelectedObjectId}
        canvasMode="thumbnail"
      />
    </Surface>
  );
}
