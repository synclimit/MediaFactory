import React, { useState, useEffect } from 'react';
import { m2RenderHistory } from '../../services/m2/RenderHistoryService.js';

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1 cursor-pointer">
      <span className="text-[9px] text-gray-500 bg-[#2d313d] hover:bg-[#3f4556] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-48 -translate-x-1/2 rounded bg-[#1e2230] border border-[#2d313d] p-2 text-[10px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e2230] border-r border-b border-[#2d313d]"></div>
      </div>
    </div>
  );
}

export default function RenderAnalyticsPanel({ onClearHistory, onHistoryCorrupted }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('All');

  const loadData = () => {
    const { data, corrupted } = m2RenderHistory.getHistory();
    if (corrupted && onHistoryCorrupted) {
      onHistoryCorrupted();
    }
    setHistory(data);
    setStats(m2RenderHistory.getStats());
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('m2_history_refresh', handleRefresh);
    return () => window.removeEventListener('m2_history_refresh', handleRefresh);
  }, []);

  const handleClear = () => {
    if (onClearHistory) onClearHistory();
    loadData();
  };

  const filteredHistory = history.filter(h => {
    if (filter === 'Completed') return h.status === 'COMPLETED';
    if (filter === 'Failed') return h.status === 'FAILED';
    return true;
  });

  const displayHistory = filteredHistory.slice(0, 50);

  const formatTime = (sec) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-[#0b0c10] border border-[#21232d] rounded-lg flex flex-col w-full mt-2">
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-indigo-400 mr-2 leading-none">⑩</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              RENDER ANALYTICS
            </span>
            <Tooltip text="Production history and output metrics. Displays up to 50 recent renders." />
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="px-2 py-1 text-[9px] font-bold rounded bg-[#1e2230] hover:bg-[#2d313d] text-gray-300 border border-[#2d313d] transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={handleClear}
            className="px-2 py-1 text-[9px] font-bold rounded bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50 transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="p-3 bg-[#0c0d12] border-b border-[#21232d]">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#12141c] border border-[#2d313d] rounded p-2">
            <div className="text-[9px] text-gray-500 uppercase">Total Renders</div>
            <div className="text-lg font-bold text-white">{stats.totalRenders || 0}</div>
            <div className="text-[10px] mt-1">
              <span className="text-emerald-400">{stats.successfulRenders || 0} OK</span>
              <span className="text-gray-600 mx-1">/</span>
              <span className="text-red-400">{stats.failedRenders || 0} ERR</span>
            </div>
          </div>
          <div className="bg-[#12141c] border border-[#2d313d] rounded p-2">
            <div className="text-[9px] text-gray-500 uppercase">Success Rate</div>
            <div className="text-lg font-bold text-emerald-400">{stats.successRate || 0}%</div>
            <div className="text-[10px] text-gray-500 mt-1">Overall stability</div>
          </div>
          <div className="bg-[#12141c] border border-[#2d313d] rounded p-2">
            <div className="text-[9px] text-gray-500 uppercase">Total Output Size</div>
            <div className="text-lg font-bold text-blue-400">{stats.totalOutputSizeGb || '0.00'} GB</div>
            <div className="text-[10px] text-gray-500 mt-1">Avg Time: {formatTime(stats.avgRenderTimeSeconds || 0)}</div>
          </div>
          <div className="bg-[#12141c] border border-[#2d313d] rounded p-2">
            <div className="text-[9px] text-gray-500 uppercase">Most Used Profile</div>
            <div className="text-sm font-bold text-amber-400 truncate mt-1">{stats.mostUsedProfile || 'None'}</div>
            <div className="text-[9px] text-gray-500 mt-1 truncate">Last: {stats.lastRenderTime || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex items-center justify-between text-[10px]">
        <div className="font-bold text-gray-300">RECENT HISTORY ({displayHistory.length} displayed)</div>
        <div className="flex gap-1.5">
          {['All', 'Completed', 'Failed'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded border transition-colors ${filter === f ? 'bg-[#2d313d] border-[#4b5263] text-white' : 'bg-transparent border-[#21232d] text-gray-500 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-2 max-h-[300px] overflow-y-auto bg-[#0a0a0f]">
        {displayHistory.length === 0 ? (
          <div className="py-4 text-center text-[10px] text-gray-500">No history found.</div>
        ) : (
          displayHistory.map(h => (
            <div key={h.renderId} className="flex flex-col p-2 bg-[#12141c] border border-[#21232d] rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${h.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                    {h.status}
                  </span>
                  <span className="text-[11px] font-bold text-gray-200">{h.renderName}</span>
                </div>
                <span className="text-[9px] text-gray-500">
                  {new Date(h.completedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-[9px] text-gray-400 mb-1.5">
                <div>Duration: <span className="text-gray-300">{h.duration}</span></div>
                <div>Tracks: <span className="text-gray-300">{h.trackCount}</span></div>
                <div>Size: <span className="text-gray-300">{h.outputSizeMb ? `${h.outputSizeMb} MB` : 'N/A'}</span></div>
                <div>Engine: <span className="text-gray-300">{h.renderEngineVersion || 'N/A'}</span></div>
              </div>

              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5 bg-[#0b0c10] border border-[#2d313d] px-1.5 py-0.5 rounded">
                  <span className="text-gray-500">Profile:</span>
                  <span className="text-amber-400 font-bold">{h.masteringProfile}</span>
                </div>
                {h.status === 'FAILED' && h.failureReason && (
                  <div className="text-red-400 truncate max-w-[200px]" title={h.failureReason}>
                    Error: {h.failureReason}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
