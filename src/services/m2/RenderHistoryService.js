import { m2WorkspaceContext } from './WorkspaceContext.js';

const MAX_ENTRIES = 500;

class RenderHistoryService {
  getStorageKey() {
    return `${m2WorkspaceContext.getWorkspaceId()}_m2_render_history`;
  }

  getHistory() {
    const stored = localStorage.getItem(this.getStorageKey());
    if (!stored) return { data: [], corrupted: false };
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      return { data: parsed, corrupted: false };
    } catch (e) {
      return { data: [], corrupted: true };
    }
  }

  addEntry(record) {
    let { data: history } = this.getHistory();
    history.unshift(record);
    if (history.length > MAX_ENTRIES) {
      history = history.slice(0, MAX_ENTRIES);
    }
    localStorage.setItem(this.getStorageKey(), JSON.stringify(history));
  }

  clearHistory() {
    localStorage.removeItem(this.getStorageKey());
  }

  getStats() {
    const { data: history } = this.getHistory();
    const totalRenders = history.length;
    const successfulRenders = history.filter(h => h.status === 'COMPLETED').length;
    const failedRenders = history.filter(h => h.status === 'FAILED').length;
    
    const successRate = totalRenders > 0 ? ((successfulRenders / totalRenders) * 100).toFixed(1) : 0;
    
    const totalOutputSizeMb = history.reduce((acc, h) => acc + (parseFloat(h.outputSizeMb) || 0), 0);
    const totalOutputSizeGb = (totalOutputSizeMb / 1024).toFixed(2);
    
    const completedWithTime = history.filter(h => h.status === 'COMPLETED' && typeof h.renderTimeSeconds === 'number');
    const totalTime = completedWithTime.reduce((acc, h) => acc + h.renderTimeSeconds, 0);
    const avgRenderTimeSeconds = completedWithTime.length > 0 ? Math.round(totalTime / completedWithTime.length) : 0;
    
    const profiles = {};
    history.forEach(h => {
      const p = h.masteringProfile || 'Unknown';
      profiles[p] = (profiles[p] || 0) + 1;
    });
    let mostUsedProfile = 'None';
    let maxCount = 0;
    Object.keys(profiles).forEach(p => {
      if (profiles[p] > maxCount) {
        maxCount = profiles[p];
        mostUsedProfile = p;
      }
    });

    const lastRenderTime = history.length > 0 ? new Date(history[0].completedAt).toLocaleString() : 'N/A';

    return {
      totalRenders,
      successfulRenders,
      failedRenders,
      successRate,
      totalOutputSizeGb,
      avgRenderTimeSeconds,
      mostUsedProfile,
      lastRenderTime
    };
  }
}

export const m2RenderHistory = new RenderHistoryService();
