import React, { useState, useEffect } from 'react';
import { Play, CheckSquare, Square, Layers, ChevronDown, HelpCircle } from 'lucide-react';

export default function M3ExportSettingsPanel({ renderMode = 'FAST', onAddToQueue, outputFilename: propFilename, setOutputFilename: propSetFilename, initialFilename = '', isThumbnailMode = false }) {
  const [internalFilename, setInternalFilename] = useState(initialFilename || 'Chill Lofi Playlist Mix.mp4');
  
  const outputFilename = propFilename !== undefined ? propFilename : internalFilename;
  const setOutputFilename = propSetFilename || setInternalFilename;

  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState('60');
  const [codec, setCodec] = useState('H.264');
  const [bitrate, setBitrate] = useState('auto');
  const [audioBitrate, setAudioBitrate] = useState('192k');
  const [bFrame, setBFrame] = useState('Otomatis');

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
              onClick={() => setResolution('480p')} 
              className={`flex-1 text-[11px] font-bold border rounded-l transition-colors ${resolution === '480p' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              480p
            </button>
            <button 
              onClick={() => setResolution('720p')} 
              className={`flex-1 text-[11px] font-bold border-y border-r transition-colors ${resolution === '720p' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              720p
            </button>
            <button 
              onClick={() => setResolution('1080p')} 
              className={`flex-1 text-[11px] font-bold border-y border-r rounded-r transition-colors ${resolution === '1080p' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              1080p
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
            <button 
              onClick={() => setFps('60')} 
              className={`flex-1 text-[11px] font-bold border-y border-r rounded-r transition-colors ${fps === '60' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              60
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
            <button 
              onClick={() => setCodec('H.265')} 
              className={`flex-1 text-[11px] font-bold border-y border-r rounded-r transition-colors ${codec === 'H.265' ? 'bg-orange-500/20 border-orange-500 text-orange-500 z-10' : 'bg-[#12131a] border-[#2d3247] text-gray-400 hover:bg-[#1a1b26]'}`}
            >
              H.265
            </button>
          </div>
        </div>

        {/* ROW 2 */}
        {/* Bitrate */}
        <div className="flex flex-col">
          <label className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
            Bitrate <HelpCircle size={10} className="text-gray-600" />
          </label>
          <div className="relative h-7">
            <select 
              value={bitrate}
              onChange={(e) => setBitrate(e.target.value)}
              className="w-full h-full bg-[#12131a] border border-[#2d3247] text-gray-300 hover:border-gray-500 text-[11px] font-medium rounded px-2 appearance-none outline-none focus:border-orange-500 transition-colors cursor-pointer truncate pr-6"
            >
              <option value="auto">Auto (2.5M)</option>
              <option value="5M">5 Mbps</option>
              <option value="8M">8 Mbps</option>
              <option value="12M">12 Mbps</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Audio Bitrate */}
        <div className="flex flex-col">
          <label className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
            Audio Bitrate <HelpCircle size={10} className="text-gray-600" />
          </label>
          <div className="relative h-7">
            <select 
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              className="w-full h-full bg-[#12131a] border border-[#2d3247] text-gray-300 hover:border-gray-500 text-[11px] font-medium rounded px-2 appearance-none outline-none focus:border-orange-500 transition-colors cursor-pointer truncate pr-6"
            >
              <option value="128k">128 kbps</option>
              <option value="192k">192 kbps (Standar)</option>
              <option value="256k">256 kbps</option>
              <option value="320k">320 kbps (Tinggi)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" />
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

      {/* ROW 3: Filename Rename Input & Add to Queue Button (Identical to Composer) */}
      <div className="flex items-center justify-between border-t border-[#1a1b26] pt-2.5 mt-2.5 gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#12131a] border border-[#2d3247] hover:border-gray-500 focus-within:border-orange-500 rounded px-2.5 py-1 transition-colors">
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            🎬 Output:
          </span>
          <input 
            type="text"
            value={outputFilename}
            onChange={(e) => setOutputFilename(e.target.value)}
            placeholder="Chill Lofi Playlist Mix.mp4"
            className="bg-transparent text-white font-mono text-[11px] outline-none flex-1 w-full"
          />
        </div>

        <button 
          onClick={() => {
            if (onAddToQueue) {
              onAddToQueue({
                filename: outputFilename || 'Chill Lofi Playlist Mix.mp4',
                outputFilename: outputFilename || 'Chill Lofi Playlist Mix.mp4',
                resolution, fps, codec, bitrate, audioBitrate, bFrame, renderMode
              });
            }
          }}
          className="bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-[11px] font-bold px-7 py-2 rounded shadow-[0_0_15px_rgba(234,88,12,0.3)] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <Play size={12} className="fill-current" />
          Add to Queue
        </button>

      </div>

    </div>
  );
}
