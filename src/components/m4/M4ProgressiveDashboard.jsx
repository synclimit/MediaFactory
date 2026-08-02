import React, { useState, useEffect } from 'react';
import './m4-theme.css';
import Tooltip from '../ui/Tooltip.jsx';
import { Video, Music, Settings2, PlayCircle, Layers, CheckCircle2, ChevronRight, Clapperboard, CloudRain, Wind, Waves, Flame, Trees, Bug, Coffee, Building2, Car, Plane, Activity, X, Folder, Shuffle, Image, VolumeX, Eraser, Volume2, MonitorPlay, HelpCircle } from 'lucide-react';

export default function M4ProgressiveDashboard({ 
  m4BgVideo, setM4BgVideo,
  m4AmbientAudio, setM4AmbientAudio,
  m4RelaxMusic, setM4RelaxMusic,
  m4LoopMode, setM4LoopMode,
  m4PreviewVideo, setM4PreviewVideo,
  isGeneratingPreview, setIsGeneratingPreview,
  activeStep, setActiveStep,
  onAddToQueue,
  m4Objects, setM4Objects
}) {
  const [targetDuration, setTargetDuration] = useState(60);
  const [durationMode, setDurationMode] = useState('2x Loop');
  const [loadingDialog, setLoadingDialog] = useState(null);
  const [ambientPresets, setAmbientPresets] = useState([]);
  const [renderSettings, setRenderSettings] = useState({
    resolution: '1080p',
    fps: '60',
    codec: 'H.264',
    bitrate: 'Auto (2.5M)',
    audioBitrate: '192 kbps (Standar)',
    rateControl: 'VBR (Variable)',
    keyframe: 'Standard Upload'
  });

  useEffect(() => {
    fetch('/api/m4/ambients').then(res => res.json()).then(data => {
        if(data.ambients) setAmbientPresets(data.ambients);
    }).catch(e => console.error(e));
  }, []);

  const steps = [
    { id: 1, title: 'BACKGROUND', desc: 'Video Visual Dasar', icon: Video, done: !!m4BgVideo },
    { id: 2, title: 'AMBIENT', desc: 'Audio Suasana', icon: Settings2, done: m4AmbientAudio && m4AmbientAudio.length > 0 },
    { id: 3, title: 'RELAX MUSIC', desc: 'Musik Pendamping', icon: Music, done: m4RelaxMusic && m4RelaxMusic.length > 0 },
    { id: 4, title: 'LOOP & FX', desc: 'Transisi & Efek', icon: Layers, completed: m4BgVideo },
    { id: 5, title: 'OVERLAY', desc: 'Tambahkan Overlay', icon: Image, completed: false },
    { id: 6, title: 'INTRO SEQUENCE', desc: 'Tambahkan Intro', icon: Clapperboard, completed: false },
    { id: 7, title: 'OUTPUT SETTINGS', desc: 'Format & Kualitas Render', icon: MonitorPlay, completed: false }
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

  const handleToggleAmbient = (presetPath) => {
      const existing = (m4AmbientAudio || []).find(a => a.path === presetPath);
      if (existing) {
          setM4AmbientAudio(prev => prev.filter(a => a.path !== presetPath));
      } else {
          fetch('/api/m4/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: presetPath }) })
          .then(res => res.json())
          .then(data => {
              if (data.path) {
                  setM4AmbientAudio(prev => [...(Array.isArray(prev)?prev:[]), { id: Date.now().toString(), name: data.name, path: data.path, durationSec: data.durationSec, volume: 60, isMuted: false, isShuffle: false }]);
              }
          });
      }
  };

  const handleBrowseAmbientArray = async (type = 'audio') => {
    if (loadingDialog) return;
    setLoadingDialog(`ambient_${type}`);
    try {
      const res = await fetch(`/api/m4/dialog/${type}`, { method: 'POST' });
      const data = await res.json();
      if (data.path) {
          const metaRes = await fetch('/api/m4/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: data.path }) });
          const meta = await metaRes.json();
          if (meta.path) {
              setM4AmbientAudio(prev => [...(Array.isArray(prev)?prev:[]), { id: Date.now().toString(), name: meta.name, path: meta.path, durationSec: meta.durationSec, volume: 80, isMuted: false, isShuffle: false }]);
          }
      }
    } catch(e) { console.error(e); } finally { setLoadingDialog(null); }
  };

  const handleBrowseRelaxArray = async (type = 'audio') => {
    if (loadingDialog) return;
    setLoadingDialog(`relax_${type}`);
    try {
      const res = await fetch(`/api/m4/dialog/${type}`, { method: 'POST' });
      const data = await res.json();
      if (data.path) {
          const metaRes = await fetch('/api/m4/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: data.path }) });
          const meta = await metaRes.json();
          if (meta.path) {
              setM4RelaxMusic(prev => [...(Array.isArray(prev)?prev:[]), { id: Date.now().toString(), name: meta.name, path: meta.path, durationSec: meta.durationSec, volume: 35, isMuted: false, isShuffle: false }]);
          }
      }
    } catch(e) { console.error(e); } finally { setLoadingDialog(null); }
  };

  const getIntroProp = (key, defaultVal) => {
    const introObj = (m4Objects || []).find(o => o.name === 'Intro Sequence');
    if (!introObj) return defaultVal;
    return introObj[key] !== undefined ? introObj[key] : defaultVal;
  };

  const updateIntroProp = (key, val) => {
    setM4Objects(prev => {
      const arr = [...(prev || [])];
      let idx = arr.findIndex(o => o.name === 'Intro Sequence');
      
      if (idx === -1) {
        if (key === 'visible' && !val) return arr; // Don't create if just hiding
        arr.push({
          id: 'm4_intro_' + Date.now(),
          name: 'Intro Sequence',
          type: 'video',
          visible: true,
          introStyle: 'Paragraph (Text)',
          introDuration: '5s',
          introText1: 'WELCOME TO MY CHANNEL',
          introText2: 'RELAX & CHILL WITH LOFI SOUNDS',
          introText3: 'SUBSCRIBE FOR MORE AMBIENT VIDEOS',
          introTextColor: '#ffffff',
          introFontSize: 36,
          introFontFamily: 'Inter',
          introTextAlign: 'center',
          darkIntensity: 70,
          blurIntensity: 30,
          paragraphCount: 1,
          paragraphDuration: 5,
          [key]: val
        });
      } else {
        arr[idx] = { ...arr[idx], [key]: val };
      }
      return arr;
    });
  };

  const handleBrowseVideo = async () => {
    if (loadingDialog) return;
    setLoadingDialog('bg_video');
    try {
      const res = await fetch('/api/m4/dialog/video', { method: 'POST' });
      const data = await res.json();
      if (data.path) fetchMetadata(data.path, setM4BgVideo);
    } catch(e) { console.error(e); } finally { setLoadingDialog(null); }
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
          const isAccessible = true;

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
                      <div className={`p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all ${loadingDialog === 'bg_video' ? 'opacity-50 pointer-events-none' : ''}`} onClick={handleBrowseVideo}>
                        {loadingDialog === 'bg_video' ? (
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        ) : (
                          <Video size={24} className="text-gray-500 mb-2" />
                        )}
                        <span className="text-[11px] text-gray-300 font-medium">
                          {loadingDialog === 'bg_video' ? 'Membuka Explorer...' : 'Browse Background Video'}
                        </span>
                        <span className="text-[9px] text-gray-600 mt-1">MP4, MOV up to 4K</span>
                      </div>
                      {m4BgVideo && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] text-gray-300 font-mono truncate">{m4BgVideo.name}</span>
                              <span className="text-[9px] text-emerald-600">{m4BgVideo.durationDisplay}</span>
                            </div>
                          </div>
                          
                          {/* Toggle Controls for Mute and Watermark */}
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className={`flex items-center justify-between p-2 border rounded cursor-pointer text-[10px] transition-colors ${m4BgVideo.isMuted ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'}`}
                                 onClick={(e) => { e.stopPropagation(); setM4BgVideo({...m4BgVideo, isMuted: !m4BgVideo.isMuted}); }}>
                                <div className="flex items-center gap-1.5">
                                  <VolumeX size={12} />
                                  <span>Muted Audio</span>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full border ${m4BgVideo.isMuted ? 'bg-orange-500 border-orange-500 shadow-[0_0_5px_#f97316]' : 'border-gray-600'}`}></div>
                            </div>
                            
                            <div className={`flex items-center justify-between p-2 border rounded cursor-pointer text-[10px] transition-colors ${m4BgVideo.cropWatermark ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'}`}
                                 onClick={(e) => { e.stopPropagation(); setM4BgVideo({...m4BgVideo, cropWatermark: !m4BgVideo.cropWatermark}); }}>
                                <div className="flex items-center gap-1.5">
                                  <Eraser size={12} />
                                  <span>Clear Watermark</span>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full border ${m4BgVideo.cropWatermark ? 'bg-orange-500 border-orange-500 shadow-[0_0_5px_#f97316]' : 'border-gray-600'}`}></div>
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="flex flex-col gap-3">
                      {ambientPresets.length > 0 && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {ambientPresets.map((preset, idx) => {
                              const l = preset.name.toLowerCase();
                              let Icon = Settings2;
                              if (l.includes('hujan')) Icon = CloudRain;
                              else if (l.includes('angin')) Icon = Wind;
                              else if (l.includes('pantai') || l.includes('sungai') || l.includes('air') || l.includes('ombak')) Icon = Waves;
                              else if (l.includes('api') || l.includes('kebakaran')) Icon = Flame;
                              else if (l.includes('hutan')) Icon = Trees;
                              else if (l.includes('jangkrik')) Icon = Bug;
                              else if (l.includes('cafe')) Icon = Coffee;
                              else if (l.includes('kota')) Icon = Building2;
                              else if (l.includes('raya') || l.includes('kereta')) Icon = Car;
                              else if (l.includes('pesawat')) Icon = Plane;
                              else if (l.includes('noise')) Icon = Activity;
                              const isSelected = (m4AmbientAudio || []).some(a => a.path === preset.path);
                              return (
                                <div key={idx} 
                                  className={`p-2 border rounded cursor-pointer flex items-center gap-2 transition-all text-[11px] ${isSelected ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#111] border-[#333] text-gray-400 hover:border-orange-500/50'}`}
                                  onClick={() => handleToggleAmbient(preset.path)}
                                >
                                   <Icon size={14} className={isSelected ? "text-orange-500" : "text-gray-500"} />
                                   <span className="truncate">{preset.name}</span>
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-gray-600 font-bold tracking-widest my-1">
                            <div className="h-px bg-[#222] flex-1"></div>
                            <span>ATAU BROWSE FILE</span>
                            <div className="h-px bg-[#222] flex-1"></div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex gap-2">
                        <div className={`flex-1 p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all ${loadingDialog === 'ambient_audio' ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => handleBrowseAmbientArray('audio')}>
                          {loadingDialog === 'ambient_audio' ? (
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          ) : (
                            <Settings2 size={24} className="text-gray-500 mb-2" />
                          )}
                          <span className="text-[11px] text-gray-300 font-medium">{loadingDialog === 'ambient_audio' ? 'Membuka...' : 'File (MP3)'}</span>
                        </div>
                        <div className={`flex-1 p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all ${loadingDialog === 'ambient_folder' ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => handleBrowseAmbientArray('folder')}>
                          {loadingDialog === 'ambient_folder' ? (
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          ) : (
                            <Folder size={24} className="text-gray-500 mb-2" />
                          )}
                          <span className="text-[11px] text-gray-300 font-medium">{loadingDialog === 'ambient_folder' ? 'Membuka...' : 'Folder Audio'}</span>
                        </div>
                      </div>
                      {m4AmbientAudio && m4AmbientAudio.length > 0 && (
                        <div className="flex flex-col gap-2 p-3 rounded bg-[#111] border border-[#222]">
                          {m4AmbientAudio.map((ambient, idx) => (
                              <div key={ambient.id} className="border-b border-[#222] pb-3 mb-2 last:border-0 last:pb-0 last:mb-0">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[11px] text-emerald-400 font-mono truncate flex items-center gap-2" title={ambient.name}>
                                       <CheckCircle2 size={12} className="shrink-0"/> 
                                       <span className="truncate">{ambient.name}</span>
                                     </span>
                                     <button 
                                        className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setM4AmbientAudio(prev => prev.filter(a => a.id !== ambient.id)); }}
                                        title="Remove Ambient Audio"
                                      >
                                        <X size={12} />
                                      </button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 px-1">
                                     <Volume2 size={12} className="text-gray-500 shrink-0" />
                                     <input 
                                       type="range" min="0" max="100" 
                                       value={ambient.volume !== undefined ? ambient.volume : 60} 
                                       onChange={(e) => {
                                         const val = Number(e.target.value);
                                         setM4AmbientAudio(prev => prev.map(a => a.id === ambient.id ? { ...a, volume: val } : a));
                                       }}
                                       className="w-full accent-orange-500 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                     />
                                     <span className="text-[10px] text-gray-400 font-mono w-7 text-right">{ambient.volume !== undefined ? ambient.volume : 60}%</span>
                                  </div>
                              </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <div className={`flex-1 p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all ${loadingDialog === 'relax_audio' ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => handleBrowseRelaxArray('audio')}>
                          {loadingDialog === 'relax_audio' ? (
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          ) : (
                            <Music size={24} className="text-gray-500 mb-2" />
                          )}
                          <span className="text-[11px] text-gray-300 font-medium">{loadingDialog === 'relax_audio' ? 'Membuka...' : 'File (MP3)'}</span>
                        </div>
                        <div className={`flex-1 p-4 border border-dashed border-[#444] hover:border-orange-500/50 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/20 m4-btn-lift transition-all ${loadingDialog === 'relax_folder' ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => handleBrowseRelaxArray('folder')}>
                          {loadingDialog === 'relax_folder' ? (
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          ) : (
                            <Folder size={24} className="text-gray-500 mb-2" />
                          )}
                          <span className="text-[11px] text-gray-300 font-medium">{loadingDialog === 'relax_folder' ? 'Membuka...' : 'Folder Audio'}</span>
                        </div>
                      </div>
                      {m4RelaxMusic && m4RelaxMusic.length > 0 && (
                        <div className="flex flex-col gap-2 p-3 rounded bg-[#111] border border-[#222]">
                          {m4RelaxMusic.map((music, idx) => (
                              <div key={music.id} className="border-b border-[#222] pb-3 mb-2 last:border-0 last:pb-0 last:mb-0">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[11px] text-emerald-400 font-mono truncate flex items-center gap-2" title={music.name}>
                                       <CheckCircle2 size={12} className="shrink-0"/>
                                       <span className="truncate">{music.name}</span>
                                     </span>
                                     <button 
                                        className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setM4RelaxMusic(prev => prev.filter(m => m.id !== music.id)); }}
                                        title="Remove Relax Music"
                                      >
                                        <X size={12} />
                                      </button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 px-1">
                                     <Volume2 size={12} className="text-gray-500 shrink-0" />
                                     <input 
                                       type="range" min="0" max="100" 
                                       value={music.volume !== undefined ? music.volume : 35} 
                                       onChange={(e) => {
                                         const val = Number(e.target.value);
                                         setM4RelaxMusic(prev => prev.map(m => m.id === music.id ? { ...m, volume: val } : m));
                                       }}
                                       className="w-full accent-orange-500 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                                     />
                                     <span className="text-[10px] text-gray-400 font-mono w-7 text-right">{music.volume !== undefined ? music.volume : 35}%</span>
                                  </div>
                              </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loop Mode</label>
                          <Tooltip text="Crossfade Blend menghaluskan transisi loop akhir-ke-awal. Ping-Pong memutar maju-mundur." />
                        </div>
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
                      </div>
                    </div>
                  )}

                  {step.id === 5 && (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#333] rounded-lg">
                        <Image size={32} className="text-[#444]" />
                        <span className="text-gray-400 text-xs text-center">Fitur Overlay / Watermark akan segera hadir.<br/><span className="text-[10px] text-gray-500">(Placeholder)</span></span>
                    </div>
                  )}

                  {step.id === 6 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intro Sequence</label>
                        <div className="flex items-center justify-between text-[11px] text-gray-300">
                           <span>Enable Intro</span>
                           <input type="checkbox" className="accent-orange-500" checked={getIntroProp('visible', false)} onChange={e => updateIntroProp('visible', e.target.checked)} />
                        </div>
                        {getIntroProp('visible', false) && (
                          <div className="flex flex-col gap-2 mt-1 p-2 bg-black/20 border border-[#333] rounded">
                            <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('introStyle', 'Focus Pull (Blur)')} onChange={e => updateIntroProp('introStyle', e.target.value)}>
                              <option>Focus Pull (Blur)</option>
                              <option>Fade from Black</option>
                              <option>Fade from White</option>
                              <option>Cinematic Vignette</option>
                              <option>Effect Blur</option>
                              <option>Paragraph (Text)</option>
                            </select>
                            
                            {getIntroProp('introStyle', 'Focus Pull (Blur)') !== 'Paragraph (Text)' && (
                                <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('introDuration', '3s')} onChange={e => updateIntroProp('introDuration', e.target.value)}>
                                    <option>2s</option><option>3s</option><option>4s</option><option>5s</option><option>6s</option><option>8s</option><option>10s</option>
                                </select>
                            )}
                            
                            {getIntroProp('introStyle', 'Focus Pull (Blur)') === 'Effect Blur' ? (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Blur Intensity</label>
                                        <input type="range" className="accent-orange-500" min="0" max="100" value={getIntroProp('intensity', 40)} onChange={e => updateIntroProp('intensity', Number(e.target.value))} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Dark Intensity</label>
                                        <input type="range" className="accent-orange-500" min="0" max="100" value={getIntroProp('darkIntensity', 100)} onChange={e => updateIntroProp('darkIntensity', Number(e.target.value))} />
                                    </div>
                                </>
                            ) : getIntroProp('introStyle', 'Focus Pull (Blur)') === 'Paragraph (Text)' ? (
                                <>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="text-[10px] text-gray-400">Bg Dark Intensity</label>
                                        <input type="range" className="accent-orange-500" min="0" max="100" value={getIntroProp('darkIntensity', 100)} onChange={e => updateIntroProp('darkIntensity', Number(e.target.value))} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Bg Blur Intensity</label>
                                        <input type="range" className="accent-orange-500" min="0" max="100" value={getIntroProp('blurIntensity', 40)} onChange={e => updateIntroProp('blurIntensity', Number(e.target.value))} />
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="text-[10px] text-gray-400">Text Transition</label>
                                        <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('textTransition', 'Fade In/Out')} onChange={e => updateIntroProp('textTransition', e.target.value)}>
                                            <option>Handwriting (Sweep)</option>
                                            <option>Focus Pull (Text)</option>
                                            <option>Cinematic Tracking</option>
                                            <option>Fade In/Out</option>
                                            <option>Typewriter</option>
                                            <option>Slide Up</option>
                                            <option>Zoom In</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Main Video Transition</label>
                                        <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('mainTransition', 'Fade to Video')} onChange={e => updateIntroProp('mainTransition', e.target.value)}>
                                            <option>Fade to Video</option>
                                            <option>Flash White</option>
                                            <option>Blur Reveal</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Total Paragraphs</label>
                                        <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('paragraphCount', 1).toString()} onChange={e => {
                                            const count = Number(e.target.value);
                                            updateIntroProp('paragraphCount', count);
                                        }}>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Duration per Paragraph</label>
                                        <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('paragraphDuration', '5s')} onChange={e => updateIntroProp('paragraphDuration', e.target.value)}>
                                            <option>3s</option><option>4s</option><option>5s</option><option>6s</option><option>8s</option><option>10s</option>
                                        </select>
                                    </div>

                                    <div className="mt-3 mb-1 border-t border-white/[0.05] pt-2">
                                      <span className="text-[9px] font-bold text-orange-500 mb-2 block tracking-wider uppercase">TEXT CONTENT</span>
                                      
                                      {[...Array(getIntroProp('paragraphCount', 1))].map((_, i) => (
                                          <textarea 
                                            key={i}
                                            className="w-full bg-[#11131a] border border-[#222] rounded p-2 text-[11px] text-gray-300 resize-none h-[50px] outline-none focus:border-orange-500 mb-2"
                                            placeholder={`Paragraf ${i + 1}...`}
                                            value={getIntroProp(`introText${i+1}`, i === 0 ? 'WELCOME TO MY CHANNEL' : i === 1 ? 'RELAX & CHILL WITH LOFI SOUNDS' : 'SUBSCRIBE FOR MORE AMBIENT VIDEOS')}
                                            onChange={e => updateIntroProp(`introText${i+1}`, e.target.value)}
                                          />
                                      ))}
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-gray-300 mb-1">
                                      <span>Text Color</span>
                                      <input type="color" value={getIntroProp('introTextColor', '#ffffff')} onChange={e => updateIntroProp('introTextColor', e.target.value)} className="w-6 h-6 bg-transparent border-none cursor-pointer" />
                                    </div>
                                    
                                    <select className="m4-input-glass h-7 text-[10px] mb-1" value={getIntroProp('introFontFamily', 'Inter')} onChange={e => updateIntroProp('introFontFamily', e.target.value)}>
                                      <option>Great Vibes</option><option>Dancing Script</option><option>Pacifico</option><option>Playball</option><option>Inter</option><option>Oswald</option><option>Bebas Neue</option>
                                    </select>
                                    
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-gray-400">Font Size</label>
                                        <input type="range" className="accent-orange-500" min="10" max="100" value={getIntroProp('introFontSize', 32)} onChange={e => updateIntroProp('introFontSize', Number(e.target.value))} />
                                    </div>
                                    
                                    <select className="m4-input-glass h-7 text-[10px]" value={getIntroProp('introTextAlign', 'center')} onChange={e => updateIntroProp('introTextAlign', e.target.value)}>
                                      <option>left</option><option>center</option><option>right</option>
                                    </select>
                                </>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-400">Effect Intensity</label>
                                    <input type="range" className="accent-orange-500" min="0" max="100" value={getIntroProp('intensity', 40)} onChange={e => updateIntroProp('intensity', Number(e.target.value))} />
                                </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {step.id === 7 && (
                    <div className="flex flex-col gap-4">
                      {/* Toggles */}
                      <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RESOLUTION</label>
                              <Tooltip text="Resolusi video output. 1080p disarankan untuk kualitas HD terbaik." />
                            </div>
                            <div className="flex rounded border border-[#333] overflow-hidden bg-black/20">
                               {['480p', '720p', '1080p'].map(res => (
                                  <button key={res} 
                                     onClick={() => setRenderSettings({...renderSettings, resolution: res})}
                                     className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${renderSettings.resolution === res ? 'bg-[#3d1c00] text-[#f97316] border border-[#f97316]' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}>
                                    {res}
                                  </button>
                               ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FRAME RATE</label>
                              <Tooltip text="Jumlah frame per detik. 60 FPS membuat gerakan video sangat halus." />
                            </div>
                            <div className="flex rounded border border-[#333] overflow-hidden bg-black/20">
                               {['24', '30', '60'].map(fps => (
                                  <button key={fps} 
                                     onClick={() => setRenderSettings({...renderSettings, fps: fps})}
                                     className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${renderSettings.fps === fps ? 'bg-[#3d1c00] text-[#f97316] border border-[#f97316]' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}>
                                    {fps}
                                  </button>
                               ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VIDEO CODEC</label>
                              <Tooltip text="H.264 memiliki kompatibilitas paling luas. H.265 menghasilkan kompresi file lebih efisien." />
                            </div>
                            <div className="flex rounded border border-[#333] overflow-hidden bg-black/20">
                               {['H.264', 'H.265'].map(c => (
                                  <button key={c} 
                                     onClick={() => setRenderSettings({...renderSettings, codec: c})}
                                     className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${renderSettings.codec === c ? 'bg-[#3d1c00] text-[#f97316] border border-[#f97316]' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}>
                                    {c}
                                  </button>
                               ))}
                            </div>
                          </div>
                      </div>
                      
                      {/* Dropdowns */}
                      <div className="grid grid-cols-1 gap-3 border-t border-white/5 pt-3">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BITRATE</label>
                             <Tooltip text="Kecepatan bit video. Semakin tinggi semakin bagus kualitasnya, namun ukuran file lebih besar." />
                           </div>
                           <select className="m4-input-glass h-8 text-[11px]" 
                              value={renderSettings.bitrate} onChange={e => setRenderSettings({...renderSettings, bitrate: e.target.value})}>
                              <option>Auto (2.5M)</option>
                              <option>High (5M)</option>
                              <option>Max (8M)</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AUDIO BITRATE</label>
                             <Tooltip text="Kecepatan bit audio. 192 kbps disarankan untuk kualitas standar yang baik." />
                           </div>
                           <select className="m4-input-glass h-8 text-[11px]" 
                              value={renderSettings.audioBitrate} onChange={e => setRenderSettings({...renderSettings, audioBitrate: e.target.value})}>
                              <option>128 kbps (Low)</option>
                              <option>192 kbps (Standar)</option>
                              <option>320 kbps (High)</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RATE CONTROL</label>
                             <Tooltip text="CBR (Constant) menjaga bitrate tetap sama, ukuran file besar. VBR (Variable) menyesuaikan bitrate sesuai gerakan, lebih efisien." />
                           </div>
                           <select className="m4-input-glass h-8 text-[11px]" 
                              value={renderSettings.rateControl} onChange={e => setRenderSettings({...renderSettings, rateControl: e.target.value})}>
                              <option>CBR (Constant)</option>
                              <option>VBR (Variable)</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KEYFRAME</label>
                             <Tooltip text="Jarak antar keyframe. Pilih Livestream (2s) agar buffering lebih lancar saat digunakan untuk Live." />
                           </div>
                           <select className="m4-input-glass h-8 text-[11px]" 
                              value={renderSettings.keyframe} onChange={e => setRenderSettings({...renderSettings, keyframe: e.target.value})}>
                              <option>Standard Upload</option>
                              <option>Livestream (2s)</option>
                           </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* ADD TO RENDER QUEUE BUTTON */}
      <div className="p-4 border-t border-white/5 bg-[#0f1015]">
          <button 
            onClick={onAddToQueue}
            disabled={!m4BgVideo}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 rounded flex flex-col items-center justify-center text-white font-bold shadow-lg shadow-orange-900/50 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <span className="text-[14px]">ADD TO RENDER QUEUE</span>
            <span className="text-[9px] font-normal opacity-80 uppercase tracking-widest">Queue to M5 CREATE</span>
          </button>
      </div>
    </div>
  );
}
