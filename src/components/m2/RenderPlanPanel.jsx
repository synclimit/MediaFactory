import React, { useState, useEffect, useCallback, useRef } from 'react';
import { foundation } from '../../foundation/index.js';
import { computeRenderPlanHash } from '../../entities/m2/RenderPlanEntity.js';

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1.5 cursor-pointer">
      <span className="text-[8px] text-gray-500 bg-[#21232d] hover:bg-[#2d3247] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-44 -translate-x-1/2 rounded bg-[#0f111a] border border-[#2d3247] p-1.5 text-[9px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#0f111a] border-r border-b border-[#2d3247]" />
      </div>
    </div>
  );
}

export default function RenderPlanPanel({
  plans = [],
  setPlans,
  onReviewSelected,
  isDevMode = false,
  addLog,
  addNotification,
  m2IsStale,
  onAddToQueue,
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
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full h-full">
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-emerald-400 mr-2 leading-none">④</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              RENDER PLANS
            </span>
            <Tooltip text="Auto-generated render plans aligned with output preview." />
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            Review render configuration before adding to queue.
          </div>
        </div>
      </div>

      <div className="p-2.5 flex flex-col gap-2 flex-1 overflow-hidden">
        {!hasPlans && (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-1">
            <div className="text-2xl opacity-20 mb-1">📋</div>
            <div className="text-[10px] text-gray-500 font-medium">No render plans available.</div>
            <div className="text-[9px] text-gray-600 mt-0.5">
              Generate a compilation preview to auto-create plans.
            </div>
          </div>
        )}

        {hasPlans && (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-[#21232d] shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={handleSelectAll} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-[#1a1c22] rounded border border-[#2d3247]">Select All</button>
                <button onClick={handleDeselectAll} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-[#1a1c22] rounded border border-[#2d3247]">Deselect All</button>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {selectedCount} / {plans.length} selected
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {plans.map((plan, idx) => (
                <div key={plan.renderId} className={`border rounded flex flex-col overflow-hidden transition-colors ${plan.selected ? 'border-emerald-700/50 bg-[#0c1015]' : 'border-[#21232d] bg-[#080910]'}`}>
                  <div className="px-2 py-1.5 flex items-center gap-2 border-b border-[#21232d]/50">
                    <input 
                      type="checkbox" 
                      checked={plan.selected || false} 
                      onChange={() => toggleSelect(plan.renderId)}
                      className="accent-emerald-500"
                    />
                    <span className="text-[10px] font-bold text-gray-300 uppercase shrink-0">Render {idx + 1}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ml-auto shrink-0 ${m2IsStale ? 'bg-amber-900/30 text-amber-400 border-amber-700/40' : 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40'}`}>
                      {m2IsStale ? 'STALE' : 'READY'}
                    </span>
                  </div>
                  
                  <div className="p-2 space-y-2">
                    <div>
                      <input
                        type="text"
                        value={plan.renderName}
                        onChange={(e) => handleNameChange(plan.renderId, e.target.value)}
                        className="w-full bg-[#12141a] border border-[#2d3247] rounded px-2 py-1 text-[10px] text-gray-200 font-mono focus:outline-none focus:border-emerald-700/50 transition-colors"
                        title="Edit Render Name"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="text-gray-500">Duration: <span className="font-mono text-emerald-400">{plan.totalDurationFormatted}</span></span>
                      <span className="text-gray-500">Tracks: <span className="font-mono text-purple-300">{plan.trackCount}</span></span>
                      <span className="text-gray-500 truncate" title={plan.audioProfile}>Profile: <span className="text-blue-300">{plan.audioProfile}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 mt-auto shrink-0 flex items-center justify-between">
              <span className={`text-[10px] font-mono ${m2IsStale ? 'text-amber-400' : 'text-emerald-400'}`}>
                {selectedCount} selected
              </span>
              <button
                onClick={() => onReviewSelected?.(plans.filter(p => p.selected))}
                disabled={selectedCount === 0 || m2IsStale}
                className={`px-4 py-1.5 text-[10px] font-bold rounded shadow transition-all ${
                  selectedCount > 0 && !m2IsStale
                    ? 'bg-[#2563eb] hover:bg-[#3b82f6] text-white'
                    : 'bg-[#12131a] text-gray-600 border border-[#2d3247] cursor-not-allowed'
                }`}
              >
                Add Selected To Queue
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
