import React from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { fastRenderState, RENDER_MODES } from '../../services/pipeline/fastrender/core/FastRenderState';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager';

export default function M3Toolbar({ mode, setMode, renderMode = 'NORMAL', setRenderMode, m3BgPool = [], m3AudioTracks = [], m3ThumbnailSaved = false, m3Objects = [], addNotification, onOpenInspector }) {
  const isBgReady = m3BgPool.length > 0;
  const isPlaylistReady = m3AudioTracks.length > 0;
  const isComposerReady = m3Objects.length > 0;

  const isFastMode = renderMode === 'FAST' || fastWorkspaceManager.isFastWorkspaceActive();

  const handleToggleRenderMode = (newMode) => {
    fastWorkspaceManager.switchWorkspace(newMode, { m3BgPool, m3AudioTracks, m3Objects });
    if (setRenderMode) {
      setRenderMode(newMode);
    }
    if (addNotification) {
      addNotification(newMode === 'FAST' ? '⚡ Fast Workspace Active' : '🎬 Normal Workspace Active');
    }
  };

  const renderingContext = fastWorkspaceManager.getRenderingContext({ m3BgPool, m3AudioTracks, m3Objects });
  const validationFeedback = renderingContext.getBoundaryValidationFeedback();

  return (
    <Surface variant={BackgroundVariants.Toolbar} className="border-b border-[#21232d] p-2 flex justify-between items-center shrink-0">
      <div className="flex gap-4 items-center">
        {renderingContext.isFastWorkspace && (
          <div className="flex items-center gap-2 bg-[#121824] border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_6px_#f97316]"></span>
            <span>⚡ FAST WORKSPACE ({validationFeedback.score}% VALID)</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        {/* Diagnostic Inspector Button */}
        <button
          onClick={onOpenInspector}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] px-3 py-1 rounded shadow-[0_0_12px_rgba(6,182,212,0.6)] flex items-center gap-1.5 transition-all mr-2"
        >
          <span>🔍 DIAGNOSTIC INSPECTOR</span>
        </button>

        {/* Mode Switcher (Composer vs Thumbnail) */}
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

