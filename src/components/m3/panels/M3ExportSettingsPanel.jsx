import React, { useState } from 'react';
import { Play, CheckSquare, Square, Lock, ChevronDown, HelpCircle } from 'lucide-react';

export default function M3ExportSettingsPanel({ onAddToQueue }) {
  const [resolution, setResolution] = useState('SD');
  const [fps, setFps] = useState('30');
  const [codec, setCodec] = useState('H.264');
  const [renderPerSong, setRenderPerSong] = useState(false);
  const [bFrame, setBFrame] = useState('Otomatis');
  const [renderMode, setRenderMode] = useState('FAST'); // FAST or NORMAL
  
  return (
    <div className="w-full flex flex-col select-none px-5 py-2">
      
      {/* 3-Column Grid for Settings */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-2.5">
        
        {/* ROW 1 */}
        {/* Resolution */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Resolution</label>
          <div className="flex rounded shadow-sm h-7">
            <button 
              onClick={() => setResolution('SD')} 
              className={`flex-1 text-[11px] font-bold border rounded-l transition-colors ${resolution === 'SD' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              480p
            </button>
            <button className="flex-1 text-[11px] font-bold border-y border-r border-[#2d3247] bg-[#12131a] text-gray-600 flex justify-center items-center gap-1.5 cursor-not-allowed">
              720p <Lock size={9} className="text-yellow-600/40" />
            </button>
            <button className="flex-1 text-[11px] font-bold border-y border-r border-[#2d3247] rounded-r bg-[#12131a] text-gray-600 flex justify-center items-center gap-1.5 cursor-not-allowed">
              1080p <Lock size={9} className="text-yellow-600/40" />
            </button>
          </div>
        </div>

        {/* Frame Rate */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Frame Rate</label>
          <div className="flex rounded shadow-sm h-7">
            <button 
              onClick={() => setFps('24')} 
              className={`flex-1 text-[11px] font-bold border rounded-l transition-colors ${fps === '24' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              24
            </button>
            <button 
              onClick={() => setFps('30')} 
              className={`flex-1 text-[11px] font-bold border-y border-r ${fps === '30' ? 'border-orange-500 bg-orange-500/20 text-orange-500 z-10' : 'border-[#2d3247] bg-[#12131a] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              30
            </button>
            <button className="flex-1 text-[11px] font-bold border-y border-r border-[#2d3247] rounded-r bg-[#12131a] text-gray-600 flex justify-center items-center gap-1.5 cursor-not-allowed">
              60 <Lock size={9} className="text-yellow-600/40" />
            </button>
          </div>
        </div>

        {/* Video Codec */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Video Codec</label>
          <div className="flex rounded shadow-sm h-7">
            <button 
              onClick={() => setCodec('H.264')} 
              className={`flex-1 text-[11px] font-bold border rounded-l transition-colors ${codec === 'H.264' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              H.264
            </button>
            <button className="flex-1 text-[11px] font-bold border-y border-r border-[#2d3247] rounded-r bg-[#12131a] text-gray-600 flex justify-center items-center gap-1.5 cursor-not-allowed">
              H.265 <Lock size={9} className="text-yellow-600/40" />
            </button>
          </div>
        </div>

        {/* ROW 2 */}
        {/* Bitrate */}
        <div className="flex flex-col">
          <label className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
            Bitrate <Lock size={10} className="text-yellow-600/60" /> <HelpCircle size={10} className="text-gray-600" />
          </label>
          <div className="relative h-7">
            <select disabled className="w-full h-full bg-[#12131a] border border-[#2d3247] text-gray-500 text-[11px] font-medium rounded px-2 appearance-none outline-none opacity-70 cursor-not-allowed truncate pr-6">
              <option>Auto (2.5M)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* Audio Bitrate */}
        <div className="flex flex-col">
          <label className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
            Audio Bitrate <Lock size={10} className="text-yellow-600/60" /> <HelpCircle size={10} className="text-gray-600" />
          </label>
          <div className="relative h-7">
            <select disabled className="w-full h-full bg-[#12131a] border border-[#2d3247] text-gray-500 text-[11px] font-medium rounded px-2 appearance-none outline-none opacity-70 cursor-not-allowed truncate pr-6">
              <option>192 kbps</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* B-Frame */}
        <div className="flex flex-col">
          <label className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">B-Frame (CPU)</label>
          <div className="relative h-7">
            <select 
              value={bFrame}
              onChange={(e) => setBFrame(e.target.value)}
              className="w-full h-full bg-[#12131a] border border-[#2d3247] text-gray-300 hover:border-gray-500 text-[11px] font-medium rounded px-2 appearance-none outline-none focus:border-orange-500 transition-colors cursor-pointer truncate pr-6"
            >
              <option value="Otomatis">Auto (disarankan)</option>
              <option value="Aktif">Aktif (file kecil)</option>
              <option value="Mati">Mati (encode cepat)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* ROW 3: Checkbox, Render Mode & Button */}
      <div className="flex items-center justify-between border-t border-[#1a1b26] pt-2.5 mt-2.5">
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors text-[11px] font-semibold group">
            <div className="relative flex items-center justify-center text-orange-500" onClick={() => setRenderPerSong(!renderPerSong)}>
              {renderPerSong ? <CheckSquare size={14} /> : <Square size={14} className="text-gray-500 group-hover:text-gray-400" />}
            </div>
            Render per song (resumable)
          </label>

          {/* RENDER MODE SELECTOR */}
          <div className="flex items-center gap-3 bg-[#12131a] px-3 py-1 rounded border border-[#2d3247]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mode</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-300 hover:text-white transition-colors">
              <input 
                type="radio" 
                name="renderMode" 
                value="FAST"
                checked={renderMode === 'FAST'}
                onChange={() => setRenderMode('FAST')}
                className="accent-orange-500 cursor-pointer"
              />
              Fast
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-300 hover:text-white transition-colors">
              <input 
                type="radio" 
                name="renderMode" 
                value="NORMAL"
                checked={renderMode === 'NORMAL'}
                onChange={() => setRenderMode('NORMAL')}
                className="accent-orange-500 cursor-pointer"
              />
              Normal
            </label>
          </div>
        </div>

        <button 
          onClick={() => {
            if (onAddToQueue) {
              // Pass the render settings payload out
              onAddToQueue({
                resolution, fps, codec, bFrame, renderPerSong, renderMode
              });
            }
          }}
          className="bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-[11px] font-bold px-8 py-2 rounded shadow-[0_0_15px_rgba(234,88,12,0.3)] flex items-center gap-1.5 transition-all"
        >
          <Play size={12} className="fill-current" />
          Add to Queue
        </button>

      </div>

    </div>
  );
}
