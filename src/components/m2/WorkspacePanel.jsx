import React, { useState, useEffect } from 'react';
import { m2WorkspacePersistence } from '../../services/m2/WorkspacePersistenceService.js';

export default function WorkspacePanel({ onSaveNow, onRestoreNow, onResetWorkspace }) {
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const unsubscribe = m2WorkspacePersistence.registerStateChange((state) => {
      setWorkspace(state);
    });
    return unsubscribe;
  }, []);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const sourcesCount = workspace?.sources?.length || 0;
  const plansCount = workspace?.renderPlans?.length || 0;
  const queueCount = workspace?.queue?.length || 0;
  const lastSaved = formatTimestamp(workspace?.savedAt);

  return (
    <div className="bg-[#1e2230] rounded-xl border border-[#2d313d] flex flex-col h-full overflow-hidden shadow-2xl text-[11px] text-gray-300">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-[#2d313d] bg-[#1a1d27]">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-xs">⑧</span>
          <h2 className="text-sm font-bold text-gray-200 tracking-wider">WORKSPACE</h2>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Dashboard Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between col-span-2">
            <span className="text-[10px] text-gray-500">Last Saved</span>
            <span className={`text-[13px] font-bold ${workspace ? 'text-green-400' : 'text-gray-400'}`}>
              {lastSaved}
            </span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Version</span>
            <span className="text-[13px] font-bold text-gray-200">{workspace?.version || 0}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Sources Count</span>
            <span className="text-[13px] font-bold text-blue-400">{sourcesCount}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Plans Count</span>
            <span className="text-[13px] font-bold text-amber-400">{plansCount}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Queue Count</span>
            <span className="text-[13px] font-bold text-purple-400">{queueCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-[#2d313d]/50">
          <button
            onClick={onSaveNow}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] py-1.5 rounded transition-colors font-medium cursor-pointer"
          >
            Save Now
          </button>
          <button
            onClick={onRestoreNow}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-[11px] py-1.5 rounded transition-colors font-medium cursor-pointer"
          >
            Restore Now
          </button>
        </div>
        <button
          onClick={onResetWorkspace}
          className="w-full bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 text-[11px] py-1.5 rounded transition-colors font-medium cursor-pointer mt-1"
        >
          Reset Workspace
        </button>
      </div>
    </div>
  );
}
