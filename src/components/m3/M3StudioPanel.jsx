import React, { useState, useRef, useEffect } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import M3Toolbar from './M3Toolbar.jsx';
import M3MenuBar from './M3MenuBar.jsx';
import M3NavigationRail from './M3NavigationRail.jsx';
import M3DynamicContentPanel from './M3DynamicContentPanel.jsx';
import M3PreviewCanvas from './M3PreviewCanvas.jsx';
import M3ExportSettingsPanel from './panels/M3ExportSettingsPanel.jsx';
import M3ObjectInspector from './M3ObjectInspector.jsx';
import M3ThumbnailEditor from './M3ThumbnailEditor.jsx';
import M3PlaybackBar from './M3PlaybackBar.jsx';
import M3Statistics from './M3Statistics.jsx';
import BeatDebugOverlay from './debug/BeatDebugOverlay.jsx';
import M3SubtitleTimelinePanel from './M3SubtitleTimelinePanel.jsx';
import { projectManager } from '../../services/pipeline/project/ProjectManager';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../services/pipeline/fastrender/core/FastRenderState.js';

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
  const [analyser, setAnalyser] = useState(null);
  const [renderMode, setRenderModeState] = useState(() => {
    try {
      return fastRenderState ? fastRenderState.getMode() : 'FAST';
    } catch(e) {
      return 'FAST';
    }
  });

  const setRenderMode = (mode) => {
    try {
      const projectState = { m3BgPool, m3AudioTracks, m3Objects, m3RenderSettings };
      const result = fastWorkspaceManager.switchWorkspace(mode, projectState);
      if (result && result.adaptedState) {
        if (result.adaptedState.m3Objects) setM3Objects(result.adaptedState.m3Objects);
        if (result.adaptedState.m3BgPool) setM3BgPool(result.adaptedState.m3BgPool);
      }
    } catch(e) {
      console.error('Error switching workspace mode:', e);
    }
    setRenderModeState(mode);
  };

  useEffect(() => {
    const unsubscribe = fastWorkspaceManager.subscribe((event) => {
      if (event.type === 'WORKSPACE_SWITCH') {
        setRenderModeState(event.mode);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const handleExport = async (exportOptions = {}) => {
    const targetMode = exportOptions.renderMode || renderMode || 'FAST';
    if (onExportQueue) {
      onExportQueue({ ...exportOptions, renderMode: targetMode });
    } else if (addNotification) {
      addNotification(`⚡ Render Job Added to Queue Manager!`);
    }
  };


  const handleSetM3SelectedObjectId = (id) => {
    setM3SelectedObjectId(id);
    if (id) {
      const obj = m3Objects.find(o => o.id === id);
      if (obj) {
        if (obj.type === 'text') setActiveContextCategory('Text Objects');
        else if (obj.type === 'visualizer') setActiveContextCategory('Visualizer');
        else if (obj.type === 'image' || obj.type === 'video' || obj.type === 'gif') setActiveContextCategory('Overlay');
        else if (obj.type === 'social-widget') setActiveContextCategory('Branding');
        else if (obj.type === 'background') setActiveContextCategory('Background');
        else if (obj.type === 'playlist' || obj.type === 'track_list_column') setActiveContextCategory('Text Objects');
        else if (obj.type === 'effect') setActiveContextCategory('Overlay');
        else if (obj.type === 'particle') setActiveContextCategory('Particle');
        else if (obj.type === 'subtitle') setActiveContextCategory('Lyrics');
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative pt-0">
      {/* RENDER MODE (M5 Cyberpunk Tab Style) */}
      <div className="flex items-center justify-center shrink-0 mb-1 mt-0 relative z-50">
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => setRenderMode('NORMAL')} 
            className={`relative flex items-center justify-center pt-0.5 pb-1 transition-all duration-300 group ${
              renderMode === 'NORMAL' ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <div className="relative z-10 flex items-center">
              <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${renderMode === 'NORMAL' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                NORMAL
              </span>
            </div>
            {renderMode === 'NORMAL' && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
            )}
          </button>

          {/* Futuristic Separator */}
          <div className="flex items-center gap-1 pt-0.5 pb-1 opacity-50">
            <div className="w-1 h-1 bg-[#444] rotate-45"></div>
            <div className="w-1 h-1 bg-[#444] rotate-45"></div>
          </div>

          <button 
            onClick={() => setRenderMode('FAST')} 
            className={`relative flex items-center justify-center pt-0.5 pb-1 transition-all duration-300 group ${
              renderMode === 'FAST' ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            <div className="relative z-10 flex items-center">
              <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${renderMode === 'FAST' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                FAST
              </span>
            </div>
            {renderMode === 'FAST' && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
            )}
          </button>
        </div>
      </div>

      <Surface variant={BackgroundVariants.Default} className="flex flex-col flex-1 min-h-0 border border-[#21232d] rounded overflow-hidden shadow-2xl mb-2">
        {/* Top File Menu removed to save vertical space */}        {/* Top Toolbar */}
        <M3Toolbar 
          mode={editorMode} 
          setMode={setEditorMode} 
          renderMode={renderMode}
          setRenderMode={setRenderMode}
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
            setActiveCategory={(cat) => {
              setActiveContextCategory(cat);
              setM3SelectedObjectId(null);
            }} 
          />
          
          {/* Dynamic Content Panel */}
          <M3DynamicContentPanel 
            m3BgPool={m3BgPool} setM3BgPool={setM3BgPool}
            m3AudioTracks={m3AudioTracks} setM3AudioTracks={setM3AudioTracks}
            m3CurrentTrackIndex={m3CurrentTrackIndex}
            m3Objects={m3Objects} setM3Objects={setM3Objects}
            setM3SelectedObjectId={handleSetM3SelectedObjectId}
            canvasMode={editorMode === 'Composer' ? 'composer' : 'thumbnail'}
            editorMode={editorMode}
            activeContextCategory={activeContextCategory}
          />
          
          {/* Left-Middle Panel: Object Inspector */}
          <M3ObjectInspector 
            m3Objects={m3Objects}
            setM3Objects={setM3Objects}
            m3BgPool={m3BgPool}
            setM3BgPool={setM3BgPool}
            m3SelectedObjectId={m3SelectedObjectId}
            activeCategory={activeContextCategory}
            renderSettings={m3RenderSettings}
            setRenderSettings={setM3RenderSettings}
          />
          
          {/* Right Panel: Live Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
            {editorMode === 'Composer' ? (
              <>
                <M3PreviewCanvas 
                  m3BgPool={m3BgPool} 
                m3AudioTracks={m3AudioTracks}
                m3Objects={m3Objects} 
                setM3Objects={setM3Objects}
                m3SelectedObjectId={m3SelectedObjectId}
                setM3SelectedObjectId={handleSetM3SelectedObjectId}
                m3CurrentTimeSec={m3CurrentTimeSec}
                m3TotalDurationSec={m3TotalDurationSec}
                setM3CurrentTimeSec={setM3CurrentTimeSec}
                m3CurrentTrackIndex={m3CurrentTrackIndex}
                setM3CurrentTrackIndex={setM3CurrentTrackIndex}
                m3EstRenderTimeSec={m3EstRenderTimeSec}
                m3EstStorageMb={m3EstStorageMb}
                analyser={analyser}
              >
                <div className="w-full bg-[#0a0a0a] border border-[#1a1b26] rounded-b-lg overflow-hidden shadow-lg mb-1">
                  <M3PlaybackBar
                    m3AudioTracks={m3AudioTracks}
                    currentTimeSec={m3CurrentTimeSec}
                    setCurrentTimeSec={setM3CurrentTimeSec}
                    currentTrackIndex={m3CurrentTrackIndex}
                    setCurrentTrackIndex={setM3CurrentTrackIndex}
                    onAnalyserReady={setAnalyser}
                  />
                </div>
                
                {/* Export Settings added directly under playback bar */}
                <M3ExportSettingsPanel renderMode={renderMode} onAddToQueue={(opts) => handleExport(opts)} />

              </M3PreviewCanvas>
              </>
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


          </div>

        </div>
        
        {editorMode === 'Composer' && (activeContextCategory === 'Lyrics' || m3Objects.some(o => o.type === 'subtitle' || o.type === 'lyrics')) && (
          <M3SubtitleTimelinePanel 
            m3CurrentTimeSec={m3CurrentTimeSec}
            setM3CurrentTimeSec={setM3CurrentTimeSec}
            m3TotalDurationSec={m3TotalDurationSec}
          />
        )}
      </Surface>

      {/* Global Debug HUD - Moved OUTSIDE of Surface to avoid overflow-hidden clipping */}
      <BeatDebugOverlay />
    </div>
  );
}
