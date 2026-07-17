import React, { useState, useEffect } from 'react';
import { m2ProductionAnalytics } from '../../services/m2/ProductionAnalyticsService.js';

export default function ProductionDashboardPanel() {
  const [metrics, setMetrics] = useState(m2ProductionAnalytics.getProductionMetrics());

  useEffect(() => {
    // Initial fetch
    setMetrics(m2ProductionAnalytics.getProductionMetrics());

    // Event listener for manual refresh (e.g. after import)
    const handleRefresh = () => setMetrics(m2ProductionAnalytics.getProductionMetrics());
    window.addEventListener('m2_dashboard_refresh', handleRefresh);

    return () => {
      window.removeEventListener('m2_dashboard_refresh', handleRefresh);
    };
  }, []);

  return (
    <div className="bg-[#12131a] p-4 text-gray-200 text-xs space-y-4">
      {/* SECTION A: Production Summary */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Production Summary</div>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Total Renders</div>
            <div className="font-bold text-lg text-blue-400">{metrics.totalRenders}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Success Rate</div>
            <div className="font-bold text-lg text-emerald-400">{metrics.successRate}%</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Failed Renders</div>
            <div className="font-bold text-lg text-red-400">{metrics.failedRenders}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Total Output</div>
            <div className="font-bold text-lg text-purple-400">{metrics.totalOutputSizeGb} GB</div>
          </div>
        </div>
      </div>

      {/* SECTION B: Performance */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Performance</div>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Avg Render Time</div>
            <div className="font-bold text-sm text-gray-300">{metrics.averageRenderTimeSeconds}s</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Last Render</div>
            <div className="font-bold text-[10px] text-gray-400 truncate mt-1">{metrics.lastRenderTime}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Top Profile</div>
            <div className="font-bold text-[10px] text-amber-400 truncate mt-1">{metrics.mostUsedMasteringProfile}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase">Render Speed</div>
            <div className="font-bold text-sm text-emerald-400">{metrics.renderSpeed}x <span className="text-[9px] text-gray-500">RT</span></div>
          </div>
        </div>
      </div>

      {/* SECTION C: Production Timeline */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Production Timeline</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#181922] p-2 rounded border border-[#21232d] flex justify-between items-center">
            <div className="text-[9px] text-gray-500 uppercase">Today</div>
            <div className="font-bold text-blue-400">{metrics.rendersToday}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d] flex justify-between items-center">
            <div className="text-[9px] text-gray-500 uppercase">This Week</div>
            <div className="font-bold text-blue-400">{metrics.rendersThisWeek}</div>
          </div>
          <div className="bg-[#181922] p-2 rounded border border-[#21232d] flex justify-between items-center">
            <div className="text-[9px] text-gray-500 uppercase">This Month</div>
            <div className="font-bold text-blue-400">{metrics.rendersThisMonth}</div>
          </div>
        </div>
      </div>

      {/* SECTION D: Operations */}
      <div>
        <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest border-b border-[#2d313d] pb-1">Operations</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#181922] p-2 rounded border border-[#21232d]">
            <div className="text-[9px] text-gray-500 uppercase mb-1">Scheduler Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${metrics.schedulerEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
              <span className={`font-bold ${metrics.schedulerEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                {metrics.schedulerEnabled ? 'RUNNING' : 'IDLE'}
              </span>
            </div>
          </div>
          
          <div className="col-span-2 bg-[#181922] p-2 rounded border border-[#21232d] flex flex-col justify-center">
            <div className="flex justify-between items-end mb-1">
              <div className="text-[9px] text-gray-500 uppercase">Current Batch Status</div>
              <div className={`font-bold text-[10px] ${
                metrics.currentBatchStatus === 'RUNNING' ? 'text-emerald-400' : 
                metrics.currentBatchStatus === 'PAUSED' ? 'text-amber-400' : 
                metrics.currentBatchStatus === 'COMPLETED' ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {metrics.currentBatchStatus} ({metrics.currentBatchProgress}%)
              </div>
            </div>
            <div className="h-1.5 w-full bg-[#1a1c22] rounded overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  metrics.currentBatchStatus === 'RUNNING' ? 'bg-emerald-500' : 
                  metrics.currentBatchStatus === 'PAUSED' ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${metrics.currentBatchProgress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-2 px-1">
          <div className="text-[9px] text-gray-500">
            Active Batches: <span className="text-gray-300 font-bold ml-1">{metrics.activeBatchCount}</span>
          </div>
          <div className="text-[9px] text-gray-500">
            Historical Batches Completed: <span className="text-gray-300 font-bold ml-1">{metrics.completedBatchCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
