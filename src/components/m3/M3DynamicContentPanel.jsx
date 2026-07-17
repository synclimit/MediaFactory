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
import { ThumbnailCard, GridThumbnail } from '../ui/Thumbnails';

// Thumbnails are now imported from ../ui/Thumbnails.jsx

export default function M3DynamicContentPanel({
  m3BgPool, setM3BgPool, 
  m3AudioTracks, setM3AudioTracks, 
  m3CurrentTrackIndex,
  m3Objects, setM3Objects, 
  m3SelectedObjectId, setM3SelectedObjectId, 
  canvasMode, 
  activeContextCategory 
}) {
  // Generic Object Adder
  const addObject = (props) => {
    const id = props.type + '-' + Date.now();
    setM3Objects([...m3Objects, { id, canvasMode, visible: true, locked: false, layer: m3Objects.length, ...props }]);
    setM3SelectedObjectId(id);
  };

  const renderBackground = () => (
    <BackgroundPanel setM3BgPool={setM3BgPool} />
  );

  const renderPlaylistAudio = () => (
    <PlaylistPanel m3AudioTracks={m3AudioTracks} setM3AudioTracks={setM3AudioTracks} m3CurrentTrackIndex={m3CurrentTrackIndex} />
  );

  const renderVisualizer = () => <VisualizerPanel addObject={addObject} />;
  const renderEffects = () => <EffectsPanel m3Objects={m3Objects || []} setM3Objects={setM3Objects} m3SelectedObjectId={m3SelectedObjectId} setM3SelectedObjectId={setM3SelectedObjectId} />;
  const renderOverlay = () => <OverlayPanel addObject={addObject} />;
  const renderTextObjects = () => <TextPanel addObject={addObject} />;
  const renderReactive = () => <ReactivePanel addObject={addObject} />;
  const renderBranding = () => <BrandingPanel addObject={addObject} />;

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
    case 'Visualizer': content = renderVisualizer(); break;
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
      <div className="px-4 py-3 border-b border-[#21232d] bg-[#0c0d12] shrink-0 shadow-sm flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-gray-200 tracking-wide uppercase">{activeContextCategory || 'Assets'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {content}
      </div>
    </Surface>
  );
}
