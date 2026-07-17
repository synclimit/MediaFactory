// Export Import Service for M2 Configuration Migration

import { m2WorkspaceContext } from './WorkspaceContext.js';
import { m2WorkspaceRegistry } from './WorkspaceRegistry.js';

class ExportImportService {

  _getStorageObj(key) {
    try {
      const val = localStorage.getItem(key);
      if (!val) return null;
      return JSON.parse(val);
    } catch {
      return null;
    }
  }

  _basePayload() {
    const wsId = m2WorkspaceContext.getWorkspaceId();
    const reg = m2WorkspaceRegistry.getRegistry();
    const wsData = reg ? reg.workspaces.find(w => w.id === wsId) : null;
    const wsName = wsData ? wsData.name : 'Unknown Workspace';

    return {
      schemaVersion: 1,
      workspaceId: wsId,
      workspaceName: wsName,
      exportedAt: new Date().toISOString()
    };
  }

  _getKeys(targetWorkspaceId) {
    const prefix = targetWorkspaceId;
    return {
      WORKSPACE: `${prefix}_m2_workspace`,
      SCHEDULER: `${prefix}_m2_scheduler`,
      BATCH: `${prefix}_m2_batch`,
      HISTORY: `${prefix}_m2_render_history`,
      TEMPLATES: 'mediafactory_m2_templates', // Global
    };
  }

  // Exports
  exportAll() {
    const currentId = m2WorkspaceContext.getWorkspaceId();
    const keys = this._getKeys(currentId);
    return {
      ...this._basePayload(),
      workspace: this._getStorageObj(keys.WORKSPACE),
      templates: this._getStorageObj(keys.TEMPLATES),
      history: this._getStorageObj(keys.HISTORY),
      batch: this._getStorageObj(keys.BATCH),
      scheduler: this._getStorageObj(keys.SCHEDULER)
    };
  }

  exportWorkspace() {
    const currentId = m2WorkspaceContext.getWorkspaceId();
    return {
      ...this._basePayload(),
      workspace: this._getStorageObj(this._getKeys(currentId).WORKSPACE)
    };
  }

  exportTemplates() {
    return {
      ...this._basePayload(),
      templates: this._getStorageObj('mediafactory_m2_templates')
    };
  }

  exportHistory() {
    const currentId = m2WorkspaceContext.getWorkspaceId();
    return {
      ...this._basePayload(),
      history: this._getStorageObj(this._getKeys(currentId).HISTORY)
    };
  }

  exportBatch() {
    const currentId = m2WorkspaceContext.getWorkspaceId();
    return {
      ...this._basePayload(),
      batch: this._getStorageObj(this._getKeys(currentId).BATCH)
    };
  }

  exportScheduler() {
    const currentId = m2WorkspaceContext.getWorkspaceId();
    return {
      ...this._basePayload(),
      scheduler: this._getStorageObj(this._getKeys(currentId).SCHEDULER)
    };
  }

  // Backup & Restore
  createBackup(targetWorkspaceId) {
    const keys = this._getKeys(targetWorkspaceId);
    const snapshot = {
      targetWorkspaceId,
      workspace: localStorage.getItem(keys.WORKSPACE),
      templates: localStorage.getItem(keys.TEMPLATES),
      history: localStorage.getItem(keys.HISTORY),
      batch: localStorage.getItem(keys.BATCH),
      scheduler: localStorage.getItem(keys.SCHEDULER)
    };
    localStorage.setItem('mediafactory_m2_backup_pre_import', JSON.stringify(snapshot));
  }

  restoreBackup() {
    try {
      const raw = localStorage.getItem('mediafactory_m2_backup_pre_import');
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      
      const keys = this._getKeys(snapshot.targetWorkspaceId);

      if (snapshot.workspace !== undefined) {
        if (snapshot.workspace === null) localStorage.removeItem(keys.WORKSPACE);
        else localStorage.setItem(keys.WORKSPACE, snapshot.workspace);
      }
      
      if (snapshot.templates !== undefined) {
        if (snapshot.templates === null) localStorage.removeItem(keys.TEMPLATES);
        else localStorage.setItem(keys.TEMPLATES, snapshot.templates);
      }

      if (snapshot.history !== undefined) {
        if (snapshot.history === null) localStorage.removeItem(keys.HISTORY);
        else localStorage.setItem(keys.HISTORY, snapshot.history);
      }

      if (snapshot.batch !== undefined) {
        if (snapshot.batch === null) localStorage.removeItem(keys.BATCH);
        else localStorage.setItem(keys.BATCH, snapshot.batch);
      }

      if (snapshot.scheduler !== undefined) {
        if (snapshot.scheduler === null) localStorage.removeItem(keys.SCHEDULER);
        else localStorage.setItem(keys.SCHEDULER, snapshot.scheduler);
      }

      return true;
    } catch {
      return false;
    }
  }

  // Validation
  validatePayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return 'IMPORT_PAYLOAD_CORRUPTED';
    }
    
    if (payload.schemaVersion === undefined) {
      return 'IMPORT_SCHEMA_INVALID';
    }

    if (payload.schemaVersion > 1) {
      return 'IMPORT_VERSION_UNSUPPORTED';
    }

    return 'VALID';
  }

  // Import
  importBundle(payload, importMode = 'NEW_WORKSPACE') {
    const validationResult = this.validatePayload(payload);
    if (validationResult !== 'VALID') {
      return validationResult;
    }

    try {
      let targetWorkspaceId = m2WorkspaceContext.getWorkspaceId();

      if (importMode === 'NEW_WORKSPACE') {
        const newId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newName = `${payload.workspaceName || 'Imported Workspace'} (Import)`;
        const res = m2WorkspaceRegistry.createWorkspace(newId, newName);
        if (res !== 'SUCCESS') {
           return res; // E.g. WORKSPACE_LIMIT_REACHED
        }
        targetWorkspaceId = newId;
      }

      this.createBackup(targetWorkspaceId);
      const keys = this._getKeys(targetWorkspaceId);

      if (payload.workspace !== undefined) {
        // Enforce rule: DO NOT EXPORT/IMPORT QUEUE. 
        const cleanWorkspace = { ...payload.workspace };
        delete cleanWorkspace.queue; 
        localStorage.setItem(keys.WORKSPACE, JSON.stringify(cleanWorkspace));
      }

      if (payload.templates !== undefined) {
        // Templates are global
        localStorage.setItem(keys.TEMPLATES, JSON.stringify(payload.templates));
      }

      if (payload.history !== undefined) {
        localStorage.setItem(keys.HISTORY, JSON.stringify(payload.history));
      }

      if (payload.batch !== undefined) {
        // Enforce rule: No automatic execution.
        const safeBatch = { ...payload.batch };
        if (safeBatch.status === 'RUNNING') safeBatch.status = 'PAUSED';
        localStorage.setItem(keys.BATCH, JSON.stringify(safeBatch));
      }

      if (payload.scheduler !== undefined) {
        // Enforce rule: No automatic execution.
        const safeScheduler = { ...payload.scheduler };
        if (safeScheduler.isRunning) safeScheduler.isRunning = false;
        localStorage.setItem(keys.SCHEDULER, JSON.stringify(safeScheduler));
      }

      if (importMode === 'NEW_WORKSPACE') {
        m2WorkspaceRegistry.selectWorkspace(targetWorkspaceId);
      } else {
        // Mode A: Overwrite current workspace, just dispatch to reload
        window.dispatchEvent(new CustomEvent('IMPORT_COMPLETED'));
      }

      return 'SUCCESS';
    } catch (err) {
      this.restoreBackup();
      return 'IMPORT_PAYLOAD_CORRUPTED';
    }
  }

}

export const m2ExportImport = new ExportImportService();
