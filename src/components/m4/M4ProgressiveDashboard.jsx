import React, { useState } from 'react';
import './m4-theme.css';
import { Video, Music, Settings2, PlayCircle, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

export default function M4ProgressiveDashboard({ 
  m4BgVideo, setM4BgVideo,
  m4AmbientAudio, setM4AmbientAudio,
  m4RelaxMusic, setM4RelaxMusic,
  m4LoopMode, setM4LoopMode,
  m4PreviewVideo, setM4PreviewVideo,
  isGeneratingPreview, setIsGeneratingPreview,
  activeStep, setActiveStep,
  onAddToQueue
}) {
  const [targetDuration, setTargetDuration] = useState(60);

  const steps = [
    { id: 1, title: 'BACKGROUND', desc: 'Video Visual Dasar', icon: Video, done: !!m4BgVideo },
    { id: 2, title: 'AMBIENT', desc: 'Audio Suasana', icon: Settings2, done: !!m4AmbientAudio },
    { id: 3, title: 'RELAX MUSIC', desc: 'Musik Pendamping', icon: Music, done: !!m4RelaxMusic },
    { id: 4, title: 'LOOP & FX', desc: 'Transisi & Efek', icon: Layers, done: false },
    { id: 5, title: 'RENDER', desc: 'Konfigurasi Akhir', icon: PlayCircle, done: false }
  ];

  const fetchMetadata = async (path, setter, defaultVol = 100) => {
    try {
      const res = await fetch('/api/m4/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (data.path) {
        setter({
          id: Date.now().toString(),
          name: data.name,
          path: data.path,
          durationSec: data.durationSec,
          durationDisplay: data.durationDisplay,
          volume: defaultVol
        });
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleBrowseVideo = async () => {
    const res = await fetch('/api/m4/dialog/video', { method: 'POST' });
    const data = await res.json();
    if (data.path) fetchMetadata(data.path, setM4BgVideo);
  };

  const handleBrowseAudio = async (setter, defaultVol) => {
    const res = await fetch('/api/m4/dialog/audio', { method: 'POST' });
    const data = await res.json();
    if (data.path) fetchMetadata(data.path, setter, defaultVol);
  };

  const handleGeneratePreview = async () => {
    if (!m4BgVideo) return;
    setIsGeneratingPreview(true);
    try {
        const res = await fetch('/api/m4/generate-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoPath: m4BgVideo.path, loopMode: m4LoopMode })
        });
        const data = await res.json();
        if (data.path) {
            setM4PreviewVideo({ ...m4BgVideo, path: data.path });
        }
    } catch(e) {
        console.error(e);
    }
    setIsGeneratingPreview(false);
  };

  const handleSubmitRender = () => {
    if (!m4BgVideo) return alert("Background Video is required!");
    if (!onAddToQueue) return alert("Queue handler not found!");
      onAddToQueue({
        renderName: `M4_Ambient_${Date.now()}`,
        outputFiles: [`M4_Ambient_${Date.now()}.mp4`],
        m4Payload: {
            bgVideo: m4BgVideo,
            ambientAudio: m4AmbientAudio,
            relaxMusic: m4RelaxMusic,
            loopMode: m4LoopMode,
            totalDurationSec: targetDuration * 60
        }
      });
  };

  return (
    <div className="w-[350px] bg-gradient-to-br from-[#2a2c33] to-[#111216] flex flex-col border-r border-[#333] z-20 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] h-full m4-animate-panel relative overflow-hidden">
      
      {/* Metal Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
      }}></div>

      {/* Header */}
      <div className="p-4 border-b border-[#21232d] flex items-center justify-between bg-black/40 relative z-10">
        <div>
          <h2 className="text-white font-bold font-sans text-lg tracking-wider">M4 AMBIENT</h2>
          <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Loop Composer OS</p>
        </div>
        <div className="w-8 h-8 rounded bg-orange-950/40 border border-orange-500/30 flex items-center justify-center m4-hover-glow shadow-inner">
          <Layers size={16} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,1)]" />
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto m4-scroll relative z-10">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          const isAccessible = step.id === 1 || steps[step.id - 2].done;

          return (
            <div key={step.id} className="flex flex-col gap-2">
              <button 
                onClick={() => isAccessible && setActiveStep(step.id)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'm4-sidebar-active bg-gradient-to-r from-orange-900/20 to-transparent' 
                    : isAccessible 
                      ? 'hover:bg-white/5 border border-transparent' 
                      : 'opacity-40 cursor-not-allowed border border-transparent'
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]"></div>}

                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  step.done ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 
                  isActive ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 
                  'bg-gray-800 border-gray-600 text-gray-400'
                }`}>
                  {step.done ? <CheckCircle2 size={14} /> : <step.icon size={14} />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-[12px] font-bold tracking-wider ${isActive ? 'text-white' : 'text-gray-300'}`}>{step.title}</h3>
                  <p className="text-[10px] text-gray-500 truncate">{step.desc}</p>
                </div>
                
                {isAccessible && !isActive && <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />}
              </button>

              {/* Panel Content (Expands if active) */}
              {isActive && (
                <div className="pl-14 pr-2 pb-4 m4-animate-workspace">
                  
                  {step.id === 1 && (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all" onClick={handleBrowseVideo}>
                        <Video size={24} className="text-gray-500 mb-2" />
                        <span className="text-[11px] text-gray-300 font-medium">Browse Background Video</span>
                        <span className="text-[9px] text-gray-600 mt-1">MP4, MOV up to 4K</span>
                      </div>
                      {m4BgVideo && (
                        <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] text-gray-300 font-mono truncate">{m4BgVideo.name}</span>
                            <span className="text-[9px] text-emerald-600">{m4BgVideo.durationDisplay}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all" onClick={() => handleBrowseAudio(setM4AmbientAudio, 80)}>
                        <Settings2 size={24} className="text-gray-500 mb-2" />
                        <span className="text-[11px] text-gray-300 font-medium">Browse Ambient Audio</span>
                        <span className="text-[9px] text-gray-600 mt-1">MP3, WAV, FLAC</span>
                      </div>
                      {m4AmbientAudio && (
                        <div className="flex flex-col gap-2 p-3 rounded bg-[#111] border border-[#222]">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[11px] text-emerald-400 font-mono truncate flex items-center gap-2" title={m4AmbientAudio.name}>
                               <CheckCircle2 size={12} className="shrink-0"/> 
                               <span className="truncate">{m4AmbientAudio.name}</span>
                             </span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <div className="flex justify-between items-center">
                               <label className="text-[10px] text-gray-500">Volume Ambient</label>
                               <span className="text-[10px] text-orange-500 font-mono">{m4AmbientAudio.volume}%</span>
                             </div>
                             <input type="range" className="w-full accent-orange-500" value={m4AmbientAudio.volume} onChange={(e) => setM4AmbientAudio({...m4AmbientAudio, volume: parseInt(e.target.value)})} min="0" max="200" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all" onClick={() => handleBrowseAudio(setM4RelaxMusic, 35)}>
                        <Music size={24} className="text-gray-500 mb-2" />
                        <span className="text-[11px] text-gray-300 font-medium">Browse Relax Music</span>
                        <span className="text-[9px] text-gray-600 mt-1">MP3, WAV</span>
                      </div>
                      {m4RelaxMusic && (
                        <div className="flex flex-col gap-2 p-3 rounded bg-[#111] border border-[#222]">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[11px] text-emerald-400 font-mono truncate flex items-center gap-2" title={m4RelaxMusic.name}>
                               <CheckCircle2 size={12} className="shrink-0"/>
                               <span className="truncate">{m4RelaxMusic.name}</span>
                             </span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <div className="flex justify-between items-center">
                               <label className="text-[10px] text-gray-500">Volume Music</label>
                               <span className="text-[10px] text-orange-500 font-mono">{m4RelaxMusic.volume}%</span>
                             </div>
                             <input type="range" className="w-full accent-orange-500" value={m4RelaxMusic.volume} onChange={(e) => setM4RelaxMusic({...m4RelaxMusic, volume: parseInt(e.target.value)})} min="0" max="200" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loop Mode</label>
                        <select 
                          value={m4LoopMode}
                          onChange={(e) => {
                              setM4LoopMode(e.target.value);
                              setM4PreviewVideo(null);
                          }}
                          className="m4-input-glass h-8"
                        >
                          <option value="Crossfade Blend">Crossfade Blend (Recommended)</option>
                          <option value="Ping-Pong Boomerang">Ping-Pong Boomerang</option>
                          <option value="Seamless Stream Loop">Raw Stream Loop</option>
                        </select>
                        {m4LoopMode !== 'Seamless Stream Loop' && (
                            <button 
                              onClick={handleGeneratePreview}
                              disabled={isGeneratingPreview || !m4BgVideo}
                              className="h-8 bg-orange-600/20 hover:bg-orange-500/30 border border-orange-500/50 rounded text-[11px] text-orange-400 font-medium transition-colors disabled:opacity-50 mt-1"
                            >
                                {isGeneratingPreview ? 'Generating...' : 'Generate Live Preview'}
                            </button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Camera Motion</label>
                        <select className="m4-input-glass h-8 text-gray-500" disabled title="Not available in current FFmpeg build">
                          <option>Static</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-[#222] pt-3 opacity-50 pointer-events-none" title="Not available in current FFmpeg build">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Effects</label>
                        <div className="flex items-center justify-between text-[11px] text-gray-300">
                           <span>Bloom</span>
                           <input type="checkbox" className="accent-orange-500" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-300">
                           <span>Color Filter</span>
                           <input type="checkbox" className="accent-orange-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">Target Duration (Minutes)</label>
                        <input type="number" className="m4-input-glass h-8 px-2" value={targetDuration} onChange={e => setTargetDuration(parseInt(e.target.value) || 1)} min="1" max="600" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500">Output Resolution</label>
                        <select className="m4-input-glass h-8">
                          <option>Follow Source Video</option>
                        </select>
                      </div>
                      <button className="m4-btn-orange w-full h-[40px] mt-4 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)]" onClick={handleSubmitRender}>
                        <PlayCircle size={16} /> ADD TO RENDER QUEUE
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
