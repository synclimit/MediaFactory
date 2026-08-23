import React from 'react';
import Tooltip from '../ui/Tooltip.jsx';
import M1CanvaVideoEditor from './M1CanvaVideoEditor.jsx';
import { getApiUrl } from '../../utils/apiUrl.js';

export default function M1VideoUpload({
  m1VideoProbing,
  handleVideoUploadChange,
  selectedVideo,
  handleManualVideoPathChange,
  m1VideoProbeError,
  m1VideoRotation = 0,
  handleRotateVideo,
  m1VideoTransform,
  setM1VideoTransform
}) {
  const fileInputRef = React.useRef(null);
  
  const handleNativeDialog = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    // 1. If inside Electron, try native Electron IPC dialog first
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const pathResult = await ipcRenderer.invoke('show-open-dialog', {
          properties: ['openFile'],
          filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }]
        });
        if (pathResult && pathResult.length > 0) {
          if (handleManualVideoPathChange) {
            handleManualVideoPathChange({ target: { value: pathResult[0] } });
          }
          return;
        }
      } catch(err) {
        console.warn('[M1] IPC dialog fallback:', err);
      }
    }

    // 2. Backend dialog fallback
    try {
      const res = await fetch(getApiUrl('/api/v1/m5/dialog/file'), { method: 'POST' });
      const data = await res.json();
      if (data && data.path && handleManualVideoPathChange) {
        handleManualVideoPathChange({ target: { value: data.path } });
        return;
      }
    } catch(err) {}

    // 3. Direct HTML File Picker (instant, 100% reliable in any browser or webview)
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (handleVideoUploadChange) {
      handleVideoUploadChange(e);
    } else if (file.path && handleManualVideoPathChange) {
      handleManualVideoPathChange({ target: { value: file.path } });
    }
  };

  // ─── EMPTY STATE (Match Mockup 1:1) ───
  if (!selectedVideo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full h-[250px] animate-fade-in relative z-10">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/mp4,video/quicktime,video/x-matroska,video/avi,video/webm" 
          className="hidden" 
          onChange={handleFileInputChange} 
        />
        
        {/* Giant Glowing Clapperboard Icon */}
        <div className="relative mb-4 group cursor-pointer" onClick={handleNativeDialog}>
          <div className="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full scale-150 group-hover:bg-orange-500/30 transition-all duration-500"></div>
          <svg className="relative w-24 h-24 text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 35 L80 35 L80 80 L20 80 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M20 35 L35 20 L95 20 L80 35" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M40 20 L25 35 M60 20 L45 35 M80 20 L65 35" stroke="currentColor" strokeWidth="4"/>
            {/* Inner Play Button */}
            <polygon points="42,48 42,66 58,57" fill="currentColor" className="drop-shadow-[0_0_10px_rgba(249,115,22,1)]" />
          </svg>
        </div>

        {/* Typography */}
        <h2 className="text-3xl font-black text-white tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">IMPORT VIDEO</h2>
        <p className="text-gray-300 font-medium text-[14px] mb-6">Pilih file video dari lokal perangkat Anda</p>

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md mb-4">
          <div className="flex w-full gap-2">
            <button 
              type="button"
              onClick={handleNativeDialog} 
              className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-b from-orange-500/20 to-orange-600/10 hover:from-orange-500/30 hover:to-orange-600/20 border border-orange-500/60 p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-[0_0_25px_rgba(249,115,22,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] group"
            >
              <svg className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <div className="flex flex-col">
                <span className="text-orange-400 font-black text-[16px] tracking-[0.2em] drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">BROWSE FILE</span>
              </div>
              {m1VideoProbing && <span className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center text-orange-500 font-black text-lg tracking-widest backdrop-blur-md">PROBING...</span>}
            </button>
          </div>
          
          <div className="w-full flex items-center gap-2 text-sm text-gray-400 mt-2">
            <div className="h-px bg-gray-600/50 flex-1"></div>
            <span>ATAU PASTE ABSOLUTE PATH</span>
            <div className="h-px bg-gray-600/50 flex-1"></div>
          </div>
          <input 
            type="text" 
            placeholder="D:\Videos\video.mp4" 
            className="w-full bg-black/50 border border-[#333] text-white px-4 py-3 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            onChange={handleManualVideoPathChange}
            disabled={m1VideoProbing}
          />
        </div>

        {m1VideoProbeError && (
          <div className="absolute bottom-2 text-red-400 text-[12px] bg-red-950/40 border border-red-500/50 rounded p-2 font-mono flex items-center gap-2">
            <span className="font-bold text-sm">✗</span>
            <span>{m1VideoProbeError}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── POPULATED STATE (Video is Selected) ───
  return (
    <>
      
      {/* Canva Interactive Video Editor */}
      <div className="flex-[0.55] min-w-0 flex flex-col justify-center">
        <M1CanvaVideoEditor 
          selectedVideo={selectedVideo}
          transform={m1VideoTransform}
          onTransformChange={setM1VideoTransform}
          m1VideoRotation={m1VideoRotation}
          handleRotateVideo={handleRotateVideo}
          handleNativeDialog={handleNativeDialog}
        />
      </div>

      {/* Center Metadata */}
      <div className="flex-[0.43] min-w-0 flex flex-col justify-center relative px-3 py-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)] animate-pulse"></span>
          <span className="text-[12px] font-['Rajdhani'] font-black tracking-[0.25em] text-orange-400 uppercase drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]">
            MASTER VIDEO SOURCE
          </span>
        </div>
        
        <h2 className="text-white font-['Rajdhani'] font-bold text-[28px] mb-4 line-clamp-2 break-all drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] block w-full leading-tight" title={selectedVideo?.metadata?.fileName}>
          {selectedVideo?.metadata?.fileName || 'No Video Selected'}
        </h2>
        
        {/* Crisp Tabular Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 w-full bg-black/40 border border-[#2e323e] rounded-xl p-3.5 shadow-inner">
          {/* Row 1: Durasi & Resolusi */}
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-gray-400 font-['Rajdhani'] font-bold text-[14px] uppercase tracking-wider">Durasi:</span>
            <span className="text-white font-mono font-bold text-[16px] tracking-wide text-right drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {selectedVideo?.metadata?.durationDisplay || '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-gray-400 font-['Rajdhani'] font-bold text-[14px] uppercase tracking-wider">Resolusi:</span>
            <span className="text-white font-mono font-bold text-[16px] tracking-wide text-right drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {selectedVideo?.metadata?.resolution || '—'}
            </span>
          </div>

          {/* Row 2: FPS & Codec */}
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-gray-400 font-['Rajdhani'] font-bold text-[14px] uppercase tracking-wider">FPS:</span>
            <span className="text-white font-mono font-bold text-[16px] tracking-wide text-right drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {selectedVideo?.metadata?.fps != null ? selectedVideo.metadata.fps.toFixed(2) : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-gray-400 font-['Rajdhani'] font-bold text-[14px] uppercase tracking-wider">Codec:</span>
            <span className="text-white font-mono font-bold text-[16px] tracking-wide text-right drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              {selectedVideo?.metadata?.codec || '—'}
            </span>
          </div>

          {/* Row 3: Ukuran */}
          <div className="flex items-center justify-between col-span-2 pt-0.5">
            <span className="text-gray-400 font-['Rajdhani'] font-bold text-[14px] uppercase tracking-wider">Ukuran File:</span>
            <span className="text-orange-400 font-mono font-bold text-[16px] tracking-wide text-right drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]">
              {selectedVideo?.metadata?.fileSizeDisplay || '—'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
