import React from 'react';
import Tooltip from '../ui/Tooltip.jsx';

export default function M1SlotItem({ slot, idx, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource, openConfigureModal }) {
  const isQueuedOutputCheck = isQueuedOutput(slot?.outputName);
  const isQueuedSourceCheck = isQueuedSource(slot);
  const isQueued = isQueuedOutputCheck || isQueuedSourceCheck;

  const isDupOutput = !isQueuedOutputCheck && isDuplicateOutput(slot?.outputName, idx);
  const isDupSource = !isQueuedSourceCheck && isDuplicateSource(slot, idx);
  const isDup = isDupOutput || isDupSource;

  // Explicit Module Status Machine
  const slotStatus = slot?.status || 'EMPTY';
  const isReady = slotStatus === 'CONFIGURED' || slotStatus === 'APPROVED' || slotStatus === 'QUEUED' || slotStatus === 'RENDERING' || slotStatus === 'DONE';
  const isPending = slotStatus === 'EMPTY';

  return (
    <div className={`relative p-[2px] rounded-xl overflow-hidden transition-all duration-[150ms] group/card h-full flex flex-col ${isQueued ? 'opacity-80' : ''}`}>
      
      {/* Outer Border Gradient (Thicker) */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-80 group-hover/card:opacity-100 transition-opacity duration-[150ms] pointer-events-none ${
        isReady ? 'from-emerald-500/80 via-[#333] to-[#111]' :
        slotStatus === 'QUEUED' ? 'from-blue-500/80 via-[#333] to-[#111]' :
        isDup ? 'from-red-500/80 via-[#333] to-[#111]' :
        'from-white/10 via-[#222] to-[#111]'
      }`}></div>

      {/* Main Glass Panel (Industrial Metal Plate) */}
      <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl flex flex-col flex-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] border border-[#333] z-10 h-full overflow-hidden">
        
        {/* Metal Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
        }}></div>

        {/* Decorative Corner Glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full blur-[30px] pointer-events-none transition-all duration-700 ${
          isReady ? 'bg-emerald-500/20 group-hover/card:bg-emerald-500/30' :
          slotStatus === 'QUEUED' ? 'bg-blue-500/20' :
          isDup ? 'bg-red-500/20' :
          'bg-white/5 group-hover/card:bg-orange-500/20'
        }`}></div>

        {/* Panel Seam */}
        <div className="absolute left-0 top-[20%] bottom-[20%] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-20"></div>

        {/* Hardware Modules / Screws */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-b from-[#444] to-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_1px_rgba(0,0,0,0.8)] border border-[#000] z-20 flex items-center justify-center"><div className="w-[1px] h-1.5 bg-black/60 rotate-45"></div></div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-b from-[#444] to-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_1px_rgba(0,0,0,0.8)] border border-[#000] z-20 flex items-center justify-center"><div className="w-[1px] h-1.5 bg-black/60 rotate-45"></div></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gradient-to-b from-[#444] to-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_1px_rgba(0,0,0,0.8)] border border-[#000] z-20 flex items-center justify-center"><div className="w-[1px] h-1.5 bg-black/60 rotate-45"></div></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gradient-to-b from-[#444] to-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_1px_rgba(0,0,0,0.8)] border border-[#000] z-20 flex items-center justify-center"><div className="w-[1px] h-1.5 bg-black/60 rotate-45"></div></div>

        {isReady ? (
          /* UI-04 READY STATE */
          <div className="flex flex-col h-full relative z-10 cursor-pointer hover:bg-white/5 transition-colors" onClick={openConfigureModal}>
            <div className="flex items-center gap-1.5 px-3 py-2 pl-4 border-b-2 border-black/80 bg-black/20 shadow-[0_2px_10px_rgba(0,0,0,0.5)] relative">
              <span className="text-white font-black text-[10px] tracking-[0.1em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                RENDER MODULE {String(slot?.segmentIndex || idx + 1).padStart(2, '0')}
              </span>
              <span className="text-emerald-400 font-bold text-[9px] font-mono uppercase tracking-[0.1em] border-l-2 border-white/10 pl-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                {slotStatus}
              </span>
              {isDupOutput && <span className="text-red-400 font-bold text-[9px] px-1.5 py-0.5 bg-red-950/80 rounded border border-red-500/50 ml-auto uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.3)]">✗ Dup Name</span>}
              {isDupSource && <span className="text-red-400 font-bold text-[9px] px-1.5 py-0.5 bg-red-950/80 rounded border border-red-500/50 ml-auto uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.3)]">✗ Dup ID</span>}
            </div>

            <div className="flex flex-1 p-2 gap-2 items-center">
              {/* Thumbnail Placeholder */}
              <div className="w-16 h-12 bg-[#0a0a0c] rounded flex items-center justify-center text-xs border border-[#222] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] relative overflow-hidden flex-shrink-0 group-hover/card:border-emerald-500/40 transition-colors">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pointer-events-none opacity-40"></div>
                <span className="text-center font-mono leading-relaxed uppercase tracking-[0.3em] font-black text-[8px] text-emerald-500/60 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] relative z-10">
                  RDY
                </span>
              </div>

              {/* Checklist & Info */}
              <div className="flex flex-col justify-center flex-1 space-y-1 font-mono text-[9px] uppercase tracking-wider text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Src: <span className="text-white font-bold truncate max-w-[100px]">{slot?.sourceType || 'Audio File'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Out: <span className="text-white font-bold truncate max-w-[100px]">{slot?.outputName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Dur: <span className="text-white font-bold">{slot?.duration || '00:00'}</span>
                </div>
                {slot?.sourceType === 'YouTube URL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Meta: <span className="text-white font-bold">Approved</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full bg-black/40 text-emerald-500/80 text-[10px] font-black tracking-[0.3em] uppercase text-center py-1.5 border-t-2 border-black group-hover/card:bg-emerald-500/10 group-hover/card:text-emerald-400 transition-colors relative">
              CLICK TO EDIT
              <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20"></div>
            </div>
          </div>
        ) : (
          /* UI-03 PENDING / EMPTY STATE */
          <div className="flex flex-col h-full relative z-10 p-2 justify-center">
            <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1 pl-4 relative z-20">
              <span className="text-white font-black text-[10px] tracking-[0.1em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                MODULE {String(slot?.segmentIndex || idx + 1).padStart(2, '0')}
              </span>
              <span className="text-orange-400 font-bold text-[9px] font-mono uppercase tracking-[0.1em] border-l border-white/10 pl-1.5 drop-shadow-[0_0_5px_rgba(249,115,22,0.3)]">
                {slotStatus}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center border-2 border-[#222] shadow-[inset_0_5px_10px_rgba(0,0,0,0.8)] group-hover/card:border-orange-500/30 group-hover/card:shadow-[inset_0_5px_10px_rgba(0,0,0,0.8),0_0_10px_rgba(249,115,22,0.1)] transition-colors">
                <svg className="w-4 h-4 text-gray-600 group-hover/card:text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <button
                onClick={openConfigureModal}
                className="w-full py-1.5 bg-gradient-to-b from-[#2a2c33] to-[#111216] hover:from-orange-600/30 hover:to-orange-500/20 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] rounded border border-[#444] hover:border-orange-500/50 transition-all duration-[200ms] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center"
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
