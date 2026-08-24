import React, { useState } from 'react';
import M1WindowFrame from './ui/M1WindowFrame';
import { getApiUrl } from '../../utils/apiUrl';

// ─── CYBER TOGGLE SWITCH COMPONENT ───
function CyberToggle({ label, checked, onChange, title }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="flex items-center gap-1.5 cursor-pointer select-none group py-0.5"
      title={title || label}
    >
      {/* Toggle Pill Track */}
      <div
        className={`w-7 h-4 rounded-full transition-all duration-200 relative p-0.5 border ${
          checked
            ? 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
            : 'bg-black/70 border-[#444] group-hover:border-gray-400'
        }`}
      >
        {/* Toggle Knob */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${
            checked
              ? 'translate-x-3 bg-white shadow-sm'
              : 'translate-x-0 bg-gray-400'
          }`}
        />
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider font-['Rajdhani'] transition-colors ${
          checked ? 'text-white drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]' : 'text-gray-400 group-hover:text-gray-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function M1BatchWorkstationModal({ m1Slots, updateM1Slot, closeModal }) {
  const [fetchStates, setFetchStates] = useState({}); // { [idx]: { progress, statusText, isFetching, error } }

  // Description Modal State
  const [descModalIdx, setDescModalIdx] = useState(null);
  const [tempDesc, setTempDesc] = useState('');
  const [batchRephrasing, setBatchRephrasing] = useState(false);

  // ─── SYNCED MASTER OVERLAYS STATE (4 Workspace Default Overlays) ───
  const allSubscribe = m1Slots.length > 0 && m1Slots.every(s => s?.useSubscribe);
  const allOverlay = m1Slots.length > 0 && m1Slots.every(s => s?.useOverlay);
  const allLogo = m1Slots.length > 0 && m1Slots.every(s => s?.useLogoChannel);
  const allWatermark = m1Slots.length > 0 && m1Slots.every(s => s?.useWatermark);

  const handleToggleMasterSubscribe = (newVal) => {
    m1Slots.forEach((_, idx) => {
      updateM1Slot(idx, 'useSubscribe', newVal);
    });
  };

  const handleToggleMasterOverlay = (newVal) => {
    m1Slots.forEach((_, idx) => {
      updateM1Slot(idx, 'useOverlay', newVal);
    });
  };

  const handleToggleMasterLogo = (newVal) => {
    m1Slots.forEach((_, idx) => {
      updateM1Slot(idx, 'useLogoChannel', newVal);
    });
  };

  const handleToggleMasterWatermark = (newVal) => {
    m1Slots.forEach((_, idx) => {
      updateM1Slot(idx, 'useWatermark', newVal);
    });
  };

  const cleanBaseFilename = (str) => {
    return str.replace(/[^a-zA-Z0-9\s_-]/g, '_').replace(/\s+/g, ' ').trim();
  };

  // ─── SINGLE YOUTUBE FETCH ENGINE ───
  const fetchSingleYoutube = async (idx, url) => {
    if (!url) return;
    setFetchStates(prev => ({
      ...prev,
      [idx]: { progress: 0, statusText: 'CONNECTING...', isFetching: true, error: null }
    }));

    try {
      const targetApiUrl = getApiUrl('/api/m1/youtube/fetch');
      const res = await fetch(targetApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Server error (${res.statusText || 'Endpoint unavailable'})`);
      }
      if (!res.body) {
        throw new Error('Streaming response body unavailable.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) {
                setFetchStates(prev => ({
                  ...prev,
                  [idx]: { progress: 0, statusText: 'ERROR', isFetching: false, error: data.error }
                }));
                break;
              }

              if (data.statusText) {
                setFetchStates(prev => ({
                  ...prev,
                  [idx]: { ...(prev[idx] || {}), statusText: data.statusText }
                }));
              }
              if (data.progress !== undefined) {
                setFetchStates(prev => ({
                  ...prev,
                  [idx]: { ...(prev[idx] || {}), progress: data.progress }
                }));
              }

              if (data.metadata || data.done || data.videoId || data.title) {
                const meta = data.metadata || data;
                const vId = meta.videoId || data.videoId || m1Slots[idx]?.videoId;
                const rawTitle = meta.title || data.title || vId || `Slot_${idx + 1}_Audio`;
                const cleanTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
                let base = cleanTitle;
                if (m1Slots[idx]?.titleStrategy === 'Original + Suffix') {
                  base += m1Slots[idx]?.titleSuffix || '';
                }

                const allUpdates = {
                  sourceType: 'YouTube URL',
                  youtubeUrl: url,
                  videoTitle: rawTitle,
                  channelName: meta.channelName || meta.uploader || meta.channel || 'YouTube Source',
                  videoId: vId,
                  thumbnailUrl: meta.thumbnailUrl || (vId ? `https://i.ytimg.com/vi/${vId}/hqdefault.jpg` : null),
                  originalDesc: meta.description || data.description || "Metadata Fetched automatically via backend integration.",
                  cleanedDesc: meta.description || data.description || "Metadata Fetched automatically via backend integration.",
                  duration: meta.durationDisplay || data.durationDisplay || "0m 00s",
                  isFetched: true,
                  isApproved: true
                };

                if (m1Slots[idx]?.titleStrategy !== 'Custom') {
                  allUpdates.outputName = `${cleanBaseFilename(base)}.mp4`;
                }
                if (data.audioPath || meta.audioPath) {
                  allUpdates.audio = data.audioPath || meta.audioPath;
                }

                updateM1Slot(idx, allUpdates);
                setFetchStates(prev => ({
                  ...prev,
                  [idx]: { progress: 100, statusText: 'COMPLETE ✓', isFetching: false, error: null }
                }));
              }
            } catch (e) {
              if (e.message && !e.message.startsWith('Unexpected end')) {
                console.error(e);
              }
            }
          }
        }
      }
    } catch (e) {
      setFetchStates(prev => ({
        ...prev,
        [idx]: { progress: 0, statusText: 'FAILED', isFetching: false, error: e.message }
      }));
    }
  };

  // ─── APPROVE ALL SLOTS & CLOSE ───
  const handleApproveAllAndClose = () => {
    m1Slots.forEach((slot, idx) => {
      const hasAudio = slot?.sourceType === 'Audio File' && slot?.audio;
      const hasYoutube = slot?.sourceType === 'YouTube URL' && (slot?.isFetched || slot?.youtubeUrl);
      if (hasAudio || hasYoutube) {
        if (!slot?.outputName) {
          const fallbackName = `Segment_${String(idx + 1).padStart(2, '0')}.mp4`;
          updateM1Slot(idx, 'outputName', fallbackName);
        }
        updateM1Slot(idx, 'isApproved', true);
      }
    });
    closeModal();
  };

  const readySlotsCount = m1Slots.filter(s => {
    const hasAudio = s?.sourceType === 'Audio File' && Boolean(s?.audio && s?.audio.trim() !== '');
    const hasYoutube = (s?.sourceType === 'YouTube URL' || !s?.sourceType) && Boolean((s?.isFetched && (s?.audio || s?.videoId)) || s?.videoId || (s?.youtubeUrl && s?.isApproved));
    const hasSource = hasAudio || hasYoutube;
    return Boolean(hasSource && s?.outputName && (s?.isApproved || s?.isFetched));
  }).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[60px]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={closeModal}></div>

      <M1WindowFrame className="w-[96vw] max-w-[1400px] h-[88vh] max-h-[880px] animate-fade-in flex flex-col border border-[#3b3f54] shadow-2xl relative overflow-hidden bg-[#161822]">
        
        {/* Top Orange Laser Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/20 via-orange-500 to-orange-600/20 shadow-[0_0_12px_rgba(249,115,22,0.8)] z-30 pointer-events-none"></div>

        {/* WORKSTATION HEADER */}
        <div className="flex items-center justify-between px-6 h-[54px] shrink-0 border-b border-[#2d3142] relative z-20 bg-[#1c1e29] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse shrink-0"></div>
            <h2 className="font-['Rajdhani'] font-bold text-base uppercase tracking-[0.2em] text-white flex items-center gap-2">
              BATCH WORKSTATION <span className="text-gray-600">/</span> <span className="text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]">MULTI-SLOT CONFIGURATOR</span>
            </h2>
            <span className="bg-[#12131b] text-orange-400 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded border border-orange-500/30">
              {m1Slots.length} SEGMENTS ALLOCATED
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={closeModal} className="text-gray-400 hover:text-orange-400 transition-colors p-1 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* WORKSTATION BODY */}
        <div className="flex flex-col flex-1 min-h-0 relative z-10 bg-[#14151e] p-4 gap-3.5 overflow-hidden">
          
          {/* MASTER OVERLAYS BAR with Orange Accent */}
          <div className="bg-[#1a1c27] border border-[#2e3347] hover:border-orange-500/40 rounded-xl p-3 px-5 shadow-sm flex items-center justify-between gap-4 shrink-0 flex-wrap relative overflow-hidden transition-colors">
            
            {/* Left Description */}
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,1)]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-['Rajdhani'] drop-shadow-sm">
                MASTER OVERLAYS:
              </span>
              <span className="text-[11px] text-gray-300 font-medium hidden sm:inline">
                Sinkronisasi overlay workspace ke semua segment secara serentak
              </span>
            </div>

            {/* Right: Master 4 Overlays Toggle Switches */}
            <div className="flex items-center gap-4 bg-[#12131b] px-4 py-1.5 rounded-lg border border-[#2d3142]">
              <CyberToggle
                label="Subscribe"
                checked={allSubscribe}
                onChange={handleToggleMasterSubscribe}
                title="Aktifkan/Nonaktifkan animasi subscribe workspace ke SEMUA segment"
              />
              <CyberToggle
                label="Overlay"
                checked={allOverlay}
                onChange={handleToggleMasterOverlay}
                title="Aktifkan/Nonaktifkan frame overlay workspace ke SEMUA segment"
              />
              <CyberToggle
                label="Logo"
                checked={allLogo}
                onChange={handleToggleMasterLogo}
                title="Aktifkan/Nonaktifkan logo channel workspace ke SEMUA segment"
              />
              <CyberToggle
                label="Watermark"
                checked={allWatermark}
                onChange={handleToggleMasterWatermark}
                title="Aktifkan/Nonaktifkan watermark workspace ke SEMUA segment"
              />
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID LAYOUT */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scroll">
            <div className="grid grid-cols-2 gap-3.5">
              {m1Slots.map((slot, idx) => {
                const isSlotFetching = fetchStates[idx]?.isFetching || slot?.isFetching;
                const slotStatusText = fetchStates[idx]?.statusText || slot?.fetchStatusText;
                const slotProgressPct = fetchStates[idx]?.progress || slot?.fetchProgress || 0;
                
                const hasAudio = slot?.sourceType === 'Audio File' && Boolean(slot?.audio && slot?.audio.trim() !== '');
                const hasYoutube = (slot?.sourceType === 'YouTube URL' || !slot?.sourceType) && Boolean((slot?.isFetched && (slot?.audio || slot?.videoId)) || slot?.videoId || (slot?.youtubeUrl && slot?.isApproved));
                const hasSource = hasAudio || hasYoutube;
                const isReady = Boolean(hasSource && slot?.outputName && (slot?.isApproved || slot?.isFetched));
                
                let activeThumbnail = null;
                if (slot?.manualThumbnail) {
                  activeThumbnail = slot.manualThumbnail;
                } else if (slot?.thumbnailUrl) {
                  activeThumbnail = slot.thumbnailUrl;
                } else if (slot?.sourceType === 'YouTube URL' && slot?.videoId) {
                  activeThumbnail = `https://i.ytimg.com/vi/${slot.videoId}/hqdefault.jpg`;
                }

                return (
                  <div
                    key={slot.slotId || idx}
                    className={`rounded-xl p-3 shadow-sm flex flex-col gap-2.5 transition-all relative overflow-hidden ${
                      isReady 
                        ? 'border border-orange-500/50 bg-[#1c1e29] shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                        : 'border border-[#2a2d3a] bg-[#171822]'
                    }`}
                  >
                    {/* Top Row: Segment Title, Status Badge, Source Selector & Duration */}
                    <div className="flex items-center justify-between border-b border-[#2a2d3a] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-orange-400 bg-black/60 px-2 py-0.5 rounded border border-[#2e3240]">
                          SEGMENT {String(idx + 1).padStart(2, '0')}
                        </span>
                        {isReady ? (
                          <span className="bg-gradient-to-r from-orange-600 to-orange-500 text-white border border-orange-300 text-[9px] font-bold font-['Rajdhani'] px-2 py-0.5 rounded flex items-center gap-1 uppercase shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                            READY
                          </span>
                        ) : (
                          <span className="bg-[#12131a] text-gray-500 border border-[#2a2d3a] text-[9px] font-bold px-2 py-0.5 rounded">
                            UNCONFIGURED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Source Type Mini Toggle */}
                        <div className="flex bg-[#12131b] p-0.5 rounded border border-[#2a2d3a]">
                          {['YouTube URL', 'Audio File'].map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                updateM1Slot(idx, 'sourceType', type);
                                if (type === 'Audio File') {
                                  updateM1Slot(idx, 'youtubeUrl', '');
                                } else {
                                  updateM1Slot(idx, 'audio', '');
                                }
                              }}
                              className={`px-2 py-0.5 text-[9px] font-bold font-['Rajdhani'] rounded cursor-pointer transition-all ${
                                (slot?.sourceType || 'YouTube URL') === type
                                  ? 'bg-[#252838] text-orange-400 border border-orange-500/50 shadow-sm'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {type === 'YouTube URL' ? 'YouTube' : 'Audio'}
                            </button>
                          ))}
                        </div>

                        <span className="font-mono text-[10px] text-orange-400/90 font-bold">
                          {slot?.duration || '0m 00s'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row 1: Source Input Bar */}
                    <div className="flex items-center gap-1.5">
                      {slot?.sourceType === 'Audio File' ? (
                        <>
                          <input
                            type="text"
                            value={slot?.audio || ''}
                            onChange={(e) => updateM1Slot(idx, 'audio', e.target.value)}
                            placeholder="Path file audio lokal (D:\Audio\track.mp3)..."
                            className="flex-1 bg-[#101117] border border-[#2a2d3a] focus:border-orange-500/60 rounded px-2.5 py-1 text-[11px] text-white font-mono outline-none shadow-inner"
                          />
                          <input
                            type="file"
                            accept="audio/*"
                            id={`col2-audio-${idx}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const filePath = file.path || file.name;
                                updateM1Slot(idx, 'audio', filePath);
                                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                const cleanBase = cleanBaseFilename(baseName);
                                updateM1Slot(idx, 'outputName', `${cleanBase}.mp4`);
                                updateM1Slot(idx, 'isApproved', true);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`col2-audio-${idx}`)?.click()}
                            className="bg-[#242735] hover:bg-[#303446] border border-[#3b3f54] text-gray-200 text-[10px] font-bold font-['Rajdhani'] px-2.5 py-1 rounded transition-colors cursor-pointer shrink-0"
                          >
                            BROWSE
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={slot?.youtubeUrl || ''}
                            onChange={(e) => updateM1Slot(idx, 'youtubeUrl', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 bg-[#101117] border border-[#2a2d3a] focus:border-orange-500/60 rounded px-2.5 py-1 text-[11px] text-white font-mono outline-none shadow-inner"
                          />
                          <button
                            type="button"
                            disabled={isSlotFetching || !slot?.youtubeUrl}
                            onClick={() => fetchSingleYoutube(idx, slot.youtubeUrl)}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-40 text-white text-[10px] font-bold font-['Rajdhani'] px-3 py-1 rounded transition-colors cursor-pointer shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                          >
                            {isSlotFetching ? 'FETCHING...' : 'FETCH'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Middle Row 2: Thumbnail, Output Rename & Deskripsi Button */}
                    <div className="flex items-center gap-2.5">
                      
                      {/* Mini Thumbnail Preview */}
                      <div className="w-[88px] h-[50px] bg-black/90 rounded-md border border-[#2a2d3a] hover:border-orange-500/50 overflow-hidden relative group flex items-center justify-center shrink-0 shadow-inner transition-colors">
                        {activeThumbnail ? (
                          <img
                            src={activeThumbnail}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (slot?.videoId && !e.target.src.includes('hqdefault')) {
                                e.target.src = `https://i.ytimg.com/vi/${slot.videoId}/hqdefault.jpg`;
                              }
                            }}
                          />
                        ) : (
                          <div className="text-[8px] font-mono text-gray-500 font-bold uppercase text-center p-0.5">
                            NO THUMB
                          </div>
                        )}

                        <input
                          id={`col2-thumb-${idx}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const url = URL.createObjectURL(e.target.files[0]);
                              updateM1Slot(idx, 'manualThumbnail', url);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`col2-thumb-${idx}`)?.click()}
                          className="absolute inset-0 bg-black/80 hover:bg-orange-600/90 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          <span>GANTI</span>
                        </button>
                      </div>

                      {/* Output Name Input & Deskripsi Button */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex items-center bg-[#101117] border border-[#2a2d3a] rounded px-2 py-0.5 focus-within:border-orange-500/60 shadow-inner">
                          <span className="text-[9px] font-bold font-mono text-orange-400 mr-1.5 uppercase">OUT:</span>
                          <input
                            type="text"
                            value={slot?.outputName || ''}
                            onChange={(e) => updateM1Slot(idx, 'outputName', e.target.value)}
                            placeholder="Nama_Video.mp4"
                            className="flex-1 bg-transparent text-[11px] text-white font-bold font-mono outline-none truncate"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDescModalIdx(idx);
                            setTempDesc(slot?.originalDesc || slot?.cleanedDesc || '');
                          }}
                          className="w-full bg-[#1c1e29] hover:bg-[#252838] text-gray-300 text-[10px] font-bold py-0.5 rounded border border-[#2a2d3a] hover:border-orange-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <svg className="w-2.5 h-2.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          <span>EDIT DESKRIPSI</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: 4 Cyber Toggle Switches for Overlays */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#2a2d3a] flex-wrap gap-2">
                      <CyberToggle
                        label="Subscribe"
                        checked={Boolean(slot?.useSubscribe)}
                        onChange={(val) => updateM1Slot(idx, 'useSubscribe', val)}
                        title="Aktifkan animasi subscribe workspace"
                      />
                      <CyberToggle
                        label="Overlay"
                        checked={Boolean(slot?.useOverlay)}
                        onChange={(val) => updateM1Slot(idx, 'useOverlay', val)}
                        title="Aktifkan frame overlay workspace"
                      />
                      <CyberToggle
                        label="Logo"
                        checked={Boolean(slot?.useLogoChannel)}
                        onChange={(val) => updateM1Slot(idx, 'useLogoChannel', val)}
                        title="Aktifkan logo channel workspace"
                      />
                      <CyberToggle
                        label="Watermark"
                        checked={Boolean(slot?.useWatermark)}
                        onChange={(val) => updateM1Slot(idx, 'useWatermark', val)}
                        title="Aktifkan watermark workspace"
                      />
                    </div>

                    {/* Live Progress Bar if fetching */}
                    {isSlotFetching && (
                      <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden relative mt-0.5">
                        <div
                          className="bg-orange-500 h-full transition-all duration-200"
                          style={{ width: `${slotProgressPct}%` }}
                        />
                        <span className="text-[8px] font-mono text-orange-400 block mt-0.5 truncate">{slotStatusText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM FOOTER ACTIONS */}
          <div className="bg-[#1a1c27] border border-[#2e3347] rounded-xl p-3 px-4 flex items-center justify-between gap-4 shrink-0 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="text-white text-xs font-bold font-mono">
                STATUS KESIAPAN: <strong className="text-orange-400 text-sm drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]">{readySlotsCount} / {m1Slots.length}</strong> SLOTS READY
              </span>
              {readySlotsCount === m1Slots.length && m1Slots.length > 0 && (
                <span className="text-orange-400 text-[11px] font-bold flex items-center gap-1 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  SEMUA SLOT SIAP DI-RENDER
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="bg-[#12131b] hover:bg-white/10 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-[#2d3142] transition-colors cursor-pointer"
              >
                TUTUP
              </button>
              
              <button
                type="button"
                onClick={handleApproveAllAndClose}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-400 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                <span>APPROVE ALL & APPLY TO DASHBOARD</span>
              </button>
            </div>
          </div>
        </div>
      </M1WindowFrame>

      {/* DEDICATED DESKRIPSI EDIT MODAL POPUP */}
      {descModalIdx !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDescModalIdx(null)}></div>
          <div className="relative bg-[#1c1e29] border border-[#3b3f54] hover:border-orange-500/50 rounded-xl p-5 w-[90vw] max-w-[640px] shadow-2xl z-10 flex flex-col gap-4 animate-scale-up overflow-hidden transition-colors">
            <div className="flex items-center justify-between border-b border-[#2d3142] pb-3 flex-wrap gap-2">
              <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="text-orange-400">EDIT DESKRIPSI</span> / SEGMENT {String(descModalIdx + 1).padStart(2, '0')}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={batchRephrasing || !tempDesc}
                  onClick={async () => {
                    if (!tempDesc.trim()) return;
                    setBatchRephrasing(true);
                    let geminiKey = localStorage.getItem('mf_gemini_api_key') || '';
                    let groqKey = localStorage.getItem('mf_groq_api_key') || '';
                    let openaiKey = '';
                    try {
                      const raw = localStorage.getItem('mf_api_keys');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        const g = parsed.find(k => (k.platform === 'google' || k.platform === 'gemini') && k.key);
                        if (g && !geminiKey) geminiKey = g.key;
                        const gr = parsed.find(k => k.platform === 'groq' && k.key);
                        if (gr && !groqKey) groqKey = gr.key;
                        const o = parsed.find(k => k.platform === 'openai' && k.key);
                        if (o) openaiKey = o.key;
                      }
                    } catch(e) {}
                    const provider = geminiKey ? 'gemini' : (groqKey ? 'groq' : (openaiKey ? 'openai' : 'gemini'));
                    const apiKey = geminiKey || groqKey || openaiKey || '';
                    try {
                      const res = await fetch(getApiUrl('/api/v1/ai/rephrase'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: tempDesc,
                          title: m1Slots[descModalIdx]?.videoTitle || '',
                          style: 'clean_rephrase',
                          apiKey,
                          provider
                        })
                      });
                      const d = await res.json();
                      if (d && d.success && d.rephrased) {
                        setTempDesc(d.rephrased);
                      }
                    } catch(e) {
                      console.error(e);
                    } finally {
                      setBatchRephrasing(false);
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 via-orange-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border border-white/20"
                >
                  {batchRephrasing ? 'REPHRASING...' : '✨ AI REPHRASE'}
                </button>

                <button onClick={() => setDescModalIdx(null)} className="text-gray-400 hover:text-white cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <textarea
              rows={9}
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              placeholder="Ketik deskripsi video di sini..."
              className="w-full bg-[#12131b] border border-[#2d3142] focus:border-orange-500/60 rounded-lg p-3 text-xs text-white font-mono outline-none resize-none leading-relaxed shadow-inner"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDescModalIdx(null)}
                className="bg-[#12131b] hover:bg-white/10 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-[#2d3142] cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => {
                  updateM1Slot(descModalIdx, 'originalDesc', tempDesc);
                  updateM1Slot(descModalIdx, 'cleanedDesc', tempDesc);
                  setDescModalIdx(null);
                }}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-bold px-5 py-2 rounded-lg shadow border border-orange-400 cursor-pointer"
              >
                SIMPAN DESKRIPSI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
