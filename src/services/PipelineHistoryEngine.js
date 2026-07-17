const MAX_ENTRIES = 1000;
const STORAGE_KEY = 'global_pipeline_history';

class PipelineHistoryEngine {
  getHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  addEntry(record) {
    let history = this.getHistory();
    history.unshift({
      ...record,
      historyId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    });
    if (history.length > MAX_ENTRIES) {
      history = history.slice(0, MAX_ENTRIES);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }

  getMovingAverageRenderTime(profileName, mode) {
    const history = this.getHistory();
    // find recent successful renders for this profile/mode
    const recent = history.filter(h => h.status === 'Completed' && h.profile === profileName && h.actualRenderTime > 0 && h.actualDuration > 0);
    
    if (recent.length === 0) return null;

    let totalRatio = 0;
    let count = 0;
    
    // Take up to last 10
    const sample = recent.slice(0, 10);
    for (const r of sample) {
      totalRatio += (r.actualRenderTime / r.actualDuration);
      count++;
    }
    
    return totalRatio / count;
  }

  getMorningSummary() {
    const history = this.getHistory();
    const completed = history.filter(h => h.status === 'Completed').length;
    const failed = history.filter(h => h.status === 'Failed').length;
    const cancelled = history.filter(h => h.status === 'Cancelled').length;
    
    const actualStorageUsedMb = history.filter(h => h.status === 'Completed').reduce((acc, h) => acc + (parseFloat(h.actualFileSize) || 0), 0);
    
    const completedWithTime = history.filter(h => h.status === 'Completed' && h.actualRenderTime > 0);
    const avgRenderTime = completedWithTime.length > 0 
      ? completedWithTime.reduce((acc, h) => acc + h.actualRenderTime, 0) / completedWithTime.length 
      : 0;

    const speedSamples = completedWithTime.filter(h => h.actualDuration > 0);
    const avgRenderSpeed = speedSamples.length > 0 
      ? speedSamples.reduce((acc, h) => acc + (h.actualDuration / h.actualRenderTime), 0) / speedSamples.length 
      : 0;

    const firstRender = history.length > 0 ? history[history.length - 1].finishTime : null;
    const lastRender = history.length > 0 ? history[0].finishTime : null;

    return {
      completed, failed, cancelled,
      actualStorageUsedMb,
      avgRenderTime,
      avgRenderSpeed,
      firstRender,
      lastRender
    };
  }
}

export const pipelineHistoryEngine = new PipelineHistoryEngine();
