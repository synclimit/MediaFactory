import React, { useEffect, useRef, useState } from 'react';
import './m4-theme.css';
import { Maximize2, Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import IntroSequenceRenderer from '../m3/widgets/IntroSequenceRenderer.jsx';

export default function M4LivePreview({ m4BgVideo, m4AmbientAudio, m4RelaxMusic, isGeneratingPreview, m4Objects, durationMode, setDurationMode, targetDuration, setTargetDuration }) {
  const isReady = m4BgVideo;
  const videoRef = useRef(null);
  const audioRefs = useRef(new Set());
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const lastTime = useRef(0);
  const [durationDisplay, setDurationDisplay] = useState('00:00 / 00:00');
  const [previewMuted, setPreviewMuted] = useState(false);

  useEffect(() => {
    // Clean up unmounted audio element references
    audioRefs.current.clear();
  }, [m4AmbientAudio, m4RelaxMusic]);



  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      videoRef.current?.play();
      audioRefs.current.forEach(a => a?.play());
    } else {
      videoRef.current?.pause();
      audioRefs.current.forEach(a => a?.pause());
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    
    // Calculate max audio duration
    const maxAudioDur = Math.max(
      0,
      ...(m4AmbientAudio || []).map(a => a.durationSec || 0),
      ...(m4RelaxMusic || []).map(m => m.durationSec || 0)
    );

    let currentLoop = loopCount;
    if (ct < lastTime.current - 1) {
      const maxLoops = durationMode === 'Custom' ? Math.ceil((targetDuration * 60) / dur) : ((durationMode === 'Match Audio' && maxAudioDur > 0) ? Math.ceil(maxAudioDur / dur) : 2);
      currentLoop = currentLoop + 1;
      
      if (currentLoop >= maxLoops) {
         currentLoop = 0;
         // Entire preview resets
         if (durationMode === '2x Loop' || durationMode === 'Match Audio') {
             audioRefs.current.forEach(a => { if(a) a.currentTime = 0; });
         }
      }
      setLoopCount(currentLoop);
    }
    lastTime.current = ct;
    
    const virtTime = currentLoop * dur + ct;
    setCurrentTimeSec(virtTime);
    
    const totalVirt = durationMode === 'Custom' ? (targetDuration * 60) : ((durationMode === 'Match Audio' && maxAudioDur > 0) ? maxAudioDur : (dur * 2));
    setProgress((virtTime / totalVirt) * 100);

    const format = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
    setDurationDisplay(`${format(virtTime)} / ${format(totalVirt)}`);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const pct = parseFloat(e.target.value);
    const dur = videoRef.current.duration || 1;
    
    const maxAudioDur = Math.max(
      0,
      ...(m4AmbientAudio || []).map(a => a.durationSec || 0),
      ...(m4RelaxMusic || []).map(m => m.durationSec || 0)
    );
    const totalVirt = durationMode === 'Custom' ? (targetDuration * 60) : ((durationMode === 'Match Audio' && maxAudioDur > 0) ? maxAudioDur : (dur * 2));
    const targetVirt = (pct / 100) * totalVirt;
    
    const targetLoop = Math.floor(targetVirt / dur);
    
    const maxLoops = durationMode === 'Custom' ? Math.ceil((targetDuration * 60) / dur) : ((durationMode === 'Match Audio' && maxAudioDur > 0) ? Math.ceil(maxAudioDur / dur) : 2);
    setLoopCount(targetLoop % maxLoops);
    
    const targetReal = targetVirt % dur;
    videoRef.current.currentTime = targetReal;
    lastTime.current = targetReal;
    setProgress(pct);
    
    audioRefs.current.forEach(a => { if(a) a.currentTime = targetVirt; });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-black min-h-0 overflow-hidden">
      
      {/* 16:9 Canvas Container */}
      <div className={`relative w-full max-w-full aspect-video bg-[#050505] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5 transition-all duration-300 ${isReady ? 'opacity-100' : 'opacity-40'}`}>
        
        {/* Placeholder / Video */}
        {m4BgVideo ? (
          <div className="absolute inset-0 bg-gray-900 overflow-hidden group">
            {/* Real Video Element */}
            {m4BgVideo.path ? (
              <video 
                ref={videoRef}
                src={`/api/m4/stream?path=${encodeURIComponent(m4BgVideo.path)}`}
                className={`w-full h-full object-cover opacity-80 ${m4BgVideo.cropWatermark ? 'scale-[1.15]' : ''}`}
                autoPlay loop muted={previewMuted || (m4BgVideo.isMuted !== false)} playsInline
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1506744626753-14013444ab31?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-80" />
            )}
            
            {/* Intro Sequence Overlay */}
            {(m4Objects || []).filter(o => o.name === 'Intro Sequence' && o.visible).map(introObj => (
              <IntroSequenceRenderer 
                key={introObj.id} 
                el={introObj} 
                currentTime={currentTimeSec} 
              />
            ))}
            
            {/* Real Audio Elements */}
            {m4AmbientAudio && m4AmbientAudio.length > 0 && m4AmbientAudio.map(ambient => (
              <audio 
                key={ambient.id} 
                src={ambient.path?.startsWith('/api/') ? ambient.path : `/api/m4/stream?path=${encodeURIComponent(ambient.path)}`} 
                autoPlay loop 
                ref={el => { 
                  if (el) { 
                    el.volume = Math.min(1, Math.max(0, (ambient.volume || 100) / 100)); 
                    el.muted = previewMuted; 
                    audioRefs.current.add(el); 
                  } 
                }}
              />
            ))}
            {m4RelaxMusic && m4RelaxMusic.length > 0 && m4RelaxMusic.map(music => (
              <audio 
                key={music.id} 
                src={music.path?.startsWith('/api/') ? music.path : `/api/m4/stream?path=${encodeURIComponent(music.path)}`} 
                autoPlay loop 
                ref={el => { 
                  if (el) { 
                    el.volume = Math.min(1, Math.max(0, (music.volume || 100) / 100)); 
                    el.muted = previewMuted; 
                    audioRefs.current.add(el);
                  } 
                }}
              />
            ))}
            
            {/* Floating Audio Indicators */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {m4AmbientAudio && m4AmbientAudio.map(ambient => (
                <div key={ambient.id} className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Volume2 size={12} className="text-orange-400" />
                  <span className="text-[10px] text-white font-mono">{ambient.name}</span>
                </div>
              ))}
              {m4RelaxMusic && m4RelaxMusic.map(music => (
                <div key={music.id} className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <Volume2 size={12} className="text-emerald-400" />
                  <span className="text-[10px] text-white font-mono">{music.name}</span>
                </div>
              ))}
            </div>

            {/* Play/Pause Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 pointer-events-none ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
               <div onClick={togglePlay} className="w-16 h-16 rounded-full bg-orange-500/80 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_30px_rgba(249,115,22,0.6)] cursor-pointer pointer-events-auto hover:scale-110 transition-transform">
                 {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
               </div>
            </div>

            {/* Generating Overlay */}
            {isGeneratingPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw size={32} className="text-orange-500 animate-spin" />
                        <span className="text-orange-400 font-mono text-[12px] tracking-widest uppercase animate-pulse">Generating Preview...</span>
                    </div>
                </div>
            )}

            {/* Custom Timeline Scrubber */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
               <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-orange-400 font-mono tracking-widest uppercase">Preview Mode:</span>
                    <select 
                      value={durationMode || 'Match Audio'}
                      onChange={(e) => {
                        setDurationMode(e.target.value);
                        setLoopCount(0);
                        if(videoRef.current) {
                           videoRef.current.currentTime = 0;
                           audioRefs.current.forEach(a => { if(a) a.currentTime = 0; });
                        }
                      }}
                      className="bg-black/50 border border-white/10 text-white text-[10px] rounded px-2 py-0.5 outline-none font-mono"
                    >
                      <option value="2x Loop">2x Loop</option>
                      <option value="Match Audio">Match Audio</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {durationMode === 'Custom' && (
                       <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            className="bg-black/50 border border-white/10 text-white text-[10px] rounded px-1 py-0.5 outline-none font-mono w-12 text-center" 
                            value={targetDuration} 
                            onChange={(e) => setTargetDuration(parseInt(e.target.value) || 1)} 
                            min="1" max="600"
                          />
                          <span className="text-[10px] text-gray-400 font-mono">min</span>
                       </div>
                    )}
                 </div>
                 <span className="text-[10px] text-gray-300 font-mono">{durationDisplay}</span>
               </div>
               <input 
                 type="range" 
                 min="0" max="100" step="0.1" 
                 value={progress} 
                 onChange={handleSeek}
                 className="w-full accent-orange-500 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
               />
               <style dangerouslySetInnerHTML={{__html: `
                 input[type=range]::-webkit-slider-thumb {
                   appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #f97316;
                 }
               `}} />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
             <div className="w-24 h-24 mb-4 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
             <p className="text-[14px] font-mono tracking-widest">LIVE PREVIEW</p>
             <p className="text-[11px] text-gray-700 mt-2">Pilih Background Video terlebih dahulu</p>
          </div>
        )}
        
        {/* Safe Area Markers */}
        {isReady && (
          <div className="absolute inset-0 pointer-events-none border border-white/5 m-8 border-dashed opacity-30"></div>
        )}
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button className="w-8 h-8 rounded bg-black/50 border border-white/10 hover:border-orange-500 hover:text-orange-400 text-gray-400 flex items-center justify-center transition-colors">
          <RefreshCw size={14} />
        </button>
        <button className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-colors" onClick={() => setPreviewMuted(!previewMuted)} title={previewMuted ? "Unmute Preview" : "Mute Preview"}>
          {previewMuted ? <VolumeX size={14} className="text-gray-400" /> : <Volume2 size={14} className="text-orange-400" />}
        </button>
        <button className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-colors">
          <Maximize2 size={14} />
        </button>
      </div>

    </div>
  );
}
