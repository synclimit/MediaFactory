import React, { useState } from 'react';
import M4ProgressiveDashboard from './M4ProgressiveDashboard.jsx';
import M4LivePreview from './M4LivePreview.jsx';
import M4ProjectSummary from './M4ProjectSummary.jsx';

export default function M4StudioPanel({
  m4BgVideo, setM4BgVideo,
  m4AmbientAudio, setM4AmbientAudio,
  m4RelaxMusic, setM4RelaxMusic,
  addNotification,
  onAddToQueue
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [m4LoopMode, setM4LoopMode] = useState('Crossfade Blend');
  const [m4PreviewVideo, setM4PreviewVideo] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  return (
    <div className="flex flex-1 min-h-0 bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] border border-[#2a2c33] rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] mb-2 relative group">
      
      {/* Orange Top Mechanical Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-50 pointer-events-none"></div>
      
      {/* Mechanical Panel Grooves (Background Texture) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)`
      }}></div>

      {/* Hardware Corner Rivets */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)] z-50"></div>
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)] z-50"></div>
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)] z-50"></div>
      <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)] z-50"></div>

      {/* LEFT: Progressive Dashboard (Replaces old Toolbar, Assets, Properties) */}
      <M4ProgressiveDashboard 
        m4BgVideo={m4BgVideo} setM4BgVideo={setM4BgVideo}
        m4AmbientAudio={m4AmbientAudio} setM4AmbientAudio={setM4AmbientAudio}
        m4RelaxMusic={m4RelaxMusic} setM4RelaxMusic={setM4RelaxMusic}
        m4LoopMode={m4LoopMode} setM4LoopMode={setM4LoopMode}
        m4PreviewVideo={m4PreviewVideo} setM4PreviewVideo={setM4PreviewVideo}
        isGeneratingPreview={isGeneratingPreview} setIsGeneratingPreview={setIsGeneratingPreview}
        activeStep={activeStep} setActiveStep={setActiveStep}
        onAddToQueue={onAddToQueue}
      />
      
      {/* RIGHT: Live Preview & Summary */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <M4LivePreview 
          m4BgVideo={m4PreviewVideo || m4BgVideo}
          m4AmbientAudio={m4AmbientAudio}
          m4RelaxMusic={m4RelaxMusic}
          isGeneratingPreview={isGeneratingPreview}
        />
        <M4ProjectSummary 
          m4BgVideo={m4BgVideo}
          m4AmbientAudio={m4AmbientAudio}
          m4RelaxMusic={m4RelaxMusic}
          m4LoopMode={m4LoopMode}
        />
      </div>

    </div>
  );
}
