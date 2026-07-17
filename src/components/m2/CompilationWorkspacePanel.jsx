import React, { useState, useEffect, useRef, useCallback } from 'react';
import { foundation } from '../../foundation/index.js';
import { CompilationEngine } from '../../services/m2/CompilationEngine.js';
import { formatDuration } from '../../entities/m2/SourceEntity.js';

const engine = new CompilationEngine();

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

export default function CompilationWorkspacePanel({
  m2DurationTarget, setM2DurationTarget,
  m2OutputCount, setM2OutputCount,
  m2NamingPattern, setM2NamingPattern,
  m2CustomPattern, setM2CustomPattern,
  onMixesChange,
  isDevMode = false,
  addLog,
  addNotification,
  m2IsStale,
  setM2IsStale
}) {
  const [mixes, setMixes] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [sources, setSources] = useState([]);

  const prevSourceVersionRef = useRef(null);
  const prevSettingsRef = useRef(`${m2DurationTarget}:${m2OutputCount}`);

  const loadSources = useCallback(async () => {
    try {
      const all = await foundation.sourceService.getReady();
      setSources(all);
      const version = all.map(s => `${s.id}:${s.videoDuration ?? s.duration ?? 0}:${s.cleanTitle ?? ''}`).join(',');
      if (prevSourceVersionRef.current !== null && prevSourceVersionRef.current !== version) {
        if (mixes.length > 0) setM2IsStale(true);
      }
      prevSourceVersionRef.current = version;
    } catch (err) {
      console.error('[CompilationWorkspacePanel] loadSources:', err);
    }
  }, []);

  useEffect(() => {
    loadSources();
    foundation.sourceService.addEventListener('sources_updated', loadSources);
    return () => {
      foundation.sourceService.removeEventListener('sources_updated', loadSources);
    };
  }, [loadSources]);

  useEffect(() => {
    const settingsKey = `${m2DurationTarget}:${m2OutputCount}:${m2NamingPattern}:${m2CustomPattern}`;
    if (prevSettingsRef.current !== settingsKey) {
      if (mixes.length > 0) {
        setM2IsStale(true);
      }
      prevSettingsRef.current = settingsKey;
    }
  }, [m2DurationTarget, m2OutputCount, m2NamingPattern, m2CustomPattern, mixes.length]);

  const resolveContext = async () => {
    try {
      return await foundation.activityService.getAll?.() ? { workspaceId: 'default', userId: 'local' } : { workspaceId: 'default', userId: 'local' };
    } catch {
      return { workspaceId: 'default', userId: 'local' };
    }
  };

  const handleGenerate = useCallback(async () => {
    if (sources.length === 0) {
      onMixesChange?.([]);
      return;
    }

    setIsBuilding(true);
    setM2IsStale(false);

    const targetSec = m2DurationTarget * 60;
    try {
      console.log('PREVIEW_SOURCES', JSON.parse(JSON.stringify(sources)));
      sources?.forEach(s => {
        console.log('SOURCE_RUNTIME', JSON.stringify({
          id: s.id,
          title: s.title,
          videoTitle: s.videoTitle,
          duration: s.duration,
          videoDuration: s.videoDuration,
          metadataStatus: s.metadataStatus
        }));
      });

      console.log('BUILDMIX_INPUT', JSON.parse(JSON.stringify(sources)));
      const generatedMixes = engine.buildMixes(sources, targetSec, m2OutputCount);
      console.log('BUILDMIX_RESULT', JSON.parse(JSON.stringify(generatedMixes)));
      
      setMixes(generatedMixes);
      onMixesChange?.(generatedMixes);

      const ctx = await resolveContext();
      await foundation.activityService.log({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        action: 'Preview Generated',
        details: {
          outputCount: generatedMixes.length,
          targetDurationSec: targetSec,
        },
      });

      addNotification?.(`Generated ${generatedMixes.length} Outputs`);
      addLog?.(`[M2] Preview Generated — ${generatedMixes.length} outputs`);
    } catch (err) {
      if (err.message === 'UNLINKED_SOURCE_DETECTED') {
        alert('UNLINKED_SOURCE_DETECTED: Please relink all files in the Source Pool before compiling.');
        addNotification?.('Compilation Blocked', 'Unlinked Source Detected');
        addLog?.('[M2] Compilation Blocked: Unlinked Source');
      } else if (err.message === 'MULTI_TRACK_MIX_FAILED') {
        alert('MULTI_TRACK_MIX_FAILED: Target duration is too short to fit multiple tracks. Please increase Target Duration or import shorter tracks.');
        addNotification?.('Compilation Failed', 'Target Duration Too Short');
        addLog?.('[M2] Compilation Failed: Multi-track condition not met');
      } else {
        console.error(err);
      }
    } finally {
      setIsBuilding(false);
    }
  }, [sources, m2DurationTarget, m2OutputCount, onMixesChange, addLog]);

  const isEmpty = mixes.length === 0;

  return (
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full h-full">
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-purple-400 mr-2 leading-none">③</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              COMPILATION WORKSPACE
            </span>
            <Tooltip text="Generate and review compilation candidates." />
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            Generate and review compilation candidates.
          </div>
        </div>
      </div>

      {m2IsStale && mixes.length > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-950/40 border border-amber-900/60 rounded flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-[14px]">⚠</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Preview Out Of Date</span>
              <span className="text-[9px] text-amber-500/80">Regenerate Required</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* Settings Section */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 flex items-center">Duration Target (Mins)</label>
              <input
                type="number"
                value={m2DurationTarget}
                onChange={(e) => setM2DurationTarget(Number(e.target.value))}
                className="w-full bg-[#181922] border border-[#2d3247] rounded p-1 text-gray-300 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 flex items-center">Output Count</label>
              <select
                value={m2OutputCount}
                onChange={(e) => setM2OutputCount(Number(e.target.value))}
                className="w-full bg-[#181922] border border-[#2d3247] rounded p-1 text-gray-300 focus:outline-none text-xs"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 flex items-center">Naming Pattern</label>
            <select
              value={m2NamingPattern}
              onChange={(e) => setM2NamingPattern(e.target.value)}
              className="w-full bg-[#181922] border border-[#2d3247] rounded p-1 text-gray-300 focus:outline-none text-xs"
            >
              <option value="Title A">Title A</option>
              <option value="Title A x Title B">Title A x Title B</option>
              <option value="Title A x Title B x Title C">Title A x Title B x Title C</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          {m2NamingPattern === 'Custom' && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Custom Pattern prefix</label>
              <input
                type="text"
                value={m2CustomPattern}
                onChange={(e) => setM2CustomPattern(e.target.value)}
                className="w-full bg-[#181922] border border-[#2d3247] rounded p-1 text-gray-300 focus:outline-none text-xs"
              />
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleGenerate}
              disabled={isBuilding || sources.length === 0}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5
                ${sources.length === 0
                  ? 'bg-[#1a1e2e] text-gray-600 border border-[#21232d] cursor-not-allowed'
                  : isBuilding
                    ? 'bg-purple-900/40 text-purple-500 border border-purple-700/30 cursor-wait'
                    : 'bg-purple-700 hover:bg-purple-600 text-white shadow-sm shadow-purple-900/40'
                }`}
            >
              <span className="text-[11px]">⊕</span> Generate Preview
            </button>
            <button
              onClick={() => {
                handleGenerate();
                addNotification?.('Outputs Reshuffled');
                addLog?.('[M2] Shuffle Refreshed');
              }}
              disabled={isBuilding || mixes.length === 0}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5
                ${mixes.length === 0
                  ? 'bg-[#1a1e2e] text-gray-600 border border-[#21232d] cursor-not-allowed'
                  : 'bg-[#1a1e2e] hover:bg-[#252a40] border border-[#3d4157] text-gray-300'
                }`}
            >
              Refresh Shuffle
            </button>
          </div>
        </div>

        {/* Outputs Section */}
        {mixes.length > 0 && (
          <div className="pt-2 border-t border-[#21232d] space-y-2">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
              Generated Outputs: {mixes.length}
            </div>
            <div className="space-y-2">
              {mixes.map((mix, idx) => (
                <div key={idx} className="bg-[#080910] border border-[#21232d] rounded overflow-hidden">
                  <div className="px-2 py-1.5 bg-[#0f111a] border-b border-[#21232d] flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Output {idx + 1}</span>
                    <span className="text-[9px] font-mono text-emerald-400">{mix.totalDurationFormatted}</span>
                  </div>
                  <div className="divide-y divide-[#21232d]">
                    {mix.preview.trackOrder.map((track) => (
                      <div key={track.id} className="flex items-center gap-2 px-2 py-1 hover:bg-[#0f111a] transition-colors">
                        <span className="flex-1 text-[10px] text-gray-300 truncate font-medium">
                          {track.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
