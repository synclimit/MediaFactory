import React from 'react';

export default function M1SlotItem({ slot, idx, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource, openConfigureModal }) {
  const isQueuedOutputCheck = isQueuedOutput(slot?.outputName);
  const isQueuedSourceCheck = isQueuedSource(slot);
  const isQueued = isQueuedOutputCheck || isQueuedSourceCheck;

  const isDupOutput = !isQueuedOutputCheck && isDuplicateOutput(slot?.outputName, idx);
  const isDupSource = !isQueuedSourceCheck && isDuplicateSource(slot, idx);
  const isDup = isDupOutput || isDupSource;

  // Strict Validation: A slot is ONLY ready if it actually has a valid source AND output name
  const hasValidAudio = slot?.sourceType === 'Audio File' && Boolean(slot?.audio && slot?.audio.trim() !== '');
  const hasValidYoutube = (slot?.sourceType === 'YouTube URL' || !slot?.sourceType) && Boolean((slot?.isFetched && (slot?.audio || slot?.videoId)) || slot?.videoId || (slot?.youtubeUrl && slot?.isApproved));
  const hasValidSource = hasValidAudio || hasValidYoutube;
  
  const hasOutput = Boolean(slot?.outputName && slot?.outputName.trim() !== '');
  const isReady = Boolean(hasValidSource && hasOutput && (slot?.isApproved || slot?.isFetched || slot?.status === 'CONFIGURED' || slot?.status === 'APPROVED'));
  const slotStatus = isReady ? (slot?.status && slot?.status !== 'EMPTY' ? slot.status : 'APPROVED') : 'EMPTY';

  return (
    <div className={`relative p-[1px] rounded-xl overflow-hidden transition-all duration-200 group/card h-full flex flex-col ${isQueued ? 'opacity-80' : ''}`}>
      
      {/* Outer Border Layer */}
      <div className={`absolute inset-0 transition-all duration-200 pointer-events-none rounded-xl ${
        isReady 
          ? 'bg-gradient-to-b from-orange-500/80 via-orange-500/20 to-transparent shadow-[0_0_18px_rgba(249,115,22,0.25)]' 
          : slotStatus === 'QUEUED' 
            ? 'bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
            : isDup 
              ? 'bg-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-white/10 opacity-30 group-hover/card:opacity-60'
      }`}></div>

      {/* Main Glass Panel */}
      <div className={`relative rounded-xl flex flex-col flex-1 z-10 h-full overflow-hidden transition-all duration-200 ${
        isReady 
          ? 'bg-gradient-to-br from-[#222430] via-[#181922] to-[#111218] border border-orange-500/40 border-t-orange-400 shadow-lg' 
          : 'bg-gradient-to-br from-[#1b1d25] to-[#111217] border border-[#2b2f3d]'
      }`}>
        
        {/* Metal Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
        }}></div>

        {/* Subtle Decorative Corner Glow for Ready Card */}
        {isReady && (
          <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-[25px] bg-orange-500/20 pointer-events-none transition-all duration-300"></div>
        )}

        {/* Hardware Screws */}
        <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full border z-20 flex items-center justify-center ${isReady ? 'bg-orange-950 border-orange-500/60' : 'bg-[#333748] border-black/80'}`}><div className="w-[1px] h-1 bg-black/60 rotate-45"></div></div>
        <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full border z-20 flex items-center justify-center ${isReady ? 'bg-orange-950 border-orange-500/60' : 'bg-[#333748] border-black/80'}`}><div className="w-[1px] h-1 bg-black/60 rotate-45"></div></div>
        <div className={`absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full border z-20 flex items-center justify-center ${isReady ? 'bg-orange-950 border-orange-500/60' : 'bg-[#333748] border-black/80'}`}><div className="w-[1px] h-1 bg-black/60 rotate-45"></div></div>
        <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full border z-20 flex items-center justify-center ${isReady ? 'bg-orange-950 border-orange-500/60' : 'bg-[#333748] border-black/80'}`}><div className="w-[1px] h-1 bg-black/60 rotate-45"></div></div>

        {isReady ? (
          /* READY / APPROVED STATE (Tasteful Industrial with Crisp Orange Accents) */
          <div className="flex flex-col h-full relative z-10 cursor-pointer group/ready" onClick={openConfigureModal}>
            
            {/* Header with Orange Accent Border & Pill Badge */}
            <div className="flex items-center justify-between px-3 py-2 pl-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent relative">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
                <span className="text-white font-['Rajdhani'] font-bold text-xs tracking-[0.15em] uppercase drop-shadow-sm">
                  RENDER MODULE {String(slot?.segmentIndex || idx + 1).padStart(2, '0')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isDupOutput && <span className="text-red-400 font-bold text-[9px] px-1.5 py-0.5 bg-red-950/80 rounded border border-red-500/40 uppercase tracking-widest">✗ Dup Name</span>}
                {isDupSource && <span className="text-red-400 font-bold text-[9px] px-1.5 py-0.5 bg-red-950/80 rounded border border-red-500/40 uppercase tracking-widest">✗ Dup ID</span>}
                
                {/* Crisp Orange Approved Badge */}
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-[9px] font-['Rajdhani'] uppercase tracking-[0.15em] px-2 py-0.5 rounded shadow-[0_0_8px_rgba(249,115,22,0.6)] border border-orange-300 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  {slotStatus}
                </span>
              </div>
            </div>

            <div className="flex flex-1 p-2.5 gap-3 items-center">
              {/* RDY Badge Box with Orange Trim */}
              <div className="w-14 h-11 bg-orange-500/10 rounded border border-orange-500/50 flex items-center justify-center flex-shrink-0 group-hover/ready:border-orange-400 group-hover/ready:bg-orange-500/20 transition-all shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
                <span className="font-['Rajdhani'] font-bold text-[11px] text-orange-400 tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]">
                  RDY
                </span>
              </div>

              {/* Checklist & Info */}
              <div className="flex flex-col justify-center flex-1 space-y-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold">✓</span> Src: <span className="text-white font-bold truncate max-w-[130px]">{slot?.sourceType || 'Audio File'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold">✓</span> Out: <span className="text-white font-bold truncate max-w-[130px]">{slot?.outputName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold">✓</span> Dur: <span className="text-orange-300 font-bold">{slot?.duration || '00:00'}</span>
                </div>
                {slot?.sourceType === 'YouTube URL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">✓</span> Meta: <span className="text-orange-300 font-bold">Approved</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Click to Edit Footer Bar */}
            <div className="w-full bg-[#161822] hover:bg-orange-500 hover:text-white text-orange-400 font-['Rajdhani'] font-bold text-[10px] tracking-[0.25em] uppercase text-center py-1 border-t border-orange-500/30 transition-all">
              CLICK TO EDIT
            </div>
          </div>
        ) : (
          /* PENDING / EMPTY STATE */
          <div className="flex flex-col h-full relative z-10 p-3 justify-center opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1.5 px-2 relative z-20">
              <span className="text-gray-400 font-['Rajdhani'] font-bold text-[11px] tracking-[0.15em] uppercase">
                MODULE {String(slot?.segmentIndex || idx + 1).padStart(2, '0')}
              </span>
              <span className="text-gray-500 font-bold text-[9px] font-mono uppercase tracking-[0.1em] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                UNCONFIGURED
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-1">
              <div className="w-9 h-9 rounded-full bg-[#121318] flex items-center justify-center border border-[#2b2e3b] shadow-inner group-hover/card:border-orange-500/40 transition-colors">
                <svg className="w-4 h-4 text-gray-500 group-hover/card:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <button
                onClick={openConfigureModal}
                className="w-full py-1.5 bg-[#181a24] hover:bg-orange-600 hover:text-white text-gray-400 font-['Rajdhani'] font-bold text-[11px] uppercase tracking-[0.2em] rounded border border-[#333748] hover:border-orange-500 transition-all cursor-pointer flex items-center justify-center"
              >
                CONFIG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
