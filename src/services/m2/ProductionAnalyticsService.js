import { m2RenderHistory } from './RenderHistoryService.js';
import { m2BatchEngine } from './BatchProductionEngine.js';
import { m2SchedulerService } from './SchedulerService.js';

class ProductionAnalyticsService {
  
  getProductionMetrics() {
    const { data: history } = m2RenderHistory.getHistory(); // already limited to 500
    
    // Core Counts
    const totalRenders = history.length;
    const successfulRenders = history.filter(h => h.status === 'COMPLETED').length;
    const failedRenders = history.filter(h => h.status === 'FAILED').length;
    const successRate = totalRenders > 0 ? ((successfulRenders / totalRenders) * 100).toFixed(1) : 0;
    
    // Output Size
    const totalOutputSizeMb = history.reduce((acc, h) => acc + (parseFloat(h.outputSizeMb) || 0), 0);
    const totalOutputSizeGb = (totalOutputSizeMb / 1024).toFixed(2);
    
    // Render Time & Speed
    const completedWithTime = history.filter(h => h.status === 'COMPLETED' && typeof h.renderTimeSeconds === 'number');
    const totalRenderTime = completedWithTime.reduce((acc, h) => acc + h.renderTimeSeconds, 0);
    const averageRenderTimeSeconds = completedWithTime.length > 0 ? Math.round(totalRenderTime / completedWithTime.length) : 0;
    
    // Speed calculation: sum(durationSeconds) / sum(renderTimeSeconds)
    const totalDurationSeconds = completedWithTime.reduce((acc, h) => acc + (h.totalDurationSec || 0), 0);
    let renderSpeed = 0;
    if (totalRenderTime > 0) {
      renderSpeed = (totalDurationSeconds / totalRenderTime).toFixed(2);
    }
    
    // Mastering Profile
    const profiles = {};
    history.forEach(h => {
      const p = h.masteringProfile || 'Unknown';
      profiles[p] = (profiles[p] || 0) + 1;
    });
    let mostUsedMasteringProfile = 'None';
    let maxCount = 0;
    Object.keys(profiles).forEach(p => {
      if (profiles[p] > maxCount) {
        maxCount = profiles[p];
        mostUsedMasteringProfile = p;
      }
    });

    const lastRenderTime = history.length > 0 && history[0].completedAt 
      ? new Date(history[0].completedAt).toLocaleString() 
      : 'N/A';

    // Timeline Counts
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    const startOfWeekTime = startOfWeek.getTime();
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let rendersToday = 0;
    let rendersThisWeek = 0;
    let rendersThisMonth = 0;
    
    const uniqueBatchIds = new Set();

    history.forEach(h => {
      if (!h.completedAt) return;
      const completedTime = new Date(h.completedAt).getTime();
      
      if (completedTime >= startOfToday) rendersToday++;
      if (completedTime >= startOfWeekTime) rendersThisWeek++;
      if (completedTime >= startOfMonth) rendersThisMonth++;

      // Track completed batches from history
      if (h.batchId) {
        uniqueBatchIds.add(h.batchId);
      }
    });

    const completedBatchCount = uniqueBatchIds.size;

    // Batch & Scheduler state
    const activeBatchCount = m2BatchEngine.state.status === 'RUNNING' ? 1 : 0;
    const schedulerEnabled = m2SchedulerService.isRunning;
    const currentBatchStatus = m2BatchEngine.state.status;
    const currentBatchProgress = m2BatchEngine.state.targetQuantity > 0 
      ? Math.min(100, Math.round((m2BatchEngine.state.completedCount / m2BatchEngine.state.targetQuantity) * 100))
      : 0;

    return {
      totalRenders,
      successfulRenders,
      failedRenders,
      successRate,
      totalOutputSizeGb,
      averageRenderTimeSeconds,
      renderSpeed, // x-Realtime
      mostUsedMasteringProfile,
      lastRenderTime,
      rendersToday,
      rendersThisWeek,
      rendersThisMonth,
      activeBatchCount,
      completedBatchCount,
      schedulerEnabled,
      currentBatchStatus,
      currentBatchProgress
    };
  }
}

export const m2ProductionAnalytics = new ProductionAnalyticsService();
