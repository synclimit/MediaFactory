import React, { useState } from 'react';
import M1SlotItem from './M1SlotItem.jsx';
import M1ConfigureAssetModal from './M1ConfigureAssetModal.jsx';

const calculateGridLayout = (count) => {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  return 'grid-cols-4 lg:grid-cols-5';
};

export default function M1SlotManager({ m1Slots, updateM1Slot, isDuplicateOutput, isDuplicateSource, isQueuedOutput, isQueuedSource, m1Watermark, setM1Watermark, m1Subscribe, setM1Subscribe, setActiveMode, handleAddToQueue }) {
  const [configureModalIdx, setConfigureModalIdx] = useState(null);

  return (
    <>
      <div className="relative p-[1px] rounded-xl overflow-hidden flex flex-col flex-1 mt-2 group/manager min-h-0">
        
        {/* Main Panel Content (Industrial Hardware Rack) */}
        <div className="relative bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] rounded-xl p-4 flex flex-col flex-1 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] border border-[#2a2c33] z-10 h-full overflow-hidden min-h-0">
          
          {/* Top Orange Indicator Line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.8)] z-0 pointer-events-none"></div>
          
          {/* Mechanical Panel Grooves (Background Texture) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)`
          }}></div>

          {/* Hardware Corner Rivets */}
          <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
          <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>
          <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(0,0,0,1)]"></div>

          {/* Header Line */}
          <div className="flex items-center gap-4 border-b-2 border-[#333] pb-3 mb-4 relative z-30 shrink-0">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] animate-pulse border-2 border-[#111] z-30 relative"></span>
            <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] relative z-30">AUDIO ALLOCATION RENDER MODULES</h2>
            
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-orange-400 bg-black/50 px-3 py-1.5 rounded-lg border border-orange-500/30 shadow-[inset_0_0_10px_rgba(249,115,22,0.2)]">
                <span className="text-orange-500 text-[12px]">{m1Slots.length}</span> MODULES ALLOCATED
              </div>

              {/* Add To Queue Button */}
              <button 
                onClick={() => handleAddToQueue && handleAddToQueue()}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-orange-400 transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                ADD TO QUEUE
              </button>
            </div>
          </div>
        
          {/* Dashboard Card Grid Container */}
          <div className="flex-1 relative z-10 overflow-hidden pr-1 min-h-0 flex flex-col">
            <div className={`grid ${calculateGridLayout(m1Slots.length)} gap-3 flex-1 min-h-0`}>
              {m1Slots.map((slot, idx) => (
                <div key={slot.slotId || idx} className="animate-slide-down h-full" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                  <M1SlotItem 
                    slot={slot}
                    idx={idx}
                    updateM1Slot={updateM1Slot}
                    isDuplicateOutput={isDuplicateOutput}
                    isDuplicateSource={isDuplicateSource}
                    isQueuedOutput={isQueuedOutput}
                    isQueuedSource={isQueuedSource}
                    openConfigureModal={() => setConfigureModalIdx(idx)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {configureModalIdx !== null && (
        <M1ConfigureAssetModal
          slot={m1Slots[configureModalIdx] || { 
             sourceType: 'YouTube URL', 
             audio: '', 
             youtubeUrl: '',
             outputName: '',
             duration: '0m 00s',
             isDummy: true 
          }}
          idx={configureModalIdx}
          updateM1Slot={updateM1Slot}
          closeModal={() => setConfigureModalIdx(null)}
        />
      )}
    </>
  );
}
