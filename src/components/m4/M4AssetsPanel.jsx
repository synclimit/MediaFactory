import React, { useState } from 'react';

function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#21232d]">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center p-3 hover:bg-[#1a1c23] transition-colors"
      >
        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">{title}</span>
        <span className="text-gray-500 text-xs">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="p-3 pt-0 bg-[#0c0d12]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function M4AssetsPanel({ 
  m4BgVideo, setM4BgVideo, 
  m4AmbientAudio, setM4AmbientAudio, 
  m4RelaxMusic, setM4RelaxMusic,
  m4Objects, setM4Objects,
  setM4SelectedObjectId,
  canvasMode
}) {
  
  const updateBgVideo = (key, val) => setM4BgVideo(prev => ({ ...prev, [key]: val }));
  const updateAmbient = (key, val) => setM4AmbientAudio(prev => ({ ...prev, [key]: val }));

  const addObject = (type, name, additionalProps = {}) => {
    const id = `${type}-${Date.now()}`;
    setM4Objects([...m4Objects, {
      id, canvasMode, type, name,
      x: 200, y: 200, width: 300, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: m4Objects.length,
      ...additionalProps
    }]);
    setM4SelectedObjectId(id);
  };

  if (canvasMode === 'thumbnail') {
    return (
      <div className="w-[20%] min-w-[250px] shrink-0 bg-[#0c0d12] border-r border-[#21232d] flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-[#21232d] bg-[#12131a]">
          <h2 className="text-xs font-bold text-gray-300">Thumbnail Assets</h2>
        </div>
        <div className="p-4 space-y-4">
          <button className="w-full bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 border border-[#2d3247] rounded py-2 text-xs flex justify-center gap-2 items-center">
            📸 Import Thumbnail Image
          </button>
          <button className="w-full bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 border border-[#2d3247] rounded py-2 text-xs flex justify-center gap-2 items-center">
            ✨ Generate Layout
          </button>
          <button className="w-full bg-[#2563eb] hover:bg-[#3b82f6] text-white border border-[#2d3247] rounded py-2 text-xs flex justify-center gap-2 items-center font-bold">
            💾 Save Thumbnail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[20%] min-w-[250px] shrink-0 bg-[#0c0d12] border-r border-[#21232d] flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#21232d] bg-[#12131a]">
        <h2 className="text-xs font-bold text-gray-300">Assets Library</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        
        {/* 1. Background Video */}
        <Accordion title="1. Background Video" defaultOpen={true}>
          <div className="space-y-3">
            <button className="w-full bg-[#1e2230] border border-dashed border-[#4b5563] text-gray-400 hover:text-white hover:border-blue-500 rounded p-4 text-center text-xs transition-colors flex flex-col items-center gap-1">
              <span className="text-xl">📁</span>
              <span>Import Video / Drag & Drop</span>
            </button>
            <div className="bg-[#181922] p-2 rounded border border-[#2d3247] text-[10px] text-gray-400 space-y-1 font-mono">
              <div className="text-blue-400 font-bold mb-1 truncate">{m4BgVideo.filename}</div>
              <div className="flex justify-between"><span>Resolution:</span> <span className="text-gray-200">{m4BgVideo.resolution}</span></div>
              <div className="flex justify-between"><span>Duration:</span> <span className="text-gray-200">{m4BgVideo.duration}s</span></div>
              <div className="flex justify-between"><span>FPS:</span> <span className="text-gray-200">{m4BgVideo.fps}</span></div>
              <div className="flex justify-between"><span>Codec:</span> <span className="text-gray-200">H.264</span></div>
              <div className="flex justify-between"><span>File Size:</span> <span className="text-gray-200">145 MB</span></div>
            </div>
            <div className="flex flex-col gap-1 text-[10px]">
              <span className="text-gray-400 font-bold">Loop Mode</span>
              <select 
                value={m4BgVideo.loopMode} 
                onChange={(e) => updateBgVideo('loopMode', e.target.value)}
                className="bg-[#1e2230] border border-[#2d3247] rounded p-1.5 text-gray-300"
              >
                <option value="Normal">Normal</option>
                <option value="Seamless">Seamless (Crossfade)</option>
                <option value="Ping Pong">Ping Pong (Reverse)</option>
              </select>
            </div>
          </div>
        </Accordion>

        {/* 2. Ambient Audio */}
        <Accordion title="2. Ambient Audio">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 bg-[#1e2230] border border-[#2d3247] hover:bg-[#2a2e3d] text-gray-300 rounded p-1.5 text-[10px] text-center">Import File</button>
              <button className="flex-1 bg-[#1e2230] border border-[#2d3247] hover:bg-[#2a2e3d] text-gray-300 rounded p-1.5 text-[10px] text-center">Import Folder</button>
            </div>
            <div className="bg-[#181922] p-2 rounded border border-[#2d3247] text-[10px] text-gray-400">
              <div className="text-emerald-400 font-bold truncate">{m4AmbientAudio.filename}</div>
              <div className="h-6 w-full bg-[#12131a] mt-2 rounded border border-[#2d3247] overflow-hidden flex items-end justify-between px-1 opacity-50">
                {[...Array(20)].map((_, i) => <div key={i} className="w-1 bg-emerald-500 rounded-t" style={{height: `${Math.random() * 100}%`}}></div>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" checked={m4AmbientAudio.mute} onChange={e => updateAmbient('mute', e.target.checked)} className="accent-emerald-500" /> Mute
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" checked={m4AmbientAudio.solo} onChange={e => updateAmbient('solo', e.target.checked)} className="accent-emerald-500" /> Solo
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" checked={m4AmbientAudio.loop} onChange={e => updateAmbient('loop', e.target.checked)} className="accent-emerald-500" /> Loop
              </label>
            </div>
            <div className="space-y-1 text-[10px] text-gray-400">
              <div className="flex justify-between"><span>Volume</span><span>{m4AmbientAudio.volume}%</span></div>
              <input type="range" min="0" max="100" value={m4AmbientAudio.volume} onChange={e => updateAmbient('volume', e.target.value)} className="w-full accent-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <div className="flex flex-col gap-1">
                <span>Fade In</span>
                <select className="bg-[#1e2230] border border-[#2d3247] rounded p-1 text-gray-300"><option>None</option><option>3s</option><option>5s</option></select>
              </div>
              <div className="flex flex-col gap-1">
                <span>Fade Out</span>
                <select className="bg-[#1e2230] border border-[#2d3247] rounded p-1 text-gray-300"><option>None</option><option>3s</option><option>5s</option></select>
              </div>
            </div>
          </div>
        </Accordion>

        {/* 3. Relax Music */}
        <Accordion title="3. Relax Music">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 bg-[#1e2230] border border-[#2d3247] hover:bg-[#2a2e3d] text-gray-300 rounded p-1.5 text-[10px] text-center">Import File</button>
              <button className="flex-1 bg-[#1e2230] border border-[#2d3247] hover:bg-[#2a2e3d] text-gray-300 rounded p-1.5 text-[10px] text-center">Import Folder</button>
            </div>
            <div className="bg-[#181922] p-2 rounded border border-[#2d3247] text-[10px] text-gray-400 font-mono">
              <div className="text-purple-400 font-bold mb-1">Current Playlist</div>
              <div className="flex justify-between"><span>Track Count:</span> <span className="text-gray-200">{m4RelaxMusic.length}</span></div>
              <div className="flex justify-between"><span>Total Duration:</span> <span className="text-gray-200">03:00:00</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" defaultChecked className="accent-purple-500" /> Shuffle
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" className="accent-purple-500" /> Mute
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" className="accent-purple-500" /> Solo
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" defaultChecked className="accent-purple-500" /> Loop
              </label>
            </div>
            <div className="space-y-1 text-[10px] text-gray-400">
              <div className="flex justify-between"><span>Volume</span><span>60%</span></div>
              <input type="range" min="0" max="100" defaultValue="60" className="w-full accent-purple-500" />
            </div>
          </div>
        </Accordion>

        {/* 4. Effects */}
        <Accordion title="4. Effects (Objects)">
          <div className="grid grid-cols-2 gap-2">
            {['Snow', 'Rain', 'Fog', 'Dust', 'Glow', 'Fireflies', 'Floating Particles', 'Light Rays', 'Club Lights'].map(ef => (
              <button 
                key={ef} 
                onClick={() => addObject('effect', ef)}
                className="bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 border border-[#2d3247] rounded p-1.5 text-[10px] transition-colors truncate"
              >
                + {ef}
              </button>
            ))}
          </div>
        </Accordion>

        {/* 5. Camera Motion */}
        <Accordion title="5. Camera Motion">
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400">Applies to Background Video</span>
            <select 
              value={m4BgVideo.cameraMotion} 
              onChange={e => updateBgVideo('cameraMotion', e.target.value)}
              className="w-full bg-[#1e2230] border border-[#2d3247] rounded p-1.5 text-[10px] text-gray-300 focus:outline-none"
            >
              <option>Static</option>
              <option>Slow Zoom</option>
              <option>Pan Left</option>
              <option>Pan Right</option>
              <option>Pan Up</option>
              <option>Pan Down</option>
              <option>Ken Burns</option>
            </select>
          </div>
        </Accordion>

        {/* 6. Color Adjustment */}
        <Accordion title="6. Color Adjustment">
          <div className="space-y-3">
            <span className="text-[10px] text-gray-400">Applies to Background Video</span>
            {[
              { id: 'brightness', label: 'Brightness', min: 0, max: 200 },
              { id: 'contrast', label: 'Contrast', min: 0, max: 200 },
              { id: 'saturation', label: 'Saturation', min: 0, max: 200 },
              { id: 'temperature', label: 'Temperature', min: -100, max: 100 },
              { id: 'blur', label: 'Blur', min: 0, max: 50 },
              { id: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
              { id: 'vignette', label: 'Vignette', min: 0, max: 100 },
            ].map(prop => (
              <div key={prop.id} className="space-y-1 text-[10px] text-gray-400">
                <div className="flex justify-between"><span>{prop.label}</span><span>{m4BgVideo[prop.id] ?? 0}</span></div>
                <input 
                  type="range" min={prop.min} max={prop.max} 
                  value={m4BgVideo[prop.id] ?? 0} 
                  onChange={e => updateBgVideo(prop.id, parseInt(e.target.value))} 
                  className="w-full accent-blue-500" 
                />
              </div>
            ))}
          </div>
        </Accordion>

        {/* 7. Overlay */}
        <Accordion title="7. Overlay (Objects)">
          <div className="space-y-2">
            {['Watermark', 'Subscribe', 'Logo', 'Custom Image'].map(ov => (
              <button 
                key={ov} 
                onClick={() => addObject('image', ov)}
                className="w-full bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 border border-[#2d3247] rounded py-1.5 text-[10px] text-left px-2 flex gap-2 items-center transition-colors"
              >
                <span className="text-blue-400 font-bold">+</span> Add {ov}
              </button>
            ))}
          </div>
        </Accordion>

        {/* 8. Text */}
        <Accordion title="8. Text (Objects)">
          <div className="space-y-2">
            {['Title', 'Subtitle', 'Custom Text'].map(txt => (
              <button 
                key={txt} 
                onClick={() => addObject('text', `Add ${txt}`)}
                className="w-full bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 border border-[#2d3247] rounded py-1.5 text-[10px] text-left px-2 flex gap-2 items-center transition-colors"
              >
                <span className="text-blue-400 font-bold">+</span> Add {txt}
              </button>
            ))}
          </div>
        </Accordion>

      </div>
    </div>
  );
}
