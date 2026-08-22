import React from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3PreviewCanvas from './M3PreviewCanvas.jsx';
import M3ExportSettingsPanel from './panels/M3ExportSettingsPanel.jsx';

export default function M3ThumbnailEditor({
  m3BgPool,
  m3AudioTracks,
  m3ThumbnailSaved,
  setM3ThumbnailSaved,
  addNotification,
  m3Objects,
  setM3Objects,
  m3SelectedObjectId,
  setM3SelectedObjectId,
  renderMode = 'FAST',
  outputFilename,
  setOutputFilename,
  onExportQueue
}) {
  const onSaveThumbnail = () => {
    if (setM3ThumbnailSaved) setM3ThumbnailSaved(true);
    if (addNotification) addNotification('Thumbnail Saved', 'Thumbnail berhasil disimpan.');
  };

  return (
    <Surface variant={BackgroundVariants.ThumbnailEditor} className="flex-1 flex flex-col relative overflow-hidden">
      {/* Secondary Toolbar for Thumbnail */}
      <div className="bg-[#12131a] border-b border-[#21232d] p-2 flex justify-between items-center shrink-0">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
            🖼️ YOUTUBE THUMBNAIL CREATOR (STATIC PNG/IMAGE)
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={onSaveThumbnail} className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold rounded shadow transition-colors flex items-center gap-1">
            💾 Save Thumbnail PNG
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <M3PreviewCanvas 
          m3BgPool={m3BgPool} 
          m3AudioTracks={m3AudioTracks}
          m3Objects={m3Objects}
          setM3Objects={setM3Objects}
          m3SelectedObjectId={m3SelectedObjectId}
          setM3SelectedObjectId={setM3SelectedObjectId}
          canvasMode="thumbnail"
        />
      </div>

      {/* Export Settings Panel (Image 2 Parity) */}
      <div className="bg-[#0a0a0a] border-t border-[#1a1b26] shrink-0">
        <M3ExportSettingsPanel
          renderMode={renderMode}
          isThumbnailMode={true}
          outputFilename={outputFilename}
          setOutputFilename={setOutputFilename}
          onAddToQueue={(opts) => {
            if (onExportQueue) {
              onExportQueue({ ...opts, isThumbnail: true });
            } else if (addNotification) {
              addNotification('Thumbnail Export Added to Queue');
            }
          }}
        />
      </div>
    </Surface>
  );
}
