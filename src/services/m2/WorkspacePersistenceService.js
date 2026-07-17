import { m2WorkspaceContext } from './WorkspaceContext.js';

class WorkspacePersistenceService {
  constructor() {
    this.saveTimeout = null;
    this.logCallback = null;
    this.stateCallbacks = [];
    this.CURRENT_VERSION = 1;
  }

  getStorageKey() {
    return `${m2WorkspaceContext.getWorkspaceId()}_m2_workspace`;
  }

  registerStateChange(callback) {
    this.stateCallbacks.push(callback);
    this._emitStateChange();
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
    };
  }

  _emitStateChange() {
    const data = localStorage.getItem(this.getStorageKey());
    let state = null;
    if (data) {
      try {
        state = JSON.parse(data);
      } catch (e) {}
    }
    this.stateCallbacks.forEach(cb => cb(state));
  }

  registerLogCallback(callback) {
    this.logCallback = callback;
  }

  log(message) {
    if (this.logCallback) {
      this.logCallback(message);
    } else {
      console.log(message);
    }
  }

  saveWorkspace(data) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      let plansToSave = data.renderPlans || [];
      if (plansToSave.length > 100) {
        plansToSave = plansToSave.slice(0, 100);
      }

      const payload = {
        version: this.CURRENT_VERSION,
        savedAt: new Date().toISOString(),
        sources: data.sources || [],
        renderPlans: plansToSave,
        scheduler: data.scheduler || {},
        cacheSnapshot: data.cacheSnapshot || { fileCount: 0, sizeMb: 0 }
      };
      // Queue is global, not saved per-workspace
      
      localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
      this.log('[M2 Workspace] Saved');
      this._emitStateChange();
    }, 1000);
  }

  restoreWorkspace() {
    const data = localStorage.getItem(this.getStorageKey());
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (!parsed || parsed.version !== this.CURRENT_VERSION) {
        this.log('[M2 Workspace] Restore Rejected (Version Mismatch)');
        return null;
      }
      this.log('[M2 Workspace] Restored');
      return parsed;
    } catch (e) {
      console.error('Failed to parse workspace', e);
      this.log('[M2 Workspace] Restore Rejected (Version Mismatch)');
      return null;
    }
  }

  resetWorkspace() {
    localStorage.removeItem(this.getStorageKey());
    this.log('[M2 Workspace] Reset');
    this._emitStateChange();
  }
}

export const m2WorkspacePersistence = new WorkspacePersistenceService();
