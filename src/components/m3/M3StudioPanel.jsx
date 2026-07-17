import React, { useState, useRef, useEffect } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3Toolbar from './M3Toolbar.jsx';
import M3MenuBar from './M3MenuBar.jsx';
import M3NavigationRail from './M3NavigationRail.jsx';
import M3DynamicContentPanel from './M3DynamicContentPanel.jsx';
import M3PreviewCanvas from './M3PreviewCanvas.jsx';
import M3ObjectInspector from './M3ObjectInspector.jsx';
import M3ThumbnailEditor from './M3ThumbnailEditor.jsx';
import M3Statistics from './M3Statistics.jsx';
import BeatDebugOverlay from './debug/BeatDebugOverlay.jsx';
import M3SubtitleTimelinePanel from './M3SubtitleTimelinePanel.jsx';
import { projectManager } from '../../services/pipeline/project/ProjectManager';

export default function M3StudioPanel({
  m3ProfileId, setM3ProfileId,
  m3BgPool, setM3BgPool,
  m3AudioTracks, setM3AudioTracks,
  m3MotionPreset, setM3MotionPreset,
  m3RenderSettings, setM3RenderSettings,
  m3OutputFilename, setM3OutputFilename,
  m3OverlayWatermark, setM3OverlayWatermark,
  m3OverlaySub, setM3OverlaySub,
  m3OverlayPlaylist, setM3OverlayPlaylist,
  m3OverlayCurrent, setM3OverlayCurrent,
  m3OverlayCounter, setM3OverlayCounter,
  m3OverlayNotify, setM3OverlayNotify,
  m3OverlaySpectrumStyle, setM3OverlaySpectrumStyle,
  m3TotalDurationSec, m3EstRenderTimeSec, m3EstStorageMb,
  m3ThumbnailSaved, setM3ThumbnailSaved,
  m3Objects, setM3Objects,
  m3SelectedObjectId, setM3SelectedObjectId,
  addNotification,
  onExportQueue
}) {
  const [editorMode, setEditorMode] = useState('Composer'); // Composer | Thumbnail
  const [m3CurrentTimeSec, setM3CurrentTimeSec] = useState(0);
  const [m3CurrentTrackIndex, setM3CurrentTrackIndex] = useState(0);
  const [activeContextCategory, setActiveContextCategory] = useState('Background');

  // Simple Undo/Redo for m3Objects
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    const currentObjectsStr = JSON.stringify(m3Objects);
    if (historyIndex >= 0 && currentObjectsStr === history[historyIndex]) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentObjectsStr);
    if (newHistory.length > 50) newHistory.shift(); // Limit to 50
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [m3Objects]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex - 1);
      setM3Objects(JSON.parse(history[historyIndex - 1]));
      addNotification('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex + 1);
      setM3Objects(JSON.parse(history[historyIndex + 1]));
      addNotification('Redo');
    }
  };

  const getProjectState = () => ({
    m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings
  });

  const handleNew = () => {
    setM3BgPool([]); setM3AudioTracks([]); setM3Objects([]);
    projectManager.createProject('Untitled Project');
    addNotification('New Project Created');
  };

  const handleOpen = (id) => {
    const data = projectManager.openProject(id);
    if (data) {
      setM3BgPool(data.m3BgPool || []);
      setM3AudioTracks(data.m3AudioTracks || []);
      setM3Objects(data.m3Objects || []);
      setM3RenderSettings(data.m3RenderSettings || m3RenderSettings);
      addNotification('Project Opened');
    }
  };

  const handleSave = () => {
    projectManager.saveProject(getProjectState());
    addNotification('Project Saved');
  };

  const handleSaveAs = () => {
    const name = window.prompt("Project Name:");
    if (name) {
      projectManager.saveAs(name, getProjectState());
      addNotification('Project Saved As ' + name);
    }
  };

  const handleExport = (format) => {
    if (onExportQueue) {
      onExportQueue();
    } else {
      addNotification(`Exporting as ${format}...`);
    }
  };

  return (
    <>
      <Surface variant={BackgroundVariants.Default} className="flex flex-col flex-1 min-h-0 border border-[#21232d] rounded overflow-hidden shadow-2xl mb-2">
        {/* Top File Menu */}
        <M3MenuBar 
          onNew={handleNew}
          onOpen={handleOpen}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={() => addNotification('Copied')}
          onPaste={() => addNotification('Pasted')}
          onDelete={() => addNotification('Deleted')}
          onExport={handleExport}
          addNotification={addNotification}
        />

        {/* Top Toolbar */}
        <M3Toolbar 
          mode={editorMode} 
          setMode={setEditorMode} 
          m3BgPool={m3BgPool} 
          m3AudioTracks={m3AudioTracks} 
          m3ThumbnailSaved={m3ThumbnailSaved}
          m3Objects={m3Objects}
          addNotification={addNotification}
        />
        
        {/* Main Studio Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Navigation Rail */}
          <M3NavigationRail 
            activeCategory={activeContextCategory} 
            setActiveCategory={setActiveContextCategory} 
          />
          
          {/* Dynamic Content Panel */}
          <M3DynamicContentPanel 
            m3BgPool={m3BgPool} setM3BgPool={setM3BgPool}
            m3AudioTracks={m3AudioTracks} setM3AudioTracks={setM3AudioTracks}
            m3CurrentTrackIndex={m3CurrentTrackIndex}
            m3Objects={m3Objects} setM3Objects={setM3Objects}
            setM3SelectedObjectId={setM3SelectedObjectId}
            canvasMode={editorMode === 'Composer' ? 'thumbnail' : 'thumbnail'} // actually, let's keep original code
            activeContextCategory={activeContextCategory}
          />
          
          {/* Left-Middle Panel: Object Inspector */}
          {editorMode === 'Composer' && (
            <M3ObjectInspector 
              m3Objects={m3Objects}
              setM3Objects={setM3Objects}
              m3SelectedObjectId={m3SelectedObjectId}
              activeCategory={activeContextCategory}
              renderSettings={m3RenderSettings}
              setRenderSettings={setM3RenderSettings}
            />
          )}
          
          {/* Right Panel: Live Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
            {editorMode === 'Composer' ? (
              <M3PreviewCanvas 
                m3BgPool={m3BgPool} 
                m3AudioTracks={m3AudioTracks}
                m3Objects={m3Objects} 
                setM3Objects={setM3Objects}
                m3SelectedObjectId={m3SelectedObjectId}
                setM3SelectedObjectId={setM3SelectedObjectId}
                m3CurrentTimeSec={m3CurrentTimeSec}
                m3TotalDurationSec={m3TotalDurationSec}
                setM3CurrentTimeSec={setM3CurrentTimeSec}
                m3CurrentTrackIndex={m3CurrentTrackIndex}
                setM3CurrentTrackIndex={setM3CurrentTrackIndex}
                m3EstRenderTimeSec={m3EstRenderTimeSec}
                m3EstStorageMb={m3EstStorageMb}
              />
            ) : (
              <M3ThumbnailEditor 
                m3BgPool={m3BgPool} 
                m3AudioTracks={m3AudioTracks}
                m3ThumbnailSaved={m3ThumbnailSaved} 
                setM3ThumbnailSaved={setM3ThumbnailSaved} 
                addNotification={addNotification}
                m3Objects={m3Objects}
                setM3Objects={setM3Objects}
                m3SelectedObjectId={m3SelectedObjectId}
                setM3SelectedObjectId={setM3SelectedObjectId}
              />
            )}
            {editorMode === 'Composer' && (
              <M3Statistics 
                m3TotalDurationSec={m3TotalDurationSec}
                m3EstRenderTimeSec={m3EstRenderTimeSec}
                m3EstStorageMb={m3EstStorageMb}
              />
            )}
          </div>

        </div>
        
        {editorMode === 'Composer' && (
          <M3SubtitleTimelinePanel 
            m3CurrentTimeSec={m3CurrentTimeSec}
            setM3CurrentTimeSec={setM3CurrentTimeSec}
            m3TotalDurationSec={m3TotalDurationSec}
          />
        )}
      </Surface>

      {/* Global Debug HUD - Moved OUTSIDE of Surface to avoid overflow-hidden clipping */}
      <BeatDebugOverlay />
    </>
  );
}
