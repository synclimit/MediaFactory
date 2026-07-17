import React, { useState, useEffect } from 'react';
import { m2CacheHealthService } from '../../services/m2/CacheHealthService.js';

export default function CachePanel({ addNotification, addLog }) {
  const [stats, setStats] = useState({
    fileCount: 0,
    sizeMb: 0,
    orphanCount: 0,
    health: 'GOOD'
  });
  const [loading, setLoading] = useState(false);
  const [lastValidated, setLastValidated] = useState(() => {
    return localStorage.getItem('mediafactory_m2_cache_last_validated') || '';
  });

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await m2CacheHealthService.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setStats(prev => ({ ...prev, health: 'CRITICAL' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = async () => {
    await loadStats();
    addNotification('Cache Statistics Updated');
    addLog('[M2] Cache Stats Refreshed');
    m2CacheHealthService.getStats().then(data => {
      if (data.health === 'WARNING' || data.health === 'CRITICAL') {
         addNotification('Cache Health Warning');
      }
    }).catch(() => addNotification('Cache Health Warning'));
  };

  const handleValidate = async () => {
    try {
      const { valid, invalid } = await m2CacheHealthService.validate();
      
      const nowStr = new Date().toISOString();
      localStorage.setItem('mediafactory_m2_cache_last_validated', nowStr);
      setLastValidated(nowStr);

      await loadStats();
      addNotification('Cache Validated', `Valid: ${valid}, Invalid: ${invalid}`);
      addLog('[M2] Cache Validated');
      if (invalid > 0) addNotification('Cache Health Warning');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = async () => {
    try {
      const { deleted } = await m2CacheHealthService.clear();
      await loadStats();
      addNotification('Cache Cleared', `Deleted ${deleted} files`);
      addLog('[M2] Cache Cleared');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveOrphans = async () => {
    try {
      const { deleted } = await m2CacheHealthService.removeOrphans();
      await loadStats();
      addNotification('Orphan Files Removed', `Deleted ${deleted} files`);
      addLog('[M2] Cache Orphans Removed');
    } catch (err) {
      console.error(err);
    }
  };

  const getHealthColor = () => {
    switch (stats.health) {
      case 'GOOD': return 'text-green-400';
      case 'WARNING': return 'text-amber-400';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#1e2230] rounded-xl border border-[#2d313d] flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="flex justify-between items-center p-3 border-b border-[#2d313d] bg-[#1a1d27]">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-xs">⑥</span>
          <h2 className="text-sm font-bold text-gray-200 tracking-wider">CACHE MANAGER</h2>
        </div>
        <button 
          onClick={handleRefresh}
          className="text-xs px-3 py-1 bg-[#2d313d] hover:bg-[#3f4556] text-gray-300 rounded transition-colors"
          disabled={loading}
        >
          Refresh Stats
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#151822] p-3 rounded-lg border border-[#2d313d]">
            <div className="text-xs text-gray-500 mb-1">Cache Size</div>
            <div className="text-xl font-bold text-gray-200">{stats.sizeMb.toFixed(2)} MB</div>
          </div>
          <div className="bg-[#151822] p-3 rounded-lg border border-[#2d313d]">
            <div className="text-xs text-gray-500 mb-1">Cache Files</div>
            <div className="text-xl font-bold text-gray-200">{stats.fileCount}</div>
          </div>
          <div className="bg-[#151822] p-3 rounded-lg border border-[#2d313d]">
            <div className="text-xs text-gray-500 mb-1">Orphan Files</div>
            <div className="text-xl font-bold text-gray-200">{stats.orphanCount}</div>
          </div>
          <div className="bg-[#151822] p-3 rounded-lg border border-[#2d313d]">
            <div className="text-xs text-gray-500 mb-1">Health Status</div>
            <div className={`text-xl font-bold ${getHealthColor()}`}>{stats.health}</div>
          </div>
          <div className="bg-[#151822] p-3 rounded-lg border border-[#2d313d] col-span-2">
            <div className="text-xs text-gray-500 mb-1">Last Validated</div>
            <div className="text-sm font-bold text-gray-200">{formatTimestamp(lastValidated)}</div>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button 
            onClick={handleValidate}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded transition-colors font-medium"
          >
            Validate Cache
          </button>
          <button 
            onClick={handleRemoveOrphans}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-2 rounded transition-colors font-medium"
          >
            Remove Orphans
          </button>
          <button 
            onClick={handleClear}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-2 rounded transition-colors font-medium"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}
