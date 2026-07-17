import React from 'react';
import M4PreviewCanvas from './M4PreviewCanvas.jsx';

export default function M4ThumbnailEditor({ m4ThumbnailSaved, setM4ThumbnailSaved, addNotification, m4Objects, setM4Objects, m4SelectedObjectId, setM4SelectedObjectId }) {
  const handleSave = () => {
    setM4ThumbnailSaved(true);
    if(addNotification) addNotification('Thumbnail Saved', 'Thumbnail ready for render.');
  };

  return (
    <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded font-bold shadow text-xs">
          💾 Save Thumbnail
        </button>
      </div>
      <M4PreviewCanvas 
        m4Objects={m4Objects} 
        setM4Objects={setM4Objects}
        m4SelectedObjectId={m4SelectedObjectId}
        setM4SelectedObjectId={setM4SelectedObjectId}
        canvasMode="thumbnail"
      />
    </div>
  );
}
