import React, { useState } from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import BackgroundPanel from './panels/BackgroundPanel';
import PlaylistPanel from './panels/PlaylistPanel';
import VisualizerPanel from './panels/VisualizerPanel';
import EffectsPanel from './panels/EffectsPanel';
import OverlayPanel from './panels/OverlayPanel';
import TextPanel from './panels/TextPanel';
import ReactivePanel from './panels/ReactivePanel';
import BrandingPanel from './panels/BrandingPanel';
import ParticlesPanel from './panels/ParticlesPanel';
import LyricsPanel from './panels/LyricsPanel';
import VisualizerV4Panel from './panels/VisualizerV4Panel';
import { ThumbnailCard, GridThumbnail } from '../ui/Thumbnails';

// Thumbnails are now imported from ../ui/Thumbnails.jsx

export default function M3DynamicContentPanel({
  m3BgPool, setM3BgPool, 
  m3AudioTracks, setM3AudioTracks, 
  m3CurrentTrackIndex,
  m3Objects, setM3Objects, 
  m3SelectedObjectId, setM3SelectedObjectId, 
  canvasMode, 
  editorMode,
  activeContextCategory 
}) {
  // Generic Object Adder
  const addObject = (props) => {
    const id = props.type + '-' + Date.now();
    setM3Objects([...m3Objects, { id, canvasMode: editorMode === 'Thumbnail' ? 'thumbnail' : 'composer', visible: true, locked: false, layer: m3Objects.length, ...props }]);
    setM3SelectedObjectId(id);
  };

  const renderBackground = () => (
    <BackgroundPanel 
        addObject={addObject} 
        m3Objects={m3Objects || []} 
        setM3Objects={setM3Objects} 
        m3BgPool={m3BgPool}
        setM3BgPool={setM3BgPool}
        m3SelectedObjectId={m3SelectedObjectId} 
        setM3SelectedObjectId={setM3SelectedObjectId} 
    />
  );

  const renderPlaylistAudio = () => (
    <PlaylistPanel m3AudioTracks={m3AudioTracks} setM3AudioTracks={setM3AudioTracks} m3CurrentTrackIndex={m3CurrentTrackIndex} />
  );

  const renderVisualizer = () => <VisualizerPanel addObject={addObject} />;
  const renderVisualizer2 = () => <Visualizer2Panel addObject={addObject} />;
  const renderVisualizer3 = () => <Visualizer3Panel addObject={addObject} />;
  const renderParticle = () => <ParticlesPanel addObject={addObject} m3Objects={m3Objects || []} setM3Objects={setM3Objects} m3SelectedObjectId={m3SelectedObjectId} setM3SelectedObjectId={setM3SelectedObjectId} />;
  const renderEffects = () => <EffectsPanel m3Objects={m3Objects || []} setM3Objects={setM3Objects} m3SelectedObjectId={m3SelectedObjectId} setM3SelectedObjectId={setM3SelectedObjectId} />;
  const renderOverlay = () => <OverlayPanel addObject={addObject} />;
  const renderTextObjects = () => <TextPanel addObject={addObject} editorMode={editorMode} />;
  const renderReactive = () => <ReactivePanel addObject={addObject} />;
  const renderBranding = () => <BrandingPanel addObject={addObject} />;
  const renderLyrics = () => <LyricsPanel addObject={addObject} m3Objects={m3Objects || []} setM3Objects={setM3Objects} m3SelectedObjectId={m3SelectedObjectId} setM3SelectedObjectId={setM3SelectedObjectId} />;

  const renderRenderPresets = () => (
    <div className="space-y-3">
      <ThumbnailCard color="gray" title="Workspace" icon="💾" />
      <ThumbnailCard color="gray" title="Render Queue" icon="📋" />
      <ThumbnailCard color="gray" title="Render Profile" icon="⚙️" />
    </div>
  );

  let content = null;
  switch (activeContextCategory) {
    case 'Background': content = renderBackground(); break;
    case 'Playlist Audio': content = renderPlaylistAudio(); break;
    case 'Lyrics': content = renderLyrics(); break;
    case 'Visualizer V4': content = <VisualizerV4Panel addObject={addObject} m3Objects={m3Objects || []} setM3Objects={setM3Objects} />; break;
    case 'Particle': content = renderParticle(); break;
    case 'Effects': content = renderEffects(); break;
    case 'Overlay': content = renderOverlay(); break;
    case 'Text Objects': content = renderTextObjects(); break;
    case 'Audio Reactive': content = renderReactive(); break;
    case 'Branding': content = renderBranding(); break;
    case 'Render': content = renderRenderPresets(); break;
    default: content = <div className="text-gray-500 text-[11px] italic p-2 text-center">Browse assets for {activeContextCategory} here.</div>;
  }

  return (
    <Surface variant={BackgroundVariants.DynamicContent} className="w-[320px] shrink-0 border-r border-[#21232d] flex flex-col h-full overflow-hidden">
      <div className="bg-[#0f1117] border-b border-[#21232d] shadow-[0_4px_15px_rgba(0,0,0,0.5)] px-4 py-3.5 flex items-center justify-between shrink-0 relative z-20">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5"></div>
        <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]"></div>
            <h2 className="text-[12px] font-black text-gray-200 tracking-widest uppercase">{activeContextCategory || 'Assets'}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {content}
      </div>
    </Surface>
  );
}
