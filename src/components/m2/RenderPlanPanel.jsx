import React, { useState, useEffect, useCallback, useRef } from 'react';
import { foundation } from '../../foundation/index.js';

export default function RenderPlanPanel({
  plans = [],
  setPlans,
  onReviewSelected,
  isDevMode = false,
  addLog,
  addNotification,
  m2IsStale,
  onAddToPipeline,
  onGenerate
}) {
  const hasPlans = plans.length > 0;
  const renameTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(renameTimeoutRef.current);
  }, []);
  
  const handleSelectAll = () => {
    setPlans(prev => prev.map(p => ({ ...p, selected: true })));
    addNotification?.('Batch Selection Updated', 'All selected');
  };

  const handleDeselectAll = () => {
    setPlans(prev => prev.map(p => ({ ...p, selected: false })));
    addNotification?.('Batch Selection Updated', 'All deselected');
  };

  const toggleSelect = (renderId) => {
    setPlans(prev => prev.map(p => p.renderId === renderId ? { ...p, selected: !p.selected } : p));
  };

  const handleNameChange = (renderId, newName) => {
    setPlans(prev => prev.map(p => p.renderId === renderId ? { ...p, renderName: newName } : p));
    if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
    renameTimeoutRef.current = setTimeout(() => {
      addNotification?.('Render Name Updated');
    }, 600);
  };

  const selectedCount = plans.filter(p => p.selected).length;

  return (
    <div className="bg-transparent flex flex-col w-full h-full text-[11px] text-gray-300">
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-[#2a2c33] shrink-0 relative z-10">
        <div className="flex items-center">
          <h3 className="text-[12px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
            OUTPUT CANDIDATES
          </h3>
        </div>
        <button
          onClick={onGenerate}
          className="px-4 py-1.5 text-[10px] font-bold rounded shadow-lg transition-all flex items-center gap-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-400 text-white border border-orange-400/30 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-[0.98]"
        >
          GENERATE CANDIDATES
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
        {!hasPlans && (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2">
            <div className="text-3xl opacity-20 mb-1">📋</div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">No candidates available</div>
            <div className="text-[10px] text-gray-600">
              Generate a compilation preview to view options here.
            </div>
          </div>
        )}

        {hasPlans && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-[#2d3247]/50 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={handleSelectAll} className="text-[10px] text-gray-400 hover:text-white px-3 py-1 bg-[#161925]/80 rounded border border-[#2d3247] hover:border-[#424867] transition-all">Select All</button>
                <button onClick={handleDeselectAll} className="text-[10px] text-gray-400 hover:text-white px-3 py-1 bg-[#161925]/80 rounded border border-[#2d3247] hover:border-[#424867] transition-all">Deselect All</button>
              </div>
              <div className="text-[10px] text-orange-500 font-mono font-bold">
                {selectedCount} / {plans.length} SELECTED
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                {plans.map((plan, idx) => (
                  <div key={plan.renderId} className={`rounded-xl border flex flex-col overflow-hidden transition-all duration-[150ms] ${plan.selected ? 'border-[#f97316]/60 bg-[#1e2230]/90 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-[#2d3247] bg-[#161925]/80 hover:border-[#424867]'}`}>
                    <div className="px-3 py-2 flex items-center gap-3 border-b border-[#2d3247]/50 bg-[#0a0b0f]/50">
                      <input 
                        type="checkbox" 
                        checked={plan.selected || false} 
                        onChange={() => toggleSelect(plan.renderId)}
                        className="accent-[#f97316] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">Candidate {idx + 1}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ml-auto shrink-0 ${m2IsStale ? 'bg-amber-950/40 text-amber-500 border-amber-900/60 shadow-[0_0_5px_rgba(245,158,11,0.2)]' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60 shadow-[0_0_5px_rgba(16,185,129,0.2)]'}`}>
                        {m2IsStale ? 'STALE' : 'READY'}
                      </span>
                    </div>
                    
                    <div className="p-3 space-y-3">
                      <div>
                        <input
                          type="text"
                          value={plan.renderName}
                          onChange={(e) => handleNameChange(plan.renderId, e.target.value)}
                          className="w-full bg-[#0a0b0f] border border-[#2d3247] rounded-lg px-2 py-1.5 text-[11px] text-gray-200 font-mono focus:outline-none focus:border-[#f97316] focus:shadow-[0_0_10px_rgba(249,115,22,0.2)] transition-all"
                          title="Edit Output Name"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] bg-[#0a0b0f]/50 p-2 rounded border border-[#2d3247]/30">
                        <span className="text-gray-500">Duration <span className="font-mono text-emerald-400 font-bold block mt-0.5">{plan.totalDurationFormatted}</span></span>
                        <span className="text-gray-500">Tracks <span className="font-mono text-purple-400 font-bold block mt-0.5">{plan.trackCount}</span></span>
                        <span className="text-gray-500">Profile <span className="text-blue-400 font-bold block mt-0.5 truncate max-w-[80px]" title={plan.audioProfile}>{plan.audioProfile}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-[#2d3247]/50 shrink-0 flex items-center justify-between">
              <span className={`text-[11px] font-bold font-mono ${m2IsStale ? 'text-amber-500' : 'text-orange-500'}`}>
                {selectedCount} SELECTED FOR QUEUE
              </span>
              <button
                onClick={() => onAddToPipeline?.(plans.filter(p => p.selected))}
                disabled={selectedCount === 0 || m2IsStale}
                className={`px-6 py-2.5 text-[11px] font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                  selectedCount > 0 && !m2IsStale
                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-400 text-white border border-orange-400/30 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-[0.98]'
                    : 'bg-[#12131a] text-gray-600 border border-[#2d3247] cursor-not-allowed'
                }`}
              >
                ADD TO PIPELINE <span className="text-[13px] leading-none">▶</span>
              </button>
            </div>
          </>
        )}
      </div>

      {isDevMode && (
        <div className="border-t border-red-900/30 bg-[#0a0005] px-3 py-2 shrink-0">
          <div className="text-[8px] font-bold text-red-400 uppercase tracking-wide mb-1.5 flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5 animate-pulse" />
            Dev Stats — Render Plans
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] font-mono">
            <div>
              <span className="text-gray-600">Total Plans: </span>
              <span className="text-purple-300">{plans.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Selected: </span>
              <span className="text-emerald-400">{selectedCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
