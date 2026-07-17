import React, { useState, useEffect } from 'react';
import { m2SchedulerService } from '../../services/m2/SchedulerService.js';

export default function SchedulerPanel() {
  const [settings, setSettings] = useState({
    enabled: false,
    mode: 'interval',
    intervalHours: 3,
    dailyTime: '02:00',
    nextRun: null,
    lastRun: null,
    lastStatus: null
  });

  useEffect(() => {
    const unsubscribe = m2SchedulerService.registerStateChange((state) => {
      setSettings(state);
    });
    return unsubscribe;
  }, []);

  const handleToggleEnabled = () => {
    m2SchedulerService.updateSettings({ enabled: !settings.enabled });
  };

  const handleChangeMode = (e) => {
    m2SchedulerService.updateSettings({ mode: e.target.value });
  };

  const handleChangeInterval = (e) => {
    m2SchedulerService.updateSettings({ intervalHours: Number(e.target.value) });
  };

  const handleChangeDailyTime = (e) => {
    m2SchedulerService.updateSettings({ dailyTime: e.target.value });
  };

  const handleRunNow = async () => {
    await m2SchedulerService.executeSchedulerRun();
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Never';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getStatusColor = () => {
    if (settings.lastStatus === 'SUCCESS') return 'text-green-400';
    if (settings.lastStatus && settings.lastStatus.startsWith('SKIPPED')) return 'text-amber-400';
    if (settings.lastStatus === 'FAILED') return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <div className="bg-[#1e2230] rounded-xl border border-[#2d313d] flex flex-col h-full overflow-hidden shadow-2xl text-[11px] text-gray-300">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-[#2d313d] bg-[#1a1d27]">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-xs">⑦</span>
          <h2 className="text-sm font-bold text-gray-200 tracking-wider">SCHEDULER</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Enable</span>
          <button
            onClick={handleToggleEnabled}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              settings.enabled ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                settings.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Settings Configurator */}
        <div className="grid grid-cols-2 gap-3 bg-[#151822] p-3 rounded-lg border border-[#2d313d]">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-[10px]">Schedule Type</span>
            <select
              value={settings.mode}
              onChange={handleChangeMode}
              disabled={!settings.enabled}
              className="bg-[#2a2e3d] border border-[#3f4556] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="interval">Interval</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            {settings.mode === 'interval' ? (
              <>
                <span className="text-gray-500 text-[10px]">Interval</span>
                <select
                  value={settings.intervalHours}
                  onChange={handleChangeInterval}
                  disabled={!settings.enabled}
                  className="bg-[#2a2e3d] border border-[#3f4556] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="1">Every 1 Hour</option>
                  <option value="3">Every 3 Hours</option>
                  <option value="6">Every 6 Hours</option>
                  <option value="12">Every 12 Hours</option>
                  <option value="24">Every 24 Hours</option>
                </select>
              </>
            ) : (
              <>
                <span className="text-gray-500 text-[10px]">Specific Time (HH:mm)</span>
                <input
                  type="time"
                  value={settings.dailyTime}
                  onChange={handleChangeDailyTime}
                  disabled={!settings.enabled}
                  className="bg-[#2a2e3d] border border-[#3f4556] rounded px-2 py-0.5 text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </>
            )}
          </div>
        </div>

        {/* Dashboard Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Scheduler Enabled</span>
            <span className={`text-[13px] font-bold ${settings.enabled ? 'text-green-400' : 'text-gray-400'}`}>
              {settings.enabled ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col justify-between">
            <span className="text-[10px] text-gray-500">Schedule Type</span>
            <span className="text-[13px] font-bold text-gray-200 uppercase">{settings.mode}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] col-span-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500">Next Run Time</span>
            <span className="text-[12px] font-mono font-bold text-blue-400">{formatTimestamp(settings.nextRun)}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] col-span-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500">Last Run Time</span>
            <span className="text-[12px] font-mono font-bold text-gray-300">{formatTimestamp(settings.lastRun)}</span>
          </div>

          <div className="bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] col-span-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-500">Last Run Status</span>
            <span className={`text-[12px] font-bold uppercase ${getStatusColor()}`}>
              {settings.lastStatus || 'None'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-[#2d313d]/50">
          <button
            onClick={handleRunNow}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] py-2 rounded transition-colors font-medium cursor-pointer shadow-lg active:scale-98"
          >
            Run Now
          </button>
        </div>
      </div>
    </div>
  );
}
