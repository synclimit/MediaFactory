import React, { useState } from 'react';
import M1WindowFrame from './ui/M1WindowFrame';
import M1MechanicalPanel from './ui/M1MechanicalPanel';
import M1Divider from './ui/M1Divider';
import M1SectionHeader from './ui/M1SectionHeader';
import M1Input from './ui/M1Input';
import M1Select from './ui/M1Select';
import M1Button from './ui/M1Button';

export default function M1ConfigureAssetModal({ slot, idx, updateM1Slot, closeModal }) {
  const [showDescModal, setShowDescModal] = useState(false);
  
  if (!slot) return null;

  // Determine Active Thumbnail Source
  let activeThumbnail = null;
  let thumbSourceText = '---';

  const isReady = slot?.isFetched || (slot?.sourceType === 'Audio File' && slot?.audio);

  if (slot?.manualThumbnail) {
    activeThumbnail = slot.manualThumbnail;
    thumbSourceText = 'MANUAL OVERRIDE';
  } else if (slot?.sourceType === 'YouTube URL' && slot?.isFetched) {
    activeThumbnail = slot?.videoId ? `https://img.youtube.com/vi/${slot.videoId}/maxresdefault.jpg` : '/assets/dummy/youtube-thumbnail.svg';
    thumbSourceText = 'AUTO YOUTUBE';
  } else if (slot?.sourceType === 'Audio File' && slot?.audio) {
    activeThumbnail = '/assets/dummy/master-frame.svg';
    thumbSourceText = 'MASTER FRAME';
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[80px]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={closeModal}></div>

      <M1WindowFrame className="w-[95vw] max-w-[1300px] h-[650px] animate-fade-in">
        
        {/* Workstation Header */}
        <div className="flex items-center justify-between px-6 h-[60px] shrink-0 border-b border-[#3b3e4f] relative z-20 bg-[#2a2d36] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] animate-pulse shrink-0"></div>
            <h2 className="font-['Rajdhani'] font-bold text-base uppercase tracking-[0.25em] text-white">
              ASSET CONFIGURATION <span className="text-gray-600 mx-2">/</span> <span className="text-[var(--m1-accent-orange)]">UPLINK SLOT {String(idx + 1).padStart(2, '0')}</span>
            </h2>
            <div className="hidden lg:flex items-center gap-2 ml-4 opacity-40">
              <div className="w-4 h-[1px] bg-orange-500"></div>
              <div className="w-1 h-1 bg-orange-500 rotate-45"></div>
              <div className="w-12 h-[1px] bg-orange-500"></div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={closeModal} className="text-gray-500 hover:text-[var(--m1-accent-orange)] transition-colors p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Workstation Body */}
        <div className="flex flex-row flex-1 min-h-0 relative z-10 bg-[#20222a]">
          
          {/* LEFT PANEL: CONFIGURATION */}
          <M1MechanicalPanel className="w-[45%] h-full flex flex-col p-6 overflow-y-auto custom-scroll">
            <M1SectionHeader title="SOURCE PARAMETERS" status="active" />
            
            <div className="flex flex-col gap-6 mt-2">
              {/* Source Type Toggle */}
              <div className="flex bg-[#20222a] p-1 rounded-[var(--m1-radius-control)] border border-[var(--m1-border-primary)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] h-[var(--m1-height-control)] shrink-0 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10 pointer-events-none"></div>
                {['YouTube URL', 'Audio File'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`flex-1 font-['Rajdhani'] font-bold text-[11px] uppercase tracking-widest rounded transition-all duration-150 relative z-10 ${
                      (slot?.sourceType || 'YouTube URL') === type 
                        ? 'bg-gradient-to-b from-[#1a0b05] to-[#0a0402] text-[var(--m1-accent-orange)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_15px_rgba(249,115,22,0.15)] border border-orange-500/40' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                    }`}
                    onClick={() => {
                      const nextType = type;
                      if ((slot?.sourceType || 'YouTube URL') === nextType) return;
                      updateM1Slot(idx, 'sourceType', nextType);
                      if (nextType === 'Audio File') {
                        updateM1Slot(idx, 'youtubeUrl', '');
                        updateM1Slot(idx, 'isFetched', false);
                        updateM1Slot(idx, 'isApproved', false);
                      } else {
                        updateM1Slot(idx, 'audio', '');
                        updateM1Slot(idx, 'outputName', '');
                      }
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Source Details */}
              {slot?.sourceType === 'Audio File' ? (
                <div className="flex gap-2 items-end">
                  <M1Input 
                    label="LOCAL AUDIO SOURCE FILE" 
                    value={slot?.audio || ''} 
                    onChange={(e) => updateM1Slot(idx, 'audio', e.target.value)} 
                    placeholder="e.g. D:\Audio\track.mp3" 
                    className="flex-1"
                  />
                  <label className="cursor-pointer shrink-0">
                    <div onClick={async () => {
                      try {
                        const res = await fetch('/api/m1/dialog/audio', { method: 'POST' });
                        const data = await res.json();
                        if (data.path) {
                          updateM1Slot(idx, 'audio', data.path);
                          const probeRes = await fetch('/api/m1/audio/probe', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: data.path }) 
                          });
                          const probeData = await probeRes.json();
                          if (probeData.durationDisplay) updateM1Slot(idx, 'duration', probeData.durationDisplay);
                        }
                      } catch (err) {}
                    }} className="h-[var(--m1-height-control)] px-5 bg-gradient-to-b from-[#1a1b23] to-[#0c0d12] hover:from-[#2d3247] hover:to-[#1a1b23] text-gray-300 font-['Rajdhani'] font-bold uppercase tracking-widest text-[11px] border border-[#2d3247] rounded-[var(--m1-radius-control)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_5px_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all active:scale-[0.98]">
                      BROWSE
                    </div>
                  </label>
                </div>
              ) : (
                <M1Input 
                  label="SOURCE YOUTUBE URL" 
                  value={slot?.youtubeUrl || ''} 
                  onChange={(e) => {
                    updateM1Slot(idx, 'youtubeUrl', e.target.value);
                    updateM1Slot(idx, 'isFetched', false);
                    updateM1Slot(idx, 'isApproved', false);
                  }} 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              )}

              <M1Select 
                label="OUTPUT NAMING STRATEGY" 
                value={slot?.titleStrategy || 'Original'} 
                onChange={(v) => updateM1Slot(idx, 'titleStrategy', v)}
                options={[
                  { label: 'Match Original', value: 'Original' },
                  { label: 'Original + Suffix', value: 'Original + Suffix' },
                  { label: 'Fully Custom Name', value: 'Custom' }
                ]}
              />

              {slot?.titleStrategy === 'Original + Suffix' && (
                <M1Input 
                  label="APPEND SUFFIX" 
                  value={slot?.titleSuffix || ''} 
                  onChange={(e) => updateM1Slot(idx, 'titleSuffix', e.target.value)} 
                  placeholder=" e.g. (Remix 2026)" 
                />
              )}

              <M1Select 
                label="TEXT CLEANING MODE" 
                value={slot?.metadataMode || 'Cleaned'} 
                onChange={(v) => updateM1Slot(idx, 'metadataMode', v)}
                options={[
                  { label: 'Original Payload', value: 'Original' },
                  { label: 'Cleaned Payload', value: 'Cleaned' }
                ]}
              />

              <div className="flex gap-6 mt-1 flex-wrap">
                <label className="flex items-center gap-2 text-[11px] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={slot?.useSubscribe || false} onChange={(e) => updateM1Slot(idx, 'useSubscribe', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5 cursor-pointer" />
                  SUBSCRIBE
                </label>
                <label className="flex items-center gap-2 text-[11px] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={slot?.useOverlay || false} onChange={(e) => updateM1Slot(idx, 'useOverlay', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5 cursor-pointer" />
                  OVERLAY
                </label>
                <label className="flex items-center gap-2 text-[11px] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={slot?.useLogoChannel || false} onChange={(e) => updateM1Slot(idx, 'useLogoChannel', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5 cursor-pointer" />
                  LOGO CHANNEL
                </label>
                <label className="flex items-center gap-2 text-[11px] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={slot?.useWatermark || false} onChange={(e) => updateM1Slot(idx, 'useWatermark', e.target.checked)} className="accent-orange-500 w-3.5 h-3.5 cursor-pointer" />
                  WATERMARK
                </label>
              </div>

              {slot?.sourceType === 'YouTube URL' && (
                <div className="mt-auto pt-4">
                  <M1Button 
                    variant="primary"
                    disabled={slot?.isFetching}
                    className="w-full"
                    onClick={async () => {
                      if(!slot?.youtubeUrl) { alert('Please enter a YouTube URL first.'); return; }
                      updateM1Slot(idx, 'isFetching', true);
                      try {
                        const res = await fetch('/api/m1/youtube/fetch', { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: slot.youtubeUrl }) 
                        });
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
                                if (data.error) throw new Error(data.error);
                                if (data.progress !== undefined) updateM1Slot(idx, 'fetchProgress', data.progress);
                                if (data.done) {
                                  updateM1Slot(idx, 'channelName', 'YouTube Source');
                                  updateM1Slot(idx, 'videoTitle', data.title || 'Unknown Title');
                                  updateM1Slot(idx, 'videoId', data.videoId);
                                  updateM1Slot(idx, 'audio', data.audioPath);
                                  updateM1Slot(idx, 'originalDesc', data.description || "Metadata Fetched automatically via backend integration.\n\nDescription content will appear here.");
                                  updateM1Slot(idx, 'cleanedDesc', data.description || "Metadata Fetched automatically via backend integration.\n\nDescription content will appear here.");
                                  updateM1Slot(idx, 'duration', data.durationDisplay || "0m 00s");
                                  let base = data.title ? data.title.replace(/[^a-zA-Z0-9 ]/g, '') : 'YouTube_Audio';
                                  if (slot?.titleStrategy === 'Original + Suffix') base += slot?.titleSuffix || '';
                                  if (slot?.titleStrategy !== 'Custom') updateM1Slot(idx, 'outputName', `${base}.mp4`);
                                  updateM1Slot(idx, 'isFetched', true);
                                }
                              } catch (e) {}
                            }
                          }
                        }
                      } catch (e) {
                        alert('Fetch error: ' + e.message);
                      } finally {
                        updateM1Slot(idx, 'isFetching', false);
                        updateM1Slot(idx, 'fetchProgress', 0);
                      }
                    }}
                  >
                    {slot?.isFetching ? (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 bg-orange-500/20 transition-all duration-300" style={{ width: `${slot.fetchProgress || 0}%` }}></div>
                        <svg className="animate-spin h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="relative z-10">COMMUNICATING WITH SATELLITE... {slot.fetchProgress ? `${slot.fetchProgress}%` : ''}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        FETCH METADATA
                      </>
                    )}
                  </M1Button>
                </div>
              )}
            </div>
          </M1MechanicalPanel>

          {/* STRUCTURAL DIVIDER */}
          <M1Divider />

          {/* RIGHT PANEL: OUTPUT PREVIEW */}
          <M1MechanicalPanel className="w-[55%] h-full flex flex-col p-6 overflow-hidden">
            <M1SectionHeader title="OUTPUT PREVIEW" status={isReady ? 'success' : 'idle'} />

            {/* FIXED LAYOUT CONTAINER */}
            <div className="flex flex-col flex-1 mt-2 bg-[#252833] border border-[#3b3e4f] p-6 rounded-sm shadow-inner justify-between">
              
              {/* ZONE 1: ASSET IDENTITY (Thumbnail + Meta Side-by-Side) */}
              <div className="flex gap-6 shrink-0 h-[146px]">
                {/* 260px Fixed 16:9 Thumbnail */}
                <div className="w-[260px] h-full shrink-0 bg-[#20222a] border border-[#3b3e4f] relative overflow-hidden flex items-center justify-center shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] rounded-sm">
                  {activeThumbnail ? (
                    <img src={activeThumbnail} className="w-full h-full object-cover relative z-10" alt="Thumbnail" />
                  ) : (
                    <div className="flex flex-col items-center opacity-30 relative z-10">
                      <svg className="w-6 h-6 text-orange-500 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <span className="font-['Rajdhani'] font-bold text-gray-500 tracking-[0.2em] uppercase text-[10px]">WAITING...</span>
                    </div>
                  )}
                  {/* Subtle Scanline Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-10" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
                </div>

                {/* Metadata Details */}
                <div className="flex flex-col justify-center min-w-0 flex-1 gap-2">
                  <span className="font-['Rajdhani'] block text-[10px] text-gray-400 font-bold tracking-widest uppercase -mb-1">VIDEO TITLE</span>
                  <span className={`font-['Rajdhani'] font-bold text-2xl leading-tight line-clamp-2 uppercase ${isReady ? 'text-white' : 'text-gray-500'}`}>
                    {isReady ? (slot?.sourceType === 'Audio File' ? slot.audio.split('\\').pop() : slot?.videoTitle) : 'WAITING FOR METADATA...'}
                  </span>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="font-['Roboto_Mono'] text-gray-400 text-[11px] truncate uppercase flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-500 rounded-sm"></span>
                      CH: {isReady ? (slot?.sourceType === 'Audio File' ? slot.audio : slot?.channelName) : '---'}
                    </span>
                    <span className={`font-['Roboto_Mono'] text-sm font-bold flex items-center gap-2 ${isReady ? 'text-[var(--m1-accent-orange)]' : 'text-gray-500'}`}>
                      <span className={`w-1 h-1 rounded-sm ${isReady ? 'bg-orange-500' : 'bg-gray-600'}`}></span>
                      DUR: {isReady ? slot?.duration : '--:--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="w-full h-[1px] bg-gradient-to-r from-[#3b3e4f] via-[#5c617a] to-[#3b3e4f] my-6 shrink-0 opacity-50"></div>

              {/* ZONE 2: OUTPUT NAME */}
              <div className="flex flex-col shrink-0">
                <label className="font-['Rajdhani'] font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-sm"></span> OUTPUT NAME
                </label>
                <div className="flex gap-2 relative">
                  <input
                    value={slot?.outputName || ''}
                    disabled={!isReady}
                    onChange={(e) => updateM1Slot(idx, 'outputName', e.target.value)}
                    placeholder="Output filename..."
                    className="flex-1 h-[var(--m1-height-control)] bg-[#20222a] border border-[#3b3e4f] rounded-[var(--m1-radius-control)] px-4 text-sm font-['Inter'] text-[var(--m1-accent-orange)] font-bold shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] focus:outline-none focus:border-orange-500/50 disabled:opacity-50 disabled:text-gray-400 tracking-wide transition-colors"
                  />
                  <button 
                    disabled={!isReady}
                    onClick={() => updateM1Slot(idx, 'outputName', 'GENERATED_AI_NAME_' + Math.floor(Math.random() * 1000))}
                    className="h-[var(--m1-height-control)] px-6 bg-gradient-to-b from-[#1a1b23] to-[#0c0d12] hover:from-[#2d3247] hover:to-[#1a1b23] text-gray-300 font-['Rajdhani'] font-bold text-[11px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 rounded-[var(--m1-radius-control)] border border-[#2d3247] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_5px_10px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98] shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-4 h-4 text-[var(--m1-accent-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    GENERATE AI
                  </button>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="w-full h-[1px] bg-gradient-to-r from-[#3b3e4f] via-[#5c617a] to-[#3b3e4f] my-6 shrink-0 opacity-50"></div>

              {/* ZONE 3: THUMBNAIL SOURCE & REPLACE */}
              <div className="flex items-center justify-between shrink-0 bg-[#20222a] p-4 border border-[#3b3e4f] rounded-sm shadow-inner">
                 <div className="flex flex-col">
                   <span className="font-['Rajdhani'] font-bold text-[10px] uppercase text-gray-400 tracking-widest mb-1">THUMBNAIL SOURCE</span>
                   <span className={`font-['Roboto_Mono'] text-[11px] font-bold ${isReady ? 'text-gray-300' : 'text-gray-500'}`}>
                     {thumbSourceText}
                   </span>
                 </div>
                 
                 {/* Hidden File Input */}
                 <input id={`thumb-upload-${idx}`} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const url = URL.createObjectURL(e.target.files[0]);
                      updateM1Slot(idx, 'manualThumbnail', url);
                    }
                  }} />

                 <M1Button 
                   variant="secondary" 
                   className="!h-[36px] !px-6 shadow-none" 
                   disabled={!isReady}
                   onClick={() => document.getElementById(`thumb-upload-${idx}`)?.click()}
                 >
                   <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                   REPLACE THUMBNAIL
                 </M1Button>
              </div>

              {/* SPACER */}
              <div className="flex-1"></div>

              {/* ZONE 4: ACTIONS */}
              <div className="flex gap-4 shrink-0">
                <M1Button variant="secondary" className="flex-1 !h-[48px] text-[13px]" disabled={!isReady} onClick={() => setShowDescModal(true)}>
                  DESKRIPSI
                </M1Button>
                <M1Button variant="secondary" className="flex-1 !h-[48px] text-[13px]" disabled={!isReady}>
                  PREVIEW
                </M1Button>
                <M1Button 
                  variant="success" 
                  className="flex-[2] !h-[48px] text-[13px]" 
                  disabled={!isReady || slot?.isApproved} 
                  onClick={() => updateM1Slot(idx, 'isApproved', true)}
                >
                  {slot?.isApproved ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      METADATA APPROVED
                    </span>
                  ) : (
                    'APPROVE & LOCK'
                  )}
                </M1Button>
              </div>

            </div>
          </M1MechanicalPanel>
        </div>
        
        {/* Machine Base (Footer) */}
        <div className="flex items-center justify-between px-6 h-[60px] shrink-0 border-t border-[#3b3e4f] relative z-20 bg-[#2a2d36] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-4 opacity-50">
            <div className="flex gap-[2px] h-4">
              {[1,3,1,1,2,1,4,1,2,1,1,3].map((w, i) => <div key={i} className="bg-gray-500" style={{width: `${w}px`}}></div>)}
            </div>
            <span className="font-['Roboto_Mono'] text-[9px] text-gray-500 tracking-widest">MF-ENG-V2.44</span>
          </div>
          <div className="flex items-center gap-4">
            <M1Button variant="secondary" onClick={closeModal} className="!px-8">
              ABORT
            </M1Button>
            <M1Button variant="primary" onClick={closeModal} className="!px-10">
              SAVE TO ENGINE
            </M1Button>
          </div>
        </div>

        {/* Description Modal Overlay */}
        {showDescModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-[#20222a] border border-[#3b3e4f] rounded-lg p-6 w-full max-w-3xl flex flex-col h-[85%] shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-[#3b3e4f] pb-4">
                <h3 className="font-['Rajdhani'] font-bold text-lg text-white uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--m1-accent-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                  YOUTUBE METADATA DESCRIPTION
                </h3>
                <button onClick={() => setShowDescModal(false)} className="text-gray-400 hover:text-[var(--m1-accent-orange)] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <textarea 
                className="flex-1 bg-[#15161c] text-gray-300 p-5 rounded-[var(--m1-radius-control)] border border-[#3b3e4f] focus:outline-none focus:border-orange-500/50 shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] custom-scroll resize-none font-['Inter'] text-sm leading-relaxed"
                value={slot?.originalDesc || ''}
                placeholder="No description available."
                onChange={(e) => updateM1Slot(idx, 'originalDesc', e.target.value)}
              />
            </div>
          </div>
        )}
      </M1WindowFrame>
    </div>
  );
}
