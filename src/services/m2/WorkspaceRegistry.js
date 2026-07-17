import { m2WorkspaceContext } from './WorkspaceContext.js';

const REGISTRY_KEY = 'mediafactory_m2_workspace_registry';
const MAX_WORKSPACES = 50;
const QUEUE_KEY = 'mediafactory_m2_queue';

class WorkspaceRegistryService {
  constructor() {
    this._initialize();
  }

  _initialize() {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) {
      this._runMigration();
    } else {
      try {
        const parsed = JSON.parse(raw);
        m2WorkspaceContext.setWorkspaceId(parsed.activeWorkspaceId || 'default');
      } catch {
        this._runMigration();
      }
    }
  }

  _runMigration() {
    // Check for legacy keys
    const legacyWorkspace = localStorage.getItem('mediafactory_m2_workspace');
    const legacyScheduler = localStorage.getItem('mediafactory_m2_scheduler');
    const legacyBatch = localStorage.getItem('mediafactory_m2_batch');
    const legacyHistory = localStorage.getItem('mediafactory_m2_render_history');

    // Copy to new default prefix
    if (legacyWorkspace) localStorage.setItem('default_m2_workspace', legacyWorkspace);
    if (legacyScheduler) localStorage.setItem('default_m2_scheduler', legacyScheduler);
    if (legacyBatch) localStorage.setItem('default_m2_batch', legacyBatch);
    if (legacyHistory) localStorage.setItem('default_m2_render_history', legacyHistory);

    // Save Registry
    const registry = {
      migrationVersion: 1,
      activeWorkspaceId: 'default',
      workspaces: [
        {
          id: 'default',
          name: 'Main Workspace',
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    m2WorkspaceContext.setWorkspaceId('default');
  }

  getRegistry() {
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _saveRegistry(registry) {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  }

  listWorkspaces() {
    const reg = this.getRegistry();
    return reg && Array.isArray(reg.workspaces) ? reg.workspaces : [];
  }

  createWorkspace(id, name) {
    const reg = this.getRegistry();
    if (!reg) return 'REGISTRY_ERROR';
    if (reg.workspaces.length >= MAX_WORKSPACES) {
      return 'WORKSPACE_LIMIT_REACHED';
    }
    if (reg.workspaces.some(w => w.id === id)) {
      return 'WORKSPACE_EXISTS';
    }

    reg.workspaces.push({
      id,
      name,
      createdAt: new Date().toISOString()
    });
    this._saveRegistry(reg);
    return 'SUCCESS';
  }

  renameWorkspace(id, newName) {
    const reg = this.getRegistry();
    if (!reg) return 'REGISTRY_ERROR';
    const ws = reg.workspaces.find(w => w.id === id);
    if (!ws) return 'NOT_FOUND';
    
    ws.name = newName;
    this._saveRegistry(reg);
    return 'SUCCESS';
  }

  deleteWorkspace(id) {
    const reg = this.getRegistry();
    if (!reg) return 'REGISTRY_ERROR';
    
    if (reg.activeWorkspaceId === id) {
      return 'ACTIVE_WORKSPACE_DELETE_BLOCKED';
    }

    const wsIndex = reg.workspaces.findIndex(w => w.id === id);
    if (wsIndex === -1) return 'NOT_FOUND';

    // Check Queue Lock
    try {
      const qRaw = localStorage.getItem(QUEUE_KEY);
      if (qRaw) {
        const queue = JSON.parse(qRaw);
        const hasActiveJobs = queue.some(job => 
          job.workspaceId === id && 
          (job.status === 'PENDING' || job.status === 'RENDERING')
        );
        if (hasActiveJobs) {
          return 'WORKSPACE_DELETE_BLOCKED';
        }
      }
    } catch {}

    reg.workspaces.splice(wsIndex, 1);
    this._saveRegistry(reg);

    // Clean up isolated storage keys
    localStorage.removeItem(`${id}_m2_workspace`);
    localStorage.removeItem(`${id}_m2_scheduler`);
    localStorage.removeItem(`${id}_m2_batch`);
    localStorage.removeItem(`${id}_m2_render_history`);

    return 'SUCCESS';
  }

  selectWorkspace(id) {
    const reg = this.getRegistry();
    if (!reg) return 'REGISTRY_ERROR';
    
    if (!reg.workspaces.some(w => w.id === id)) {
      return 'NOT_FOUND';
    }

    reg.activeWorkspaceId = id;
    this._saveRegistry(reg);
    
    m2WorkspaceContext.setWorkspaceId(id);
    return 'SUCCESS';
  }

  getActiveWorkspace() {
    const reg = this.getRegistry();
    if (!reg) return null;
    return reg.workspaces.find(w => w.id === reg.activeWorkspaceId) || null;
  }
}

export const m2WorkspaceRegistry = new WorkspaceRegistryService();
